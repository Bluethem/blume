# == Schema Information
#
# Table name: horario_medicos
#
#  id                     :uuid             not null, primary key
#  medico_id              :uuid             not null
#  dia_semana             :integer          not null
#  hora_inicio            :time             not null
#  hora_fin               :time             not null
#  duracion_cita_minutos  :integer          default(30), not null
#  activo                 :boolean          default(TRUE), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#

class HorarioMedico < ApplicationRecord
  self.table_name = 'horario_medicos'
  # Asociaciones
  belongs_to :medico

  # Validaciones
  validates :medico_id, presence: true
  validates :dia_semana, presence: true, 
                         inclusion: { in: 0..6, message: 'debe estar entre 0 (domingo) y 6 (sábado)' }
  validates :hora_inicio, presence: true
  validates :hora_fin, presence: true
  validates :duracion_cita_minutos, presence: true, 
                                    numericality: { greater_than: 0, less_than_or_equal_to: 240 }
  validate :hora_fin_posterior_a_inicio
  validate :horario_no_superpuesto

  # Scopes
  scope :activos, -> { where(activo: true) }
  scope :inactivos, -> { where(activo: false) }
  scope :del_dia, ->(dia) { where(dia_semana: dia) }
  scope :ordenados, -> { order(:dia_semana, :hora_inicio) }

  # Constantes
  DIAS_SEMANA = {
    0 => 'Domingo',
    1 => 'Lunes',
    2 => 'Martes',
    3 => 'Miércoles',
    4 => 'Jueves',
    5 => 'Viernes',
    6 => 'Sábado'
  }.freeze

  # Métodos de instancia
  def nombre_dia
    DIAS_SEMANA[dia_semana]
  end

  def duracion_horario_minutos
    return 0 unless hora_inicio && hora_fin
    
    inicio = hora_inicio.hour * 60 + hora_inicio.min
    fin = hora_fin.hour * 60 + hora_fin.min
    fin - inicio
  end

  def cantidad_citas_posibles
    duracion_horario_minutos / duracion_cita_minutos
  end

  def horarios_disponibles(fecha)
    # Generar array de horarios disponibles para una fecha específica
    return [] unless activo
    return [] unless fecha.wday == dia_semana

    horarios = []
    hora_actual = hora_inicio
    
    while hora_actual < hora_fin
      fecha_hora = fecha.change(hour: hora_actual.hour, min: hora_actual.min)
      
      if medico.disponible_en_horario?(fecha_hora, duracion_cita_minutos)
        horarios << fecha_hora
      end
      
      hora_actual += duracion_cita_minutos.minutes
    end
    
    horarios
  end

  def activar!
    update(activo: true)
  end

  def desactivar!
    update(activo: false)
  end

  private

  def hora_fin_posterior_a_inicio
    if hora_inicio.present? && hora_fin.present?
      if hora_fin <= hora_inicio
        errors.add(:hora_fin, 'debe ser posterior a la hora de inicio')
      end
    end
  end

  def horario_no_superpuesto
    return unless medico_id && dia_semana && hora_inicio && hora_fin

    # Buscar horarios superpuestos del mismo médico en el mismo día
    horarios_superpuestos = HorarioMedico
      .where(medico_id: medico_id, dia_semana: dia_semana, activo: true)
      .where.not(id: id) # Excluir el registro actual si es una actualización
      .where('hora_inicio < ? AND hora_fin > ?', hora_fin, hora_inicio)

    if horarios_superpuestos.exists?
      errors.add(:base, 'El horario se superpone con otro horario existente del médico')
    end
  end
end