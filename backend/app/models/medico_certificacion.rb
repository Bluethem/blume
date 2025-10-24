# == Schema Information
#
# Table name: medico_certificaciones
#
#  id                 :uuid             not null, primary key
#  medico_id          :uuid             not null
#  certificacion_id   :uuid             not null
#  fecha_obtencion    :date
#  fecha_expiracion   :date
#  numero_certificado :string
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#

class MedicoCertificacion < ApplicationRecord
  self.table_name = 'medico_certificaciones'
  # Asociaciones
  belongs_to :medico
  belongs_to :certificacion

  # Validaciones
  validates :medico_id, presence: true
  validates :certificacion_id, presence: true
  validates :medico_id, uniqueness: { scope: :certificacion_id, message: 'ya tiene esta certificación' }
  validate :fecha_expiracion_posterior_a_obtencion

  # Scopes
  scope :vigentes, -> { where('fecha_expiracion IS NULL OR fecha_expiracion > ?', Date.today) }
  scope :expiradas, -> { where('fecha_expiracion IS NOT NULL AND fecha_expiracion <= ?', Date.today) }
  scope :ordenadas_por_fecha, -> { order(fecha_obtencion: :desc) }

  # Métodos de instancia
  def vigente?
    fecha_expiracion.nil? || fecha_expiracion > Date.today
  end

  def expirada?
    !vigente?
  end

  def dias_para_vencer
    return nil if fecha_expiracion.nil?
    (fecha_expiracion - Date.today).to_i
  end

  def proxima_a_vencer?(dias = 30)
    return false if fecha_expiracion.nil?
    dias_restantes = dias_para_vencer
    dias_restantes.present? && dias_restantes > 0 && dias_restantes <= dias
  end

  private

  def fecha_expiracion_posterior_a_obtencion
    if fecha_obtencion.present? && fecha_expiracion.present?
      if fecha_expiracion <= fecha_obtencion
        errors.add(:fecha_expiracion, 'debe ser posterior a la fecha de obtención')
      end
    end
  end
end