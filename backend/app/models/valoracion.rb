# frozen_string_literal: true

# == Schema Information
#
# Table name: valoraciones
#
#  id          :uuid             not null, primary key
#  paciente_id :uuid             not null
#  medico_id   :uuid             not null
#  cita_id     :uuid
#  calificacion :integer         not null
#  comentario  :text
#  anonimo     :boolean          default(FALSE), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class Valoracion < ApplicationRecord
  self.table_name = 'valoraciones'
  
  # ========== Asociaciones ==========
  belongs_to :paciente
  belongs_to :medico
  belongs_to :cita, optional: true

  # ========== Validaciones ==========
  validates :calificacion, presence: true, 
                          numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
  validates :comentario, length: { maximum: 1000 }, allow_blank: true
  validates :paciente_id, uniqueness: { scope: :medico_id, message: 'ya ha valorado a este médico' }

  # ========== Scopes ==========
  scope :recientes, -> { order(created_at: :desc) }
  scope :con_comentario, -> { where.not(comentario: nil).where.not(comentario: '') }
  scope :por_calificacion, ->(calificacion) { where(calificacion: calificacion) }
  scope :publicas, -> { where(anonimo: false) }

  # ========== Callbacks ==========
  after_save :actualizar_calificacion_medico
  after_destroy :actualizar_calificacion_medico

  # ========== Métodos de instancia ==========
  
  # Obtener nombre del paciente (anónimo si corresponde)
  def nombre_paciente
    return 'Paciente Anónimo' if anonimo
    "#{paciente.usuario.nombre} #{paciente.usuario.apellido}"
  end

  # Iniciales del paciente
  def iniciales_paciente
    return 'PA' if anonimo
    "#{paciente.usuario.nombre[0]}#{paciente.usuario.apellido[0]}"
  end

  private

  # Actualizar la calificación promedio del médico en la DB
  def actualizar_calificacion_medico
    medico.actualizar_calificacion_promedio!
  end
end
