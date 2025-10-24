# == Schema Information
#
# Table name: notificaciones
#
#  id          :uuid             not null, primary key
#  usuario_id  :uuid             not null
#  cita_id     :uuid
#  tipo        :integer          not null
#  titulo      :string           not null
#  mensaje     :text             not null
#  leida       :boolean          default(FALSE), not null
#  fecha_leida :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class Notificacion < ApplicationRecord
  self.table_name = 'notificaciones'
  # Enumeraciones
  enum :tipo, { cita_creada: 0, cita_confirmada: 1, cita_cancelada: 2, recordatorio: 3 }

  # Asociaciones
  belongs_to :usuario
  belongs_to :cita, optional: true

  # Validaciones
  validates :usuario_id, presence: true
  validates :tipo, presence: true
  validates :titulo, presence: true, length: { minimum: 3, maximum: 255 }
  validates :mensaje, presence: true, length: { minimum: 10 }

  # Callbacks
  after_update :marcar_fecha_leida, if: :saved_change_to_leida?

  # Scopes
  scope :no_leidas, -> { where(leida: false) }
  scope :leidas, -> { where(leida: true) }
  scope :recientes, -> { order(created_at: :desc) }
  scope :de_hoy, -> { where('created_at >= ?', Time.current.beginning_of_day) }
  scope :de_esta_semana, -> { where('created_at >= ?', Time.current.beginning_of_week) }
  scope :por_tipo, ->(tipo) { where(tipo: tipo) }

  # Métodos de clase
  def self.enviar_recordatorios_citas
    # Este método se puede llamar desde un job diario
    # para enviar recordatorios 24 horas antes
    manana = 1.day.from_now
    
    citas_manana = Cita
      .where(estado: [:pendiente, :confirmada])
      .where(fecha_hora_inicio: manana.beginning_of_day..manana.end_of_day)
    
    citas_manana.each do |cita|
      # Solo crear recordatorio si no existe uno reciente
      unless cita.notificaciones.recordatorio.where('created_at > ?', 2.days.ago).exists?
        Notificacion.create!(
          usuario: cita.paciente.usuario,
          cita: cita,
          tipo: :recordatorio,
          titulo: 'Recordatorio de cita',
          mensaje: "Recuerda tu cita mañana a las #{cita.fecha_hora_inicio.strftime('%H:%M')} con #{cita.medico.nombre_profesional}"
        )
      end
    end
  end

  # Métodos de instancia
  def marcar_como_leida!
    update(leida: true, fecha_leida: Time.current)
  end

  def marcar_como_no_leida!
    update(leida: false, fecha_leida: nil)
  end

  def hace_cuanto
    return 'Justo ahora' if created_at > 1.minute.ago
    
    tiempo = Time.current - created_at
    
    case tiempo
    when 0..59
      'Hace menos de 1 minuto'
    when 60..3599
      minutos = (tiempo / 60).to_i
      "Hace #{minutos} #{minutos == 1 ? 'minuto' : 'minutos'}"
    when 3600..86399
      horas = (tiempo / 3600).to_i
      "Hace #{horas} #{horas == 1 ? 'hora' : 'horas'}"
    else
      dias = (tiempo / 86400).to_i
      "Hace #{dias} #{dias == 1 ? 'día' : 'días'}"
    end
  end

  def icono
    case tipo.to_sym
    when :cita_creada
      'calendar-plus'
    when :cita_confirmada
      'calendar-check'
    when :cita_cancelada
      'calendar-x'
    when :recordatorio
      'bell'
    else
      'info'
    end
  end

  private

  def marcar_fecha_leida
    if leida? && fecha_leida.nil?
      update_column(:fecha_leida, Time.current)
    elsif !leida?
      update_column(:fecha_leida, nil)
    end
  end
end