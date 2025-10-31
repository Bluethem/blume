# app/models/usuario.rb
# == Schema Information
#
# Table name: usuarios
#
#  id                      :uuid             not null, primary key
#  email                   :string           not null, unique
#  password_digest         :string           not null
#  nombre                  :string           not null
#  apellido                :string           not null
#  telefono                :string
#  direccion               :text
#  rol                     :integer          default(0), not null
#  activo                  :boolean          default(TRUE), not null
#  reset_password_token    :string
#  reset_password_sent_at  :datetime
#  foto_url                :string
#  es_super_admin          :boolean          default(FALSE), not null
#  ultimo_acceso           :datetime
#  creado_por_id           :uuid
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#

class Usuario < ApplicationRecord
  self.table_name = 'usuarios'
  
  # Encriptación de contraseña
  has_secure_password

  # ✅ ENUM para roles (esto ya genera automáticamente los métodos es_paciente?, es_medico?, es_administrador?)
  enum :rol, {
    paciente: 0,
    medico: 1,
    administrador: 2  
  }, prefix: :es

  # Asociaciones
  has_one :paciente, dependent: :destroy
  has_one :medico, dependent: :destroy
  has_many :notificaciones, dependent: :destroy
  has_many :citas_canceladas, class_name: 'Cita', foreign_key: 'cancelada_por_id'
  
  # Asociaciones de auditoría
  belongs_to :creado_por, class_name: 'Usuario', optional: true
  has_many :usuarios_creados, class_name: 'Usuario', foreign_key: 'creado_por_id', dependent: :nullify

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
  scope :por_rol, ->(rol) { where(rol: rol) }
  scope :super_admins, -> { where(es_super_admin: true) }
  scope :admins_regulares, -> { where(rol: :administrador, es_super_admin: false) }

  # Métodos de instancia
  def nombre_completo
    "#{nombre} #{apellido}"
  end
  
  def foto_perfil_url(host: nil)
    if foto_url.present?
      # Si la URL ya es completa (comienza con http), devolverla tal cual
      if foto_url.start_with?('http://', 'https://')
        foto_url
      else
        # Si hay un host, construir URL completa
        host ? "#{host}#{foto_url}" : foto_url
      end
    else
      # URL de avatar generado por defecto
      "https://ui-avatars.com/api/?name=#{nombre_completo.gsub(' ', '+')}&size=200&background=B71C1C&color=fff"
    end
  end
  
  def paciente?
    es_paciente?
  end

  def medico?
    es_medico?
  end

  def administrador?
    es_administrador?
  end

  def activar!
    update(activo: true)
  end

  def desactivar!
    update(activo: false)
  end
  
  def super_admin?
    es_super_admin == true
  end
  
  def admin?
    es_administrador?
  end
  
  def puede_gestionar_admins?
    super_admin?
  end
  
  def registrar_acceso!
    update_column(:ultimo_acceso, Time.current)
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