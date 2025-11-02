# app/controllers/api/v1/medico/reprogramaciones_controller.rb
module Api
  module V1
    module Medico
      class ReprogramacionesController < ApplicationController
        before_action :authenticate_request!
        before_action :verificar_medico
        before_action :set_reprogramacion, only: [:show, :aprobar, :rechazar]
        
        # GET /api/v1/medico/reprogramaciones
        def index
          reprogramaciones = Reprogramacion.joins(:cita_original)
                                           .where(citas: { medico_id: @medico.id })
                                           .includes(:cita_original, :solicitado_por, :cita_nueva)
                                           .order(created_at: :desc)
          
          # Filtros
          reprogramaciones = reprogramaciones.where(estado: params[:estado]) if params[:estado].present?
          reprogramaciones = reprogramaciones.where(motivo: params[:motivo]) if params[:motivo].present?
          
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
        
        # GET /api/v1/medico/reprogramaciones/pendientes
        def pendientes
          reprogramaciones = ReschedulingService.reprogramaciones_pendientes_medico(@medico.id)
          
          render_success({
            reprogramaciones: reprogramaciones.map { |r| reprogramacion_json(r) },
            total: reprogramaciones.count
          })
        end
        
        # GET /api/v1/medico/reprogramaciones/:id
        def show
          render_success(reprogramacion_json(@reprogramacion, detallado: true))
        end
        
        # PUT /api/v1/medico/reprogramaciones/:id/aprobar
        def aprobar
          fecha_seleccionada = parse_datetime(params[:fecha_seleccionada])
          
          unless fecha_seleccionada
            return render_error('Debe especificar una fecha válida', status: :unprocessable_entity)
          end
          
          reprogramacion = ReschedulingService.aprobar_reprogramacion(
            @reprogramacion,
            current_user,
            fecha_seleccionada,
            crear_cita_nueva: params[:crear_cita_nueva] != false
          )
          
          render_success(
            reprogramacion_json(reprogramacion, detallado: true),
            message: 'Reprogramación aprobada exitosamente'
          )
        rescue ReschedulingService::ReschedulingError => e
          render_error(e.message, status: :unprocessable_entity)
        rescue => e
          Rails.logger.error("Error al aprobar reprogramación: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          render_error('Error al procesar la aprobación', status: :internal_server_error)
        end
        
        # PUT /api/v1/medico/reprogramaciones/:id/rechazar
        def rechazar
          unless params[:motivo_rechazo].present?
            return render_error('Debe especificar el motivo del rechazo', status: :unprocessable_entity)
          end
          
          reprogramacion = ReschedulingService.rechazar_reprogramacion(
            @reprogramacion,
            current_user,
            params[:motivo_rechazo]
          )
          
          render_success(
            reprogramacion_json(reprogramacion),
            message: 'Reprogramación rechazada'
          )
        rescue ReschedulingService::ReschedulingError => e
          render_error(e.message, status: :unprocessable_entity)
        rescue => e
          Rails.logger.error("Error al rechazar reprogramación: #{e.message}")
          render_error('Error al procesar el rechazo', status: :internal_server_error)
        end
        
        # POST /api/v1/medico/reprogramaciones/registrar_falta
        def registrar_falta
          cita = @medico.citas.find(params[:cita_id])
          quien_falta = params[:quien_falta] # 'paciente' o 'medico'
          
          unless ['paciente', 'medico'].include?(quien_falta)
            return render_error('Debe especificar quien no asistió', status: :unprocessable_entity)
          end
          
          if quien_falta == 'paciente'
            cita.marcar_falta_paciente!(params[:motivo])
          else
            cita.marcar_falta_medico!(params[:motivo])
          end
          
          # Si la cita estaba pagada, crear reprogramación automática
          if cita.requiere_reprogramacion_automatica?
            motivo = quien_falta == 'medico' ? :medico_no_asistio : :paciente_no_asistio
            reprogramacion = ReschedulingService.crear_reprogramacion_automatica(cita, motivo)
            
            render_success(
              {
                cita: { id: cita.id, estado: cita.estado },
                reprogramacion: reprogramacion_json(reprogramacion)
              },
              message: 'Falta registrada y reprogramación creada automáticamente'
            )
          else
            render_success(
              { cita: { id: cita.id, estado: cita.estado } },
              message: 'Falta registrada exitosamente'
            )
          end
        rescue => e
          Rails.logger.error("Error al registrar falta: #{e.message}")
          render_error('Error al registrar la falta', status: :internal_server_error)
        end
        
        private
        
        def verificar_medico
          unless current_user.es_medico?
            render_error('Acceso no autorizado', status: :forbidden)
            return
          end
          
          @medico = current_user.medico
          
          unless @medico
            render_error('Médico no encontrado', status: :not_found)
          end
        end
        
        def set_reprogramacion
          @reprogramacion = Reprogramacion.joins(:cita_original)
                                          .where(citas: { medico_id: @medico.id })
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
              paciente: reprogramacion.cita_original.paciente.nombre_completo,
              pagado: reprogramacion.cita_original.pagado
            },
            solicitado_por: {
              nombre: reprogramacion.solicitado_por.nombre_completo,
              rol: reprogramacion.solicitado_por.rol
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
              } : nil
            })
          end
          
          json
        end
      end
    end
  end
end
