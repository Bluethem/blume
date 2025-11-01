class Api::V1::MedicoDashboardController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico

  def index
    medico = current_user.medico
    
    render_success({
      medico: medico_info(medico),
      estadisticas: estadisticas(medico),
      citas_hoy: citas_hoy(medico),
      citas_proximas: citas_proximas(medico),
      pacientes_recientes: pacientes_recientes(medico)
    })
  rescue => e
    Rails.logger.error("Dashboard error: #{e.message}")
    render_error('Error al cargar el dashboard', status: :internal_server_error)
  end

  def estadisticas
    medico = current_user.medico
    
    render_success({
      total_citas: medico.citas.count,
      citas_completadas: medico.citas.where(estado: :completada).count,
      total_pacientes: medico.citas.select(:paciente_id).distinct.count,
      calificacion_promedio: medico.calificacion_promedio || 0,
      total_valoraciones: medico.valoraciones.count
    })
  end

  # GET /api/v1/medico/estadisticas/exportar
  def exportar_estadisticas
    medico = current_user.medico
    
    # Obtener parámetros de fecha
    fecha_inicio = params[:fecha_inicio]&.to_date || 1.month.ago.to_date
    fecha_fin = params[:fecha_fin]&.to_date || Date.today
    
    begin
      excel = ExcelGeneratorService.generar_estadisticas_medico(medico, fecha_inicio, fecha_fin)
      
      send_data excel,
                filename: "estadisticas_#{medico.nombre_profesional.parameterize}_#{Date.current.strftime('%Y%m%d')}.xlsx",
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
    rescue => e
      Rails.logger.error("Error generando Excel de estadísticas: #{e.message}")
      render_error('Error al generar el archivo Excel', status: :internal_server_error)
    end
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def medico_info(medico)
    {
      id: medico.id,
      nombre_completo: medico.usuario.nombre_completo,
      nombre_profesional: medico.nombre_profesional,
      numero_colegiatura: medico.numero_colegiatura,
      especialidad: medico.especialidad_principal&.nombre || 'Sin especialidad',
      foto_url: absolute_url(medico.usuario.foto_url)
    }
  end

  def estadisticas(medico)
    hoy = Date.today
    citas_hoy = medico.citas.where('DATE(fecha_hora_inicio) = ?', hoy)
    proxima_cita = medico.citas
      .where(estado: [:pendiente, :confirmada])
      .where('fecha_hora_inicio > ?', Time.current)
      .order(:fecha_hora_inicio)
      .first
    
    {
      citas_hoy: citas_hoy.count,
      citas_completadas_hoy: citas_hoy.where(estado: :completada).count,
      total_pacientes_atendidos: medico.citas.where(estado: :completada).select(:paciente_id).distinct.count,
      proxima_cita_hora: proxima_cita ? proxima_cita.fecha_hora_inicio.strftime('%I:%M %p') : nil
    }
  end

  def citas_hoy(medico)
    hoy = Date.today
    citas = medico.citas
      .includes(paciente: :usuario)
      .where('DATE(fecha_hora_inicio) = ?', hoy)
      .order(:fecha_hora_inicio)
    
    citas.map do |cita|
      {
        id: cita.id,
        fecha_hora_inicio: cita.fecha_hora_inicio,
        hora_inicio: cita.fecha_hora_inicio.strftime('%H:%M'),
        hora_fin: cita.fecha_hora_fin.strftime('%H:%M'),
        estado: cita.estado,
        motivo_consulta: cita.motivo_consulta,
        paciente: {
          id: cita.paciente.id,
          nombre_completo: cita.paciente.usuario.nombre_completo,
          edad: cita.paciente.edad,
          foto_url: absolute_url(cita.paciente.usuario.foto_url)
        }
      }
    end
  end

  def citas_proximas(medico)
    # Obtener citas de las próximas 2 semanas para el calendario
    inicio = Date.today.beginning_of_week
    fin = (Date.today + 2.weeks).end_of_week
    
    citas = medico.citas
      .includes(paciente: :usuario)
      .where('DATE(fecha_hora_inicio) >= ? AND DATE(fecha_hora_inicio) <= ?', inicio, fin)
      .order(:fecha_hora_inicio)
    
    citas.map do |cita|
      {
        id: cita.id,
        fecha_hora_inicio: cita.fecha_hora_inicio,
        fecha_hora_fin: cita.fecha_hora_fin,
        estado: cita.estado,
        paciente_nombre: cita.paciente.usuario.nombre_completo,
        paciente_id: cita.paciente.id
      }
    end
  end

  def pacientes_recientes(medico)
    # Obtener los últimos 5 pacientes únicos con citas completadas
    pacientes_ids = medico.citas
      .where(estado: :completada)
      .order(fecha_hora_inicio: :desc)
      .limit(20)
      .pluck(:paciente_id)
      .uniq
      .take(5)
    
    Paciente.includes(:usuario)
      .where(id: pacientes_ids)
      .map do |paciente|
        ultima_cita = medico.citas
          .where(paciente_id: paciente.id, estado: :completada)
          .order(fecha_hora_inicio: :desc)
          .first
        
        {
          id: paciente.id,
          nombre_completo: paciente.usuario.nombre_completo,
          foto_url: absolute_url(paciente.usuario.foto_url),
          ultima_cita: ultima_cita&.fecha_hora_inicio&.strftime('%d de %B, %Y'),
          ultima_cita_fecha: ultima_cita&.fecha_hora_inicio,
          total_citas: medico.citas.where(paciente_id: paciente.id).count
        }
      end
  end
end
