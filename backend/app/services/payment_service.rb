# app/services/payment_service.rb
class PaymentService
  class PaymentError < StandardError; end
  
  # Crear pago inicial para una consulta
  def self.crear_pago_inicial(cita, metodo_pago, user_id = nil)
    # Validar que la cita no tenga ya un pago
    if cita.pago_inicial.present?
      raise PaymentError, 'Esta cita ya tiene un pago registrado'
    end
    
    # Crear el registro de pago
    pago = Pago.create!(
      cita: cita,
      paciente: cita.paciente,
      tipo_pago: :pago_consulta,
      estado: :pendiente,
      metodo_pago: metodo_pago,
      monto: cita.costo,
      concepto: "Consulta con #{cita.medico.nombre_profesional}",
      descripcion: "Pago de consulta médica - #{cita.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M')}",
      metadata: {
        created_by: user_id,
        created_at: Time.current,
        medico_id: cita.medico_id,
        especialidad: cita.medico.especialidad_principal&.nombre
      }
    )
    
    # Procesar según el método de pago
    case metodo_pago.to_sym
    when :efectivo
      # El efectivo se confirma manualmente
      pago
    when :tarjeta, :yape, :plin, :transferencia
      # Aquí iría la integración con pasarela de pagos
      # Por ahora lo dejamos pendiente
      pago
    else
      pago
    end
  end
  
  # Confirmar un pago manualmente (para efectivo o admin)
  def self.confirmar_pago(pago_id, confirmado_por: nil)
    pago = Pago.find(pago_id)
    
    if pago.completado?
      raise PaymentError, 'Este pago ya está confirmado'
    end
    
    pago.completar!(pago.transaction_id)
    
    # Actualizar metada con info del confirmador
    pago.update!(
      metadata: pago.metadata.merge(
        confirmado_por: confirmado_por,
        confirmado_en: Time.current
      )
    )
    
    # Enviar notificación
    enviar_notificacion_pago_confirmado(pago)
    
    pago
  end
  
  # Procesar pago (simula procesamiento con pasarela)
  def self.procesar_pago(pago_id)
    pago = Pago.find(pago_id)
    
    if pago.completado?
      raise PaymentError, 'Este pago ya fue procesado'
    end
    
    # Actualizar a procesando
    pago.update!(estado: :procesando)
    
    begin
      # Aquí iría la lógica de integración con pasarela
      # Por ejemplo: Stripe, PayPal, Mercado Pago, etc.
      
      # Por ahora simulamos un pago exitoso
      resultado = simular_procesamiento_pago(pago)
      
      if resultado[:exitoso]
        pago.completar!(resultado[:transaction_id])
        enviar_notificacion_pago_confirmado(pago)
        { exitoso: true, pago: pago }
      else
        pago.fallar!(resultado[:error])
        enviar_notificacion_pago_fallido(pago, resultado[:error])
        { exitoso: false, error: resultado[:error] }
      end
    rescue => e
      pago.fallar!(e.message)
      { exitoso: false, error: e.message }
    end
  end
  
  # Crear pago adicional durante la consulta
  def self.crear_pago_adicional(cita, monto, concepto, metodo_pago, creado_por: nil)
    unless cita.completada? || cita.confirmada?
      raise PaymentError, 'Solo se pueden agregar pagos adicionales a citas confirmadas o completadas'
    end
    
    pago = Pago.create!(
      cita: cita,
      paciente: cita.paciente,
      tipo_pago: :pago_adicional,
      estado: :pendiente,
      metodo_pago: metodo_pago,
      monto: monto,
      concepto: concepto,
      descripcion: "Pago adicional - #{concepto}",
      metadata: {
        created_by: creado_por,
        created_at: Time.current
      }
    )
    
    # Actualizar la cita
    cita.update!(
      requiere_pago_adicional: true,
      monto_adicional: cita.monto_adicional.to_f + monto
    )
    
    pago
  end
  
  # Crear reembolso
  def self.crear_reembolso(cita, motivo, procesado_por: nil)
    pago_original = cita.pago_inicial
    
    unless pago_original&.completado?
      raise PaymentError, 'No hay un pago completado para reembolsar'
    end
    
    # Verificar que no exista ya un reembolso
    if Pago.exists?(cita_id: cita.id, tipo_pago: :reembolso)
      raise PaymentError, 'Ya existe un reembolso para esta cita'
    end
    
    reembolso = Pago.create!(
      cita: cita,
      paciente: cita.paciente,
      tipo_pago: :reembolso,
      estado: :procesando,
      metodo_pago: pago_original.metodo_pago,
      monto: -pago_original.monto.abs, # Negativo para indicar reembolso
      concepto: "Reembolso de consulta",
      descripcion: "Reembolso: #{motivo}",
      metadata: {
        pago_original_id: pago_original.id,
        motivo: motivo,
        procesado_por: procesado_por,
        procesado_en: Time.current
      }
    )
    
    # Procesar el reembolso
    procesar_reembolso(reembolso, pago_original)
  end
  
  # Procesar reembolso
  def self.procesar_reembolso(reembolso, pago_original)
    begin
      # Aquí iría la lógica de reembolso con la pasarela
      # Por ahora lo marcamos como completado
      
      reembolso.update!(
        estado: :completado,
        fecha_pago: Time.current
      )
      
      # Marcar el pago original como reembolsado
      pago_original.procesar_reembolso!
      
      # Actualizar la cita
      reembolso.cita.update!(pagado: false)
      
      # Notificar
      enviar_notificacion_reembolso_procesado(reembolso)
      
      { exitoso: true, reembolso: reembolso }
    rescue => e
      reembolso.update!(estado: :fallido)
      { exitoso: false, error: e.message }
    end
  end
  
  # Obtener historial de pagos de un paciente
  def self.historial_pagos_paciente(paciente_id, params = {})
    pagos = Pago.where(paciente_id: paciente_id)
                .includes(cita: [:medico])
                .order(created_at: :desc)
    
    # Filtros opcionales
    pagos = pagos.where(estado: params[:estado]) if params[:estado].present?
    pagos = pagos.where(tipo_pago: params[:tipo]) if params[:tipo].present?
    
    if params[:fecha_desde].present? && params[:fecha_hasta].present?
      pagos = pagos.por_fecha(params[:fecha_desde], params[:fecha_hasta])
    end
    
    pagos
  end
  
  # Calcular estadísticas de pagos
  def self.estadisticas_pagos(paciente_id)
    pagos = Pago.where(paciente_id: paciente_id)
    
    {
      total_pagado: pagos.completados.sum(:monto).to_f,
      total_pendiente: pagos.pendientes.sum(:monto).to_f,
      cantidad_pagos: pagos.count,
      ultimo_pago: pagos.completados.order(fecha_pago: :desc).first&.fecha_pago,
      metodos_usados: pagos.completados.group(:metodo_pago).count
    }
  end
  
  private
  
  # Simular procesamiento de pago (reemplazar con integración real)
  def self.simular_procesamiento_pago(pago)
    # Simular 90% de éxito
    if rand(100) < 90
      {
        exitoso: true,
        transaction_id: "TXN-#{SecureRandom.hex(8).upcase}"
      }
    else
      {
        exitoso: false,
        error: 'Fondos insuficientes o tarjeta rechazada'
      }
    end
  end
  
  # Enviar notificación de pago confirmado
  def self.enviar_notificacion_pago_confirmado(pago)
    Notificacion.create!(
      usuario: pago.paciente.usuario,
      cita: pago.cita,
      tipo: :pago_confirmado,
      titulo: 'Pago confirmado',
      mensaje: "Tu pago de S/ #{pago.monto} ha sido confirmado exitosamente"
    )
  rescue => e
    Rails.logger.error("Error al enviar notificación de pago: #{e.message}")
  end
  
  # Enviar notificación de pago fallido
  def self.enviar_notificacion_pago_fallido(pago, error)
    Notificacion.create!(
      usuario: pago.paciente.usuario,
      cita: pago.cita,
      tipo: :pago_fallido,
      titulo: 'Pago rechazado',
      mensaje: "Tu pago de S/ #{pago.monto} fue rechazado. Motivo: #{error}"
    )
  rescue => e
    Rails.logger.error("Error al enviar notificación de pago fallido: #{e.message}")
  end
  
  # Enviar notificación de reembolso
  def self.enviar_notificacion_reembolso_procesado(reembolso)
    Notificacion.create!(
      usuario: reembolso.paciente.usuario,
      cita: reembolso.cita,
      tipo: :reembolso_procesado,
      titulo: 'Reembolso procesado',
      mensaje: "Se ha procesado tu reembolso de S/ #{reembolso.monto.abs}"
    )
  rescue => e
    Rails.logger.error("Error al enviar notificación de reembolso: #{e.message}")
  end
end
