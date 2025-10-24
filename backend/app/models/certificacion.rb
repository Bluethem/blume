# == Schema Information
#
# Table name: certificaciones
#
#  id                  :uuid             not null, primary key
#  nombre              :string           not null
#  institucion_emisora :string
#  descripcion         :text
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#

class Certificacion < ApplicationRecord
  self.table_name = 'certificaciones'
  # Asociaciones
  has_many :medico_certificaciones, dependent: :destroy
  has_many :medicos, through: :medico_certificaciones

  # Validaciones
  validates :nombre, presence: true, length: { minimum: 3, maximum: 255 }
  validates :institucion_emisora, length: { maximum: 255 }, allow_blank: true

  # Scopes
  scope :por_nombre, ->(nombre) { where('nombre ILIKE ?', "%#{nombre}%") }
  scope :por_institucion, ->(institucion) { where('institucion_emisora ILIKE ?', "%#{institucion}%") }

  # Métodos de instancia
  def total_medicos
    medicos.count
  end

  def medicos_activos
    medicos.activos
  end
end