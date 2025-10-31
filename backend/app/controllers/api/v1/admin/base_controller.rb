class Api::V1::Admin::BaseController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_admin
  
  private
  
  def verificar_admin
    unless current_user.admin?
      render_error('Acceso no autorizado. Solo administradores', status: :forbidden)
    end
  end
  
  def verificar_super_admin
    unless current_user.super_admin?
      render_error('Acceso no autorizado. Solo Super Administrador', status: :forbidden)
    end
  end
  
  def registrar_actividad(accion, modelo, modelo_id, cambios = {})
    # TODO: Implementar modelo de AuditLog
    Rails.logger.info("Admin Activity: #{current_user.email} - #{accion} - #{modelo}##{modelo_id}")
  end
end
