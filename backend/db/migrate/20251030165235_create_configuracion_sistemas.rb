class CreateConfiguracionSistemas < ActiveRecord::Migration[8.1]
  def change
    create_table :configuracion_sistemas, id: :uuid do |t|
      t.string :clave, null: false
      t.text :valor
      t.text :descripcion
      t.string :categoria, null: false
      t.boolean :solo_super_admin, default: false, null: false

      t.timestamps
    end

    add_index :configuracion_sistemas, :clave, unique: true
    add_index :configuracion_sistemas, :categoria
  end
end
