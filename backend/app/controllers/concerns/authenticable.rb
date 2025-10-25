module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_request!
    attr_reader :current_user
  end

  private

  def authenticate_request!
    begin
      token = extract_token_from_header
      
      unless token
        render_unauthorized('Token no proporcionado')
        return
      end

      decoded_token = JsonWebToken.decode(token)
      
      unless decoded_token
        render_unauthorized('Token inválido o expirado')
        return
      end

      @current_user = Usuario.find_by(id: decoded_token[:user_id])
      
      unless @current_user
        render_unauthorized('Usuario no encontrado')
        return
      end

      unless @current_user.activo?
        render_unauthorized('Usuario inactivo')
        return
      end

    rescue ActiveRecord::RecordNotFound
      render_unauthorized('Usuario no encontrado')
    rescue => e
      Rails.logger.error("Authentication error: #{e.message}")
      render_unauthorized('Error en la autenticación')
    end
  end

  def extract_token_from_header
    header = request.headers['Authorization']
    return nil unless header
    
    # Formato esperado: "Bearer TOKEN"
    header.split(' ').last if header.split(' ').first == 'Bearer'
  end

  def render_unauthorized(message = 'No autorizado')
    render json: { error: message }, status: :unauthorized
  end

  # Métodos para verificar roles
  def require_admin!
    unless current_user&.es_administrador?
      render json: { error: 'Acceso denegado: Se requiere rol de administrador' }, 
             status: :forbidden
    end
  end

  def require_medico!
    unless current_user&.es_medico?
      render json: { error: 'Acceso denegado: Se requiere rol de médico' }, 
             status: :forbidden
    end
  end

  def require_paciente!
    unless current_user&.es_paciente?
      render json: { error: 'Acceso denegado: Se requiere rol de paciente' }, 
             status: :forbidden
    end
  end

  # Verificar si el usuario tiene permiso sobre el recurso
  def authorize_resource!(resource_user_id)
    unless current_user.es_administrador? || current_user.id == resource_user_id
      render json: { error: 'No tienes permiso para acceder a este recurso' }, 
             status: :forbidden
    end
  end
end