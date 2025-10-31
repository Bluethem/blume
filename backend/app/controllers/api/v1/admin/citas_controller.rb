class Api::V1::Admin::CitasController < Api::V1::Admin::BaseController
  before_action :set_cita, only: [:show, :update, :destroy, :cancelar, :confirmar, :completar]

  # GET /api/v1/admin/citas
  def index
    @citas = Cita.includes(paciente: :usuario, medico: [:usuario, :especialidades])
    
    # Filtros
    if params[:search].present?
      @citas = @citas.joins(paciente: :usuario)
                     .where('usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ?', "%#{params[:search]}%", "%#{params[:search]}%")
    end
    @citas = @citas.where(estado: params[:estado]) if params[:estado].present?
    @citas = @citas.where(medico_id: params[:medico_id]) if params[:medico_id].present?
    @citas = @citas.where(paciente_id: params[:paciente_id]) if params[:paciente_id].present?
    
    # Filtro por rango de fechas
    if params[:fecha_desde].present?
      @citas = @citas.where('fecha_hora_inicio >= ?', params[:fecha_desde])
    end
    if params[:fecha_hasta].present?
      @citas = @citas.where('fecha_hora_inicio <= ?', params[:fecha_hasta])
    end
    
    # Ordenamiento
    order_by = params[:order_by] || 'fecha_hora_inicio'
    order_dir = params[:order_dir] || 'desc'
    @citas = @citas.order("#{order_by} #{order_dir}")
    
    # Paginación manual
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    
    total_count = @citas.count
    total_pages = (total_count.to_f / per_page).ceil
    offset = (page - 1) * per_page
    
    @citas_paginadas = @citas.limit(per_page).offset(offset)
    
    render_success({
      citas: @citas_paginadas.map { |cita| cita_json(cita) },
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      }
    })
  rescue => e
    Rails.logger.error("Error al listar citas: #{e.message}")
    render_error('Error al cargar las citas', status: :internal_server_error)
  end

  # GET /api/v1/admin/citas/:id
  def show
    render_success(cita_detalle_json(@cita))
  rescue => e
    Rails.logger.error("Error al obtener cita: #{e.message}")
    render_error('Error al cargar la cita', status: :internal_server_error)
  end

  # POST /api/v1/admin/citas
  def create
    @cita = Cita.new(cita_params)
    
    if @cita.save
      render_success(cita_json(@cita), message: 'Cita creada exitosamente', status: :created)
    else
      render_error(@cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al crear cita: #{e.message}")
    render_error('Error al crear la cita', status: :internal_server_error)
  end

  # PUT /api/v1/admin/citas/:id
  def update
    if @cita.update(cita_params)
      render_success(cita_json(@cita), message: 'Cita actualizada exitosamente')
    else
      render_error(@cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al actualizar cita: #{e.message}")
    render_error('Error al actualizar la cita', status: :internal_server_error)
  end

  # DELETE /api/v1/admin/citas/:id
  def destroy
    if @cita.destroy
      render_success({}, message: 'Cita eliminada exitosamente')
    else
      render_error('No se pudo eliminar la cita', status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al eliminar cita: #{e.message}")
    render_error('Error al eliminar la cita', status: :internal_server_error)
  end

  # PUT /api/v1/admin/citas/:id/cancelar
  def cancelar
    if @cita.update(estado: :cancelada, motivo_cancelacion: params[:motivo_cancelacion])
      render_success(cita_json(@cita), message: 'Cita cancelada exitosamente')
    else
      render_error(@cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al cancelar cita: #{e.message}")
    render_error('Error al cancelar la cita', status: :internal_server_error)
  end

  # PUT /api/v1/admin/citas/:id/confirmar
  def confirmar
    if @cita.update(estado: :confirmada)
      render_success(cita_json(@cita), message: 'Cita confirmada exitosamente')
    else
      render_error(@cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al confirmar cita: #{e.message}")
    render_error('Error al confirmar la cita', status: :internal_server_error)
  end

  # PUT /api/v1/admin/citas/:id/completar
  def completar
    if @cita.update(estado: :completada)
      render_success(cita_json(@cita), message: 'Cita marcada como completada')
    else
      render_error(@cita.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al completar cita: #{e.message}")
    render_error('Error al completar la cita', status: :internal_server_error)
  end

  # POST /api/v1/admin/citas/cancelar_multiples
  def cancelar_multiples
    cita_ids = params[:cita_ids] || []
    
    if cita_ids.empty?
      return render_error('No se proporcionaron IDs de citas', status: :bad_request)
    end

    canceladas = 0
    errores = []

    cita_ids.each do |cita_id|
      cita = Cita.find_by(id: cita_id)
      if cita
        if cita.update(estado: :cancelada, motivo_cancelacion: params[:motivo_cancelacion])
          canceladas += 1
        else
          errores << "Cita #{cita_id}: #{cita.errors.full_messages.join(', ')}"
        end
      else
        errores << "Cita #{cita_id} no encontrada"
      end
    end

    if errores.empty?
      render_success({ canceladas: canceladas }, message: "#{canceladas} citas canceladas exitosamente")
    else
      render_success({ canceladas: canceladas, errores: errores }, message: "Se cancelaron #{canceladas} citas con algunos errores")
    end
  rescue => e
    Rails.logger.error("Error al cancelar múltiples citas: #{e.message}")
    render_error('Error al cancelar las citas', status: :internal_server_error)
  end

  # GET /api/v1/admin/citas/exportar
  def exportar
    @citas = Cita.includes(paciente: :usuario, medico: [:usuario, :especialidades])
                 .order(fecha_hora_inicio: :desc)

    # Aplicar los mismos filtros que en index
    @citas = @citas.where('usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ?', "%#{params[:search]}%", "%#{params[:search]}%") if params[:search].present?
    @citas = @citas.where(estado: params[:estado]) if params[:estado].present?

    csv_data = generate_csv(@citas)
    
    render_success({
      csv: csv_data,
      filename: "citas_#{Date.today.strftime('%Y%m%d')}.csv"
    })
  rescue => e
    Rails.logger.error("Error al exportar citas: #{e.message}")
    render_error('Error al exportar las citas', status: :internal_server_error)
  end

  private

  def set_cita
    @cita = Cita.includes(paciente: :usuario, medico: [:usuario, :especialidades]).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Cita no encontrada', status: :not_found)
  end

  def cita_params
    params.require(:cita).permit(
      :paciente_id,
      :medico_id,
      :fecha_hora_inicio,
      :fecha_hora_fin,
      :motivo_consulta,
      :estado,
      :costo,
      :observaciones,
      :diagnostico,
      :motivo_cancelacion
    )
  end

  def cita_json(cita)
    {
      id: cita.id,
      paciente_id: cita.paciente_id,
      paciente_nombre: cita.paciente.usuario.nombre_completo,
      medico_id: cita.medico_id,
      medico_nombre: "Dr. #{cita.medico.usuario.nombre_completo}",
      especialidad: cita.medico.especialidad_principal&.nombre || 'N/A',
      fecha_hora_inicio: cita.fecha_hora_inicio,
      fecha_hora_fin: cita.fecha_hora_fin,
      motivo_consulta: cita.motivo_consulta,
      estado: cita.estado,
      estado_display: I18n.t("cita.estados.#{cita.estado}", default: cita.estado.to_s.titleize),
      costo: cita.costo.to_f,
      created_at: cita.created_at
    }
  end

  def cita_detalle_json(cita)
    {
      id: cita.id,
      paciente: {
        id: cita.paciente_id,
        nombre: cita.paciente.usuario.nombre_completo,
        email: cita.paciente.usuario.email,
        telefono: cita.paciente.usuario.telefono
      },
      medico: {
        id: cita.medico_id,
        nombre: "Dr. #{cita.medico.usuario.nombre_completo}",
        especialidad: cita.medico.especialidad_principal&.nombre,
        email: cita.medico.usuario.email
      },
      fecha_hora_inicio: cita.fecha_hora_inicio,
      fecha_hora_fin: cita.fecha_hora_fin,
      duracion_minutos: ((cita.fecha_hora_fin - cita.fecha_hora_inicio) / 60).to_i,
      motivo_consulta: cita.motivo_consulta,
      estado: cita.estado,
      estado_display: I18n.t("cita.estados.#{cita.estado}", default: cita.estado.to_s.titleize),
      costo: cita.costo.to_f,
      observaciones: cita.observaciones,
      diagnostico: cita.diagnostico,
      motivo_cancelacion: cita.motivo_cancelacion,
      created_at: cita.created_at,
      updated_at: cita.updated_at
    }
  end

  def generate_csv(citas)
    require 'csv'
    
    CSV.generate(headers: true) do |csv|
      csv << ['ID', 'Paciente', 'Médico', 'Especialidad', 'Fecha', 'Hora', 'Motivo', 'Estado', 'Costo']
      
      citas.each do |cita|
        csv << [
          cita.id,
          cita.paciente.usuario.nombre_completo,
          "Dr. #{cita.medico.usuario.nombre_completo}",
          cita.medico.especialidad_principal&.nombre || 'N/A',
          cita.fecha_hora_inicio.strftime('%d/%m/%Y'),
          cita.fecha_hora_inicio.strftime('%H:%M'),
          cita.motivo_consulta,
          I18n.t("cita.estados.#{cita.estado}", default: cita.estado.to_s.titleize),
          "$#{cita.costo.to_f}"
        ]
      end
    end
  end
end
