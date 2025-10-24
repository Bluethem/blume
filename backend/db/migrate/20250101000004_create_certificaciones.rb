class CreateCertificaciones < ActiveRecord::Migration[8.1]
  def change
    create_table :certificaciones, id: :uuid do |t|
      t.string :nombre, null: false
      t.string :institucion_emisora
      t.text :descripcion

      t.timestamps
    end

    # Índice para búsquedas por nombre
    add_index :certificaciones, :nombre
  end
end