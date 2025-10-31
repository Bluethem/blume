class Api::V1::Admin::PerfilController < Api::V1::Admin::BaseController
  # GET /api/v1/admin/perfil
  def show
    render_success({
      id: @current_user.id,
      nombre: @current_user.nombre,
      apellido: @current_user.apellido,
      nombre_completo: @current_user.nombre_completo,
      email: @current_user.email,
      telefono: @current_user.telefono,
      direccion: @current_user.direccion,
      foto_url: absolute_url(@current_user.foto_url),
      rol: @current_user.rol,
      rol_display: I18n.t("usuario.roles.#{@current_user.rol}", default: @current_user.rol.titleize),
      es_super_admin: @current_user.es_super_admin?,
      activo: @current_user.activo,
      created_at: @current_user.created_at,
      updated_at: @current_user.updated_at
    })
  rescue => e
    Rails.logger.error("Error al obtener perfil: #{e.message}")
    render_error('Error al cargar el perfil', status: :internal_server_error)
  end

  # PUT /api/v1/admin/perfil
  def update
    if @current_user.update(perfil_params)
      render_success({
        id: @current_user.id,
        nombre: @current_user.nombre,
        apellido: @current_user.apellido,
        nombre_completo: @current_user.nombre_completo,
        email: @current_user.email,
        telefono: @current_user.telefono,
        direccion: @current_user.direccion,
        foto_url: absolute_url(@current_user.foto_url),
        es_super_admin: @current_user.es_super_admin?
      }, message: 'Perfil actualizado exitosamente')
    else
      render_error(@current_user.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al actualizar perfil: #{e.message}")
    render_error('Error al actualizar el perfil', status: :internal_server_error)
  end

  # PUT /api/v1/admin/perfil/cambiar_password
  def cambiar_password
    # Validar password actual
    unless @current_user.authenticate(password_params[:password_actual])
      return render_error('La contraseña actual es incorrecta', status: :unauthorized)
    end

    # Validar que las nuevas contraseñas coincidan
    if password_params[:password_nuevo] != password_params[:password_confirmacion]
      return render_error('Las contraseñas nuevas no coinciden', status: :unprocessable_entity)
    end

    # Validar longitud mínima
    if password_params[:password_nuevo].length < 6
      return render_error('La contraseña debe tener al menos 6 caracteres', status: :unprocessable_entity)
    end

    # Actualizar contraseña
    if @current_user.update(password: password_params[:password_nuevo])
      render_success({}, message: 'Contraseña actualizada exitosamente')
    else
      render_error(@current_user.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al cambiar contraseña: #{e.message}")
    render_error('Error al cambiar la contraseña', status: :internal_server_error)
  end

  # POST /api/v1/admin/perfil/foto
  def foto
    unless params[:foto].present?
      return render_error('No se proporcionó ninguna foto', status: :bad_request)
    end

    foto = params[:foto]
    
    # Validar tipo de archivo
    unless foto.content_type.start_with?('image/')
      return render_error('El archivo debe ser una imagen', status: :unprocessable_entity)
    end

    # Validar tamaño (máx 5MB)
    if foto.size > 5.megabytes
      return render_error('La imagen no debe superar los 5MB', status: :unprocessable_entity)
    end

    # Crear directorio si no existe
    uploads_dir = Rails.root.join('public', 'uploads', 'avatars')
    FileUtils.mkdir_p(uploads_dir) unless File.directory?(uploads_dir)

    # Generar nombre único
    extension = File.extname(foto.original_filename)
    filename = "#{@current_user.id}_#{Time.current.to_i}#{extension}"
    filepath = uploads_dir.join(filename)

    # Guardar archivo
    File.open(filepath, 'wb') do |file|
      file.write(foto.read)
    end

    # Actualizar URL en base de datos (guardar URL relativa)
    foto_url = "/uploads/avatars/#{filename}"
    @current_user.update(foto_url: foto_url)

    # Devolver URL completa al frontend
    render_success({
      id: @current_user.id,
      nombre: @current_user.nombre,
      apellido: @current_user.apellido,
      nombre_completo: @current_user.nombre_completo,
      email: @current_user.email,
      foto_url: absolute_url(@current_user.foto_url)
    }, message: 'Foto actualizada exitosamente')
  rescue => e
    Rails.logger.error("Error al subir foto: #{e.message}")
    render_error('Error al subir la foto', status: :internal_server_error)
  end

  private

  def perfil_params
    params.require(:perfil).permit(
      :nombre,
      :apellido,
      :email,
      :telefono,
      :direccion
    )
  end

  def password_params
    params.permit(
      :password_actual,
      :password_nuevo,
      :password_confirmacion
    )
  end
end
