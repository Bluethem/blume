# == Schema Information
#
# Table name: usuarios
#
#  id              :uuid             not null, primary key
#  email           :string           not null
#  password_digest :string           not null
#  nombre          :string           not null
#  apellido        :string           not null
#  telefono        :string
#  direccion       :text
#  rol             :integer          default("paciente"), not null
#  activo          :boolean          default(TRUE), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

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
  validates :password, length: { minimum: 6 }, if: :password_digest_changed?

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

  def activar!
    update(activo: true)
  end

  def desactivar!
    update(activo: false)
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
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
end