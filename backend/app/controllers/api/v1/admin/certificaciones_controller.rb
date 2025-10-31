class Api::V1::Admin::CertificacionesController < Api::V1::Admin::BaseController
  before_action :set_certificacion, only: [:show, :update, :destroy]

  # GET /api/v1/admin/certificaciones
  def index
    # Parámetros de búsqueda y paginación
    search = params[:search]
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 10

    # Query base
    certificaciones = Certificacion.all

    # Aplicar búsqueda si existe
    if search.present?
      certificaciones = certificaciones.where(
        'nombre ILIKE ? OR institucion_emisora ILIKE ?',
        "%#{search}%", "%#{search}%"
      )
    end

    # Ordenar
    certificaciones = certificaciones.order(created_at: :desc)

    # Calcular total antes de paginar
    total_count = certificaciones.count

    # Paginar
    offset = (page - 1) * per_page
    certificaciones = certificaciones.limit(per_page).offset(offset)

    # Calcular páginas
    total_pages = (total_count.to_f / per_page).ceil

    render_success({
      certificaciones: certificaciones.map { |cert| certificacion_con_stats(cert) },
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      }
    })
  rescue => e
    Rails.logger.error("Error en index de certificaciones: #{e.message}")
    render_error('Error al cargar certificaciones', status: :internal_server_error)
  end

  # GET /api/v1/admin/certificaciones/:id
  def show
    render_success(certificacion_detallada(@certificacion))
  rescue => e
    Rails.logger.error("Error en show de certificación: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render_error("Error al cargar certificación: #{e.message}", status: :internal_server_error)
  end

  # POST /api/v1/admin/certificaciones
  def create
    @certificacion = Certificacion.new(certificacion_params)

    if @certificacion.save
      render_success(
        certificacion_detallada(@certificacion),
        message: 'Certificación creada exitosamente',
        status: :created
      )
    else
      render_error(
        'No se pudo crear la certificación',
        errors: @certificacion.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue => e
    Rails.logger.error("Error al crear certificación: #{e.message}")
    render_error('Error al crear certificación', status: :internal_server_error)
  end

  # PATCH/PUT /api/v1/admin/certificaciones/:id
  def update
    if @certificacion.update(certificacion_params)
      render_success(
        certificacion_detallada(@certificacion),
        message: 'Certificación actualizada exitosamente'
      )
    else
      render_error(
        'No se pudo actualizar la certificación',
        errors: @certificacion.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue => e
    Rails.logger.error("Error al actualizar certificación: #{e.message}")
    render_error('Error al actualizar certificación', status: :internal_server_error)
  end

  # DELETE /api/v1/admin/certificaciones/:id
  def destroy
    if @certificacion.destroy
      render_success(
        { id: @certificacion.id },
        message: 'Certificación eliminada exitosamente'
      )
    else
      render_error(
        'No se pudo eliminar la certificación',
        errors: @certificacion.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue => e
    Rails.logger.error("Error al eliminar certificación: #{e.message}")
    render_error('Error al eliminar certificación', status: :internal_server_error)
  end

  # DELETE /api/v1/admin/certificaciones/bulk_delete
  def bulk_delete
    ids = params[:ids]
    
    if ids.blank?
      return render_error('No se proporcionaron IDs para eliminar', status: :bad_request)
    end

    deleted_count = 0
    errors = []

    ids.each do |id|
      certificacion = Certificacion.find_by(id: id)
      if certificacion
        if certificacion.destroy
          deleted_count += 1
        else
          errors << "No se pudo eliminar #{certificacion.nombre}"
        end
      end
    end

    render_success(
      { deleted_count: deleted_count, errors: errors },
      message: "#{deleted_count} certificación(es) eliminada(s) exitosamente"
    )
  rescue => e
    Rails.logger.error("Error en eliminación masiva: #{e.message}")
    render_error('Error al eliminar certificaciones', status: :internal_server_error)
  end

  private

  def set_certificacion
    @certificacion = Certificacion.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Certificación no encontrada', status: :not_found)
  end

  def certificacion_params
    params.require(:certificacion).permit(
      :nombre,
      :institucion_emisora,
      :descripcion
    )
  end

  def certificacion_con_stats(certificacion)
    {
      id: certificacion.id,
      nombre: certificacion.nombre,
      institucion_emisora: certificacion.institucion_emisora,
      descripcion: certificacion.descripcion,
      total_medicos: certificacion.medicos.count,
      created_at: certificacion.created_at
    }
  end

  def certificacion_detallada(certificacion)
    {
      id: certificacion.id,
      nombre: certificacion.nombre,
      institucion_emisora: certificacion.institucion_emisora,
      descripcion: certificacion.descripcion,
      total_medicos: certificacion.medicos.count,
      medicos: certificacion.medicos.map do |medico|
        {
          id: medico.id,
          nombre_completo: medico.usuario.nombre_completo,
          especialidad: medico.especialidad_principal&.nombre || 'Sin especialidad'
        }
      end,
      created_at: certificacion.created_at,
      updated_at: certificacion.updated_at
    }
  end
end
