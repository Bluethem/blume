# app/controllers/api/v1/horario_medicos_controller.rb
module Api
  module V1
    class HorarioMedicosController < ApplicationController
      before_action :authenticate_request!
      before_action :set_medico
      before_action :set_horario, only: [:show, :update, :destroy]
      before_action :authorize_medico_access, except: [:index, :disponibles]
      
      # GET /api/v1/medicos/:medico_id/horarios
      def index
        horarios = @medico.horario_medicos
                          .where(activo: true)
                          .order(:dia_semana, :hora_inicio)
        
        render_success(horarios.map { |h| horario_response(h) })
      end
      
      # GET /api/v1/medicos/:medico_id/horarios/:id
      def show
        render_success(horario_response(@horario, detailed: true))
      end
      
      # GET /api/v1/medicos/:medico_id/horarios/disponibles?fecha=2025-01-15
      def disponibles
        fecha = params[:fecha]&.to_date
        
        unless fecha
          render_error('Parámetro fecha es requerido (formato: YYYY-MM-DD)', status: :bad_request)
          return
        end
        
        # Verificar que la fecha no sea en el pasado
        if fecha < Date.today
          render_success({
            fecha: fecha.to_s,
            dia_semana: fecha.strftime('%A'),
            dia_numero: fecha.wday,
            disponible: false,
            mensaje: 'No se pueden agendar citas en fechas pasadas',
            slots: []
          })
          return
        end
        
        # Verificar si el médico tiene horarios para ese día
        dia_semana = fecha.wday
        horarios = @medico.horario_medicos.activos.where(dia_semana: dia_semana)
        
        unless horarios.exists?
          render_success({
            fecha: fecha.to_s,
            dia_semana: fecha.strftime('%A'),
            dia_numero: fecha.wday,
            disponible: false,
            mensaje: 'El médico no atiende este día de la semana',
            slots: []
          })
          return
        end
        
        # Generar slots disponibles
        slots = horarios.flat_map { |h| h.slots_disponibles(fecha) }
        slots_disponibles = slots.select { |s| s[:disponible] }
        
        render_success({
          fecha: fecha.to_s,
          dia_semana: fecha.strftime('%A'),
          dia_numero: fecha.wday,
          disponible: slots_disponibles.any?,
          total_slots: slots.length,
          slots_disponibles: slots_disponibles.length,
          slots_ocupados: slots.length - slots_disponibles.length,
          slots: slots,
          medico: {
            id: @medico.id,
            nombre_completo: @medico.nombre_completo,
            nombre_profesional: @medico.nombre_profesional
          }
        })
      end
      
      # POST /api/v1/medicos/:medico_id/horarios
      def create
        horario = @medico.horario_medicos.new(horario_params)
        
        if horario.save
          render_success(
            horario_response(horario, detailed: true),
            message: 'Horario creado exitosamente',
            status: :created
          )
        else
          render_error('Error al crear horario', errors: horario.errors.full_messages)
        end
      end
      
      # PUT /api/v1/medicos/:medico_id/horarios/:id
      def update
        if @horario.update(horario_params)
          render_success(
            horario_response(@horario, detailed: true),
            message: 'Horario actualizado exitosamente'
          )
        else
          render_error('Error al actualizar horario', errors: @horario.errors.full_messages)
        end
      end
      
      # DELETE /api/v1/medicos/:medico_id/horarios/:id
      def destroy
        # No eliminar, solo desactivar
        if @horario.update(activo: false)
          render_success(nil, message: 'Horario desactivado exitosamente')
        else
          render_error('Error al desactivar horario')
        end
      end
      
      # POST /api/v1/medicos/:medico_id/horarios/:id/activar
      def activar
        set_horario
        
        if @horario.update(activo: true)
          render_success(
            horario_response(@horario),
            message: 'Horario activado exitosamente'
          )
        else
          render_error('Error al activar horario')
        end
      end
      
      # GET /api/v1/medicos/:medico_id/horarios/semana
      def semana
        horarios_agrupados = @medico.horario_medicos
                                    .activos
                                    .order(:dia_semana, :hora_inicio)
                                    .group_by(&:dia_semana)
        
        semana = (0..6).map do |dia|
          horarios_del_dia = horarios_agrupados[dia] || []
          
          {
            dia_numero: dia,
            dia_nombre: HorarioMedico.dias_semana_hash[dia],
            dia_abreviado: HorarioMedico.dias_semana_abreviados[dia],
            tiene_horarios: horarios_del_dia.any?,
            horarios: horarios_del_dia.map { |h| horario_response(h) }
          }
        end
        
        render_success(semana)
      end
      
      private
      
      def set_medico
        @medico = Medico.find(params[:medico_id])
      end
      
      def set_horario
        @horario = @medico.horario_medicos.find(params[:id])
      end
      
      def authorize_medico_access
        unless current_user.es_administrador? || 
               (current_user.es_medico? && current_user.medico.id == @medico.id)
          render_error('No autorizado', status: :forbidden)
        end
      end
      
      def horario_params
        params.require(:horario).permit(
          :dia_semana,
          :hora_inicio,
          :hora_fin,
          :duracion_cita_minutos,
          :activo
        )
      end
      
      def horario_response(horario, detailed: false)
        response = {
          id: horario.id,
          dia_semana: horario.dia_semana,
          dia_nombre: horario.nombre_dia,
          dia_abreviado: horario.nombre_dia_abreviado,
          hora_inicio: horario.hora_inicio.strftime('%H:%M'),
          hora_fin: horario.hora_fin.strftime('%H:%M'),
          duracion_cita_minutos: horario.duracion_cita_minutos,
          activo: horario.activo
        }
        
        if detailed
          response.merge!(
            duracion_total_minutos: horario.duracion_total_minutos,
            cantidad_slots: horario.cantidad_slots_disponibles,
            created_at: horario.created_at,
            updated_at: horario.updated_at
          )
        end
        
        response
      end
    end
  end
end