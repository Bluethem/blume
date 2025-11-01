class Api::V1::Admin::ReportesController < Api::V1::Admin::BaseController
  # GET /api/v1/admin/reportes/dashboard
  def dashboard
    # Parámetros de fecha
    fecha_inicio = params[:fecha_inicio] || 30.days.ago.to_date
    fecha_fin = params[:fecha_fin] || Date.today

    # Convertir a Date si son strings
    fecha_inicio = Date.parse(fecha_inicio.to_s) if fecha_inicio.is_a?(String)
    fecha_fin = Date.parse(fecha_fin.to_s) if fecha_fin.is_a?(String)

    # KPIs principales
    citas_en_periodo = Cita.where(fecha_hora_inicio: fecha_inicio.beginning_of_day..fecha_fin.end_of_day)
    
    total_citas = citas_en_periodo.count
    
    # Ingresos (solo citas completadas)
    ingresos = citas_en_periodo.where(estado: :completada).sum(:costo)
    
    # Pacientes nuevos en el período
    pacientes_nuevos = Paciente.where(created_at: fecha_inicio.beginning_of_day..fecha_fin.end_of_day).count
    
    # Médico con más citas
    medico_top = citas_en_periodo
      .joins(medico: :usuario)
      .group('medicos.id', 'usuarios.nombre', 'usuarios.apellido')
      .select('medicos.id, usuarios.nombre, usuarios.apellido, COUNT(citas.id) as total_citas')
      .order('total_citas DESC')
      .first

    medico_top_nombre = medico_top ? "Dr. #{medico_top.nombre} #{medico_top.apellido}" : 'N/A'
    medico_top_count = medico_top ? medico_top.total_citas : 0

    # Evolución de citas por día
    citas_por_dia = citas_en_periodo
      .group("DATE(fecha_hora_inicio)")
      .order("DATE(fecha_hora_inicio)")
      .count
      .map { |fecha, count| { fecha: fecha.to_s, total: count } }

    # Distribución por médico
    citas_por_medico = citas_en_periodo
      .joins(medico: :usuario)
      .group('medicos.id', 'usuarios.nombre', 'usuarios.apellido')
      .select('medicos.id, usuarios.nombre, usuarios.apellido, COUNT(citas.id) as total_citas')
      .order('total_citas DESC')
      .limit(10)
      .map do |item|
        {
          medico_id: item.id,
          medico_nombre: "Dr. #{item.nombre} #{item.apellido}",
          total_citas: item.total_citas
        }
      end

    # Distribución por estado
    citas_por_estado = citas_en_periodo
      .group(:estado)
      .count
      .transform_keys { |k| I18n.t("cita.estados.#{k}", default: k.to_s.titleize) }

    render_success({
      kpis: {
        total_citas: total_citas,
        ingresos_generados: ingresos.to_f,
        pacientes_nuevos: pacientes_nuevos,
        medico_top: {
          nombre: medico_top_nombre,
          total_citas: medico_top_count
        }
      },
      graficos: {
        citas_por_dia: citas_por_dia,
        citas_por_medico: citas_por_medico,
        citas_por_estado: citas_por_estado
      },
      periodo: {
        fecha_inicio: fecha_inicio.to_s,
        fecha_fin: fecha_fin.to_s
      }
    })
  rescue => e
    Rails.logger.error("Error en dashboard de reportes: #{e.message}")
    render_error('Error al generar el dashboard', status: :internal_server_error)
  end

  # GET /api/v1/admin/reportes/citas_detalle
  def citas_detalle
    # Parámetros
    fecha_inicio = params[:fecha_inicio] || 30.days.ago.to_date
    fecha_fin = params[:fecha_fin] || Date.today
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 50

    # Convertir a Date
    fecha_inicio = Date.parse(fecha_inicio.to_s) if fecha_inicio.is_a?(String)
    fecha_fin = Date.parse(fecha_fin.to_s) if fecha_fin.is_a?(String)

    # Query de citas
    citas = Cita.includes(paciente: :usuario, medico: :usuario)
                .where(fecha_hora_inicio: fecha_inicio.beginning_of_day..fecha_fin.end_of_day)
                .order(fecha_hora_inicio: :desc)

    total_count = citas.count
    total_pages = (total_count.to_f / per_page).ceil
    offset = (page - 1) * per_page
    citas = citas.limit(per_page).offset(offset)

    citas_data = citas.map do |cita|
      {
        id: cita.id,
        fecha: cita.fecha_hora_inicio.to_date.to_s,
        hora: cita.fecha_hora_inicio.strftime('%H:%M'),
        paciente: {
          id: cita.paciente.id,
          nombre_completo: cita.paciente.usuario.nombre_completo
        },
        medico: {
          id: cita.medico.id,
          nombre_completo: "Dr. #{cita.medico.usuario.nombre_completo}"
        },
        estado: cita.estado,
        estado_label: I18n.t("cita.estados.#{cita.estado}", default: cita.estado.to_s.titleize),
        costo: cita.costo.to_f,
        ingreso: cita.completada? ? cita.costo.to_f : 0.0
      }
    end

    render_success({
      citas: citas_data,
      meta: {
        current_page: page,
        total_pages: total_pages,
        total_count: total_count,
        per_page: per_page
      }
    })
  rescue => e
    Rails.logger.error("Error en detalle de citas: #{e.message}")
    render_error('Error al cargar el detalle de citas', status: :internal_server_error)
  end

  # GET /api/v1/admin/reportes/medicos_ranking
  def medicos_ranking
    fecha_inicio = params[:fecha_inicio] || 30.days.ago.to_date
    fecha_fin = params[:fecha_fin] || Date.today

    fecha_inicio = Date.parse(fecha_inicio.to_s) if fecha_inicio.is_a?(String)
    fecha_fin = Date.parse(fecha_fin.to_s) if fecha_fin.is_a?(String)

    medicos = Medico.joins(:usuario, :citas)
                    .where(citas: { fecha_hora_inicio: fecha_inicio.beginning_of_day..fecha_fin.end_of_day })
                    .group('medicos.id', 'usuarios.nombre', 'usuarios.apellido')
                    .select('medicos.id, usuarios.nombre, usuarios.apellido, 
                            COUNT(citas.id) as total_citas,
                            COUNT(CASE WHEN citas.estado = 0 THEN 1 END) as citas_completadas,
                            SUM(CASE WHEN citas.estado = 0 THEN citas.costo ELSE 0 END) as ingresos_generados')
                    .order('total_citas DESC')
                    .limit(20)

    medicos_data = medicos.map do |medico|
      {
        medico_id: medico.id,
        nombre_completo: "Dr. #{medico.nombre} #{medico.apellido}",
        total_citas: medico.total_citas,
        citas_completadas: medico.citas_completadas,
        ingresos_generados: medico.ingresos_generados.to_f
      }
    end

    render_success({ medicos: medicos_data })
  rescue => e
    Rails.logger.error("Error en ranking de médicos: #{e.message}")
    render_error('Error al cargar el ranking', status: :internal_server_error)
  end

  # GET /api/v1/admin/reportes/ingresos
  def ingresos
    fecha_inicio = params[:fecha_inicio] || 30.days.ago.to_date
    fecha_fin = params[:fecha_fin] || Date.today

    fecha_inicio = Date.parse(fecha_inicio.to_s) if fecha_inicio.is_a?(String)
    fecha_fin = Date.parse(fecha_fin.to_s) if fecha_fin.is_a?(String)

    # Ingresos por día
    ingresos_por_dia = Cita.where(estado: :completada)
                           .where(fecha_hora_inicio: fecha_inicio.beginning_of_day..fecha_fin.end_of_day)
                           .group("DATE(fecha_hora_inicio)")
                           .sum(:costo)
                           .map { |fecha, total| { fecha: fecha.to_s, total: total.to_f } }

    # Total de ingresos
    total_ingresos = ingresos_por_dia.sum { |item| item[:total] }

    # Promedio por día
    dias_count = (fecha_fin - fecha_inicio).to_i + 1
    promedio_diario = dias_count > 0 ? (total_ingresos / dias_count) : 0

    render_success({
      ingresos_por_dia: ingresos_por_dia,
      total_ingresos: total_ingresos,
      promedio_diario: promedio_diario,
      dias_analizados: dias_count
    })
  rescue => e
    Rails.logger.error("Error en reporte de ingresos: #{e.message}")
    render_error('Error al cargar el reporte de ingresos', status: :internal_server_error)
  end

  # GET /api/v1/admin/reportes/pacientes_nuevos
  def pacientes_nuevos
    fecha_inicio = params[:fecha_inicio] || 30.days.ago.to_date
    fecha_fin = params[:fecha_fin] || Date.today

    fecha_inicio = Date.parse(fecha_inicio.to_s) if fecha_inicio.is_a?(String)
    fecha_fin = Date.parse(fecha_fin.to_s) if fecha_fin.is_a?(String)

    # Pacientes nuevos por día
    pacientes_por_dia = Paciente.where(created_at: fecha_inicio.beginning_of_day..fecha_fin.end_of_day)
                                .group("DATE(created_at)")
                                .count
                                .map { |fecha, total| { fecha: fecha.to_s, total: total } }

    total_pacientes_nuevos = pacientes_por_dia.sum { |item| item[:total] }

    render_success({
      pacientes_por_dia: pacientes_por_dia,
      total_pacientes_nuevos: total_pacientes_nuevos
    })
  rescue => e
    Rails.logger.error("Error en reporte de pacientes nuevos: #{e.message}")
    render_error('Error al cargar el reporte', status: :internal_server_error)
  end

  # POST /api/v1/admin/reportes/exportar
  def exportar
    tipo = params[:tipo] # 'pdf' o 'excel'
    reporte_tipo = params[:reporte_tipo]
    fecha_inicio = params[:fecha_inicio]
    fecha_fin = params[:fecha_fin]

    # Por ahora retornamos la URL donde se generaría el archivo
    # En una implementación real, aquí se generaría el PDF o Excel

    render_success({
      message: "Exportación iniciada. Se enviará un email cuando esté lista.",
      tipo: tipo,
      reporte_tipo: reporte_tipo
    })
  rescue => e
    Rails.logger.error("Error en exportación: #{e.message}")
    render_error('Error al exportar', status: :internal_server_error)
  end

  # GET /api/v1/admin/reportes/exportar_pdf
  def exportar_pdf
    fecha_inicio = params[:fecha_inicio]&.to_date || 1.month.ago.to_date
    fecha_fin = params[:fecha_fin]&.to_date || Date.today
    
    citas = Cita.where(fecha_hora_inicio: fecha_inicio.beginning_of_day..fecha_fin.end_of_day)
               .includes(:medico, :paciente)
    
    begin
      pdf = PdfGeneratorService.generar_reporte_citas_admin(citas, fecha_inicio, fecha_fin)
      
      send_data pdf,
                filename: "reporte_citas_#{fecha_inicio.strftime('%Y%m%d')}_#{fecha_fin.strftime('%Y%m%d')}.pdf",
                type: 'application/pdf',
                disposition: 'attachment'
    rescue => e
      Rails.logger.error("Error generando PDF de reporte: #{e.message}")
      render_error('Error al generar el PDF', status: :internal_server_error)
    end
  end

  # GET /api/v1/admin/reportes/exportar_excel
  def exportar_excel
    fecha_inicio = params[:fecha_inicio]&.to_date || 1.month.ago.to_date
    fecha_fin = params[:fecha_fin]&.to_date || Date.today
    
    citas = Cita.where(fecha_hora_inicio: fecha_inicio.beginning_of_day..fecha_fin.end_of_day)
               .includes(:medico, :paciente)
    
    begin
      excel = ExcelGeneratorService.generar_reporte_citas_admin(citas, fecha_inicio, fecha_fin)
      
      send_data excel,
                filename: "reporte_citas_#{fecha_inicio.strftime('%Y%m%d')}_#{fecha_fin.strftime('%Y%m%d')}.xlsx",
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
    rescue => e
      Rails.logger.error("Error generando Excel de reporte: #{e.message}")
      render_error('Error al generar el archivo Excel', status: :internal_server_error)
    end
  end
end
