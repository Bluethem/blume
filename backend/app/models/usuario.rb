class Usuario < ApplicationRecord
  self.table_name = 'usuarios'
  
  # Encriptación de contraseña
  has_secure_password

  # Enumeraciones
  enum :rol, { paciente: 0, medico: 1, administrador: 2 }

  # Asociaciones
  has_one :paciente, dependent: :destroy
  has_one :medico, dependent: :destroy
  has_many :notificaciones, dependent: :destroy
  has_many :citas_canceladas, class_name: 'Cita', foreign_key: 'cancelada_por_id'

  # Validaciones
  validates :email, presence: true, 
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :nombre, presence: true, length: { minimum: 2, maximum: 100 }
  validates :apellido, presence: true, length: { minimum: 2, maximum: 100 }
  validates :telefono, length: { maximum: 20 }, allow_blank: true
  validates :rol, presence: true
  validates :password, length: { minimum: 6, message: "debe tener al menos 6 caracteres" }, 
            if: -> { new_record? || password.present? }

  # Callbacks
  before_save :normalize_email

  # Scopes
  scope :activos, -> { where(activo: true) }
  scope :inactivos, -> { where(activo: false) }

  # Métodos de instancia
  def nombre_completo
    "#{nombre} #{apellido}"
  end

  def es_paciente?
    rol == 'paciente'
  end

  def es_medico?
    rol == 'medico'
  end

  def es_administrador?
    rol == 'administrador'
  end
  
  # Alias para consistencia con el código existente
  alias paciente? es_paciente?
  alias medico? es_medico?
  alias administrador? es_administrador?

  def activar!
    update(activo: true)
  end

  def desactivar!
    update(activo: false)
  end

  # Generar token de reset de contraseña
  def generate_password_reset_token
    self.reset_password_token = SecureRandom.urlsafe_base64(32)
    self.reset_password_sent_at = Time.current
    save(validate: false)
  end
  
  # Verificar si el token expiró (válido por 2 horas)
  def password_reset_token_expired?
    return true if reset_password_sent_at.nil?
    reset_password_sent_at < 2.hours.ago
  end
  
  # Limpiar token de reset
  def clear_password_reset_token
    self.reset_password_token = nil
    self.reset_password_sent_at = nil
    save(validate: false)
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end