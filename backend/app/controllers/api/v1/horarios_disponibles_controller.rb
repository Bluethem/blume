module Api
  module V1
    class HorariosDisponiblesController < ApplicationController
      skip_before_action :authenticate_request!, only: [:por_medico, :disponibles]
      before_action :set_horario, only: [:show, :update, :destroy]
      before_action :authorize_horario_access, only: [:create, :update, :destroy]

      # GET /api/v1/horarios
      def index
        if current_user.es_medico?
          @horarios = current_user.medico.horarios_disponibles
        elsif current_user.es_administrador?
          @horarios = HorarioDisponible.all.includes(:medico)
        else
          render_error('No autorizado', status: :forbidden)
          return
        end

        @horarios = @horarios.order(:dia_semana, :hora_inicio)

        render_success(@horarios.map { |h| horario_response(h) })
      end

      # GET /api/v1/horarios/:id
      def show
        render_success(horario_response(@horario))
      end

      # POST /api/v1/horarios
      def create
        medico_id = params[:medico_id]
        
        # Si es médico, solo puede crear sus propios horarios
        if current_user.es_medico?
          medico_id = current_user.medico.id
        end

        @horario = HorarioDisponible.new(horario_params)
        @horario.medico_id = medico_id

        # Validar que no haya solapamiento de horarios
        if horario_solapado?(@horario)
          render_error('Ya existe un horario en ese día y rango de horas')
          return
        end

        if @horario.save
          render_success(
            horario_response(@horario),
            message: 'Horario creado exitosamente',
            status: :created
          )
        else
          render_error('Error al crear el horario', errors: @horario.errors.full_messages)
        end
      end

      # PUT /api/v1/horarios/:id
      def update
        if @horario.update(horario_params)
          render_success(
            horario_response(@horario),
            message: 'Horario actualizado exitosamente'
          )
        else
          render_error('Error al actualizar el horario', errors: @horario.errors.full_messages)
        end
      end

      # DELETE /api/v1/horarios/:id
      def destroy
        if @horario.destroy
          render_success(nil, message: 'Horario eliminado exitosamente')
        else
          render_error('Error al eliminar el horario')
        end
      end

      # GET /api/v1/horarios/por_medico/:medico_id
      def por_medico
        medico = ::Medico.find(params[:medico_id])
        @horarios = medico.horarios_disponibles.where(activo: true).order(:dia_semana, :hora_inicio)

        render_success(@horarios.map { |h| horario_response(h) })
      end

      # GET /api/v1/horarios/disponibles
      def disponibles
        fecha = params[:fecha]&.to_date || Date.today
        medico_id = params[:medico_id]

        unless medico_id.present?
          render_error('medico_id es requerido', status: :bad_request)
          return
        end

        dia_semana = fecha.wday
        @horarios = HorarioDisponible.where(medico_id: medico_id, dia_semana: dia_semana, activo: true)
                                     .order(:hora_inicio)

        # Filtrar horarios que ya tienen citas
        horarios_libres = @horarios.select do |horario|
          !tiene_cita_en_horario?(medico_id, fecha, horario)
        end

        render_success(horarios_libres.map { |h| horario_response(h) })
      end

      private

      def set_horario
        @horario = HorarioDisponible.find(params[:id])
      end

      def horario_params
        params.require(:horario).permit(:dia_semana, :hora_inicio, :hora_fin, :activo)
      end

      def authorize_horario_access
        return if current_user.es_administrador?
        
        if current_user.es_medico?
          medico_id = params[:medico_id] || @horario&.medico_id
          unless current_user.medico.id == medico_id
            render_error('No tienes permiso para gestionar estos horarios', status: :forbidden)
          end
        else
          render_error('No autorizado', status: :forbidden)
        end
      end

      def horario_solapado?(horario)
        HorarioDisponible.where(
          medico_id: horario.medico_id,
          dia_semana: horario.dia_semana,
          activo: true
        ).where.not(id: horario.id)
         .where('(hora_inicio < ? AND hora_fin > ?) OR (hora_inicio < ? AND hora_fin > ?)',
                horario.hora_fin, horario.hora_inicio,
                horario.hora_fin, horario.hora_inicio)
         .exists?
      end

      def tiene_cita_en_horario?(medico_id, fecha, horario)
        fecha_inicio = Time.zone.local(fecha.year, fecha.month, fecha.day, 
                                       horario.hora_inicio.hour, horario.hora_inicio.min)
        fecha_fin = Time.zone.local(fecha.year, fecha.month, fecha.day,
                                    horario.hora_fin.hour, horario.hora_fin.min)

        Cita.where(medico_id: medico_id)
            .where.not(estado: :cancelada)
            .where('fecha_hora_inicio >= ? AND fecha_hora_fin <= ?', fecha_inicio, fecha_fin)
            .exists?
      end

      def horario_response(horario)
        response = {
          id: horario.id,
          medico_id: horario.medico_id,
          dia_semana: horario.dia_semana,
          dia_nombre: Date::DAYNAMES[horario.dia_semana],
          hora_inicio: horario.hora_inicio.strftime('%H:%M'),
          hora_fin: horario.hora_fin.strftime('%H:%M'),
          activo: horario.activo,
          created_at: horario.created_at
        }

        if current_user&.es_administrador?
          response[:medico_nombre] = horario.medico.nombre_completo
        end

        response
      end
    end
  end
end