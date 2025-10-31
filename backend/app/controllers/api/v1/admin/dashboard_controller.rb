class Api::V1::Admin::DashboardController < Api::V1::Admin::BaseController
  
  def index
    render_success({
      estadisticas: estadisticas_completas,
      citas_hoy: citas_hoy,
      citas_recientes: citas_recientes,
      actividad_reciente: actividad_reciente,
      grafico_citas_semana: grafico_citas_semana,
      grafico_estados: grafico_estados,
      medicos_top: medicos_top
    })
  rescue => e
    Rails.logger.error("Error en dashboard admin: #{e.message}")
    render_error('Error al cargar dashboard', status: :internal_server_error)
  end
  
  private
  
  def estadisticas_completas
    hoy = Date.today
    inicio_semana = hoy.beginning_of_week
    fin_semana = hoy.end_of_week
    inicio_mes = hoy.beginning_of_month
    
    {
      total_citas_hoy: Cita.where('DATE(fecha_hora_inicio) = ?', hoy).count,
      total_citas_semana: Cita.where(fecha_hora_inicio: inicio_semana..fin_semana).count,
      total_medicos_activos: Usuario.es_medico.activos.count,
      total_pacientes: Paciente.count,
      ingresos_mes: Cita.where(estado: :completada).where('fecha_hora_inicio >= ?', inicio_mes).sum(:costo).to_f,
      citas_pendientes: Cita.where(estado: [:pendiente, :confirmada]).count,
      nuevos_pacientes_mes: Paciente.where('created_at >= ?', inicio_mes).count,
      tasa_ocupacion: calcular_tasa_ocupacion
    }
  end
  
  def calcular_tasa_ocupacion
    hoy = Date.today
    total_citas_mes = Cita.where('fecha_hora_inicio >= ? AND fecha_hora_inicio < ?', hoy.beginning_of_month, hoy.end_of_month).count
    medicos_activos = Usuario.es_medico.activos.count
    
    return 0 if medicos_activos.zero?
    
    # Asumimos 20 días laborables y 8 citas por día por médico
    capacidad_mensual = medicos_activos * 20 * 8
    
    return 0 if capacidad_mensual.zero?
    
    ((total_citas_mes.to_f / capacidad_mensual) * 100).round(1)
  end
  
  def citas_hoy
    hoy = Date.today
    Cita.includes(paciente: :usuario, medico: :usuario)
        .where('DATE(fecha_hora_inicio) = ?', hoy)
        .order(fecha_hora_inicio: :asc)
        .limit(10)
        .map do |cita|
      {
        id: cita.id,
        paciente_nombre: cita.paciente.usuario.nombre_completo,
        medico_nombre: "Dr. #{cita.medico.usuario.nombre_completo}",
        fecha_hora: cita.fecha_hora_inicio,
        motivo_consulta: cita.motivo_consulta,
        estado: cita.estado,
        estado_display: I18n.t("cita.estados.#{cita.estado}", default: cita.estado.to_s.titleize)
      }
    end
  end
  
  def citas_recientes
    Cita.includes(paciente: :usuario, medico: :usuario)
        .order(created_at: :desc)
        .limit(5)
        .map do |cita|
      {
        id: cita.id,
        paciente_nombre: cita.paciente.usuario.nombre_completo,
        medico_nombre: "Dr. #{cita.medico.usuario.nombre_completo}",
        fecha_hora: cita.fecha_hora_inicio,
        estado: cita.estado,
        estado_display: I18n.t("cita.estados.#{cita.estado}", default: cita.estado.to_s.titleize),
        created_at: cita.created_at
      }
    end
  end
  
  def actividad_reciente
    actividades = []
    
    # Últimas citas creadas
    Cita.includes(paciente: :usuario)
        .order(created_at: :desc)
        .limit(3)
        .each do |cita|
      actividades << {
        tipo: 'cita_creada',
        descripcion: "Nueva cita para #{cita.paciente.usuario.nombre_completo}",
        fecha: cita.created_at,
        icono: 'event'
      }
    end
    
    # Últimos pacientes registrados
    Paciente.includes(:usuario)
            .order(created_at: :desc)
            .limit(2)
            .each do |paciente|
      actividades << {
        tipo: 'paciente_nuevo',
        descripcion: "Nuevo paciente: #{paciente.usuario.nombre_completo}",
        fecha: paciente.created_at,
        icono: 'person_add'
      }
    end
    
    # Ordenar por fecha
    actividades.sort_by { |a| a[:fecha] }.reverse.take(5)
  end
  
  def grafico_citas_semana
    inicio_semana = Date.today.beginning_of_week
    fin_semana = Date.today.end_of_week
    
    citas_por_dia = Cita.where(fecha_hora_inicio: inicio_semana.beginning_of_day..fin_semana.end_of_day)
                        .group("DATE(fecha_hora_inicio)")
                        .count
    
    (inicio_semana..fin_semana).map do |fecha|
      {
        dia: I18n.l(fecha, format: '%a'),
        total: citas_por_dia[fecha] || 0
      }
    end
  end
  
  def grafico_estados
    Cita.group(:estado)
        .count
        .map do |estado, total|
      {
        estado: I18n.t("cita.estados.#{estado}", default: estado.to_s.titleize),
        total: total
      }
    end
  end
  
  def medicos_top
    Cita.joins(medico: :usuario)
        .where('fecha_hora_inicio >= ?', 1.month.ago)
        .group('medicos.id', 'usuarios.nombre', 'usuarios.apellido')
        .select('usuarios.nombre, usuarios.apellido, COUNT(citas.id) as citas_count')
        .order('citas_count DESC')
        .limit(5)
        .map do |resultado|
      {
        nombre: "Dr. #{resultado.nombre} #{resultado.apellido}",
        citas: resultado.citas_count
      }
    end
  end
end
