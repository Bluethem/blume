# == Schema Information
#
# Table name: medicos
#
#  id                     :uuid             not null, primary key
#  usuario_id             :uuid             not null
#  numero_colegiatura     :string           not null
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
  has_many :medico_especialidades, dependent: :destroy
  has_many :especialidades, through: :medico_especialidades
  has_many :valoraciones, class_name: 'Valoracion', dependent: :destroy

  # Validaciones
  validates :usuario_id, presence: true, uniqueness: true
  validates :numero_colegiatura, presence: true, 
                                 uniqueness: true,
                                 format: { with: /\A[A-Z]{3}-\d{5}\z/, message: 'debe tener el formato CMP-12345' }
  validates :anios_experiencia, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :costo_consulta, numericality: { greater_than: 0 }, allow_nil: true
  
  # ✅ Validar que tenga especialidad principal
  validate :debe_tener_especialidad_principal, on: :update

  # Delegaciones
  delegate :nombre, :apellido, :email, :telefono, :direccion, :nombre_completo, to: :usuario

  # Scopes
  scope :activos, -> { where(activo: true) }
  scope :inactivos, -> { where(activo: false) }
  scope :con_experiencia_minima, ->(anios) { where('anios_experiencia >= ?', anios) }
  scope :por_especialidad, ->(especialidad_id) {
    joins(:especialidades).where(especialidades: { id: especialidad_id })
  }
  scope :por_nombre_especialidad, ->(nombre) {
    joins(:especialidades).where('especialidades.nombre ILIKE ?', "%#{nombre}%")
  }

  # Métodos de instancia
  def nombre_profesional
    "Dr(a). #{nombre_completo}"
  end

  def especialidad_principal
    medico_especialidades.find_by(es_principal: true)&.especialidad
  end

  def especialidades_secundarias
    especialidades.where(medico_especialidades: { es_principal: false })
  end

  def agregar_especialidad(especialidad_id, es_principal: false)
    # Si se marca como principal, desmarcar las demás
    if es_principal
      medico_especialidades.update_all(es_principal: false)
    end
    
    medico_especialidades.find_or_create_by(especialidad_id: especialidad_id) do |me|
      me.es_principal = es_principal
    end
  end
  
  def cambiar_especialidad_principal(especialidad_id)
    transaction do
      medico_especialidades.update_all(es_principal: false)
      medico_especialidad = medico_especialidades.find_or_initialize_by(especialidad_id: especialidad_id)
      medico_especialidad.es_principal = true
      medico_especialidad.save!
    end
  end

  def tiene_disponibilidad?(dia_semana)
    horario_medicos.where(activo: true).exists?(dia_semana: dia_semana)
  end
  
  def horarios_activos
    horario_medicos.where(activo: true).order(:dia_semana, :hora_inicio)
  end

  def horarios_del_dia(dia_semana)
    horario_medicos.where(activo: true, dia_semana: dia_semana).order(:hora_inicio)
  end
  
  def horarios_fecha(fecha)
    dia_semana = fecha.wday
    horario_medicos.where(activo: true, dia_semana: dia_semana)
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
    return false unless activo

    dia_semana = fecha_hora.wday
    hora = fecha_hora.strftime('%H:%M')
    
    horario = horario_medicos.where(activo: true).find_by(dia_semana: dia_semana)
    return false unless horario

    return false if hora < horario.hora_inicio.strftime('%H:%M')
    return false if hora >= horario.hora_fin.strftime('%H:%M')

    fecha_fin = fecha_hora + duracion_minutos.minutes
    
    !citas.where(estado: [:pendiente, :confirmada])
          .where('fecha_hora_inicio < ? AND fecha_hora_fin > ?', fecha_fin, fecha_hora)
          .exists?
  end
  def calificacion_promedio
    return 0.0 if valoraciones.empty?
    Rails.cache.fetch("medico_#{id}_calificacion", expires_in: 1.hour) do
      valoraciones.average(:calificacion).to_f.round(1)
    end
  end

  def total_resenas
    valoraciones.count
  end
  
  def actualizar_calificacion_promedio
    Rails.cache.delete("medico_#{id}_calificacion")
    calificacion_promedio
  end

  def distribucion_calificaciones
    {
      5 => valoraciones.where(calificacion: 5).count,
      4 => valoraciones.where(calificacion: 4).count,
      3 => valoraciones.where(calificacion: 3).count,
      2 => valoraciones.where(calificacion: 2).count,
      1 => valoraciones.where(calificacion: 1).count
    }
  end

  def foto_url
    usuario.foto_url || "https://ui-avatars.com/api/?name=#{nombre_completo}&size=200"
  end

  def disponible_hoy?
    dia_hoy = Date.today.wday
    horario_medicos.activos.exists?(dia_semana: dia_hoy)
  end

  def total_citas_completadas
    citas.where(estado: :completada).count
  end

  def activar!
    update(activo: true)
  end

  def desactivar!
    update(activo: false)
  end
  
  private
  
  def debe_tener_especialidad_principal
    if persisted? && (especialidades.none? || medico_especialidades.where(es_principal: true).none?)
      errors.add(:base, 'debe tener al menos una especialidad principal')
    end
  end
end