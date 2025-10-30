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
      foto_url: usuario.foto_perfil_url,
      numero_colegiatura: medico.numero_colegiatura,
      especialidad: especialidad_obj&.nombre || 'No especificada',
      especialidad_id: especialidad_obj&.id,
      anios_experiencia: medico.anios_experiencia || 0,
      biografia: medico.biografia
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
      foto_url: usuario.foto_perfil_url,
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
