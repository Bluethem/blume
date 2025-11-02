# app/models/cita.rb
# == Schema Information
#
# Table name: citas
#
#  id                  :uuid             not null, primary key
#  paciente_id         :uuid             not null
#  medico_id           :uuid             not null
#  fecha_hora_inicio   :datetime         not null
#  fecha_hora_fin      :datetime         not null
#  estado              :integer          default(0), not null
#  motivo_consulta     :text
#  observaciones       :text
#  diagnostico         :text
#  motivo_cancelacion  :text
#  cancelada_por_id    :uuid
#  costo               :decimal(10, 2)
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#

class Cita < ApplicationRecord
  self.table_name = 'citas'
  
  # ✅ ENUM para estados
  enum :estado, {
    pendiente: 0,
    confirmada: 1,
    cancelada: 2,
    completada: 3,
    no_asistio: 4
  }, prefix: :estado

  # ✅ ENUM para quien no asistió
  enum :quien_no_asistio, {
    paciente: 0,
    medico: 1
  }, prefix: :falta, allow_nil: true

  # Asociaciones
  belongs_to :paciente
  belongs_to :medico
  belongs_to :cancelada_por, class_name: 'Usuario', optional: true
  has_many :notificaciones, dependent: :destroy
  has_many :pagos, dependent: :destroy
  has_many :reprogramaciones_como_original, class_name: 'Reprogramacion', foreign_key: 'cita_original_id', dependent: :destroy
  has_many :reprogramaciones_como_nueva, class_name: 'Reprogramacion', foreign_key: 'cita_nueva_id', dependent: :nullify

  # Validaciones
  validates :paciente_id, presence: true
  validates :medico_id, presence: true
  validates :fecha_hora_inicio, presence: true
  validates :fecha_hora_fin, presence: true
  validates :estado, presence: true
  validates :costo, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  
  validate :fecha_fin_posterior_a_inicio
  validate :fecha_no_pasada, on: :create, unless: -> { estado_completada? || estado_cancelada? }
  validate :dentro_horario_medico
  validate :sin_superposicion_medico
  validate :motivo_cancelacion_presente_si_cancelada

  # Callbacks
  before_validation :calcular_fecha_fin, if: -> { fecha_hora_inicio_changed? && fecha_hora_fin.blank? }
  before_validation :asignar_costo, if: :new_record?
  after_create :enviar_notificacion_creacion
  after_update :enviar_notificacion_cambio_estado, if: :saved_change_to_estado?

  # Delegaciones
  delegate :nombre_completo, to: :paciente, prefix: true, allow_nil: true
  delegate :nombre_profesional, to: :medico, prefix: true, allow_nil: true
  delegate :usuario, to: :paciente, prefix: true
  delegate :usuario, to: :medico, prefix: true

  # Scopes
  scope :proximas, -> { where('fecha_hora_inicio > ?', Time.current).order(:fecha_hora_inicio) }
  scope :pasadas, -> { where('fecha_hora_inicio <= ?', Time.current).order(fecha_hora_inicio: :desc) }
  scope :del_dia, ->(fecha) { where(fecha_hora_inicio: fecha.beginning_of_day..fecha.end_of_day) }
  scope :del_mes, ->(fecha) { where(fecha_hora_inicio: fecha.beginning_of_month..fecha.end_of_month) }
  scope :por_paciente, ->(paciente_id) { where(paciente_id: paciente_id) }
  scope :por_medico, ->(medico_id) { where(medico_id: medico_id) }
  scope :activas, -> { where(estado: [:pendiente, :confirmada]) }

  # ✅ Métodos de instancia
  def duracion_minutos
    return 0 unless fecha_hora_inicio && fecha_hora_fin
    ((fecha_hora_fin - fecha_hora_inicio) / 60).to_i
  end

  # ✅ Métodos de conveniencia para verificar estados (sin prefijo)
  def pendiente?
    estado_pendiente?
  end

  def confirmada?
    estado_confirmada?
  end

  def cancelada?
    estado_cancelada?
  end

  def completada?
    estado_completada?
  end

  def no_asistio?
    estado_no_asistio?
  end

  # ✅ Métodos de verificación de permisos
  def puede_cancelarse?
    (estado_pendiente? || estado_confirmada?) && fecha_hora_inicio > Time.current
  end

  def puede_confirmarse?
    estado_pendiente? && fecha_hora_inicio > Time.current
  end

  def puede_completarse?
    # Permitir completar citas pendientes o confirmadas
    # Sin validar la fecha (útil para demo/testing)
    estado_pendiente? || estado_confirmada?
  end
  
  def puede_cancelar?(usuario)
    return false unless puede_cancelarse?
    return true if usuario.es_administrador?
    return true if usuario.id == medico.usuario_id
    return true if usuario.id == paciente.usuario_id && fecha_hora_inicio > 24.hours.from_now
    false
  end
  
  def puede_confirmar?(usuario)
    return false unless puede_confirmarse?
    return true if usuario.es_administrador?
    return true if usuario.id == medico.usuario_id
    false
  end
  
  def puede_completar?(usuario)
    return false unless puede_completarse?
    return true if usuario.es_administrador?
    return true if usuario.id == medico.usuario_id
    false
  end

  # ✅ Métodos de cambio de estado
  def confirmar!(usuario = nil)
    return false unless puede_confirmarse?
    update(estado: :confirmada)
  end

  def cancelar!(usuario, motivo)
    return false unless puede_cancelarse?
    return false unless puede_cancelar?(usuario) if usuario
    
    update(
      estado: :cancelada,
      motivo_cancelacion: motivo,
      cancelada_por_id: usuario&.id
    )
  end

  def completar!(usuario = nil, diagnostico: nil, observaciones: nil)
    return false unless puede_completarse?
    return false unless puede_completar?(usuario) if usuario
    
    attrs = { estado: :completada }
    attrs[:diagnostico] = diagnostico if diagnostico.present?
    attrs[:observaciones] = observaciones if observaciones.present?
    
    update(attrs)
  end

  def marcar_no_asistio!(usuario = nil)
    return false unless estado_confirmada? && fecha_hora_inicio < Time.current
    return false unless puede_completar?(usuario) if usuario
    
    update(estado: :no_asistio)
  end

  # ✅ Métodos de estado
  def esta_en_curso?
    estado_confirmada? && fecha_hora_inicio <= Time.current && fecha_hora_fin >= Time.current
  end

  def tiempo_restante
    return nil if fecha_hora_inicio < Time.current
    ((fecha_hora_inicio - Time.current) / 3600).round(1) # Horas
  end
  
  def tiempo_restante_humanizado
    return 'Ya pasó' if fecha_hora_inicio < Time.current
    
    segundos = (fecha_hora_inicio - Time.current).to_i
    dias = segundos / 86400
    horas = (segundos % 86400) / 3600
    minutos = (segundos % 3600) / 60
    
    if dias > 0
      "#{dias} día#{'s' if dias > 1}"
    elsif horas > 0
      "#{horas} hora#{'s' if horas > 1}"
    else
      "#{minutos} minuto#{'s' if minutos > 1}"
    end
  end

  # ✅ Métodos de pago
  def pago_inicial
    pagos.find_by(tipo_pago: :pago_consulta)
  end

  def pagos_adicionales
    pagos.where(tipo_pago: :pago_adicional)
  end

  def monto_total
    costo.to_f + monto_adicional.to_f
  end

  def monto_pagado
    pagos.completados.sum(:monto).to_f
  end

  def saldo_pendiente
    monto_total - monto_pagado
  end

  def pagado_completamente?
    pagado && saldo_pendiente <= 0
  end

  def tiene_pagos_pendientes?
    !pagado || saldo_pendiente > 0
  end

  def puede_agregar_pago_adicional?
    completada? && !requiere_pago_adicional
  end

  def agregar_monto_adicional(monto, concepto)
    return false unless completada?
    
    # Agregar concepto a las observaciones
    concepto_text = "\n[Cargo adicional: S/ #{monto} - #{concepto}]"
    nuevas_observaciones = (observaciones || "") + concepto_text
    
    update(
      requiere_pago_adicional: true,
      monto_adicional: self.monto_adicional.to_f + monto,
      observaciones: nuevas_observaciones
    )
  end

  # ✅ Métodos de reprogramación
  def puede_reprogramarse?
    permite_reprogramacion && 
      reprogramaciones_count < 3 &&
      (estado_confirmada? || estado_pendiente? || estado_no_asistio?)
  end

  def tiene_reprogramacion_pendiente?
    reprogramaciones_como_original.pendientes.exists?
  end

  def reprogramacion_activa
    reprogramaciones_como_original.where(estado: [:pendiente, :aprobada]).first
  end

  def marcar_falta_paciente!(motivo = nil)
    transaction do
      update!(
        estado: :no_asistio,
        quien_no_asistio: :paciente,
        motivo_no_asistencia: motivo || 'Paciente no se presentó a la cita',
        fecha_no_asistencia: Time.current
      )
      
      # Crear notificación
      notificar_falta_paciente
    end
  end

  def marcar_falta_medico!(motivo = nil)
    transaction do
      update!(
        estado: :no_asistio,
        quien_no_asistio: :medico,
        motivo_no_asistencia: motivo || 'Médico no pudo atender la cita',
        fecha_no_asistencia: Time.current
      )
      
      # Crear notificación
      notificar_falta_medico
    end
  end

  def requiere_reprogramacion_automatica?
    estado_no_asistio? && pagado? && !tiene_reprogramacion_pendiente?
  end

  private

  def notificar_falta_paciente
    return if notificado_no_asistencia?
    
    Notificacion.create!(
      usuario: paciente.usuario,
      cita: self,
      tipo: :cita_no_asistida,
      titulo: 'Falta a Cita Registrada',
      mensaje: "No asististe a tu cita del #{fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')}. Si deseas, puedes solicitar una reprogramación."
    )
    
    update_column(:notificado_no_asistencia, true)
  rescue => e
    Rails.logger.error("Error al notificar falta de paciente: #{e.message}")
  end

  def notificar_falta_medico
    return if notificado_no_asistencia?
    
    Notificacion.create!(
      usuario: paciente.usuario,
      cita: self,
      tipo: :cita_cancelada,
      titulo: 'Cita Cancelada por Médico',
      mensaje: "Lamentamos informarte que tu cita del #{fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')} fue cancelada. Se procederá con la reprogramación automáticamente."
    )
    
    update_column(:notificado_no_asistencia, true)
  rescue => e
    Rails.logger.error("Error al notificar falta de médico: #{e.message}")
  end

  def calcular_fecha_fin
    return unless fecha_hora_inicio.present? && medico.present?
    
    horario = medico.horario_medicos.activos.find_by(dia_semana: fecha_hora_inicio.wday)
    duracion = horario&.duracion_cita_minutos || 30
    self.fecha_hora_fin = fecha_hora_inicio + duracion.minutes
  end

  def asignar_costo
    self.costo ||= medico&.costo_consulta
  end

  def fecha_fin_posterior_a_inicio
    return unless fecha_hora_inicio.present? && fecha_hora_fin.present?
    
    if fecha_hora_fin <= fecha_hora_inicio
      errors.add(:fecha_hora_fin, 'debe ser posterior a la fecha de inicio')
    end
  end

  def fecha_no_pasada
    return unless fecha_hora_inicio.present?
    
    if fecha_hora_inicio < Time.current
      errors.add(:fecha_hora_inicio, 'no puede ser una fecha pasada')
    end
  end

  def dentro_horario_medico
    return unless medico_id.present? && fecha_hora_inicio.present?
    return if estado_cancelada? # No validar si está cancelada
    
    dia_semana = fecha_hora_inicio.wday
    hora_cita = fecha_hora_inicio.strftime('%H:%M:%S')
    
    # Buscar TODOS los horarios del médico para este día
    horarios = medico.horario_medicos.activos.where(dia_semana: dia_semana)
    
    unless horarios.any?
      errors.add(:base, 'El médico no atiende este día de la semana')
      return
    end
    
    # Verificar si la cita está dentro de ALGUNO de los horarios
    dentro_de_algun_horario = horarios.any? do |horario|
      hora_inicio_str = horario.hora_inicio.strftime('%H:%M:%S')
      hora_fin_str = horario.hora_fin.strftime('%H:%M:%S')
      hora_cita.between?(hora_inicio_str, hora_fin_str)
    end
    
    unless dentro_de_algun_horario
      errors.add(:base, 'La cita está fuera del horario de atención del médico')
    end
  end

  def sin_superposicion_medico
    return unless medico_id.present? && fecha_hora_inicio.present? && fecha_hora_fin.present?
    return if estado_cancelada? # No validar si la cita está cancelada

    citas_superpuestas = Cita
      .where(medico_id: medico_id)
      .where(estado: [:pendiente, :confirmada])
      .where.not(id: id)
      .where('(fecha_hora_inicio < ? AND fecha_hora_fin > ?) OR ' \
             '(fecha_hora_inicio < ? AND fecha_hora_fin > ?) OR ' \
             '(fecha_hora_inicio >= ? AND fecha_hora_fin <= ?)',
             fecha_hora_fin, fecha_hora_inicio,
             fecha_hora_inicio, fecha_hora_fin,
             fecha_hora_inicio, fecha_hora_fin)

    if citas_superpuestas.exists?
      errors.add(:base, 'El médico ya tiene una cita en ese horario')
    end
  end

  def motivo_cancelacion_presente_si_cancelada
    if estado_cancelada? && motivo_cancelacion.blank?
      errors.add(:motivo_cancelacion, 'debe estar presente cuando la cita está cancelada')
    end
  end

  def enviar_notificacion_creacion
    return unless paciente&.usuario && medico&.usuario
    
    # Notificar al paciente
    Notificacion.create!(
      usuario: paciente.usuario,
      cita: self,
      tipo: :cita_creada,
      titulo: 'Cita creada exitosamente',
      mensaje: "Tu cita con #{medico_nombre_profesional} ha sido creada para el #{fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')}"
    )

    # Notificar al médico
    Notificacion.create!(
      usuario: medico.usuario,
      cita: self,
      tipo: :cita_creada,
      titulo: 'Nueva cita agendada',
      mensaje: "Se ha agendado una cita con #{paciente_nombre_completo} para el #{fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')}"
    )
  rescue => e
    Rails.logger.error("Error al enviar notificación de creación: #{e.message}")
  end

  def enviar_notificacion_cambio_estado
    return unless paciente&.usuario && medico&.usuario
    
    case estado.to_sym
    when :confirmada
      Notificacion.create!(
        usuario: paciente.usuario,
        cita: self,
        tipo: :cita_confirmada,
        titulo: 'Cita confirmada',
        mensaje: "Tu cita con #{medico_nombre_profesional} ha sido confirmada para el #{fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')}"
      )
    when :cancelada
      # Notificar al paciente
      Notificacion.create!(
        usuario: paciente.usuario,
        cita: self,
        tipo: :cita_cancelada,
        titulo: 'Cita cancelada',
        mensaje: "Tu cita con #{medico_nombre_profesional} ha sido cancelada. Motivo: #{motivo_cancelacion}"
      )
      
      # Notificar al médico
      Notificacion.create!(
        usuario: medico.usuario,
        cita: self,
        tipo: :cita_cancelada,
        titulo: 'Cita cancelada',
        mensaje: "La cita con #{paciente_nombre_completo} del #{fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')} ha sido cancelada"
      )
    when :completada
      Notificacion.create!(
        usuario: paciente.usuario,
        cita: self,
        tipo: :cita_creada, # Puedes crear un nuevo tipo si quieres
        titulo: 'Cita completada',
        mensaje: "Tu cita con #{medico_nombre_profesional} ha sido completada exitosamente"
      )
    end
  rescue => e
    Rails.logger.error("Error al enviar notificación de cambio de estado: #{e.message}")
  end
end