class Api::V1::Admin::PacientesController < Api::V1::Admin::BaseController
  before_action :set_paciente, only: [:show, :update, :destroy, :toggle_estado]
  
  # GET /api/v1/admin/pacientes
  def index
    @pacientes = Paciente.includes(:usuario)
                         .order(created_at: :desc)
    
    # Búsqueda
    if params[:search].present?
      search_term = "%#{params[:search]}%"
      @pacientes = @pacientes.joins(:usuario)
                             .where(
                               'usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ? OR usuarios.email ILIKE ?',
                               search_term, search_term, search_term
                             )
    end
    
    # Filtro por grupo sanguíneo
    if params[:grupo_sanguineo].present?
      @pacientes = @pacientes.where(grupo_sanguineo: params[:grupo_sanguineo])
    end
    
    # Filtro por alergias
    if params[:con_alergias].present?
      tiene_alergias = params[:con_alergias] == 'true'
      if tiene_alergias
        @pacientes = @pacientes.where.not(alergias: [nil, ''])
      else
        @pacientes = @pacientes.where(alergias: [nil, ''])
      end
    end
    
    # Filtro por estado
    if params[:activo].present?
      estado = params[:activo] == 'true'
      @pacientes = @pacientes.joins(:usuario).where(usuarios: { activo: estado })
    end
    
    # Paginación manual
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 10).to_i
    
    total_count = @pacientes.count
    total_pages = (total_count.to_f / per_page).ceil
    
    offset = (page - 1) * per_page
    @pacientes_paginados = @pacientes.limit(per_page).offset(offset)
    
    render_success({
      pacientes: @pacientes_paginados.map { |paciente| paciente_con_stats(paciente) },
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      }
    })
  rescue => e
    Rails.logger.error("Error en index de pacientes: #{e.message}")
    render_error('Error al cargar pacientes', status: :internal_server_error)
  end
  
  # GET /api/v1/admin/pacientes/:id
  def show
    data = paciente_detallado(@paciente)
    render_success(data)
  rescue => e
    Rails.logger.error("Error en show de paciente: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render_error("Error al cargar paciente: #{e.message}", status: :internal_server_error)
  end
  
  # POST /api/v1/admin/pacientes
  def create
    # Crear usuario primero
    usuario_params = paciente_params[:usuario_attributes] || {}
    usuario_params[:rol] = :paciente
    usuario_params[:creado_por_id] = current_user.id
    
    @usuario = Usuario.new(usuario_params)
    
    if @usuario.save
      # Crear paciente
      paciente_data = paciente_params.except(:usuario_attributes, :contacto_emergencia_attributes)
      @paciente = Paciente.new(paciente_data.merge(usuario: @usuario))
      
      if @paciente.save
        # Crear contacto de emergencia si se proporcionó
        crear_contacto_emergencia(@paciente, paciente_params[:contacto_emergencia_attributes]) if paciente_params[:contacto_emergencia_attributes].present?
        
        registrar_actividad('crear', 'Paciente', @paciente.id)
        render_success(paciente_detallado(@paciente), message: 'Paciente creado exitosamente', status: :created)
      else
        @usuario.destroy
        render_error(@paciente.errors.full_messages.join(', '), status: :unprocessable_entity)
      end
    else
      render_error(@usuario.errors.full_messages.join(', '), status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al crear paciente: #{e.message}")
    render_error('Error al crear paciente', status: :internal_server_error)
  end
  
  # PUT/PATCH /api/v1/admin/pacientes/:id
  def update
    paciente_data = paciente_params.except(:usuario_attributes, :contacto_emergencia_attributes)
    
    if @paciente.update(paciente_data)
      # Actualizar usuario
      if paciente_params[:usuario_attributes].present?
        @paciente.usuario.update(paciente_params[:usuario_attributes].except(:password, :password_confirmation))
      end
      
      # Actualizar contacto de emergencia
      if paciente_params[:contacto_emergencia_attributes].present?
        actualizar_contacto_emergencia(@paciente, paciente_params[:contacto_emergencia_attributes])
      end
      
      registrar_actividad('actualizar', 'Paciente', @paciente.id)
      render_success(paciente_detallado(@paciente), message: 'Paciente actualizado exitosamente')
    else
      render_error(@paciente.errors.full_messages.join(', '), status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al actualizar paciente: #{e.message}")
    render_error('Error al actualizar paciente', status: :internal_server_error)
  end
  
  # DELETE /api/v1/admin/pacientes/:id
  def destroy
    if @paciente.usuario.desactivar!
      registrar_actividad('desactivar', 'Paciente', @paciente.id)
      render_success(nil, message: 'Paciente desactivado exitosamente')
    else
      render_error('Error al desactivar paciente', status: :unprocessable_entity)
    end
  rescue => e
    render_error('Error al desactivar paciente', status: :internal_server_error)
  end
  
  # POST /api/v1/admin/pacientes/:id/toggle_estado
  def toggle_estado
    nuevo_estado = !@paciente.usuario.activo
    
    if nuevo_estado
      @paciente.usuario.activar!
      mensaje = 'Paciente activado exitosamente'
      accion = 'activar'
    else
      @paciente.usuario.desactivar!
      mensaje = 'Paciente desactivado exitosamente'
      accion = 'desactivar'
    end
    
    registrar_actividad(accion, 'Paciente', @paciente.id)
    render_success({ activo: nuevo_estado }, message: mensaje)
  rescue => e
    render_error('Error al cambiar estado del paciente', status: :internal_server_error)
  end
  
  private
  
  def set_paciente
    @paciente = Paciente.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Paciente no encontrado', status: :not_found)
  end
  
  def paciente_params
    params.require(:paciente).permit(
      :numero_documento,
      :tipo_documento,
      :fecha_nacimiento,
      :genero,
      :grupo_sanguineo,
      :alergias,
      :observaciones,
      usuario_attributes: [:nombre, :apellido, :email, :telefono, :direccion, :password, :password_confirmation]
    )
  end
  
  def paciente_con_stats(paciente)
    # Calcular última cita de forma segura
    ultima_cita = paciente.citas.order(fecha_hora_inicio: :desc).first rescue nil
    
    {
      id: paciente.id,
      nombre_completo: paciente.usuario.nombre_completo,
      email: paciente.usuario.email,
      telefono: paciente.usuario.telefono,
      foto_url: absolute_url(paciente.usuario.foto_url),
      grupo_sanguineo: paciente.grupo_sanguineo,
      tiene_alergias: paciente.alergias.present?,
      fecha_registro: paciente.created_at.strftime('%d/%m/%Y'),
      ultima_cita: ultima_cita&.fecha_hora_inicio&.strftime('%d/%m/%Y'),
      activo: paciente.usuario.activo,
      created_at: paciente.created_at
    }
  end
  
  def paciente_detallado(paciente)
    
    # Calcular estadísticas de citas de manera segura
    total_citas = 0
    citas_completadas = 0
    proxima_cita = nil
    
    begin
      total_citas = paciente.citas.count
      citas_completadas = paciente.citas.where(estado: :completada).count
      proxima_cita_obj = paciente.citas.where('fecha_hora_inicio > ?', Time.current).order(:fecha_hora_inicio).first
      proxima_cita = proxima_cita_obj.fecha_hora_inicio.iso8601 if proxima_cita_obj
    rescue => e
      Rails.logger.error("Error calculando estadísticas de paciente: #{e.message}")
    end
    
    {
      id: paciente.id,
      usuario: {
        id: paciente.usuario.id,
        nombre: paciente.usuario.nombre || '',
        apellido: paciente.usuario.apellido || '',
        email: paciente.usuario.email || '',
        telefono: paciente.usuario.telefono || '',
        direccion: paciente.usuario.direccion || '',
        foto_url: absolute_url(paciente.usuario.foto_url),
        activo: paciente.usuario.activo || false
      },
      numero_documento: paciente.numero_documento || '',
      tipo_documento: paciente.tipo_documento || 'dni',
      fecha_nacimiento: paciente.fecha_nacimiento&.iso8601,
      genero: paciente.genero || 'masculino',
      grupo_sanguineo: paciente.grupo_sanguineo,
      alergias: paciente.alergias,
      observaciones: paciente.observaciones,
      estadisticas: {
        total_citas: total_citas,
        citas_completadas: citas_completadas,
        proxima_cita: proxima_cita
      }
    }
  end
end
