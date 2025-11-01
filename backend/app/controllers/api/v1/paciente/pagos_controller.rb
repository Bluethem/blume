# app/controllers/api/v1/paciente/pagos_controller.rb
module Api
  module V1
    module Paciente
      class PagosController < ApplicationController
        before_action :authenticate_request!
        before_action :verificar_paciente
        before_action :set_pago, only: [:show, :confirmar]
        
        # GET /api/v1/paciente/pagos
        def index
          pagos = PaymentService.historial_pagos_paciente(
            @paciente.id,
            {
              estado: params[:estado],
              tipo: params[:tipo],
              fecha_desde: params[:fecha_desde],
              fecha_hasta: params[:fecha_hasta]
            }
          )
          
          page = params[:page]&.to_i || 1
          per_page = params[:per_page]&.to_i || 10
          
          pagos_paginados = pagos.offset((page - 1) * per_page).limit(per_page)
          
          render_success({
            pagos: pagos_paginados.map { |p| pago_json(p) },
            total: pagos.count,
            page: page,
            per_page: per_page,
            total_pages: (pagos.count.to_f / per_page).ceil
          })
        end
        
        # GET /api/v1/paciente/pagos/:id
        def show
          render_success(pago_json(@pago, detallado: true))
        end
        
        # POST /api/v1/paciente/pagos
        # Crear pago para una cita
        def create
          cita = @paciente.citas.find(params[:cita_id])
          
          unless cita.puede_confirmarse? || cita.confirmada?
            return render_error('La cita no está disponible para pago', status: :unprocessable_entity)
          end
          
          pago = PaymentService.crear_pago_inicial(
            cita,
            params[:metodo_pago],
            current_user.id
          )
          
          # Si es efectivo o transferencia, queda pendiente de confirmación
          # Si es tarjeta/yape/plin, se procesa automáticamente
          if [:tarjeta, :yape, :plin].include?(params[:metodo_pago].to_sym)
            resultado = PaymentService.procesar_pago(pago.id)
            
            if resultado[:exitoso]
              render_success(
                pago_json(resultado[:pago]),
                message: 'Pago procesado exitosamente'
              )
            else
              render_error(
                'Error al procesar el pago',
                errors: [resultado[:error]],
                status: :unprocessable_entity
              )
            end
          else
            render_success(
              pago_json(pago),
              message: 'Pago registrado. Pendiente de confirmación'
            )
          end
        rescue PaymentService::PaymentError => e
          render_error(e.message, status: :unprocessable_entity)
        rescue => e
          Rails.logger.error("Error al crear pago: #{e.message}")
          render_error('Error al procesar el pago', status: :internal_server_error)
        end
        
        # PUT /api/v1/paciente/pagos/:id/confirmar
        # Confirmar un pago pendiente (para efectivo)
        def confirmar
          unless @pago.pendiente?
            return render_error('Este pago no está pendiente', status: :unprocessable_entity)
          end
          
          pago = PaymentService.confirmar_pago(@pago.id, confirmado_por: current_user.id)
          
          render_success(
            pago_json(pago),
            message: 'Pago confirmado exitosamente'
          )
        rescue PaymentService::PaymentError => e
          render_error(e.message, status: :unprocessable_entity)
        rescue => e
          Rails.logger.error("Error al confirmar pago: #{e.message}")
          render_error('Error al confirmar el pago', status: :internal_server_error)
        end
        
        # GET /api/v1/paciente/pagos/estadisticas
        def estadisticas
          stats = PaymentService.estadisticas_pagos(@paciente.id)
          render_success(stats)
        end
        
        # GET /api/v1/paciente/pagos/pendientes
        def pendientes
          pagos = @paciente.pagos
                           .pendientes
                           .includes(cita: [:medico])
                           .order(created_at: :desc)
          
          render_success({
            pagos: pagos.map { |p| pago_json(p) },
            total: pagos.count
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
        
        def set_pago
          @pago = @paciente.pagos.find_by(id: params[:id])
          
          unless @pago
            render_error('Pago no encontrado', status: :not_found)
          end
        end
        
        def pago_json(pago, detallado: false)
          json = {
            id: pago.id,
            monto: pago.monto.to_f,
            tipo_pago: pago.tipo_pago,
            estado: pago.estado,
            metodo_pago: pago.metodo_pago,
            concepto: pago.concepto,
            descripcion: pago.descripcion,
            transaction_id: pago.transaction_id,
            fecha_pago: pago.fecha_pago&.iso8601,
            created_at: pago.created_at.iso8601,
            cita: {
              id: pago.cita.id,
              fecha: pago.cita.fecha_hora_inicio.iso8601,
              medico: pago.cita.medico.nombre_profesional,
              especialidad: pago.cita.medico.especialidad_principal&.nombre
            }
          }
          
          if detallado
            json.merge!({
              metadata: pago.metadata,
              fecha_reembolso: pago.fecha_reembolso&.iso8601,
              payment_gateway: pago.payment_gateway,
              updated_at: pago.updated_at.iso8601
            })
          end
          
          json
        end
      end
    end
  end
end
