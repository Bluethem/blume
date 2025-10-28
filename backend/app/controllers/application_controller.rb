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
  def render_success(data, message: nil, status: :ok, meta: nil)
    response = { success: true }
    response[:message] = message if message
    response[:data] = data if data
    response[:meta] = meta if meta
    
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
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    per_page = 100 if per_page > 100 # Límite máximo

    # Usar offset y limit de ActiveRecord
    collection.offset((page - 1) * per_page).limit(per_page)
  end

  def pagination_meta(collection)
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    total = collection.is_a?(ActiveRecord::Relation) ? collection.count : collection.size
    
    {
      page: page,
      per_page: per_page,
      total: total,
      total_pages: (total.to_f / per_page).ceil
    }
  end
end