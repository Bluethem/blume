class Api::V1::MedicoPacientesController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico
  before_action :set_paciente, only: [:show, :update]

  # GET /api/v1/medico/pacientes/buscar
  def buscar
    termino = params[:q]
    
    if termino.blank? || termino.length < 3
      return render_error('El término de búsqueda debe tener al menos 3 caracteres', status: :bad_request)
    end
    
    # Buscar pacientes por nombre, apellido o documento
    pacientes = Paciente.joins(:usuario)
                        .where(
                          'usuarios.nombre ILIKE :term OR usuarios.apellido ILIKE :term OR pacientes.numero_documento ILIKE :term',
                          term: "%#{termino}%"
                        )
                        .limit(10)
    
    render_success(pacientes.map { |p| paciente_busqueda_json(p) })
  rescue => e
    Rails.logger.error("Error en búsqueda de pacientes: #{e.message}")
    render_error('Error al buscar pacientes', status: :internal_server_error)
  end

  # GET /api/v1/medico/pacientes
  def index
    medico = current_user.medico
    
    # Obtener pacientes únicos que han tenido citas con este médico
    pacientes_ids = medico.citas.select(:paciente_id).distinct.pluck(:paciente_id)
    pacientes = Paciente.includes(:usuario).where(id: pacientes_ids)
    
    render_success(pacientes.map { |p| paciente_detalle_json(p, medico) })
  rescue => e
    Rails.logger.error("Error al listar pacientes: #{e.message}")
    render_error('Error al cargar pacientes', status: :internal_server_error)
  end

  # GET /api/v1/medico/pacientes/:id
  def show
    medico = current_user.medico
    render_success(paciente_completo_json(@paciente, medico))
  end

  # POST /api/v1/medico/pacientes
  def create
    # Crear usuario
    usuario_params = {
      nombre: paciente_params[:nombre],
      apellido: paciente_params[:apellido],
      telefono: paciente_params[:telefono],
      email: paciente_params[:email],
      rol: :paciente,
      password: generate_temp_password,
      password_confirmation: generate_temp_password
    }
    
    usuario = Usuario.new(usuario_params)
    
    if usuario.save
      # Crear paciente
      paciente = usuario.build_paciente(
        tipo_documento: paciente_params[:tipo_documento],
        numero_documento: paciente_params[:numero_documento],
        fecha_nacimiento: paciente_params[:fecha_nacimiento],
        genero: paciente_params[:genero],
        grupo_sanguineo: paciente_params[:grupo_sanguineo],
        alergias: paciente_params[:alergias]
      )
      
      if paciente.save
        # Marcar que fue registrado por el médico
        # TODO: Crear tabla pacientes_medicos si se necesita este tracking
        render_success(paciente_busqueda_json(paciente), status: :created)
      else
        usuario.destroy
        render_error('No se pudo crear el paciente', errors: paciente.errors.full_messages, status: :unprocessable_entity)
      end
    else
      render_error('No se pudo crear el usuario', errors: usuario.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al crear paciente: #{e.message}")
    render_error('Error al registrar paciente', status: :internal_server_error)
  end

  # PUT /api/v1/medico/pacientes/:id
  def update
    usuario = @paciente.usuario
    
    # Actualizar datos del usuario
    if params[:usuario].present?
      usuario_params_hash = params.require(:usuario).permit(:nombre, :apellido, :email, :telefono)
      unless usuario.update(usuario_params_hash)
        return render_error('No se pudo actualizar el usuario', errors: usuario.errors.full_messages, status: :unprocessable_entity)
      end
    end
    
    # Actualizar datos del paciente
    if params[:paciente].present?
      paciente_params_hash = params.require(:paciente).permit(
        :tipo_documento,
        :numero_documento,
        :fecha_nacimiento,
        :genero,
        :grupo_sanguineo,
        :alergias
      )
      unless @paciente.update(paciente_params_hash)
        return render_error('No se pudo actualizar el paciente', errors: @paciente.errors.full_messages, status: :unprocessable_entity)
      end
    end
    
    render_success(paciente_completo_json(@paciente.reload, current_user.medico))
  rescue => e
    Rails.logger.error("Error al actualizar paciente: #{e.message}")
    render_error('Error al actualizar paciente', status: :internal_server_error)
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def set_paciente
    @paciente = Paciente.find_by(id: params[:id])
    unless @paciente
      render_error('Paciente no encontrado', status: :not_found)
    end
  end

  def paciente_busqueda_json(paciente)
    {
      id: paciente.id,
      nombre_completo: paciente.usuario.nombre_completo,
      numero_documento: paciente.numero_documento,
      foto_url: absolute_url(paciente.usuario.foto_url),
      telefono: paciente.usuario.telefono,
      edad: paciente.edad
    }
  end

  def paciente_detalle_json(paciente, medico)
    ultima_cita = medico.citas.where(paciente_id: paciente.id).order(fecha_hora_inicio: :desc).first
    
    {
      id: paciente.id,
      nombre_completo: paciente.usuario.nombre_completo,
      numero_documento: paciente.numero_documento,
      foto_url: absolute_url(paciente.usuario.foto_url),
      telefono: paciente.usuario.telefono,
      edad: paciente.edad,
      grupo_sanguineo: paciente.grupo_sanguineo,
      alergias: paciente.alergias,
      total_citas: medico.citas.where(paciente_id: paciente.id).count,
      ultima_cita: ultima_cita&.fecha_hora_inicio
    }
  end

  def paciente_completo_json(paciente, medico)
    citas = medico.citas.where(paciente_id: paciente.id).order(fecha_hora_inicio: :desc).limit(10)
    
    {
      id: paciente.id,
      nombre_completo: paciente.usuario.nombre_completo,
      numero_documento: paciente.numero_documento,
      tipo_documento: paciente.tipo_documento,
      foto_url: absolute_url(paciente.usuario.foto_url),
      telefono: paciente.usuario.telefono,
      email: paciente.usuario.email,
      edad: paciente.edad,
      fecha_nacimiento: paciente.fecha_nacimiento,
      genero: paciente.genero,
      grupo_sanguineo: paciente.grupo_sanguineo,
      alergias: paciente.alergias,
      historial_citas: citas.map { |c| historial_cita_json(c) }
    }
  end

  def historial_cita_json(cita)
    {
      id: cita.id,
      fecha_hora_inicio: cita.fecha_hora_inicio,
      estado: cita.estado,
      motivo_consulta: cita.motivo_consulta,
      diagnostico: cita.diagnostico
    }
  end

  def paciente_params
    params.require(:paciente).permit(
      :tipo_documento,
      :numero_documento,
      :nombre,
      :apellido,
      :fecha_nacimiento,
      :genero,
      :telefono,
      :email,
      :grupo_sanguineo,
      :alergias
    )
  end

  def generate_temp_password
    SecureRandom.hex(8)
  end
end
