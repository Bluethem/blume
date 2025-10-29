# == Schema Information
#
# Table name: pacientes
#
#  id                :uuid             not null, primary key
#  usuario_id        :uuid             not null
#  fecha_nacimiento  :date
#  genero            :integer
#  numero_documento  :string
#  tipo_documento    :integer
#  grupo_sanguineo   :string
#  alergias          :text
#  observaciones     :text
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#

class Paciente < ApplicationRecord
  self.table_name = 'pacientes'
  # Enumeraciones
  enum :genero, {
    masculino: 0,
    femenino: 1,
    otro: 2
  }
  
  enum :tipo_documento, {
    dni: 0,
    pasaporte: 1,
    carnet_extranjeria: 2
  }

  # Asociaciones
  belongs_to :usuario
  has_many :citas, dependent: :destroy
  has_many :medicos, through: :citas
  has_many :valoraciones, class_name: 'Valoracion', dependent: :destroy

  # Validaciones
  validates :usuario_id, presence: true, uniqueness: true
  validates :numero_documento, uniqueness: true, allow_blank: true
  validates :fecha_nacimiento, presence: true
  validate :fecha_nacimiento_valida

  # Delegaciones
  delegate :nombre, :apellido, :email, :telefono, :direccion, :nombre_completo, to: :usuario

  # Scopes
  scope :con_alergias, -> { where.not(alergias: [nil, '']) }
  scope :por_genero, ->(genero) { where(genero: genero) }

  # Métodos de instancia
  def edad
    return nil unless fecha_nacimiento.present?
    
    today = Date.today
    age = today.year - fecha_nacimiento.year
    age -= 1 if today < fecha_nacimiento + age.years
    age
  end

  def tiene_alergias?
    alergias.present?
  end

  def historial_citas
    citas.order(fecha_hora_inicio: :desc)
  end

  def proximas_citas
    citas.where('fecha_hora_inicio > ?', Time.current)
         .where(estado: [:pendiente, :confirmada])
         .order(:fecha_hora_inicio)
  end

  def citas_completadas
    citas.where(estado: :completada).order(fecha_hora_inicio: :desc)
  end

  private

  def fecha_nacimiento_valida
    if fecha_nacimiento.present?
      if fecha_nacimiento > Date.today
        errors.add(:fecha_nacimiento, 'no puede ser una fecha futura')
      elsif fecha_nacimiento < 150.years.ago
        errors.add(:fecha_nacimiento, 'no es válida')
      end
    end
  end
end