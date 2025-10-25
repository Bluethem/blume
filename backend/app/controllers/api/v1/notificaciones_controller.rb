module Api
  module V1
    class NotificacionesController < ApplicationController
      before_action :set_notificacion, only: [:show, :marcar_leida]

      # GET /api/v1/notificaciones
      def index
        @notificaciones = current_user.notificaciones.order(created_at: :desc)

        if params[:leida].present?
          @notificaciones = @notificaciones.where(leida: params[:leida])
        end

        if params[:tipo].present?
          @notificaciones = @notificaciones.where(tipo: params[:tipo])
        end

        paginated_notificaciones = paginate(@notificaciones)

        render_success({
          notificaciones: paginated_notificaciones.map { |n| notificacion_response(n) },
          meta: pagination_meta(paginated_notificaciones),
          no_leidas_count: current_user.notificaciones.where(leida: false).count
        })
      end

      # GET /api/v1/notificaciones/:id
      def show
        render_success(notificacion_response(@notificacion))
      end

      # PUT /api/v1/notificaciones/:id/marcar_leida
      def marcar_leida
        if @notificacion.update(leida: true)
          render_success(notificacion_response(@notificacion), message: 'Notificación marcada como leída')
        else
          render_error('Error al marcar la notificación como leída')
        end
      end

      # PUT /api/v1/notificaciones/marcar_todas_leidas
      def marcar_todas_leidas
        count = current_user.notificaciones.where(leida: false).update_all(leida: true)
        render_success({ marcadas: count }, message: "#{count} notificaciones marcadas como leídas")
      end

      # GET /api/v1/notificaciones/no_leidas
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
      end

      def notificacion_response(notificacion)
        {
          id: notificacion.id,
          tipo: notificacion.tipo,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          leida: notificacion.leida,
          created_at: notificacion.created_at
        }
      end
    end
  end
end