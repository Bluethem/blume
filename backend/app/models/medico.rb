# == Schema Information
#
# Table name: medicos
#
#  id                     :uuid             not null, primary key
#  usuario_id             :uuid             not null
#  numero_colegiatura     :string           not null
#  especialidad_principal :string           not null
#  anios_experiencia      :integer
#  biografia              :text
#  costo_consulta         :decimal(10, 2)
#  activo                 :boolean          default(TRUE), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#

class Medico < ApplicationRecord
  self.table_name = 'medicos'
  # Asociaciones
  belongs_to :usuario
  has_many :medico_certificaciones, dependent: :destroy
  has_many :certificaciones, through: :medico_certificaciones
  has_many :horario_medicos, dependent: :destroy
  has_many :citas, dependent: :destroy
  has_many :pacientes, through: :citas

  # Validaciones
  validates :usuario_id, presence: true, uniqueness: true
  validates :numero_colegiatura, presence: true, 
                                 uniqueness: true,
                                 format: { with: /\A[A-Z]{3}-\d{5}\z/, message: 'debe tener el formato CMP-12345' }
  validates :especialidad_principal, presence: true, length: { minimum: 3, maximum: 100 }
  validates :anios_experiencia, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :costo_consulta, numericality: { greater_than: 0 }, allow_nil: true

  # Delegaciones
  delegate :nombre, :apellido, :email, :telefono, :direccion, :nombre_completo, to: :usuario

  # Scopes
  scope :activos, -> { where(activo: true) }
  scope :inactivos, -> { where(activo: false) }
  scope :por_especialidad, ->(especialidad) { where(especialidad_principal: especialidad) }
  scope :con_experiencia_minima, ->(anios) { where('anios_experiencia >= ?', anios) }

  # Métodos de instancia
  def nombre_profesional
    "Dr(a). #{nombre_completo}"
  end

  def tiene_disponibilidad?(dia_semana)
    horario_medicos.activos.exists?(dia_semana: dia_semana)
  end

  def horarios_del_dia(dia_semana)
    horario_medicos.activos.where(dia_semana: dia_semana).order(:hora_inicio)
  end

  def proximas_citas
    citas.where('fecha_hora_inicio > ?', Time.current)
         .where(estado: [:pendiente, :confirmada])
         .order(:fecha_hora_inicio)
  end

  def citas_del_dia(fecha)
    inicio_dia = fecha.beginning_of_day
    fin_dia = fecha.end_of_day
    
    citas.where(fecha_hora_inicio: inicio_dia..fin_dia)
         .order(:fecha_hora_inicio)
  end

  def disponible_en_horario?(fecha_hora, duracion_minutos = 30)
    # Verificar que el médico esté activo
    return false unless activo

    # Verificar que el día de la semana tenga horario configurado
    dia_semana = fecha_hora.wday
    hora = fecha_hora.strftime('%H:%M')
    
    horario = horario_medicos.activos.find_by(dia_semana: dia_semana)
    return false unless horario

    # Verificar que la hora esté dentro del rango del horario
    return false if hora < horario.hora_inicio.strftime('%H:%M')
    return false if hora >= horario.hora_fin.strftime('%H:%M')

    # Verificar que no haya citas superpuestas
    fecha_fin = fecha_hora + duracion_minutos.minutes
    
    !citas.where(estado: [:pendiente, :confirmada])
          .where('fecha_hora_inicio < ? AND fecha_hora_fin > ?', fecha_fin, fecha_hora)
          .exists?
  end

  def total_citas_completadas
    citas.completada.count
  end

  def activar!
    update(activo: true)
  end

  def desactivar!
    update(activo: false)
  end
end