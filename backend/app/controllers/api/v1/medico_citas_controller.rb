class Api::V1::MedicoCitasController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico
  before_action :set_cita, only: [:show, :completar, :cancelar]

  # GET /api/v1/medico/citas
  def index
    medico = current_user.medico
    
    # Filtros
    filtro_estado = params[:estado]
    fecha_desde = params[:fecha_desde]
    fecha_hasta = params[:fecha_hasta]
    busqueda = params[:busqueda]
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 10
    
    # Query base
    citas_query = medico.citas.includes(paciente: :usuario).order(fecha_hora_inicio: :desc)
    
    # Filtro por rango de fechas
    if fecha_desde.present? && fecha_hasta.present?
      citas_query = citas_query.where('DATE(fecha_hora_inicio) >= ? AND DATE(fecha_hora_inicio) <= ?', fecha_desde, fecha_hasta)
    elsif fecha_desde.present?
      citas_query = citas_query.where('DATE(fecha_hora_inicio) >= ?', fecha_desde)
    elsif fecha_hasta.present?
      citas_query = citas_query.where('DATE(fecha_hora_inicio) <= ?', fecha_hasta)
    end
    
    # Aplicar filtros
    citas = aplicar_filtros(citas_query, filtro_estado)
    citas = aplicar_busqueda(citas, busqueda) if busqueda.present?
    
    # Paginación
    total = citas.count
    citas_paginadas = citas.offset((page - 1) * per_page).limit(per_page)
    
    render_success({
      citas: citas_paginadas.map { |c| cita_json(c) },
      total: total,
      page: page,
      per_page: per_page,
      total_pages: (total.to_f / per_page).ceil,
      estadisticas: calcular_estadisticas(medico)
    })
  rescue => e
    Rails.logger.error("Error al listar citas: #{e.message}")
    render_error('Error al cargar las citas', status: :internal_server_error)
  end

  # GET /api/v1/medico/citas/:id
  def show
    render_success(cita_json(@cita, detallado: true))
  end

  # POST /api/v1/medico/citas
  def create
    medico = current_user.medico
    
    cita = medico.citas.new(cita_params)
    
    if cita.save
      render_success(cita_json(cita), status: :created)
    else
      render_error('No se pudo crear la cita', errors: cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al crear cita: #{e.message}")
    render_error('Error al crear la cita', status: :internal_server_error)
  end

  # PUT /api/v1/medico/citas/:id/completar
  def completar
    unless @cita.puede_completarse?
      return render_error('La cita no puede ser completada', status: :unprocessable_entity)
    end
    
    @cita.assign_attributes(completar_params)
    @cita.estado = :completada
    @cita.fecha_atencion = Time.current
    
    if @cita.save
      render_success(cita_json(@cita))
    else
      render_error('No se pudo completar la cita', errors: @cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al completar cita: #{e.message}")
    render_error('Error al completar la cita', status: :internal_server_error)
  end

  # PUT /api/v1/medico/citas/:id/cancelar
  def cancelar
    unless @cita.puede_cancelarse?
      return render_error('La cita no puede ser cancelada', status: :unprocessable_entity)
    end
    
    @cita.estado = :cancelada
    @cita.motivo_cancelacion = params[:motivo_cancelacion]
    
    if @cita.save
      render_success(cita_json(@cita))
    else
      render_error('No se pudo cancelar la cita', errors: @cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al cancelar cita: #{e.message}")
    render_error('Error al cancelar la cita', status: :internal_server_error)
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def set_cita
    medico = current_user.medico
    @cita = medico.citas.find_by(id: params[:id])
    
    unless @cita
      render_error('Cita no encontrada', status: :not_found)
    end
  end

  def aplicar_filtros(citas, filtro)
    case filtro
    when 'proximas'
      citas.where('fecha_hora_inicio >= ?', Time.current)
           .where(estado: [:pendiente, :confirmada])
    when 'completadas'
      citas.where(estado: :completada)
    when 'canceladas'
      citas.where(estado: :cancelada)
    when 'todas', nil
      citas
    else
      # Filtrar por estado específico
      citas.where(estado: filtro)
    end
  end

  def aplicar_busqueda(citas, termino)
    citas.joins(paciente: :usuario)
         .where(
           'usuarios.nombre ILIKE :term OR usuarios.apellido ILIKE :term OR citas.motivo_consulta ILIKE :term',
           term: "%#{termino}%"
         )
  end

  def calcular_estadisticas(medico)
    {
      todas: medico.citas.count,
      proximas: medico.citas.where('fecha_hora_inicio >= ?', Time.current)
                            .where(estado: [:pendiente, :confirmada]).count,
      completadas: medico.citas.where(estado: :completada).count,
      canceladas: medico.citas.where(estado: :cancelada).count,
      pendientes: medico.citas.where(estado: :pendiente).count
    }
  end

  def cita_json(cita, detallado: false)
    json = {
      id: cita.id,
      fecha_hora_inicio: cita.fecha_hora_inicio,
      fecha_hora_fin: cita.fecha_hora_fin,
      estado: cita.estado,
      motivo_consulta: cita.motivo_consulta,
      paciente: {
        id: cita.paciente.id,
        nombre_completo: cita.paciente.usuario.nombre_completo,
        foto_url: cita.paciente.usuario.foto_perfil_url,
        edad: cita.paciente.edad,
        telefono: cita.paciente.usuario.telefono
      },
      created_at: cita.created_at,
      updated_at: cita.updated_at
    }
    
    if detallado
      json.merge!({
        diagnostico: cita.diagnostico,
        observaciones: cita.observaciones,
        receta: cita.receta,
        motivo_cancelacion: cita.motivo_cancelacion,
        fecha_atencion: cita.fecha_atencion
      })
    end
    
    json
  end

  def cita_params
    params.require(:cita).permit(
      :paciente_id,
      :fecha_hora_inicio,
      :fecha_hora_fin,
      :motivo_consulta,
      :estado
    )
  end

  def completar_params
    params.permit(:diagnostico, :observaciones, :receta)
  end
end
