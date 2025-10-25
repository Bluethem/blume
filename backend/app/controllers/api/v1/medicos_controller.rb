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
    end
  end
end