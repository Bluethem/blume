class Api::V1::MedicoEstadisticasController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico

  # GET /api/v1/medico/estadisticas
  def index
    medico = current_user.medico
    periodo = params[:periodo] || 'mes'
    
    # Definir rangos de fechas
    fecha_inicio, fecha_fin = obtener_rango_fechas(periodo)
    fecha_inicio_anterior, fecha_fin_anterior = obtener_rango_anterior(periodo)
    
    # Citas del período actual
    citas_periodo = medico.citas.where('fecha_hora_inicio >= ? AND fecha_hora_inicio <= ?', fecha_inicio, fecha_fin)
    
    # Citas del período anterior (para comparación)
    citas_periodo_anterior = medico.citas.where('fecha_hora_inicio >= ? AND fecha_hora_inicio <= ?', fecha_inicio_anterior, fecha_fin_anterior)
    
    # Calcular estadísticas
    estadisticas = {
      total_citas_atendidas: citas_periodo.where(estado: :completada).count,
      tasa_no_asistencia: calcular_tasa_no_asistencia(citas_periodo),
      calificacion_promedio: 4.5, # Placeholder - implementar sistema de calificaciones
      cambio_citas: calcular_cambio_porcentual(
        citas_periodo.where(estado: :completada).count,
        citas_periodo_anterior.where(estado: :completada).count
      ),
      cambio_no_asistencia: calcular_cambio_porcentual(
        calcular_tasa_no_asistencia(citas_periodo),
        calcular_tasa_no_asistencia(citas_periodo_anterior)
      ),
      cambio_calificacion: 0.1, # Placeholder
      distribucion_estados: {
        completadas: citas_periodo.where(estado: :completada).count,
        canceladas: citas_periodo.where(estado: :cancelada).count,
        no_asistio: citas_periodo.where(estado: :no_asistio).count
      },
      citas_por_mes: obtener_citas_por_mes(medico, periodo),
      citas_recientes: obtener_citas_recientes(medico)
    }
    
    render_success(estadisticas)
  rescue => e
    Rails.logger.error("Error al obtener estadísticas: #{e.message}")
    render_error('Error al cargar estadísticas', status: :internal_server_error)
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def obtener_rango_fechas(periodo)
    hoy = Date.today
    
    case periodo
    when 'semana'
      inicio_semana = hoy.beginning_of_week
      [inicio_semana, hoy]
    when 'mes'
      [hoy.beginning_of_month, hoy.end_of_month]
    when 'trimestre'
      [3.months.ago.beginning_of_month, hoy.end_of_month]
    when 'anio'
      [hoy.beginning_of_year, hoy.end_of_year]
    else
      [hoy.beginning_of_month, hoy.end_of_month]
    end
  end

  def obtener_rango_anterior(periodo)
    hoy = Date.today
    
    case periodo
    when 'semana'
      inicio_semana_anterior = (hoy - 1.week).beginning_of_week
      fin_semana_anterior = inicio_semana_anterior + 6.days
      [inicio_semana_anterior, fin_semana_anterior]
    when 'mes'
      mes_anterior = hoy - 1.month
      [mes_anterior.beginning_of_month, mes_anterior.end_of_month]
    when 'trimestre'
      [6.months.ago.beginning_of_month, 3.months.ago.end_of_month]
    when 'anio'
      anio_anterior = hoy - 1.year
      [anio_anterior.beginning_of_year, anio_anterior.end_of_year]
    else
      mes_anterior = hoy - 1.month
      [mes_anterior.beginning_of_month, mes_anterior.end_of_month]
    end
  end

  def calcular_tasa_no_asistencia(citas)
    total = citas.count
    return 0 if total.zero?
    
    no_asistieron = citas.where(estado: :no_asistio).count
    ((no_asistieron.to_f / total) * 100).round(1)
  end

  def calcular_cambio_porcentual(actual, anterior)
    return 0 if anterior.zero?
    
    ((actual.to_f - anterior) / anterior * 100).round(1)
  end

  def obtener_citas_por_mes(medico, periodo)
    meses = []
    
    case periodo
    when 'trimestre'
      num_meses = 3
    when 'anio'
      num_meses = 12
    else
      num_meses = 3
    end
    
    num_meses.times do |i|
      fecha = Date.today - (num_meses - 1 - i).months
      inicio = fecha.beginning_of_month
      fin = fecha.end_of_month
      
      citas_mes = medico.citas.where('fecha_hora_inicio >= ? AND fecha_hora_inicio <= ?', inicio, fin)
      
      meses << {
        mes: I18n.l(fecha, format: '%b %Y'),
        total: citas_mes.count,
        completadas: citas_mes.where(estado: :completada).count,
        canceladas: citas_mes.where(estado: :cancelada).count
      }
    end
    
    meses
  end

  def obtener_citas_recientes(medico)
    medico.citas
          .includes(paciente: :usuario)
          .order(fecha_hora_inicio: :desc)
          .limit(10)
          .map do |cita|
      {
        id: cita.id,
        paciente_nombre: cita.paciente.usuario.nombre_completo,
        fecha: cita.fecha_hora_inicio,
        hora: cita.fecha_hora_inicio.strftime('%H:%M'),
        estado: cita.estado,
        motivo_consulta: cita.motivo_consulta
      }
    end
  end
end
