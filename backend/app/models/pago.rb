# app/models/pago.rb
class Pago < ApplicationRecord
  # === Relaciones ===
  belongs_to :cita
  belongs_to :paciente
  
  has_one :medico, through: :cita
  
  # === Enums ===
  enum :tipo_pago, {
    pago_consulta: 0,      # Pago inicial de la consulta
    pago_adicional: 1,     # Pago extra durante la consulta
    reembolso: 2           # Reembolso por cancelación
  }
  
  enum :estado, {
    pendiente: 0,
    procesando: 1,
    completado: 2,
    fallido: 3,
    reembolsado: 4,
    cancelado: 5
  }
  
  enum :metodo_pago, {
    efectivo: 0,
    tarjeta: 1,
    transferencia: 2,
    yape: 3,
    plin: 4,
    otro: 5
  }
  
  # === Validaciones ===
  validates :monto, presence: true, numericality: { greater_than: 0 }
  validates :tipo_pago, presence: true
  validates :estado, presence: true
  validates :metodo_pago, presence: true
  validates :concepto, presence: true
  validates :transaction_id, uniqueness: true, allow_blank: true
  
  # Validar que no haya múltiples pagos de consulta para la misma cita
  validate :unico_pago_consulta_por_cita, if: :pago_consulta?
  
  # === Scopes ===
  scope :completados, -> { where(estado: :completado) }
  scope :pendientes, -> { where(estado: :pendiente) }
  scope :por_fecha, ->(fecha_inicio, fecha_fin) { where(fecha_pago: fecha_inicio..fecha_fin) }
  scope :del_mes_actual, -> { where('EXTRACT(MONTH FROM fecha_pago) = ? AND EXTRACT(YEAR FROM fecha_pago) = ?', Date.current.month, Date.current.year) }
  
  # === Callbacks ===
  before_create :generar_transaction_id, unless: :transaction_id?
  after_update :actualizar_estado_cita, if: :saved_change_to_estado?
  
  # === Métodos de instancia ===
  
  # Verifica si el pago está completado
  def completado?
    estado == 'completado'
  end
  
  # Verifica si el pago está pendiente
  def pendiente?
    estado == 'pendiente'
  end
  
  # Verifica si el pago falló
  def fallido?
    estado == 'fallido'
  end
  
  # Marca el pago como completado
  def completar!(transaction_id = nil)
    update!(
      estado: :completado,
      fecha_pago: Time.current,
      transaction_id: transaction_id || self.transaction_id
    )
  end
  
  # Marca el pago como fallido
  def fallar!(razon = nil)
    update!(
      estado: :fallido,
      metadata: metadata.merge(razon_fallo: razon, fecha_fallo: Time.current)
    )
  end
  
  # Procesa el reembolso
  def procesar_reembolso!
    return false unless puede_reembolsar?
    
    update!(
      estado: :reembolsado,
      fecha_reembolso: Time.current
    )
  end
  
  # Verifica si puede ser reembolsado
  def puede_reembolsar?
    completado? && !reembolsado? && tipo_pago != 'reembolso'
  end
  
  # Información del pago para mostrar
  def info_completa
    {
      id: id,
      monto: monto.to_f,
      tipo: tipo_pago,
      estado: estado,
      metodo: metodo_pago,
      concepto: concepto,
      fecha: fecha_pago&.iso8601,
      transaction_id: transaction_id,
      cita: {
        id: cita.id,
        fecha: cita.fecha_hora_inicio.iso8601,
        medico: cita.medico.nombre_profesional
      }
    }
  end
  
  private
  
  # Genera un ID de transacción único
  def generar_transaction_id
    self.transaction_id = "PAY-#{SecureRandom.hex(8).upcase}"
  end
  
  # Valida que solo haya un pago de consulta por cita
  def unico_pago_consulta_por_cita
    if Pago.where(cita_id: cita_id, tipo_pago: :pago_consulta)
           .where.not(id: id)
           .exists?
      errors.add(:base, 'Ya existe un pago de consulta para esta cita')
    end
  end
  
  # Actualiza el estado de la cita según el estado del pago
  def actualizar_estado_cita
    case estado
    when 'completado'
      if pago_consulta?
        cita.update(pagado: true)
      end
    when 'reembolsado'
      # Lógica adicional si es necesario
    end
  end
end
