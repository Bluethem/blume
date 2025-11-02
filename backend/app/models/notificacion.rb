# app/models/notificacion.rb
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
  
  # ✅ ENUM para tipos
  enum :tipo, {
    cita_creada: 0,
    cita_confirmada: 1,
    cita_cancelada: 2,
    recordatorio: 3,
    pago_confirmado: 4,
    pago_fallido: 5,
    reembolso_procesado: 6,
    pago_pendiente: 7,
    reprogramacion_solicitada: 8,
    reprogramacion_aprobada: 9,
    reprogramacion_rechazada: 10,
    cita_no_asistida: 11,
    pago_adicional: 12
  }, prefix: :tipo

  # Asociaciones
  belongs_to :usuario
  belongs_to :cita, optional: true

  # Validaciones
  validates :usuario_id, presence: true
  validates :tipo, presence: true
  validates :titulo, presence: true, length: { minimum: 3, maximum: 255 }
  validates :mensaje, presence: true, length: { minimum: 10 }

  # Callbacks
  # ❌ ELIMINAR - causa loop infinito
  # after_update :marcar_fecha_leida, if: :saved_change_to_leida?

  # Scopes
  scope :no_leidas, -> { where(leida: false) }
  scope :leidas, -> { where(leida: true) }
  scope :recientes, -> { order(created_at: :desc) }
  scope :de_hoy, -> { where('created_at >= ?', Time.current.beginning_of_day) }
  scope :de_esta_semana, -> { where('created_at >= ?', Time.current.beginning_of_week) }
  scope :del_mes_actual, -> { where('created_at >= ?', Time.current.beginning_of_month) }
  scope :por_tipo, ->(tipo) { where(tipo: tipo) }
  scope :por_usuario, ->(usuario_id) { where(usuario_id: usuario_id) }
  scope :con_cita, -> { where.not(cita_id: nil) }
  scope :sin_cita, -> { where(cita_id: nil) }

  # Delegaciones
  delegate :nombre_completo, to: :usuario, prefix: true, allow_nil: true

  # Métodos de clase
  def self.enviar_recordatorios_citas
    # Este método se puede llamar desde un job diario
    # para enviar recordatorios 24 horas antes
    manana = 1.day.from_now
    
    citas_manana = Cita
      .includes(:paciente, :medico)
      .where(estado: [:pendiente, :confirmada])
      .where(fecha_hora_inicio: manana.beginning_of_day..manana.end_of_day)
    
    contador_pacientes = 0
    contador_medicos = 0
    
    citas_manana.each do |cita|
      # Solo crear recordatorio si no existe uno reciente para esta cita
      next if cita.notificaciones.tipo_recordatorio.where('created_at > ?', 2.days.ago).exists?
      
      begin
        # Recordatorio para el PACIENTE
        Notificacion.create!(
          usuario: cita.paciente.usuario,
          cita: cita,
          tipo: :recordatorio,
          titulo: 'Recordatorio de cita',
          mensaje: "Recuerda tu cita mañana a las #{cita.fecha_hora_inicio.strftime('%H:%M')} con #{cita.medico.nombre_profesional}"
        )
        contador_pacientes += 1
        
        # Recordatorio para el MÉDICO
        Notificacion.create!(
          usuario: cita.medico.usuario,
          cita: cita,
          tipo: :recordatorio,
          titulo: 'Recordatorio de cita',
          mensaje: "Mañana tienes cita a las #{cita.fecha_hora_inicio.strftime('%H:%M')} con #{cita.paciente.nombre_completo}"
        )
        contador_medicos += 1
      rescue => e
        Rails.logger.error("Error al crear recordatorios para cita #{cita.id}: #{e.message}")
      end
    end
    
    total = contador_pacientes + contador_medicos
    Rails.logger.info("Se enviaron #{total} recordatorios: #{contador_pacientes} a pacientes, #{contador_medicos} a médicos")
    { total: total, pacientes: contador_pacientes, medicos: contador_medicos }
  end
  
  def self.marcar_todas_como_leidas(usuario_id)
    no_leidas.where(usuario_id: usuario_id).update_all(
      leida: true,
      fecha_leida: Time.current
    )
  end
  
  def self.eliminar_antiguas(dias = 90)
    # Eliminar notificaciones leídas de más de X días
    where(leida: true)
      .where('fecha_leida < ?', dias.days.ago)
      .delete_all
  end
  
  def self.estadisticas_usuario(usuario_id)
    notificaciones = where(usuario_id: usuario_id)
    
    {
      total: notificaciones.count,
      no_leidas: notificaciones.no_leidas.count,
      leidas: notificaciones.leidas.count,
      por_tipo: notificaciones.group(:tipo).count,
      hoy: notificaciones.de_hoy.count,
      esta_semana: notificaciones.de_esta_semana.count
    }
  end

  # ✅ Métodos de instancia
  def marcar_como_leida!
    return true if leida? # Ya está leída
    
    update(leida: true, fecha_leida: Time.current)
  end

  def marcar_como_no_leida!
    return true unless leida? # Ya está no leída
    
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
    when 86400..604799 # Hasta 7 días
      dias = (tiempo / 86400).to_i
      "Hace #{dias} #{dias == 1 ? 'día' : 'días'}"
    else
      created_at.strftime('%d/%m/%Y')
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
  
  def color
    case tipo.to_sym
    when :cita_creada
      'blue'
    when :cita_confirmada
      'green'
    when :cita_cancelada
      'red'
    when :recordatorio
      'yellow'
    else
      'gray'
    end
  end
  
  def url
    return nil unless cita_id
    
    # Esto se puede ajustar según tus rutas del frontend
    case usuario.rol.to_sym
    when :paciente
      "/paciente/citas/#{cita_id}"
    when :medico
      "/medico/citas/#{cita_id}"
    when :administrador
      "/admin/citas/#{cita_id}"
    else
      "/citas/#{cita_id}"
    end
  end
  
  def relacionada_con_cita_proxima?
    return false unless cita
    cita.fecha_hora_inicio > Time.current
  end
end