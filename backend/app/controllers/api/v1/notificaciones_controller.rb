
module Api
  module V1
    class NotificacionesController < ApplicationController
      before_action :set_notificacion, only: [:show, :marcar_leida]

      # GET /api/v1/notificaciones
      def index
        @notificaciones = current_user.notificaciones.order(created_at: :desc)

        # Filtros
        if params[:leida].present?
          @notificaciones = @notificaciones.where(leida: params[:leida])
        end

        if params[:tipo].present?
          @notificaciones = @notificaciones.where(tipo: params[:tipo])
        end

        # Paginar manualmente
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        
        total = @notificaciones.count
        total_pages = (total.to_f / per_page).ceil
        offset = (page - 1) * per_page
        
        paginated_notificaciones = @notificaciones.limit(per_page).offset(offset)

        render_success({
          notificaciones: paginated_notificaciones.map { |n| notificacion_response(n) },
          total: total,
          no_leidas: current_user.notificaciones.where(leida: false).count,
          page: page,
          per_page: per_page,
          total_pages: total_pages
        })
      end

      # GET /api/v1/notificaciones/:id
      def show
        render_success(notificacion_response(@notificacion))
      end

      # PUT /api/v1/notificaciones/:id/marcar_leida
      def marcar_leida
        if @notificacion.update(leida: true, fecha_leida: Time.current)
          render_success(
            notificacion_response(@notificacion),
            message: 'Notificación marcada como leída'
          )
        else
          render_error('Error al marcar la notificación')
        end
      end

      # PUT /api/v1/notificaciones/marcar_todas_leidas
      def marcar_todas_leidas
        count = current_user.notificaciones.where(leida: false).update_all(
          leida: true,
          fecha_leida: Time.current
        )

        render_success(
          { notificaciones_actualizadas: count },
          message: "#{count} notificaciones marcadas como leídas"
        )
      end

      # GET /api/v1/notificaciones/no_leidas (ya lo tienes, mejorar)
      def no_leidas
        @notificaciones = current_user.notificaciones
                                      .where(leida: false)
                                      .order(created_at: :desc)
                                      .limit(20)

        render_success({
          notificaciones: @notificaciones.map { |n| notificacion_response(n) },
          total: @notificaciones.count
        })
      end

      private

      def set_notificacion
        @notificacion = current_user.notificaciones.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error('Notificación no encontrada', status: :not_found)
      end

      # MEJORAR: Agregar más datos a la respuesta
      def notificacion_response(notificacion)
        {
          id: notificacion.id,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          leida: notificacion.leida,
          fecha_leida: notificacion.fecha_leida,
          created_at: notificacion.created_at,
          tiempo_relativo: tiempo_relativo(notificacion.created_at),
          cita_id: notificacion.cita_id,
          icono: icono_notificacion(notificacion.tipo),
          color: color_notificacion(notificacion.tipo)
        }
      end

      # NUEVO HELPER: Calcular tiempo relativo
      def tiempo_relativo(time)
        seconds = (Time.current - time).to_i
        
        case seconds
        when 0..59
          'hace unos segundos'
        when 60..3599
          minutes = seconds / 60
          "hace #{minutes} #{'minuto'.pluralize(minutes)}"
        when 3600..86399
          hours = seconds / 3600
          "hace #{hours} #{'hora'.pluralize(hours)}"
        else
          days = seconds / 86400
          "hace #{days} #{'día'.pluralize(days)}"
        end
      end

      # NUEVO HELPER: Icono según tipo de notificación
      def icono_notificacion(tipo)
        tipos_iconos = {
          'cita_creada' => 'event_available',
          'cita_nueva' => 'event_available',
          'cita_confirmada' => 'check_circle',
          'cita_cancelada' => 'cancel',
          'cita_reprogramada' => 'update',
          'recordatorio' => 'alarm',
          'mensaje' => 'mail',
          'sistema' => 'info'
        }
        tipos_iconos[tipo.to_s] || 'notifications'
      end

      # NUEVO HELPER: Color según tipo de notificación
      def color_notificacion(tipo)
        tipos_colores = {
          'cita_creada' => 'blue',
          'cita_nueva' => 'blue',
          'cita_confirmada' => 'green',
          'cita_cancelada' => 'red',
          'cita_reprogramada' => 'orange',
          'recordatorio' => 'orange',
          'mensaje' => 'purple',
          'sistema' => 'gray'
        }
        tipos_colores[tipo.to_s] || 'gray'
      end
    end
  end
end