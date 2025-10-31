class ConfiguracionSistema < ApplicationRecord
  # Validaciones
  validates :clave, presence: true, uniqueness: true
  validates :categoria, presence: true
  validates :solo_super_admin, inclusion: { in: [true, false] }

  # Scopes
  scope :por_categoria, ->(categoria) { where(categoria: categoria) }
  scope :accesible_para_admin, -> { where(solo_super_admin: false) }
  scope :solo_super_admin, -> { where(solo_super_admin: true) }

  # Métodos de clase para obtener/establecer valores
  def self.obtener(clave, valor_default = nil)
    config = find_by(clave: clave)
    config&.valor || valor_default
  end

  def self.establecer(clave, valor, usuario = nil)
    config = find_or_initialize_by(clave: clave)
    
    # Verificar permisos si es configuración de solo super admin
    if config.solo_super_admin && usuario && !usuario.es_super_admin?
      return false
    end

    config.valor = valor.to_s
    config.save
  end

  # Método para verificar si un usuario puede modificar esta configuración
  def puede_modificar?(usuario)
    return false unless usuario

    # Super admin puede modificar todo
    return true if usuario.es_super_admin?

    # Admin normal solo puede modificar configuraciones no restringidas
    !solo_super_admin
  end
end
