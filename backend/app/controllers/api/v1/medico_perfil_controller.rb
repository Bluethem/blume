class Api::V1::MedicoPerfilController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico

  # GET /api/v1/medico/perfil
  def show
    medico = current_user.medico
    usuario = current_user
    
    especialidad_obj = medico.especialidad_principal
    
    perfil = {
      id: medico.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      foto_url: absolute_url(usuario.foto_url),
      numero_colegiatura: medico.numero_colegiatura,
      especialidad: especialidad_obj&.nombre || 'No especificada',
      especialidad_id: especialidad_obj&.id,
      anios_experiencia: medico.anios_experiencia || 0,
      biografia: medico.biografia,
      certificaciones: medico.medico_certificaciones.includes(:certificacion).map do |mc|
        {
          id: mc.certificacion.id,
          nombre: mc.certificacion.nombre,
          institucion: mc.certificacion.institucion_emisora,
          fecha_obtencion: mc.fecha_obtencion || mc.created_at
        }
      end
    }
    
    render_success(perfil)
  rescue => e
    Rails.logger.error("Error al obtener perfil: #{e.message}")
    render_error('Error al cargar perfil', status: :internal_server_error)
  end

  # PUT /api/v1/medico/perfil
  def update
    medico = current_user.medico
    usuario = current_user
    
    # Actualizar datos del usuario
    if medico_params[:nombre] || medico_params[:apellido] || medico_params[:telefono]
      usuario_updates = {}
      usuario_updates[:nombre] = medico_params[:nombre] if medico_params[:nombre]
      usuario_updates[:apellido] = medico_params[:apellido] if medico_params[:apellido]
      usuario_updates[:telefono] = medico_params[:telefono] if medico_params[:telefono]
      
      unless usuario.update(usuario_updates)
        return render_error('No se pudo actualizar el usuario', errors: usuario.errors.full_messages, status: :unprocessable_entity)
      end
    end
    
    # Actualizar datos del médico
    medico_updates = {}
    medico_updates[:numero_colegiatura] = medico_params[:numero_colegiatura] if medico_params[:numero_colegiatura]
    medico_updates[:anios_experiencia] = medico_params[:anios_experiencia] if medico_params[:anios_experiencia]
    medico_updates[:biografia] = medico_params[:biografia] if medico_params.key?(:biografia)
    
    unless medico.update(medico_updates)
      return render_error('No se pudo actualizar el perfil', errors: medico.errors.full_messages, status: :unprocessable_entity)
    end
    
    # Nota: La especialidad se maneja por separado porque es una relación
    # Por ahora, la especialidad es solo de lectura en el perfil
    
    # Retornar perfil actualizado
    especialidad_obj = medico.especialidad_principal
    
    perfil = {
      id: medico.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      foto_url: absolute_url(usuario.foto_url),
      numero_colegiatura: medico.numero_colegiatura,
      especialidad: especialidad_obj&.nombre || 'No especificada',
      especialidad_id: especialidad_obj&.id,
      anios_experiencia: medico.anios_experiencia || 0,
      biografia: medico.biografia
    }
    
    render_success(perfil)
  rescue => e
    Rails.logger.error("Error al actualizar perfil: #{e.message}")
    render_error('Error al actualizar perfil', status: :internal_server_error)
  end

  # POST /api/v1/medico/perfil/upload_foto
  def upload_foto
    unless params[:foto].present?
      return render_error('No se proporcionó ninguna imagen')
    end

    foto = params[:foto]
    
    # Validar tipo de archivo
    unless foto.content_type.start_with?('image/')
      return render_error('El archivo debe ser una imagen')
    end

    # Validar tamaño (máx 5MB)
    if foto.size > 5.megabytes
      return render_error('La imagen no debe superar los 5MB')
    end

    # Crear directorio si no existe
    uploads_dir = Rails.root.join('public', 'uploads', 'avatars')
    FileUtils.mkdir_p(uploads_dir) unless File.directory?(uploads_dir)

    # Generar nombre único
    extension = File.extname(foto.original_filename)
    filename = "#{current_user.id}_#{Time.current.to_i}#{extension}"
    filepath = uploads_dir.join(filename)

    # Guardar archivo
    File.open(filepath, 'wb') do |file|
      file.write(foto.read)
    end

    # Actualizar URL en base de datos (guardar URL relativa)
    foto_url = "/uploads/avatars/#{filename}"
    current_user.update(foto_url: foto_url)

    # Devolver URL completa al frontend
    render_success({
      message: 'Foto de perfil actualizada exitosamente',
      foto_url: absolute_url(foto_url)
    })
  rescue => e
    Rails.logger.error("Error uploading foto: #{e.message}")
    render_error('Error al subir la imagen')
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def medico_params
    params.require(:medico).permit(
      :nombre,
      :apellido,
      :telefono,
      :numero_colegiatura,
      :especialidad,
      :anios_experiencia,
      :biografia
    )
  end
end
