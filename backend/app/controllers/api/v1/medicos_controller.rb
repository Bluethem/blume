module Api
  module V1
    class MedicosController < ApplicationController
      skip_before_action :authenticate_request!, only: [:index, :show, :buscar, :disponibles]
      before_action :set_medico, only: [:show, :update, :destroy, :horarios, :citas, :estadisticas]
      before_action :require_admin!, only: [:destroy]
      before_action :authorize_medico_access, only: [:update]

      # GET /api/v1/medicos
      def index
        @medicos = ::Medico.includes(:usuario, :certificaciones, :especialidades)
                        .joins(:usuario)
                        .where(usuarios: { activo: true })

        # Aplicar filtros si existen
        if params[:q].present? || params[:especialidad_id].present? || params[:tarifa_max].present? || params[:costo_max].present? || params[:experiencia_min].present? || params[:calificacion_min].present? || params[:disponible_hoy].present?
          @medicos = filter_medicos(@medicos)
        end

        # Obtener el total ANTES de paginar
        total_count = @medicos.count

        # Paginar manualmente
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 10).to_i
        per_page = 100 if per_page > 100

        @medicos_paginados = @medicos.offset((page - 1) * per_page).limit(per_page)

        render_success(
          @medicos_paginados.map { |m| medico_response(m, for_card: true) },
          meta: {
            page: page,
            per_page: per_page,
            total: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        )
      end

      # GET /api/v1/medicos/:id
      def show
        render_success(medico_response(@medico, detailed: true))
      end

      # POST /api/v1/medicos
      def create
        require_admin!
        
        ActiveRecord::Base.transaction do
          # Crear usuario
          usuario = Usuario.new(usuario_params)
          usuario.rol = 'medico'
          
          if usuario.save
            # Crear perfil de médico
            @medico = ::Medico.new(medico_params.except(:especialidad_ids))
            @medico.usuario_id = usuario.id
            
            if @medico.save
              # Asignar especialidades
              if params[:medico][:especialidad_ids].present?
                asignar_especialidades(@medico, params[:medico][:especialidad_ids])
              end
              
              render_success(
                medico_response(@medico, detailed: true),
                message: 'Médico creado exitosamente',
                status: :created
              )
            else
              raise ActiveRecord::Rollback
              render_error('Error al crear el médico', errors: @medico.errors.full_messages)
            end
          else
            render_error('Error al crear el usuario', errors: usuario.errors.full_messages)
          end
        end
      rescue => e
        Rails.logger.error("Error creating medico: #{e.message}")
        render_error('Error al crear el médico')
      end

      # PUT /api/v1/medicos/:id
      def update
        if @medico.update(medico_params.except(:especialidad_ids))
          # Actualizar especialidades si se proporcionaron
          if params[:medico][:especialidad_ids].present?
            asignar_especialidades(@medico, params[:medico][:especialidad_ids])
          end

          if params[:usuario].present?
            @medico.usuario.update(usuario_params)
          end
          
          render_success(
            medico_response(@medico, detailed: true),
            message: 'Médico actualizado exitosamente'
          )
        else
          render_error('Error al actualizar el médico', errors: @medico.errors.full_messages)
        end
      end

      # DELETE /api/v1/medicos/:id
      def destroy
        if @medico.usuario.update(activo: false)
          render_success(nil, message: 'Médico desactivado exitosamente')
        else
          render_error('Error al desactivar el médico')
        end
      end

      # GET /api/v1/medicos/buscar
      def buscar
        query = params[:q]
        
        if query.blank?
          render_error('Parámetro de búsqueda requerido', status: :bad_request)
          return
        end

        @medicos = ::Medico.joins(:usuario)
                         .left_joins(:especialidades)
                         .where('usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ? OR medicos.numero_colegiatura ILIKE ? OR especialidades.nombre ILIKE ?',
                                "%#{query}%", "%#{query}%", "%#{query}%", "%#{query}%")
                         .where(usuarios: { activo: true })
                         .includes(:especialidades, :usuario)
                         .distinct
                         .limit(20)

        render_success(@medicos.map { |m| medico_response(m) })
      end

      # GET /api/v1/medicos/disponibles
      def disponibles
        fecha = params[:fecha]&.to_date || Date.today
        especialidad_id = params[:especialidad_id]

        @medicos = ::Medico.joins(:usuario)
                         .where(usuarios: { activo: true })
                         .includes(:horario_medicos, :especialidades)

        # Filtrar por especialidad si se proporciona
        if especialidad_id.present?
          @medicos = @medicos.joins(:especialidades)
                             .where(especialidades: { id: especialidad_id })
        end

        # Filtrar por disponibilidad en la fecha
        dia_semana = fecha.wday
        @medicos = @medicos.where(
          id: HorarioMedico.where(dia_semana: dia_semana, activo: true)
                           .select(:medico_id)
        )

        render_success(@medicos.map { |m| medico_response(m, include_horarios: true) })
      end

      # GET /api/v1/medicos/:id/horarios
      def horarios
        horarios = @medico.horario_medicos.where(activo: true).order(:dia_semana, :hora_inicio)
        
        render_success(horarios.map { |h| horario_response(h) })
      end

      # GET /api/v1/medicos/:id/citas
      def citas
        unless current_user.es_administrador? || (current_user.es_medico? && current_user.medico.id == @medico.id)
          render_error('No tienes permiso para ver estas citas', status: :forbidden)
          return
        end

        @citas = @medico.citas.includes(:paciente)
        @citas = @citas.where(estado: params[:estado]) if params[:estado].present?
        
        if params[:fecha_desde].present?
          @citas = @citas.where('fecha_hora_inicio >= ?', params[:fecha_desde])
        end
        
        if params[:fecha_hasta].present?
          @citas = @citas.where('fecha_hora_inicio <= ?', params[:fecha_hasta])
        end

        @citas = @citas.order(fecha_hora_inicio: :desc)
        paginated_citas = paginate(@citas)

        render_success({
          citas: paginated_citas.map { |c| cita_simple_response(c) },
          meta: pagination_meta(paginated_citas)
        })
      end

      # GET /api/v1/medicos/:id/estadisticas
      def estadisticas
        unless current_user.es_administrador? || (current_user.es_medico? && current_user.medico.id == @medico.id)
          render_error('No tienes permiso para ver estas estadísticas', status: :forbidden)
          return
        end

        stats = {
          total_citas: @medico.citas.count,
          citas_completadas: @medico.citas.where(estado: :completada).count,
          citas_pendientes: @medico.citas.where(estado: :pendiente).count,
          citas_canceladas: @medico.citas.where(estado: :cancelada).count,
          pacientes_unicos: @medico.citas.select(:paciente_id).distinct.count,
          ingresos_totales: @medico.citas.where(estado: :completada).sum(:costo)
        }

        # Estadísticas por mes (últimos 6 meses)
        if @medico.citas.any?
          stats[:citas_por_mes] = @medico.citas
                                         .where('fecha_hora_inicio >= ?', 6.months.ago)
                                         .group("DATE_TRUNC('month', fecha_hora_inicio)")
                                         .count
                                         .transform_keys { |k| k.strftime('%Y-%m') }
        else
          stats[:citas_por_mes] = {}
        end

        render_success(stats)
      end

      private

      def set_medico
        @medico = ::Medico.includes(:usuario, :especialidades).find(params[:id])
      end

      def authorize_medico_access
        unless current_user.es_administrador? || (current_user.es_medico? && current_user.medico.id == @medico.id)
          render_error('No autorizado', status: :forbidden)
        end
      end

      def usuario_params
        params.require(:usuario).permit(:email, :password, :password_confirmation, :nombre, :apellido, :telefono, :direccion)
      end

      def medico_params
        params.require(:medico).permit(
          :numero_colegiatura,
          :anios_experiencia,
          :biografia,
          :costo_consulta,
          :activo,
          especialidad_ids: []
        )
      end

      def filter_medicos(medicos)
        # Búsqueda por texto en nombre, apellido y especialidades
        if params[:q].present?
          busqueda = params[:q].downcase
          medicos = medicos.joins(:usuario)
                           .left_joins(:especialidades)
                           .where(
                             'LOWER(usuarios.nombre) LIKE ? OR LOWER(usuarios.apellido) LIKE ? OR LOWER(especialidades.nombre) LIKE ?',
                             "%#{busqueda}%", "%#{busqueda}%", "%#{busqueda}%"
                           ).distinct
        end

        # Filtro por especialidad
        if params[:especialidad_id].present?
          medicos = medicos.por_especialidad(params[:especialidad_id])
        end

        # Filtro por tarifa/costo máxima (alias soportado: tarifa_max o costo_max)
        costo_max = params[:costo_max] || params[:tarifa_max]
        if costo_max.present?
          medicos = medicos.where('costo_consulta <= ?', costo_max)
        end

        # Filtro por experiencia mínima
        if params[:experiencia_min].present?
          medicos = medicos.where('anios_experiencia >= ?', params[:experiencia_min])
        end

        # ✅ Filtro por calificación mínima
        if params[:calificacion_min].present?
          medicos = medicos.where('calificacion_promedio >= ?', params[:calificacion_min])
        end

        # Filtro por disponibilidad hoy
        if params[:disponible_hoy].present? && ActiveModel::Type::Boolean.new.cast(params[:disponible_hoy])
          dia_hoy = Date.current.wday
          medicos = medicos.where(id: HorarioMedico.where(dia_semana: dia_hoy, activo: true).select(:medico_id))
        end

        # Ordenamiento
        orden = params[:orden] || 'nombre'
        medicos = case orden
        when 'experiencia'
          medicos.order(anios_experiencia: :desc)
        when 'precio_asc'
          medicos.order(costo_consulta: :asc)
        when 'precio_desc'
          medicos.order(costo_consulta: :desc)
        else
          medicos.joins(:usuario).order('usuarios.nombre ASC')
        end

        medicos
      end

      def horario_response(horario)
        {
          id: horario.id,
          dia_semana: horario.dia_semana,
          nombre_dia: HorarioMedico.dias_semana_hash[horario.dia_semana],
          hora_inicio: horario.hora_inicio.strftime('%H:%M'),
          hora_fin: horario.hora_fin.strftime('%H:%M'),
          duracion_cita_minutos: horario.duracion_cita_minutos,
          activo: horario.activo
        }
      end

      def cita_simple_response(cita)
        {
          id: cita.id,
          paciente_nombre: cita.paciente.nombre_completo,
          fecha_hora_inicio: cita.fecha_hora_inicio,
          fecha_hora_fin: cita.fecha_hora_fin,
          motivo_consulta: cita.motivo_consulta,
          estado: cita.estado,
          costo: cita.costo
        }
      end

      def medico_response(medico, detailed: false, include_horarios: false, for_card: false)
        especialidad_principal = medico.especialidad_principal
        
        response = {
          id: medico.id,
          nombre_completo: medico.nombre_completo,
          nombre_profesional: medico.nombre_profesional,
          email: medico.email,
          telefono: medico.telefono,
          numero_colegiatura: medico.numero_colegiatura,
          anios_experiencia: medico.anios_experiencia,
          costo_consulta: medico.costo_consulta,
          activo: medico.usuario.activo,
          disponible_hoy: medico.disponible_hoy?,
          calificacion_promedio: medico.calificacion_promedio,
          total_resenas: medico.total_resenas,
          foto_url: absolute_url(medico.usuario.foto_url),
          especialidad_principal: especialidad_principal ? {
            id: especialidad_principal.id,
            nombre: especialidad_principal.nombre
          } : nil,
          especialidades: medico.especialidades.map do |e|
            {
              id: e.id,
              nombre: e.nombre,
              es_principal: medico.medico_especialidades.find_by(especialidad_id: e.id)&.es_principal || false
            }
          end
        }

        # Para cards del dashboard
        if for_card
          response.merge!({
            especialidad: especialidad_principal&.nombre || 'General',
            biografia: medico.biografia&.truncate(150),
            total_reviews: 0 # Implementar reviews reales después
          })
        end

        if detailed
          response.merge!({
            direccion: medico.direccion,
            biografia: medico.biografia,
            total_citas: medico.citas.count,
            pacientes_atendidos: medico.citas.select(:paciente_id).distinct.count,
            created_at: medico.created_at,
            certificaciones: medico.medico_certificaciones.includes(:certificacion).map do |mc|
              {
                id: mc.certificacion.id,
                nombre: mc.certificacion.nombre,
                institucion: mc.certificacion.institucion_emisora,
                fecha_obtencion: mc.fecha_obtencion || mc.created_at
              }
            end,
            horarios_atencion: agrupar_horarios(medico)
          })
        end

        if include_horarios
          response[:horarios_disponibles] = medico.horario_medicos
                                                   .where(activo: true)
                                                   .order(:dia_semana, :hora_inicio)
                                                   .map { |h| horario_response(h) }
        end

        response
      end

      def agrupar_horarios(medico)
        medico.horario_medicos.where(activo: true).group_by(&:dia_semana).map do |dia, horarios|
          {
            dia: dia_semana_texto(dia),
            horarios: horarios.map { |h| "#{h.hora_inicio.strftime('%I:%M %p')} - #{h.hora_fin.strftime('%I:%M %p')}" }
          }
        end
      end

      def tiene_horario_hoy?(medico)
        dia_hoy = Date.current.wday
        medico.horario_medicos.where(dia_semana: dia_hoy, activo: true).exists?
      end

      def dia_semana_texto(dia)
        dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        dias[dia.to_i]
      end

      def asignar_especialidades(medico, especialidad_ids)
        return unless especialidad_ids.present?
        
        # Limpiar especialidades actuales
        medico.medico_especialidades.destroy_all
        
        # Asignar nuevas especialidades
        especialidad_ids.each_with_index do |esp_id, index|
          medico.agregar_especialidad(esp_id, es_principal: index == 0)
        end
      end

      def combinar_fecha_hora(fecha, hora)
        Time.zone.parse("#{fecha} #{hora}")
      end
    end
  end
end