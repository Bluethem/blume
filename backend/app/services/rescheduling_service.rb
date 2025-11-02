# app/services/rescheduling_service.rb
class ReschedulingService
  class ReschedulingError < StandardError; end
  
  # Solicitar reprogramación
  def self.solicitar_reprogramacion(cita, usuario, params)
    # Validar que la cita puede reprogramarse
    unless cita.puede_reprogramarse?
      raise ReschedulingError, 'Esta cita no puede ser reprogramada'
    end
    
    # Validar que no haya una reprogramación pendiente
    if cita.tiene_reprogramacion_pendiente?
      raise ReschedulingError, 'Ya existe una solicitud de reprogramación pendiente para esta cita'
    end
    
    # Determinar el motivo según quien solicita
    motivo = determinar_motivo(cita, usuario, params[:motivo])
    
    # Crear la reprogramación
    reprogramacion = Reprogramacion.create!(
      cita_original: cita,
      solicitado_por: usuario,
      motivo: motivo,
      estado: :pendiente,
      descripcion: params[:descripcion],
      justificacion: params[:justificacion],
      fecha_propuesta_1: params[:fecha_propuesta_1],
      fecha_propuesta_2: params[:fecha_propuesta_2],
      fecha_propuesta_3: params[:fecha_propuesta_3],
      requiere_reembolso: debe_reembolsar?(motivo),
      metadata: {
        solicitud_automatica: params[:automatica] || false,
        quien_solicita_rol: usuario.rol
      }
    )
    
    # Notificar a los involucrados
    notificar_solicitud_reprogramacion(reprogramacion)
    
    reprogramacion
  end
  
  # Aprobar reprogramación
  def self.aprobar_reprogramacion(reprogramacion, usuario, fecha_seleccionada, crear_cita_nueva: true)
    unless reprogramacion.pendiente?
      raise ReschedulingError, 'Esta reprogramación ya fue procesada'
    end
    
    # Validar que el usuario tenga permisos
    unless puede_aprobar?(reprogramacion, usuario)
      raise ReschedulingError, 'No tienes permisos para aprobar esta reprogramación'
    end
    
    # Validar que la fecha seleccionada sea una de las propuestas
    unless reprogramacion.fechas_propuestas.include?(fecha_seleccionada)
      raise ReschedulingError, 'La fecha seleccionada no está entre las fechas propuestas'
    end
    
    cita_nueva = nil
    
    if crear_cita_nueva
      # Crear la nueva cita
      cita_nueva = crear_nueva_cita(reprogramacion.cita_original, fecha_seleccionada)
    end
    
    # Aprobar la reprogramación
    reprogramacion.aprobar!(usuario, fecha_seleccionada, cita_nueva)
    
    # Procesar reembolso si es necesario
    if reprogramacion.requiere_reembolso && !reprogramacion.reembolso_procesado
      procesar_reembolso_reprogramacion(reprogramacion)
    end
    
    reprogramacion
  end
  
  # Rechazar reprogramación
  def self.rechazar_reprogramacion(reprogramacion, usuario, motivo_rechazo)
    unless reprogramacion.pendiente?
      raise ReschedulingError, 'Esta reprogramación ya fue procesada'
    end
    
    # Validar que el usuario tenga permisos
    unless puede_aprobar?(reprogramacion, usuario)
      raise ReschedulingError, 'No tienes permisos para rechazar esta reprogramación'
    end
    
    reprogramacion.rechazar!(usuario, motivo_rechazo)
  end
  
  # Cancelar reprogramación
  def self.cancelar_reprogramacion(reprogramacion, usuario, motivo = nil)
    # Solo el solicitante o un admin pueden cancelar
    unless puede_cancelar?(reprogramacion, usuario)
      raise ReschedulingError, 'No tienes permisos para cancelar esta reprogramación'
    end
    
    reprogramacion.cancelar!(usuario, motivo)
  end
  
  # Obtener reprogramaciones pendientes de un médico
  def self.reprogramaciones_pendientes_medico(medico_id)
    Reprogramacion.joins(:cita_original)
                  .where(citas: { medico_id: medico_id })
                  .where(estado: :pendiente)
                  .includes(:cita_original, :solicitado_por)
                  .order(created_at: :desc)
  end
  
  # Obtener reprogramaciones de un paciente
  def self.reprogramaciones_paciente(paciente_id, estado: nil)
    query = Reprogramacion.joins(:cita_original)
                          .where(citas: { paciente_id: paciente_id })
                          .includes(:cita_original, :cita_nueva, :aprobado_por)
                          .order(created_at: :desc)
    
    query = query.where(estado: estado) if estado.present?
    query
  end
  
  # Procesar reprogramación automática por falta
  def self.crear_reprogramacion_automatica(cita, motivo_falta)
    # Determinar quien no asistió
    quien_falta = motivo_falta == :medico_no_asistio ? :medico : :paciente
    
    # Generar fechas propuestas automáticamente
    fechas_propuestas = generar_fechas_propuestas(cita)
    
    # Crear la solicitud
    solicitar_reprogramacion(
      cita,
      cita.medico.usuario, # El médico es quien registra
      {
        motivo: motivo_falta,
        descripcion: "Reprogramación automática por #{quien_falta == :medico ? 'falta del médico' : 'falta del paciente'}",
        justificacion: "El #{quien_falta == :medico ? 'médico' : 'paciente'} no pudo asistir a la cita programada",
        fecha_propuesta_1: fechas_propuestas[0],
        fecha_propuesta_2: fechas_propuestas[1],
        fecha_propuesta_3: fechas_propuestas[2],
        automatica: true
      }
    )
  end
  
  # Estadísticas de reprogramaciones
  def self.estadisticas_reprogramaciones(params = {})
    query = Reprogramacion.all
    
    if params[:medico_id].present?
      query = query.joins(:cita_original).where(citas: { medico_id: params[:medico_id] })
    end
    
    if params[:fecha_desde].present? && params[:fecha_hasta].present?
      query = query.where(created_at: params[:fecha_desde]..params[:fecha_hasta])
    end
    
    {
      total: query.count,
      pendientes: query.where(estado: :pendiente).count,
      aprobadas: query.where(estado: :aprobada).count,
      rechazadas: query.where(estado: :rechazada).count,
      por_motivo: query.group(:motivo).count,
      con_reembolso: query.where(reembolso_procesado: true).count,
      promedio_por_cita: query.joins(:cita_original)
                              .group('citas.id')
                              .count
                              .values
                              .sum.to_f / [query.count, 1].max
    }
  end
  
  private
  
  # Determinar el motivo de la reprogramación
  def self.determinar_motivo(cita, usuario, motivo_param)
    return motivo_param.to_sym if motivo_param.present?
    
    # Si el médico es quien solicita
    if usuario.es_medico? && cita.medico.usuario_id == usuario.id
      :medico_no_asistio
    # Si el paciente solicita
    elsif usuario.es_paciente? && cita.paciente.usuario_id == usuario.id
      :solicitud_paciente
    # Si es admin
    else
      :error_programacion
    end
  end
  
  # Verificar si debe reembolsar
  def self.debe_reembolsar?(motivo)
    [:medico_no_asistio, :emergencia_medica, :error_programacion].include?(motivo)
  end
  
  # Verificar si puede aprobar
  def self.puede_aprobar?(reprogramacion, usuario)
    return true if usuario.es_administrador?
    return true if usuario.es_medico? && reprogramacion.cita_original.medico.usuario_id == usuario.id
    false
  end
  
  # Verificar si puede cancelar
  def self.puede_cancelar?(reprogramacion, usuario)
    return true if usuario.es_administrador?
    return true if reprogramacion.solicitado_por_id == usuario.id
    false
  end
  
  # Crear nueva cita a partir de la reprogramación
  def self.crear_nueva_cita(cita_original, nueva_fecha)
    duracion = (cita_original.fecha_hora_fin - cita_original.fecha_hora_inicio) / 60 # en minutos
    
    Cita.create!(
      paciente: cita_original.paciente,
      medico: cita_original.medico,
      fecha_hora_inicio: nueva_fecha,
      fecha_hora_fin: nueva_fecha + duracion.minutes,
      motivo_consulta: cita_original.motivo_consulta,
      costo: cita_original.costo,
      estado: :confirmada,
      pagado: cita_original.pagado, # Mantener el estado de pago
      observaciones: "Cita reprogramada desde #{cita_original.fecha_hora_inicio.strftime('%d/%m/%Y')}"
    )
  end
  
  # Generar fechas propuestas automáticamente
  def self.generar_fechas_propuestas(cita)
    medico = cita.medico
    fecha_base = [cita.fecha_hora_inicio, Time.current].max
    fechas = []
    
    # Buscar los próximos 3 slots disponibles
    dias_buscados = 0
    fecha_actual = fecha_base
    
    while fechas.length < 3 && dias_buscados < 30
      # Verificar si el médico trabaja ese día
      horario = medico.horario_medicos.activos.find_by(dia_semana: fecha_actual.wday)
      
      if horario
        # Proponer en el mismo horario de la cita original
        hora_propuesta = Time.zone.parse(
          "#{fecha_actual.to_date} #{cita.fecha_hora_inicio.strftime('%H:%M')}"
        )
        
        # Verificar que esté dentro del horario de atención
        if hora_dentro_horario?(hora_propuesta, horario) && !medico_tiene_cita?(medico, hora_propuesta)
          fechas << hora_propuesta
        end
      end
      
      fecha_actual += 1.day
      dias_buscados += 1
    end
    
    # Si no se encontraron 3 fechas, completar con fechas básicas
    while fechas.length < 3
      fecha_actual += 1.day
      fechas << fecha_actual.change(hour: 9, min: 0)
    end
    
    fechas
  end
  
  # Verificar si una hora está dentro del horario
  def self.hora_dentro_horario?(hora, horario)
    hora_str = hora.strftime('%H:%M:%S')
    inicio_str = horario.hora_inicio.strftime('%H:%M:%S')
    fin_str = horario.hora_fin.strftime('%H:%M:%S')
    
    hora_str >= inicio_str && hora_str <= fin_str
  end
  
  # Verificar si el médico tiene cita en ese horario
  def self.medico_tiene_cita?(medico, fecha_hora)
    medico.citas.activas.where(
      'fecha_hora_inicio <= ? AND fecha_hora_fin > ?',
      fecha_hora,
      fecha_hora
    ).exists?
  end
  
  # Notificar solicitud de reprogramación
  def self.notificar_solicitud_reprogramacion(reprogramacion)
    # Notificar al médico si no fue él quien solicitó
    if reprogramacion.solicitado_por.rol != 'medico'
      Notificacion.create!(
        usuario: reprogramacion.cita_original.medico.usuario,
        cita: reprogramacion.cita_original,
        tipo: :reprogramacion_solicitada,
        titulo: 'Nueva Solicitud de Reprogramación',
        mensaje: "#{reprogramacion.solicitado_por.nombre_completo} ha solicitado reprogramar una cita"
      )
    end
    
    # Notificar al paciente si no fue él quien solicitó
    if reprogramacion.solicitado_por.rol != 'paciente'
      Notificacion.create!(
        usuario: reprogramacion.cita_original.paciente.usuario,
        cita: reprogramacion.cita_original,
        tipo: :reprogramacion_solicitada,
        titulo: 'Solicitud de Reprogramación',
        mensaje: "Tu cita del #{reprogramacion.cita_original.fecha_hora_inicio.strftime('%d/%m/%Y')} requiere reprogramación"
      )
    end
  rescue => e
    Rails.logger.error("Error al notificar solicitud de reprogramación: #{e.message}")
  end
  
  # Procesar reembolso de reprogramación
  def self.procesar_reembolso_reprogramacion(reprogramacion)
    return unless reprogramacion.debe_reembolsar?
    
    pago = reprogramacion.cita_original.pago_inicial
    return unless pago&.completado?
    
    PaymentService.crear_reembolso(
      reprogramacion.cita_original,
      "Reprogramación por #{reprogramacion.motivo_humanizado}",
      procesado_por: reprogramacion.aprobado_por&.id
    )
    
    reprogramacion.update!(reembolso_procesado: true)
  rescue => e
    Rails.logger.error("Error al procesar reembolso de reprogramación: #{e.message}")
  end
end
