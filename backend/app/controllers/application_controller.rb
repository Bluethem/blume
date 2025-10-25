# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  include Authenticable  # ← ESTO ES CRÍTICO

  # Manejo centralizado de errores
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from ActionController::ParameterMissing, with: :parameter_missing

  private

  def record_not_found(exception)
    render json: { 
      error: 'Registro no encontrado',
      details: exception.message 
    }, status: :not_found
  end

  def record_invalid(exception)
    render json: { 
      error: 'Datos inválidos',
      details: exception.record.errors.full_messages 
    }, status: :unprocessable_entity
  end

  def parameter_missing(exception)
    render json: { 
      error: 'Parámetro requerido faltante',
      details: exception.message 
    }, status: :bad_request
  end

  # Métodos auxiliares para respuestas JSON
  def render_success(data, message: nil, status: :ok)
    response = { success: true }
    response[:message] = message if message
    response[:data] = data if data
    
    render json: response, status: status
  end

  def render_error(message, errors: nil, status: :unprocessable_entity)
    response = { success: false, error: message }
    response[:details] = errors if errors
    
    render json: response, status: status
  end

  # Métodos de paginación
  def pagination_params
    {
      page: params[:page] || 1,
      per_page: params[:per_page] || 20
    }
  end

  def paginate(collection)
    page = pagination_params[:page].to_i
    per_page = [pagination_params[:per_page].to_i, 100].min
    
    collection.page(page).per(per_page)
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      next_page: collection.next_page,
      prev_page: collection.prev_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count
    }
  end
end