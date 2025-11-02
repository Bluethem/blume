# app/controllers/api/v1/paciente/reprogramaciones_controller.rb
module Api
  module V1
    module Paciente
      class ReprogramacionesController < ApplicationController
        before_action :authenticate_request!
        before_action :verificar_paciente
        before_action :set_reprogramacion, only: [:show, :cancelar]
        
        # GET /api/v1/paciente/reprogramaciones
        def index
          reprogramaciones = ReschedulingService.reprogramaciones_paciente(
            @paciente.id,
            estado: params[:estado]
          )
          
          page = params[:page]&.to_i || 1
          per_page = params[:per_page]&.to_i || 10
          
          reprogramaciones_paginadas = reprogramaciones.offset((page - 1) * per_page).limit(per_page)
          
          render_success({
            reprogramaciones: reprogramaciones_paginadas.map { |r| reprogramacion_json(r) },
            total: reprogramaciones.count,
            page: page,
            per_page: per_page,
            total_pages: (reprogramaciones.count.to_f / per_page).ceil
          })
        end
        
        # GET /api/v1/paciente/reprogramaciones/:id
        def show
          render_success(reprogramacion_json(@reprogramacion, detallado: true))
        end
        
        # POST /api/v1/paciente/reprogramaciones
        def create
          cita = @paciente.citas.find(params[:cita_id])
          
          reprogramacion = ReschedulingService.solicitar_reprogramacion(
            cita,
            current_user,
            {
              motivo: params[:motivo],
              descripcion: params[:descripcion],
              justificacion: params[:justificacion],
              fecha_propuesta_1: parse_datetime(params[:fecha_propuesta_1]),
              fecha_propuesta_2: parse_datetime(params[:fecha_propuesta_2]),
              fecha_propuesta_3: parse_datetime(params[:fecha_propuesta_3])
            }
          )
          
          render_success(
            reprogramacion_json(reprogramacion),
            message: 'Solicitud de reprogramación enviada exitosamente'
          )
        rescue ReschedulingService::ReschedulingError => e
          render_error(e.message, status: :unprocessable_entity)
        rescue => e
          Rails.logger.error("Error al crear reprogramación: #{e.message}")
          render_error('Error al procesar la solicitud', status: :internal_server_error)
        end
        
        # PUT /api/v1/paciente/reprogramaciones/:id/cancelar
        def cancelar
          ReschedulingService.cancelar_reprogramacion(
            @reprogramacion,
            current_user,
            params[:motivo]
          )
          
          render_success(
            reprogramacion_json(@reprogramacion),
            message: 'Reprogramación cancelada exitosamente'
          )
        rescue ReschedulingService::ReschedulingError => e
          render_error(e.message, status: :unprocessable_entity)
        rescue => e
          Rails.logger.error("Error al cancelar reprogramación: #{e.message}")
          render_error('Error al cancelar la reprogramación', status: :internal_server_error)
        end
        
        # GET /api/v1/paciente/reprogramaciones/pendientes
        def pendientes
          reprogramaciones = ReschedulingService.reprogramaciones_paciente(
            @paciente.id,
            estado: :pendiente
          )
          
          render_success({
            reprogramaciones: reprogramaciones.map { |r| reprogramacion_json(r) },
            total: reprogramaciones.count
          })
        end
        
        private
        
        def verificar_paciente
          unless current_user.es_paciente?
            render_error('Acceso no autorizado', status: :forbidden)
            return
          end
          
          @paciente = current_user.paciente
          
          unless @paciente
            render_error('Paciente no encontrado', status: :not_found)
          end
        end
        
        def set_reprogramacion
          @reprogramacion = Reprogramacion.joins(:cita_original)
                                          .where(citas: { paciente_id: @paciente.id })
                                          .find_by(id: params[:id])
          
          unless @reprogramacion
            render_error('Reprogramación no encontrada', status: :not_found)
          end
        end
        
        def parse_datetime(datetime_str)
          return nil if datetime_str.blank?
          DateTime.parse(datetime_str)
        rescue ArgumentError
          nil
        end
        
        def reprogramacion_json(reprogramacion, detallado: false)
          json = {
            id: reprogramacion.id,
            motivo: reprogramacion.motivo,
            motivo_label: reprogramacion.motivo_humanizado,
            estado: reprogramacion.estado,
            estado_label: reprogramacion.estado_humanizado,
            descripcion: reprogramacion.descripcion,
            fechas_propuestas: reprogramacion.fechas_propuestas.map(&:iso8601),
            fecha_seleccionada: reprogramacion.fecha_seleccionada&.iso8601,
            requiere_reembolso: reprogramacion.requiere_reembolso,
            reembolso_procesado: reprogramacion.reembolso_procesado,
            created_at: reprogramacion.created_at.iso8601,
            cita_original: {
              id: reprogramacion.cita_original.id,
              fecha: reprogramacion.cita_original.fecha_hora_inicio.iso8601,
              medico: reprogramacion.cita_original.medico.nombre_profesional,
              costo: reprogramacion.cita_original.costo.to_f
            }
          }
          
          if detallado
            json.merge!({
              justificacion: reprogramacion.justificacion,
              fecha_aprobacion: reprogramacion.fecha_aprobacion&.iso8601,
              fecha_rechazo: reprogramacion.fecha_rechazo&.iso8601,
              motivo_rechazo: reprogramacion.motivo_rechazo,
              metadata: reprogramacion.metadata,
              cita_nueva: reprogramacion.cita_nueva ? {
                id: reprogramacion.cita_nueva.id,
                fecha: reprogramacion.cita_nueva.fecha_hora_inicio.iso8601,
                estado: reprogramacion.cita_nueva.estado
              } : nil,
              aprobado_por: reprogramacion.aprobado_por ? {
                nombre: reprogramacion.aprobado_por.nombre_completo,
                rol: reprogramacion.aprobado_por.rol
              } : nil
            })
          end
          
          json
        end
      end
    end
  end
end
