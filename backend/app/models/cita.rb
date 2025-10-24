# == Schema Information
#
# Table name: citas
#
#  id                  :uuid             not null, primary key
#  paciente_id         :uuid             not null
#  medico_id           :uuid             not null
#  fecha_hora_inicio   :datetime         not null
#  fecha_hora_fin      :datetime         not null
#  estado              :integer          default("pendiente"), not null
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
  # Enumeraciones
  enum :estado, { pendiente: 0, confirmada: 1, cancelada: 2, completada: 3, no_asistio: 4 }

  # Asociaciones
  belongs_to :paciente
  belongs_to :medico
  belongs_to :cancelada_por, class_name: 'Usuario', optional: true
  has_many :notificaciones, dependent: :destroy

  # Validaciones
  validates :paciente_id, presence: true
  validates :medico_id, presence: true
  validates :fecha_hora_inicio, presence: true
  validates :fecha_hora_fin, presence: true
  validates :estado, presence: true
  validates :costo, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :fecha_fin_posterior_a_inicio
  validate :fecha_no_pasada, on: :create, if: -> { pendiente? || confirmada? }
  # validate :horario_dentro_disponibilidad
  validate :sin_superposicion_medico
  validate :motivo_cancelacion_presente_si_cancelada

  # Callbacks
  before_validation :calcular_fecha_fin, if: :fecha_hora_inicio_changed?
  before_validation :asignar_costo, if: :new_record?
  after_create :enviar_notificacion_creacion
  after_update :enviar_notificacion_cambio_estado, if: :saved_change_to_estado?

  # Delegaciones
  delegate :nombre_completo, to: :paciente, prefix: true
  delegate :nombre_profesional, to: :medico, prefix: true

  # Scopes
  scope :proximas, -> { where('fecha_hora_inicio > ?', Time.current).order(:fecha_hora_inicio) }
  scope :pasadas, -> { where('fecha_hora_inicio <= ?', Time.current).order(fecha_hora_inicio: :desc) }
  scope :del_dia, ->(fecha) { where(fecha_hora_inicio: fecha.beginning_of_day..fecha.end_of_day) }
  scope :del_mes, ->(fecha) { where(fecha_hora_inicio: fecha.beginning_of_month..fecha.end_of_month) }
  scope :por_paciente, ->(paciente_id) { where(paciente_id: paciente_id) }
  scope :por_medico, ->(medico_id) { where(medico_id: medico_id) }

  # Métodos de instancia
  def duracion_minutos
    return 0 unless fecha_hora_inicio && fecha_hora_fin
    ((fecha_hora_fin - fecha_hora_inicio) / 60).to_i
  end

  def puede_cancelarse?
    (pendiente? || confirmada?) && fecha_hora_inicio > Time.current
  end

  def puede_confirmarse?
    pendiente? && fecha_hora_inicio > Time.current
  end

  def puede_completarse?
    confirmada? && fecha_hora_inicio < Time.current
  end

  def confirmar!(usuario = nil)
    return false unless puede_confirmarse?
    update(estado: :confirmada)
  end

  def cancelar!(usuario, motivo)
    return false unless puede_cancelarse?
    update(
      estado: :cancelada,
      motivo_cancelacion: motivo,
      cancelada_por: usuario
    )
  end

  def completar!(diagnostico = nil, observaciones = nil)
    return false unless puede_completarse?
    
    attrs = { estado: :completada }
    attrs[:diagnostico] = diagnostico if diagnostico.present?
    attrs[:observaciones] = observaciones if observaciones.present?
    
    update(attrs)
  end

  def marcar_no_asistio!
    return false unless confirmada? && fecha_hora_inicio < Time.current
    update(estado: :no_asistio)
  end

  def esta_en_curso?
    confirmada? && fecha_hora_inicio <= Time.current && fecha_hora_fin >= Time.current
  end

  def tiempo_restante
    return nil if fecha_hora_inicio < Time.current
    ((fecha_hora_inicio - Time.current) / 3600).round(1) # Horas
  end

  private

  def calcular_fecha_fin
    if fecha_hora_inicio.present?
      horario = medico.horario_medicos.find_by(dia_semana: fecha_hora_inicio.wday)
      duracion = horario&.duracion_cita_minutos || 30
      self.fecha_hora_fin = fecha_hora_inicio + duracion.minutes
    end
  end

  def asignar_costo
    self.costo ||= medico.costo_consulta if medico
  end

  def fecha_fin_posterior_a_inicio
    if fecha_hora_inicio.present? && fecha_hora_fin.present?
      if fecha_hora_fin <= fecha_hora_inicio
        errors.add(:fecha_hora_fin, 'debe ser posterior a la fecha de inicio')
      end
    end
  end

  def fecha_no_pasada
    if fecha_hora_inicio.present? && fecha_hora_inicio < Time.current
      errors.add(:fecha_hora_inicio, 'no puede ser una fecha pasada')
    end
  end

  def horario_dentro_disponibilidad
    return unless medico && fecha_hora_inicio

    unless medico.disponible_en_horario?(fecha_hora_inicio, duracion_minutos)
      errors.add(:fecha_hora_inicio, 'no está dentro del horario de atención del médico')
    end
  end

  def sin_superposicion_medico
    return unless medico_id && fecha_hora_inicio && fecha_hora_fin
    return if cancelada? # No validar si la cita está cancelada

    citas_superpuestas = Cita
      .where(medico_id: medico_id)
      .where(estado: [:pendiente, :confirmada])
      .where.not(id: id)
      .where('fecha_hora_inicio < ? AND fecha_hora_fin > ?', fecha_hora_fin, fecha_hora_inicio)

    if citas_superpuestas.exists?
      errors.add(:base, 'El médico ya tiene una cita en ese horario')
    end
  end

  def motivo_cancelacion_presente_si_cancelada
    if cancelada? && motivo_cancelacion.blank?
      errors.add(:motivo_cancelacion, 'debe estar presente cuando la cita está cancelada')
    end
  end

  def enviar_notificacion_creacion
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
  end

  def enviar_notificacion_cambio_estado
    case estado.to_sym
    when :confirmada
      Notificacion.create!(
        usuario: paciente.usuario,
        cita: self,
        tipo: :cita_confirmada,
        titulo: 'Cita confirmada',
        mensaje: "Tu cita con #{medico_nombre_profesional} ha sido confirmada"
      )
    when :cancelada
      Notificacion.create!(
        usuario: paciente.usuario,
        cita: self,
        tipo: :cita_cancelada,
        titulo: 'Cita cancelada',
        mensaje: "Tu cita con #{medico_nombre_profesional} ha sido cancelada. Motivo: #{motivo_cancelacion}"
      )
    end
  end
end