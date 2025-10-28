class Especialidad < ApplicationRecord
  # Asociaciones
  has_many :medico_especialidades, dependent: :destroy
  has_many :medicos, through: :medico_especialidades
  
  # Validaciones
  validates :nombre, presence: true, 
                     uniqueness: { case_sensitive: false },
                     length: { minimum: 3, maximum: 100 }
  
  # Callbacks
  before_save :normalizar_nombre
  
  # Scopes
  scope :activas, -> { 
    joins(:medicos).merge(Medico.activos).distinct 
  }
  scope :ordenadas, -> { order(:nombre) }
  scope :con_medicos, -> { 
    joins(:medicos).group('especialidades.id').having('COUNT(medicos.id) > 0') 
  }
  
  # Búsqueda
  scope :buscar, ->(termino) {
    where('nombre ILIKE ? OR descripcion ILIKE ?', "%#{termino}%", "%#{termino}%")
  }
  
  # Métodos de instancia
  def medicos_activos
    medicos.joins(:usuario).where(usuarios: { activo: true })
  end
  
  def total_medicos_activos
    medicos_activos.count
  end
  
  private
  
  def normalizar_nombre
    self.nombre = nombre.strip.titleize if nombre.present?
  end
end