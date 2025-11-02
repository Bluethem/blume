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

          # Verificar si la cita ya está pagada
          if cita.pagado?
            return render_error('Esta cita ya ha sido pagada', status: :unprocessable_entity)
          end
          
          # Verificar si ya existe un pago completado para esta cita
          if cita.pago_inicial&.completado?
            return render_error('Esta cita ya tiene un pago completado', status: :unprocessable_entity)
          end
          
          # Verificar si la cita está cancelada
          if cita.estado_cancelada?
            return render_error('No se puede pagar una cita cancelada', status: :unprocessable_entity)
          end
          
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
              cita.update!(pagado: true)
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
        rescue ActiveRecord::RecordNotFound
          render_error('Cita no encontrada', status: :not_found)
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
        
        # GET /api/v1/paciente/pagos/adicionales_pendientes
        def adicionales_pendientes
          citas = @paciente.citas
                           .where(estado: :completada, requiere_pago_adicional: true)
                           .includes(:medico)
                           .order(fecha_hora_inicio: :desc)
          
          render_success(citas.map { |c| cita_con_pago_adicional_json(c) })
        end
        
        # POST /api/v1/paciente/pagos/adicional
        def pagar_adicional
          cita_id = params[:cita_id]
          metodo_pago = params[:metodo_pago]
          
          cita = @paciente.citas.find_by(id: cita_id)
          
          unless cita
            return render_error('Cita no encontrada', status: :not_found)
          end
          
          unless cita.requiere_pago_adicional?
            return render_error('La cita no requiere pago adicional')
          end
          
          if cita.monto_adicional <= 0
            return render_error('El monto adicional debe ser mayor a 0')
          end
          
          # Crear pago adicional
          pago = Pago.create!(
            cita: cita,
            paciente: @paciente,
            tipo_pago: :pago_adicional,
            metodo_pago: metodo_pago,
            monto: cita.monto_adicional,
            estado: :completado,
            concepto: 'Pago adicional',
            descripcion: "Pago adicional de la consulta",
            fecha_pago: Time.current
          )
          
          # Actualizar cita
          cita.update!(
            requiere_pago_adicional: false,
            pagado: true
          )
          
          # Notificar al médico
          Notificacion.create!(
            usuario: cita.medico.usuario,
            cita: cita,
            tipo: :pago_confirmado, 
            titulo: 'Pago Adicional Recibido',
            mensaje: "El paciente #{@paciente.nombre_completo} ha pagado el monto adicional de S/ #{pago.monto}"
          )
          
          render_success(
            pago_json(pago),
            message: 'Pago adicional procesado exitosamente'
          )
        rescue ActiveRecord::RecordNotFound
          render_error('Cita no encontrada', status: :not_found)
        rescue => e
          Rails.logger.error("Error al procesar pago adicional: #{e.message}")
          render_error('Error al procesar el pago adicional', status: :internal_server_error)
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
        
        def cita_con_pago_adicional_json(cita)
          {
            id: cita.id,
            fecha_hora_inicio: cita.fecha_hora_inicio.iso8601,
            costo: cita.costo.to_f,
            monto_adicional: cita.monto_adicional.to_f,
            observaciones: cita.observaciones,
            medico: {
              id: cita.medico.id,
              nombre_profesional: cita.medico.nombre_profesional,
              especialidad: cita.medico.especialidad_principal&.nombre
            }
          }
        end
      end
    end
  end
end
