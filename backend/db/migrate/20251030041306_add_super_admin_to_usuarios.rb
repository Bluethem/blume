class AddSuperAdminToUsuarios < ActiveRecord::Migration[8.1]
  def change
    add_column :usuarios, :es_super_admin, :boolean, default: false, null: false
    add_column :usuarios, :ultimo_acceso, :datetime
    add_column :usuarios, :creado_por_id, :integer
    
    add_index :usuarios, :es_super_admin
    add_index :usuarios, :creado_por_id
    
    # La columna activo ya existe, solo agregamos índice si no existe
    add_index :usuarios, :activo unless index_exists?(:usuarios, :activo)
  end
end
