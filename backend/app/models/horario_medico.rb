# app/models/horario_medico.rb
# == Schema Information
#
# Table name: horario_medicos
#
#  id                     :uuid             not null, primary key
#  medico_id              :uuid             not null
#  dia_semana             :integer          not null (0=domingo, 6=sábado)
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
  validates :hora_inicio, :hora_fin, presence: true
  validates :duracion_cita_minutos, presence: true, 
            numericality: { greater_than: 0, less_than_or_equal_to: 120 }
  
  validate :hora_fin_mayor_que_inicio
  validate :no_superposicion_horarios
  
  # Scopes
  scope :activos, -> { where(activo: true) }
  scope :inactivos, -> { where(activo: false) }
  scope :del_dia, ->(dia) { where(dia_semana: dia) }
  scope :por_medico, ->(medico_id) { where(medico_id: medico_id) }
  
  # Enum para facilitar el uso
  enum :dia_semana, {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6
  }, prefix: :dia
  
  # Métodos de clase
  def self.dias_semana_hash
    {
      0 => 'Domingo',
      1 => 'Lunes',
      2 => 'Martes',
      3 => 'Miércoles',
      4 => 'Jueves',
      5 => 'Viernes',
      6 => 'Sábado'
    }
  end
  
  def self.dias_semana_abreviados
    {
      0 => 'Dom',
      1 => 'Lun',
      2 => 'Mar',
      3 => 'Mié',
      4 => 'Jue',
      5 => 'Vie',
      6 => 'Sáb'
    }
  end
  
  # Métodos de instancia
  def nombre_dia
    HorarioMedico.dias_semana_hash[dia_semana]
  end
  
  def nombre_dia_abreviado
    HorarioMedico.dias_semana_abreviados[dia_semana]
  end
  
  def duracion_total_minutos
    ((hora_fin - hora_inicio) / 60).to_i
  end
  
  def cantidad_slots_disponibles
    duracion_total_minutos / duracion_cita_minutos
  end
  
  # Genera slots de tiempo disponibles para una fecha específica
  def slots_disponibles(fecha)
    return [] unless activo
    
    # Verificar que la fecha corresponde al día de la semana de este horario
    return [] unless fecha.wday == dia_semana
    
    slots = []
    current_time = hora_inicio
    
    while current_time < hora_fin
      slot_fin = current_time + duracion_cita_minutos.minutes
      break if slot_fin > hora_fin
      
      # Construir datetime completo
      fecha_hora_inicio = Time.zone.parse("#{fecha} #{current_time.strftime('%H:%M:%S')}")
      fecha_hora_fin = Time.zone.parse("#{fecha} #{slot_fin.strftime('%H:%M:%S')}")
      
      # Verificar si el slot está en el pasado
      if fecha_hora_inicio < Time.current
        current_time = slot_fin
        next
      end
      
      # Verificar si el slot está ocupado
      ocupado = medico.citas.where(
        fecha_hora_inicio: fecha_hora_inicio,
        estado: [:pendiente, :confirmada]
      ).exists?
      
      slots << {
        hora_inicio: current_time.strftime('%H:%M'),
        hora_fin: slot_fin.strftime('%H:%M'),
        fecha_hora_inicio: fecha_hora_inicio.iso8601,
        fecha_hora_fin: fecha_hora_fin.iso8601,
        disponible: !ocupado,
        duracion_minutos: duracion_cita_minutos
      }
      
      current_time = slot_fin
    end
    
    slots
  end
  
  # Verifica si un horario específico está disponible
  def disponible_en?(fecha_hora)
    return false unless activo
    return false if fecha_hora.wday != dia_semana
    
    hora = fecha_hora.strftime('%H:%M:%S')
    hora_inicio_str = hora_inicio.strftime('%H:%M:%S')
    hora_fin_str = hora_fin.strftime('%H:%M:%S')
    
    return false unless hora.between?(hora_inicio_str, hora_fin_str)
    
    # Verificar que no hay citas en ese horario
    !medico.citas.where(
      fecha_hora_inicio: fecha_hora,
      estado: [:pendiente, :confirmada]
    ).exists?
  end
  
  private
  
  def hora_fin_mayor_que_inicio
    if hora_fin && hora_inicio && hora_fin <= hora_inicio
      errors.add(:hora_fin, 'debe ser mayor que hora de inicio')
    end
  end
  
  def no_superposicion_horarios
    return if medico_id.blank? || dia_semana.blank?
    
    horarios_superpuestos = HorarioMedico
      .where(medico_id: medico_id, dia_semana: dia_semana, activo: true)
      .where.not(id: id)
      .where('(hora_inicio < ? AND hora_fin > ?) OR ' \
             '(hora_inicio < ? AND hora_fin > ?) OR ' \
             '(hora_inicio >= ? AND hora_fin <= ?)',
             hora_fin, hora_inicio,
             hora_inicio, hora_fin,
             hora_inicio, hora_fin)
    
    if horarios_superpuestos.exists?
      errors.add(:base, 'Ya existe un horario superpuesto para este día')
    end
  end
end