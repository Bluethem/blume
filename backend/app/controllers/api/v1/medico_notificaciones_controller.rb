class Api::V1::MedicoNotificacionesController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico
  before_action :set_notificacion, only: [:marcar_leida, :marcar_no_leida, :destroy]

  # GET /api/v1/medico/notificaciones
  def index
    # Obtener notificaciones del usuario (médico) ordenadas por más reciente
    notificaciones = current_user.notificaciones.order(created_at: :desc)
    
    notificaciones_data = notificaciones.map do |notif|
      {
        id: notif.id,
        tipo: notif.tipo,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        leida: notif.leida,
        fecha: notif.created_at,
        cita_id: notif.cita_id,
        icono: obtener_icono(notif.tipo)
      }
    end
    
    render_success(notificaciones_data)
  rescue => e
    Rails.logger.error("Error al obtener notificaciones: #{e.message}")
    render_error('Error al cargar notificaciones', status: :internal_server_error)
  end

  # POST /api/v1/medico/notificaciones/marcar_todas_leidas
  def marcar_todas_leidas
    current_user.notificaciones.where(leida: false).update_all(leida: true)
    
    render_success({ message: 'Todas las notificaciones han sido marcadas como leídas' })
  rescue => e
    Rails.logger.error("Error al marcar notificaciones: #{e.message}")
    render_error('Error al marcar notificaciones', status: :internal_server_error)
  end

  # PUT /api/v1/medico/notificaciones/:id/marcar_leida
  def marcar_leida
    if @notificacion.update(leida: true)
      render_success({ message: 'Notificación marcada como leída' })
    else
      render_error('No se pudo marcar la notificación', status: :unprocessable_entity)
    end
  end

  # PUT /api/v1/medico/notificaciones/:id/marcar_no_leida
  def marcar_no_leida
    if @notificacion.update(leida: false)
      render_success({ message: 'Notificación marcada como no leída' })
    else
      render_error('No se pudo marcar la notificación', status: :unprocessable_entity)
    end
  end

  # DELETE /api/v1/medico/notificaciones/:id
  def destroy
    if @notificacion.destroy
      render_success({ message: 'Notificación eliminada correctamente' })
    else
      render_error('No se pudo eliminar la notificación', status: :unprocessable_entity)
    end
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def set_notificacion
    @notificacion = current_user.notificaciones.find_by(id: params[:id])
    
    unless @notificacion
      render_error('Notificación no encontrada', status: :not_found)
    end
  end

  def obtener_icono(tipo)
    iconos = {
      'nueva_cita' => 'calendar_add_on',
      'recordatorio' => 'notifications_active',
      'cancelacion' => 'cancel',
      'confirmacion' => 'task_alt',
      'cambio_horario' => 'schedule',
      'mensaje' => 'mail'
    }
    
    iconos[tipo] || 'notifications'
  end
end
