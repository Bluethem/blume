class Api::V1::Admin::MedicosController < Api::V1::Admin::BaseController
  before_action :set_medico, only: [:show, :update, :destroy, :toggle_estado]
  
  # GET /api/v1/admin/medicos
  def index
    @medicos = Medico.includes(usuario: :medico)
                     .order(created_at: :desc)
    
    # Búsqueda
    if params[:search].present?
      search_term = "%#{params[:search]}%"
      @medicos = @medicos.joins(:usuario)
                        .joins(:especialidades)
                        .where(
                          'usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ? OR especialidades.nombre ILIKE ?',
                          search_term, search_term, search_term
                        ).distinct
    end
    
    # Filtro por especialidad
    if params[:especialidad_id].present?
      @medicos = @medicos.joins(:medico_especialidades)
                        .where(medico_especialidades: { especialidad_id: params[:especialidad_id] })
    end
    
    # Filtro por estado
    if params[:activo].present?
      estado = params[:activo] == 'true'
      @medicos = @medicos.joins(:usuario).where(usuarios: { activo: estado })
    end
    
    # Paginación manual
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    
    # Calcular total antes de paginar
    total_count = @medicos.count
    total_pages = (total_count.to_f / per_page).ceil
    
    # Aplicar paginación con LIMIT y OFFSET
    offset = (page - 1) * per_page
    @medicos_paginados = @medicos.limit(per_page).offset(offset)
    
    render_success({
      medicos: @medicos_paginados.map { |medico| medico_con_stats(medico) },
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      }
    })
  rescue => e
    Rails.logger.error("Error en index de médicos: #{e.message}")
    render_error('Error al cargar médicos', status: :internal_server_error)
  end
  
  # GET /api/v1/admin/medicos/:id
  def show
    render_success(medico_detallado(@medico))
  rescue => e
    render_error('Error al cargar médico', status: :internal_server_error)
  end
  
  # POST /api/v1/admin/medicos
  def create
    # Crear usuario primero
    usuario_params = medico_params[:usuario_attributes] || {}
    usuario_params[:rol] = :medico
    usuario_params[:creado_por_id] = current_user.id
    
    @usuario = Usuario.new(usuario_params)
    
    if @usuario.save
      # Crear médico
      medico_data = medico_params.except(:usuario_attributes, :especialidades, :certificaciones)
      @medico = Medico.new(medico_data.merge(usuario: @usuario))
      
      if @medico.save
        # Agregar especialidades
        agregar_especialidades(@medico, medico_params[:especialidades]) if medico_params[:especialidades].present?
        
        # Agregar certificaciones
        agregar_certificaciones(@medico, medico_params[:certificaciones]) if medico_params[:certificaciones].present?
        
        registrar_actividad('crear', 'Medico', @medico.id)
        render_success(medico_detallado(@medico), message: 'Médico creado exitosamente', status: :created)
      else
        @usuario.destroy
        render_error(@medico.errors.full_messages.join(', '), status: :unprocessable_entity)
      end
    else
      render_error(@usuario.errors.full_messages.join(', '), status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al crear médico: #{e.message}")
    render_error('Error al crear médico', status: :internal_server_error)
  end
  
  # PUT/PATCH /api/v1/admin/medicos/:id
  def update
    medico_data = medico_params.except(:usuario_attributes, :especialidades, :certificaciones)
    
    if @medico.update(medico_data)
      # Actualizar usuario
      if medico_params[:usuario_attributes].present?
        @medico.usuario.update(medico_params[:usuario_attributes].except(:password, :password_confirmation))
      end
      
      # Actualizar especialidades
      if medico_params[:especialidades].present?
        @medico.medico_especialidades.destroy_all
        agregar_especialidades(@medico, medico_params[:especialidades])
      end
      
      # Actualizar certificaciones
      if medico_params[:certificaciones].present?
        @medico.medico_certificaciones.destroy_all
        agregar_certificaciones(@medico, medico_params[:certificaciones])
      end
      
      registrar_actividad('actualizar', 'Medico', @medico.id)
      render_success(medico_detallado(@medico), message: 'Médico actualizado exitosamente')
    else
      render_error(@medico.errors.full_messages.join(', '), status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al actualizar médico: #{e.message}")
    render_error('Error al actualizar médico', status: :internal_server_error)
  end
  
  # DELETE /api/v1/admin/medicos/:id
  def destroy
    # No eliminamos, solo desactivamos
    if @medico.usuario.desactivar!
      registrar_actividad('desactivar', 'Medico', @medico.id)
      render_success(nil, message: 'Médico desactivado exitosamente')
    else
      render_error('Error al desactivar médico', status: :unprocessable_entity)
    end
  rescue => e
    render_error('Error al desactivar médico', status: :internal_server_error)
  end
  
  # POST /api/v1/admin/medicos/:id/toggle_estado
  def toggle_estado
    nuevo_estado = !@medico.usuario.activo
    
    if nuevo_estado
      @medico.usuario.activar!
      mensaje = 'Médico activado exitosamente'
      accion = 'activar'
    else
      @medico.usuario.desactivar!
      mensaje = 'Médico desactivado exitosamente'
      accion = 'desactivar'
    end
    
    registrar_actividad(accion, 'Medico', @medico.id)
    render_success({ activo: nuevo_estado }, message: mensaje)
  rescue => e
    render_error('Error al cambiar estado del médico', status: :internal_server_error)
  end
  
  private
  
  def set_medico
    @medico = Medico.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Médico no encontrado', status: :not_found)
  end
  
  def medico_params
    params.require(:medico).permit(
      :numero_colegiatura,
      :anios_experiencia,
      :costo_consulta,
      :biografia,
      usuario_attributes: [:nombre, :apellido, :email, :telefono, :direccion, :password, :password_confirmation],
      especialidades: [:especialidad_id, :es_principal],
      certificaciones: [:certificacion_id, :fecha_obtencion]
    )
  end
  
  def medico_con_stats(medico)
    {
      id: medico.id,
      nombre_completo: medico.usuario.nombre_completo,
      email: medico.usuario.email,
      telefono: medico.usuario.telefono,
      foto_url: absolute_url(medico.usuario.foto_url),
      numero_colegiatura: medico.numero_colegiatura,
      especialidad_principal: medico.especialidad_principal&.nombre,
      total_certificaciones: medico.medico_certificaciones.count,
      citas_mes: medico.citas.where('EXTRACT(MONTH FROM fecha_hora_inicio) = ? AND EXTRACT(YEAR FROM fecha_hora_inicio) = ?', Date.today.month, Date.today.year).count,
      activo: medico.usuario.activo,
      created_at: medico.created_at
    }
  end
  
  def medico_detallado(medico)
    {
      id: medico.id,
      usuario: {
        id: medico.usuario.id,
        nombre: medico.usuario.nombre,
        apellido: medico.usuario.apellido,
        email: medico.usuario.email,
        telefono: medico.usuario.telefono,
        direccion: medico.usuario.direccion,
        foto_url: absolute_url(medico.usuario.foto_url),
        activo: medico.usuario.activo
      },
      numero_colegiatura: medico.numero_colegiatura,
      anios_experiencia: medico.anios_experiencia,
      costo_consulta: medico.costo_consulta,
      biografia: medico.biografia,
      especialidades: medico.especialidades.map { |e|
        {
          id: e.id,
          nombre: e.nombre,
          es_principal: medico.medico_especialidades.find_by(especialidad_id: e.id)&.es_principal || false
        }
      },
      certificaciones: medico.medico_certificaciones.includes(:certificacion).map { |mc|
        {
          id: mc.certificacion.id,
          nombre: mc.certificacion.nombre,
          institucion: mc.certificacion.institucion_emisora,
          fecha_obtencion: mc.fecha_obtencion
        }
      },
      estadisticas: {
        total_citas: medico.citas.count,
        citas_mes: medico.citas.where('EXTRACT(MONTH FROM fecha_hora_inicio) = ?', Date.today.month).count,
        calificacion_promedio: medico.calificacion_promedio,
        total_resenas: medico.total_resenas
      }
    }
  end
  
  def agregar_especialidades(medico, especialidades_params)
    especialidades_params.each do |esp_params|
      medico.agregar_especialidad(
        esp_params[:especialidad_id],
        es_principal: esp_params[:es_principal] || false
      )
    end
  end
  
  def agregar_certificaciones(medico, certificaciones_params)
    certificaciones_params.each do |cert_params|
      MedicoCertificacion.create!(
        medico: medico,
        certificacion_id: cert_params[:certificacion_id],
        fecha_obtencion: cert_params[:fecha_obtencion] || Date.today
      )
    end
  end
end
