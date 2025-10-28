class MedicoEspecialidad < ApplicationRecord
  # Asociaciones
  belongs_to :medico
  belongs_to :especialidad
  
  # Validaciones
  validates :medico_id, presence: true
  validates :especialidad_id, presence: true, uniqueness: { scope: :medico_id }
  validate :solo_una_principal_por_medico, if: :es_principal?
  
  # Scopes
  scope :principales, -> { where(es_principal: true) }
  scope :secundarias, -> { where(es_principal: false) }
  
  private
  
  def solo_una_principal_por_medico
    if MedicoEspecialidad.where(medico_id: medico_id, es_principal: true)
                         .where.not(id: id)
                         .exists?
      errors.add(:es_principal, 'el médico ya tiene una especialidad principal')
    end
  end
end