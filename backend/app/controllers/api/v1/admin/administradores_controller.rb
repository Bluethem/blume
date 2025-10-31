class Api::V1::Admin::AdministradoresController < Api::V1::Admin::BaseController
  before_action :verificar_super_admin
  before_action :set_administrador, only: [:show, :update, :destroy, :toggle_estado]

  # GET /api/v1/admin/administradores
  def index
    # Parámetros
    search = params[:search]
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 10
    rol_filter = params[:rol]

    # Query base - solo administradores
    administradores = Usuario.where(rol: :administrador)

    # Aplicar búsqueda
    if search.present?
      administradores = administradores.where(
        'nombre ILIKE ? OR apellido ILIKE ? OR email ILIKE ?',
        "%#{search}%", "%#{search}%", "%#{search}%"
      )
    end

    # Filtrar por tipo de admin
    if rol_filter == 'super_admin'
      administradores = administradores.where(es_super_admin: true)
    elsif rol_filter == 'admin'
      administradores = administradores.where(es_super_admin: false)
    end

    # Ordenar
    administradores = administradores.order(created_at: :desc)

    # Calcular total
    total_count = administradores.count

    # Paginar
    offset = (page - 1) * per_page
    administradores = administradores.limit(per_page).offset(offset)

    # Calcular páginas
    total_pages = (total_count.to_f / per_page).ceil

    render_success({
      administradores: administradores.map { |admin| admin_response(admin) },
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      }
    })
  rescue => e
    Rails.logger.error("Error en index de administradores: #{e.message}")
    render_error('Error al cargar administradores', status: :internal_server_error)
  end

  # GET /api/v1/admin/administradores/:id
  def show
    render_success(admin_detallado(@administrador))
  rescue => e
    Rails.logger.error("Error en show de administrador: #{e.message}")
    render_error("Error al cargar administrador: #{e.message}", status: :internal_server_error)
  end

  # POST /api/v1/admin/administradores
  def create
    # No permitir crear otro super admin
    if admin_params[:es_super_admin] == true
      return render_error('No se puede crear otro Super Administrador', status: :forbidden)
    end

    @administrador = Usuario.new(admin_params)
    @administrador.rol = :administrador
    @administrador.creado_por_id = current_user.id

    if @administrador.save
      render_success(
        admin_detallado(@administrador),
        message: 'Administrador creado exitosamente',
        status: :created
      )
    else
      render_error(
        'No se pudo crear el administrador',
        errors: @administrador.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue => e
    Rails.logger.error("Error al crear administrador: #{e.message}")
    render_error('Error al crear administrador', status: :internal_server_error)
  end

  # PATCH/PUT /api/v1/admin/administradores/:id
  def update
    # No permitir modificar super admin (excepto por sí mismo)
    if @administrador.es_super_admin? && @administrador.id != current_user.id
      return render_error('No se puede modificar al Super Administrador', status: :forbidden)
    end

    # No permitir convertir a super admin
    if update_params[:es_super_admin] == true && !@administrador.es_super_admin?
      return render_error('No se puede promover a Super Administrador', status: :forbidden)
    end

    if @administrador.update(update_params)
      render_success(
        admin_detallado(@administrador),
        message: 'Administrador actualizado exitosamente'
      )
    else
      render_error(
        'No se pudo actualizar el administrador',
        errors: @administrador.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue => e
    Rails.logger.error("Error al actualizar administrador: #{e.message}")
    render_error('Error al actualizar administrador', status: :internal_server_error)
  end

  # DELETE /api/v1/admin/administradores/:id
  def destroy
    # No permitir eliminar super admin
    if @administrador.es_super_admin?
      return render_error('No se puede eliminar al Super Administrador', status: :forbidden)
    end

    # No permitir eliminarse a sí mismo
    if @administrador.id == current_user.id
      return render_error('No puedes eliminarte a ti mismo', status: :forbidden)
    end

    if @administrador.destroy
      render_success(
        { id: @administrador.id },
        message: 'Administrador eliminado exitosamente'
      )
    else
      render_error(
        'No se pudo eliminar el administrador',
        errors: @administrador.errors.full_messages,
        status: :unprocessable_entity
      )
    end
  rescue => e
    Rails.logger.error("Error al eliminar administrador: #{e.message}")
    render_error('Error al eliminar administrador', status: :internal_server_error)
  end

  # POST /api/v1/admin/administradores/:id/toggle_estado
  def toggle_estado
    # No permitir desactivar super admin
    if @administrador.es_super_admin?
      return render_error('No se puede desactivar al Super Administrador', status: :forbidden)
    end

    # No permitir desactivarse a sí mismo
    if @administrador.id == current_user.id
      return render_error('No puedes desactivarte a ti mismo', status: :forbidden)
    end

    @administrador.activo = !@administrador.activo

    if @administrador.save
      render_success(
        admin_response(@administrador),
        message: "Administrador #{@administrador.activo? ? 'activado' : 'desactivado'} exitosamente"
      )
    else
      render_error('Error al cambiar el estado', status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al cambiar estado: #{e.message}")
    render_error('Error al cambiar el estado', status: :internal_server_error)
  end

  # POST /api/v1/admin/administradores/bulk_action
  def bulk_action
    action = params[:action_type]
    ids = params[:ids]

    if ids.blank?
      return render_error('No se proporcionaron IDs', status: :bad_request)
    end

    administradores = Usuario.where(id: ids, rol: :administrador)

    # Filtrar super admins y el usuario actual
    administradores = administradores.where.not(es_super_admin: true)
                                     .where.not(id: current_user.id)

    case action
    when 'activate'
      administradores.update_all(activo: true)
      render_success(
        { affected_count: administradores.count },
        message: "#{administradores.count} administrador(es) activado(s)"
      )
    when 'deactivate'
      administradores.update_all(activo: false)
      render_success(
        { affected_count: administradores.count },
        message: "#{administradores.count} administrador(es) desactivado(s)"
      )
    when 'delete'
      count = administradores.count
      administradores.destroy_all
      render_success(
        { affected_count: count },
        message: "#{count} administrador(es) eliminado(s)"
      )
    else
      render_error('Acción no válida', status: :bad_request)
    end
  rescue => e
    Rails.logger.error("Error en acción masiva: #{e.message}")
    render_error('Error al ejecutar acción masiva', status: :internal_server_error)
  end

  private

  def set_administrador
    @administrador = Usuario.find(params[:id])
    
    unless @administrador.administrador?
      render_error('Usuario no es administrador', status: :not_found)
    end
  rescue ActiveRecord::RecordNotFound
    render_error('Administrador no encontrado', status: :not_found)
  end

  def admin_params
    params.require(:administrador).permit(
      :nombre,
      :apellido,
      :email,
      :telefono,
      :direccion,
      :password,
      :password_confirmation,
      :es_super_admin,
      :activo
    )
  end

  def update_params
    params.require(:administrador).permit(
      :nombre,
      :apellido,
      :email,
      :telefono,
      :direccion,
      :password,
      :password_confirmation,
      :activo
    )
  end

  def admin_response(admin)
    {
      id: admin.id,
      nombre: admin.nombre,
      apellido: admin.apellido,
      nombre_completo: admin.nombre_completo,
      email: admin.email,
      telefono: admin.telefono,
      direccion: admin.direccion,
      es_super_admin: admin.es_super_admin || false,
      rol_display: admin.es_super_admin? ? 'Super Administrador' : 'Administrador',
      activo: admin.activo,
      foto_url: absolute_url(admin.foto_url),
      ultimo_acceso: admin.ultimo_acceso,
      created_at: admin.created_at,
      puede_editar: !admin.es_super_admin? || admin.id == current_user.id,
      puede_eliminar: !admin.es_super_admin? && admin.id != current_user.id,
      puede_desactivar: !admin.es_super_admin? && admin.id != current_user.id
    }
  end

  def admin_detallado(admin)
    response = admin_response(admin)
    
    # Agregar información adicional
    response.merge!({
      creado_por: admin.creado_por ? {
        id: admin.creado_por.id,
        nombre_completo: admin.creado_por.nombre_completo
      } : nil,
      updated_at: admin.updated_at
    })

    response
  end
end
