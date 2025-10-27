module Api
  module V1
    class MedicosController < ApplicationController
      skip_before_action :authenticate_request!, only: [:index, :show, :buscar, :disponibles]
      before_action :set_medico, only: [:show, :update, :destroy, :horarios, :citas, :estadisticas]
      before_action :require_admin!, only: [:destroy]
      before_action :authorize_medico_access, only: [:update]

      # GET /api/v1/medicos
      def index
        @medicos = Medico.includes(:usuario, :especialidades)
                         .joins(:usuario)
                         .where(usuarios: { activo: true })
        
        @medicos = filter_medicos(@medicos)
        @medicos = @medicos.order(created_at: :desc)

        paginated_medicos = paginate(@medicos)

        render_success({
          medicos: paginated_medicos.map { |m| medico_response(m) },
          meta: pagination_meta(paginated_medicos)
        })
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
            @medico = Medico.new(medico_params)
            @medico.usuario_id = usuario.id
            
            if @medico.save
              # Asignar especialidades
              asignar_especialidades(@medico, params[:especialidad_ids])
              
              render_success(
                medico_response(@medico),
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
        if @medico.update(medico_params)
          # Actualizar especialidades si se proporcionaron
          if params[:especialidad_ids].present?
            asignar_especialidades(@medico, params[:especialidad_ids])
          end
          
          render_success(
            medico_response(@medico),
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

        @medicos = Medico.joins(:usuario)
                         .where('usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ? OR medicos.numero_colegiatura ILIKE ?',
                                "%#{query}%", "%#{query}%", "%#{query}%")
                         .where(usuarios: { activo: true })
                         .includes(:especialidades, :usuario)
                         .limit(20)

        render_success(@medicos.map { |m| medico_response(m) })
      end

      # GET /api/v1/medicos/disponibles
      def disponibles
        fecha = params[:fecha]&.to_date || Date.today
        especialidad_id = params[:especialidad_id]

        @medicos = Medico.joins(:usuario)
                         .where(usuarios: { activo: true })
                         .includes(:horarios_disponibles, :especialidades)

        # Filtrar por especialidad si se proporciona
        if especialidad_id.present?
          @medicos = @medicos.joins(:especialidades)
                             .where(especialidades: { id: especialidad_id })
        end

        # Filtrar por disponibilidad en la fecha
        dia_semana = fecha.wday
        @medicos = @medicos.where(
          id: HorarioDisponible.where(dia_semana: dia_semana, activo: true)
                                .select(:medico_id)
        )

        render_success(@medicos.map { |m| medico_response(m, include_horarios: true) })
      end

      # GET /api/v1/medicos/:id/horarios
      def horarios
        horarios = @medico.horarios_disponibles.where(activo: true).order(:dia_semana, :hora_inicio)
        
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
          calificacion_promedio: @medico.calificacion_promedio,
          pacientes_unicos: @medico.citas.select(:paciente_id).distinct.count,
          ingresos_totales: @medico.citas.where(estado: :completada).sum(:costo)
        }

        # Estadísticas por mes (últimos 6 meses)
        stats[:citas_por_mes] = @medico.citas
                                       .where('fecha_hora_inicio >= ?', 6.months.ago)
                                       .group_by_month(:fecha_hora_inicio)
                                       .count

        render_success(stats)
      end

      private

      def set_medico
        @medico = Medico.find(params[:id])
      end

      def usuario_params
        params.require(:usuario).permit(:email, :password, :password_confirmation, :nombre, :apellido, :telefono, :direccion)
      end

      def medico_params
        params.require(:medico).permit(
          :numero_colegiatura,
          :anos_experiencia,
          :tarifa_consulta,
          :biografia,
          :calificacion_promedio
        )
      end

      def authorize_medico_access
        unless current_user.es_administrador? || (current_user.es_medico? && current_user.medico.id == @medico.id)
          render_error('No tienes permiso para modificar este médico', status: :forbidden)
        end
      end

      def filter_medicos(medicos)
        if params[:especialidad_id].present?
          medicos = medicos.joins(:especialidades)
                           .where(especialidades: { id: params[:especialidad_id] })
        end

        if params[:calificacion_min].present?
          medicos = medicos.where('calificacion_promedio >= ?', params[:calificacion_min])
        end

        if params[:tarifa_max].present?
          medicos = medicos.where('tarifa_consulta <= ?', params[:tarifa_max])
        end

        medicos
      end

      def asignar_especialidades(medico, especialidad_ids)
        return unless especialidad_ids.is_a?(Array)
        
        medico.especialidades.clear
        especialidad_ids.each do |esp_id|
          especialidad = Especialidad.find_by(id: esp_id)
          medico.especialidades << especialidad if especialidad
        end
      end

      def medico_response(medico, detailed: false, include_horarios: false)
        response = {
          id: medico.id,
          nombre_completo: medico.nombre_completo,
          email: medico.email,
          telefono: medico.telefono,
          numero_colegiatura: medico.numero_colegiatura,
          anos_experiencia: medico.anos_experiencia,
          calificacion_promedio: medico.calificacion_promedio,
          tarifa_consulta: medico.tarifa_consulta,
          especialidades: medico.especialidades.map { |e| { id: e.id, nombre: e.nombre } }
        }

        if detailed
          response.merge!({
            direccion: medico.direccion,
            biografia: medico.biografia,
            total_citas: medico.citas.count,
            pacientes_atendidos: medico.citas.select(:paciente_id).distinct.count,
            created_at: medico.created_at
          })
        end

        if include_horarios
          response[:horarios_disponibles] = medico.horarios_disponibles
                                                   .where(activo: true)
                                                   .order(:dia_semana, :hora_inicio)
                                                   .map { |h| horario_response(h) }
        end

        response
      end

      def horario_response(horario)
        {
          id: horario.id,
          dia_semana: horario.dia_semana,
          hora_inicio: horario.hora_inicio.strftime('%H:%M'),
          hora_fin: horario.hora_fin.strftime('%H:%M'),
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

      def horarios_disponibles
        fecha = params[:fecha] ? Date.parse(params[:fecha]) : Date.current
        
        # Obtener horarios del médico para ese día
        dia_semana = fecha.wday
        horarios = @medico.horarios_disponibles.where(dia_semana: dia_semana, activo: true)

        if horarios.empty?
          return render_success({
            fecha: fecha,
            dia_semana: I18n.l(fecha, format: '%A'),
            disponible: false,
            horarios: []
          })
        end

        # Obtener citas ya agendadas para ese día
        citas_ocupadas = @medico.citas
          .where('DATE(fecha_hora_inicio) = ?', fecha)
          .where(estado: [:pendiente, :confirmada])
          .pluck(:fecha_hora_inicio)

        # Generar slots disponibles
        slots_disponibles = []
        
        horarios.each do |horario|
          hora_actual = combinar_fecha_hora(fecha, horario.hora_inicio)
          hora_fin = combinar_fecha_hora(fecha, horario.hora_fin)
          duracion = 30.minutes # Puedes hacer esto configurable por médico

          while hora_actual < hora_fin
            # Verificar que no esté ocupado y que sea futuro
            unless citas_ocupadas.include?(hora_actual) || hora_actual < Time.current
              slots_disponibles << {
                fecha_hora: hora_actual,
                hora_display: hora_actual.strftime('%I:%M %p'),
                disponible: true
              }
            end
            hora_actual += duracion
          end
        end

        render_success({
          fecha: fecha,
          dia_semana: I18n.l(fecha, format: '%A'),
          disponible: slots_disponibles.any?,
          horarios: slots_disponibles,
          duracion_cita: 30
        })
      end

      # NUEVO MÉTODO: GET /api/v1/medicos/especialidades
      # Para obtener lista de especialidades con cantidad de médicos
      def especialidades
        especialidades = Especialidad.all.map do |esp|
          medicos_count = Medico.joins(:especialidades)
                                .where(especialidades: { id: esp.id })
                                .where(usuarios: { activo: true })
                                .count
          {
            id: esp.id,
            nombre: esp.nombre,
            descripcion: esp.descripcion,
            total_medicos: medicos_count
          }
        end.select { |e| e[:total_medicos] > 0 }
         .sort_by { |e| e[:nombre] }

        render_success(especialidades)
      end

      private

      # NUEVO HELPER: Combinar fecha con hora
      def combinar_fecha_hora(fecha, hora)
        Time.zone.parse("#{fecha} #{hora}")
      end

      # MEJORAR método medico_response para incluir datos del dashboard
      def medico_response(medico, detailed: false, include_horarios: false, for_card: false)
        response = {
          id: medico.id,
          nombre_completo: medico.nombre_completo,
          email: medico.email,
          telefono: medico.telefono,
          numero_colegiatura: medico.numero_colegiatura,
          anos_experiencia: medico.anos_experiencia,
          calificacion_promedio: medico.calificacion_promedio || 4.5,
          tarifa_consulta: medico.tarifa_consulta,
          especialidades: medico.especialidades.map { |e| { id: e.id, nombre: e.nombre } }
        }

        # Para cards del dashboard
        if for_card
          response.merge!({
            especialidad: medico.especialidades.first&.nombre || 'General',
            anos_experiencia: medico.anos_experiencia,
            costo_consulta: medico.tarifa_consulta,
            biografia: medico.biografia&.truncate(150),
            calificacion: medico.calificacion_promedio || 4.5,
            total_reviews: rand(10..100), # Temporal - implementar reviews reales
            foto_url: nil,
            disponible_hoy: tiene_horario_hoy?(medico)
          })
        end

        if detailed
          response.merge!({
            direccion: medico.direccion,
            biografia: medico.biografia,
            total_citas: medico.citas.count,
            pacientes_atendidos: medico.citas.select(:paciente_id).distinct.count,
            created_at: medico.created_at,
            certificaciones: medico.certificaciones.map do |cert|
              {
                id: cert.id,
                nombre: cert.nombre,
                institucion: cert.institucion_emisora
              }
            end,
            horarios_atencion: agrupar_horarios(medico)
          })
        end

        if include_horarios
          response[:horarios_disponibles] = medico.horarios_disponibles
                                                   .where(activo: true)
                                                   .order(:dia_semana, :hora_inicio)
                                                   .map { |h| horario_response(h) }
        end

        response
      end

      # NUEVO HELPER: Agrupar horarios por día
      def agrupar_horarios(medico)
        medico.horarios_disponibles.where(activo: true).group_by(&:dia_semana).map do |dia, horarios|
          {
            dia: dia_semana_texto(dia),
            horarios: horarios.map { |h| "#{h.hora_inicio.strftime('%I:%M %p')} - #{h.hora_fin.strftime('%I:%M %p')}" }
          }
        end
      end

      # NUEVO HELPER: Verificar si tiene horario hoy
      def tiene_horario_hoy?(medico)
        dia_hoy = Date.current.wday
        medico.horarios_disponibles.where(dia_semana: dia_hoy, activo: true).exists?
      end

      # NUEVO HELPER: Convertir número de día a texto
      def dia_semana_texto(dia)
        dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        dias[dia]
      end

      # MODIFICAR filtro para buscar por nombre y especialidad
      def filter_medicos(medicos)
        # Búsqueda por texto
        if params[:q].present?
          busqueda = params[:q].downcase
          medicos = medicos.joins(:usuario).where(
            'LOWER(usuarios.nombre) LIKE ? OR LOWER(usuarios.apellido) LIKE ? OR LOWER(medicos.especialidad_principal) LIKE ?',
            "%#{busqueda}%", "%#{busqueda}%", "%#{busqueda}%"
          )
        end

        if params[:especialidad].present?
          medicos = medicos.where(especialidad_principal: params[:especialidad])
        end

        if params[:especialidad_id].present?
          medicos = medicos.joins(:especialidades)
                           .where(especialidades: { id: params[:especialidad_id] })
        end

        if params[:calificacion_min].present?
          medicos = medicos.where('calificacion_promedio >= ?', params[:calificacion_min])
        end

        if params[:tarifa_max].present?
          medicos = medicos.where('tarifa_consulta <= ?', params[:tarifa_max])
        end

        # Ordenamiento
        orden = params[:orden] || 'nombre'
        medicos = case orden
        when 'experiencia'
          medicos.order(anos_experiencia: :desc)
        when 'precio_asc'
          medicos.order(tarifa_consulta: :asc)
        when 'precio_desc'
          medicos.order(tarifa_consulta: :desc)
        when 'calificacion'
          medicos.order(calificacion_promedio: :desc)
        else
          medicos.joins(:usuario).order('usuarios.nombre ASC')
        end

        medicos
      end
    end
  end
end