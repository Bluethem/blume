# app/models/reprogramacion.rb
class Reprogramacion < ApplicationRecord
  self.table_name = 'reprogramaciones'
  
  # === Relaciones ===
  belongs_to :cita_original, class_name: 'Cita'
  belongs_to :cita_nueva, class_name: 'Cita', optional: true
  belongs_to :solicitado_por, class_name: 'Usuario'
  belongs_to :aprobado_por, class_name: 'Usuario', optional: true
  
  has_one :paciente, through: :cita_original
  has_one :medico, through: :cita_original
  
  # === Enums ===
  enum :motivo, {
    paciente_no_asistio: 0,      # El paciente no llegó
    medico_no_asistio: 1,         # El médico no pudo atender
    emergencia_medica: 2,         # Emergencia del médico
    solicitud_paciente: 3,        # Paciente solicita cambio
    error_programacion: 4         # Error en la agenda
  }
  
  enum :estado, {
    pendiente: 0,                 # Esperando aprobación
    aprobada: 1,                  # Aprobada y reprogramada
    rechazada: 2,                 # Rechazada
    completada: 3,                # Cita nueva completada
    cancelada: 4                  # Cancelada la reprogramación
  }
  
  # === Validaciones ===
  validates :motivo, presence: true
  validates :estado, presence: true
  validates :descripcion, presence: true
  validates :cita_original_id, presence: true, uniqueness: { 
    scope: :estado, 
    conditions: -> { where.not(estado: [:rechazada, :cancelada]) },
    message: 'ya tiene una reprogramación activa'
  }
  
  validate :cita_original_permite_reprogramacion
  validate :al_menos_una_fecha_propuesta, on: :create
  validate :fecha_aprobacion_presente_si_aprobada
  validate :motivo_rechazo_presente_si_rechazada
  
  # === Scopes ===
  scope :pendientes, -> { where(estado: :pendiente) }
  scope :aprobadas, -> { where(estado: :aprobada) }
  scope :del_mes, ->(fecha) { where(created_at: fecha.beginning_of_month..fecha.end_of_month) }
  scope :por_motivo, ->(motivo) { where(motivo: motivo) }
  scope :recientes, -> { order(created_at: :desc) }
  
  # === Callbacks ===
  before_create :verificar_limite_reprogramaciones
  after_update :notificar_cambio_estado, if: :saved_change_to_estado?
  after_update :procesar_reembolso_si_necesario, if: -> { saved_change_to_estado? && rechazada? }
  
  # === Métodos de instancia ===
  
  # Aprobar la reprogramación
  def aprobar!(usuario, fecha_seleccionada, cita_nueva = nil)
    return false unless pendiente?
    
    transaction do
      # Actualizar estado
      update!(
        estado: :aprobada,
        aprobado_por: usuario,
        fecha_aprobacion: Time.current,
        fecha_seleccionada: fecha_seleccionada,
        cita_nueva: cita_nueva
      )
      
      # Marcar cita original como reprogramada
      cita_original.update!(
        estado: :cancelada,
        motivo_cancelacion: "Reprogramada: #{motivo_humanizado}",
        cancelada_por: usuario
      )
      
      # Incrementar contador
      cita_original.increment!(:reprogramaciones_count)
      
      true
    end
  end
  
  # Rechazar la reprogramación
  def rechazar!(usuario, motivo_rechazo)
    return false unless pendiente?
    
    update!(
      estado: :rechazada,
      aprobado_por: usuario,
      fecha_rechazo: Time.current,
      motivo_rechazo: motivo_rechazo
    )
  end
  
  # Cancelar la reprogramación
  def cancelar!(usuario, motivo = nil)
    return false if completada?
    
    update!(
      estado: :cancelada,
      metadata: metadata.merge(
        cancelado_por: usuario.id,
        cancelado_en: Time.current,
        motivo_cancelacion: motivo
      )
    )
  end
  
  # Verificar si requiere reembolso
  def debe_reembolsar?
    medico_no_asistio? || emergencia_medica?
  end
  
  # Procesar el reembolso
  def procesar_reembolso!
    return false unless debe_reembolsar?
    return false if reembolso_procesado?
    
    pago = cita_original.pago_inicial
    return false unless pago&.completado?
    
    # Crear reembolso
    PaymentService.crear_reembolso(
      cita_original,
      "Reprogramación por #{motivo_humanizado}",
      procesado_por: aprobado_por&.id
    )
    
    update!(reembolso_procesado: true)
  rescue => e
    Rails.logger.error("Error al procesar reembolso: #{e.message}")
    false
  end
  
  # Obtener fechas propuestas
  def fechas_propuestas
    [fecha_propuesta_1, fecha_propuesta_2, fecha_propuesta_3].compact
  end
  
  # Verificar si tiene fechas propuestas
  def tiene_fechas_propuestas?
    fechas_propuestas.any?
  end
  
  # Información completa
  def info_completa
    {
      id: id,
      motivo: motivo,
      motivo_label: motivo_humanizado,
      estado: estado,
      estado_label: estado_humanizado,
      descripcion: descripcion,
      justificacion: justificacion,
      fechas_propuestas: fechas_propuestas.map(&:iso8601),
      fecha_seleccionada: fecha_seleccionada&.iso8601,
      requiere_reembolso: requiere_reembolso,
      reembolso_procesado: reembolso_procesado,
      cita_original: {
        id: cita_original.id,
        fecha: cita_original.fecha_hora_inicio.iso8601,
        medico: cita_original.medico.nombre_profesional,
        paciente: cita_original.paciente.nombre_completo
      },
      cita_nueva: cita_nueva ? {
        id: cita_nueva.id,
        fecha: cita_nueva.fecha_hora_inicio.iso8601
      } : nil,
      solicitado_por: {
        id: solicitado_por.id,
        nombre: solicitado_por.nombre_completo,
        rol: solicitado_por.rol
      },
      created_at: created_at.iso8601
    }
  end
  
  # Motivo en texto humanizado
  def motivo_humanizado
    I18n.t("activerecord.attributes.reprogramacion.motivos.#{motivo}", default: motivo.humanize)
  end
  
  # Estado en texto humanizado
  def estado_humanizado
    I18n.t("activerecord.attributes.reprogramacion.estados.#{estado}", default: estado.humanize)
  end
  
  private
  
  # Validar que la cita original permite reprogramación
  def cita_original_permite_reprogramacion
    return unless cita_original
    
    unless cita_original.permite_reprogramacion
      errors.add(:base, 'La cita original no permite reprogramación')
    end
    
    # Verificar que esté pagada si es por falta del médico
    if medico_no_asistio? || emergencia_medica?
      unless cita_original.pagado?
        errors.add(:base, 'La cita debe estar pagada para reprogramar por falta del médico')
      end
    end
  end
  
  # Validar que haya al menos una fecha propuesta
  def al_menos_una_fecha_propuesta
    unless tiene_fechas_propuestas?
      errors.add(:base, 'Debe proponer al menos una fecha para la reprogramación')
    end
  end
  
  # Validar fecha de aprobación si está aprobada
  def fecha_aprobacion_presente_si_aprobada
    if aprobada? && fecha_aprobacion.blank?
      errors.add(:fecha_aprobacion, 'debe estar presente cuando está aprobada')
    end
  end
  
  # Validar motivo de rechazo si está rechazada
  def motivo_rechazo_presente_si_rechazada
    if rechazada? && motivo_rechazo.blank?
      errors.add(:motivo_rechazo, 'debe estar presente cuando está rechazada')
    end
  end
  
  # Verificar límite de reprogramaciones
  def verificar_limite_reprogramaciones
    limite = 3 # Máximo 3 reprogramaciones por cita
    
    if cita_original.reprogramaciones_count >= limite
      errors.add(:base, "Se ha alcanzado el límite de #{limite} reprogramaciones para esta cita")
      throw :abort
    end
  end
  
  # Notificar cambio de estado
  def notificar_cambio_estado
    case estado.to_sym
    when :aprobada
      notificar_aprobacion
    when :rechazada
      notificar_rechazo
    end
  end
  
  # Notificar aprobación
  def notificar_aprobacion
    # Notificar al paciente
    Notificacion.create!(
      usuario: cita_original.paciente.usuario,
      cita: cita_nueva || cita_original,
      tipo: :reprogramacion_aprobada,
      titulo: 'Reprogramación Aprobada',
      mensaje: "Tu cita ha sido reprogramada para el #{fecha_seleccionada.strftime('%d/%m/%Y a las %H:%M')}"
    )
    
    # Notificar al médico
    Notificacion.create!(
      usuario: cita_original.medico.usuario,
      cita: cita_nueva || cita_original,
      tipo: :reprogramacion_aprobada,
      titulo: 'Cita Reprogramada',
      mensaje: "La cita con #{cita_original.paciente.nombre_completo} ha sido reprogramada"
    )
  rescue => e
    Rails.logger.error("Error al notificar aprobación: #{e.message}")
  end
  
  # Notificar rechazo
  def notificar_rechazo
    Notificacion.create!(
      usuario: solicitado_por,
      cita: cita_original,
      tipo: :reprogramacion_rechazada,
      titulo: 'Reprogramación Rechazada',
      mensaje: "Tu solicitud de reprogramación fue rechazada. Motivo: #{motivo_rechazo}"
    )
  rescue => e
    Rails.logger.error("Error al notificar rechazo: #{e.message}")
  end
  
  # Procesar reembolso si es necesario
  def procesar_reembolso_si_necesario
    if requiere_reembolso && debe_reembolsar? && !reembolso_procesado
      procesar_reembolso!
    end
  end
end
