class CreateMedicos < ActiveRecord::Migration[8.1]
  def change
    create_table :medicos, id: :uuid do |t|
      t.references :usuario, type: :uuid, null: false, foreign_key: true, index: { unique: true }
      t.string :numero_colegiatura, null: false
      t.string :especialidad_principal, null: false
      t.integer :anios_experiencia
      t.text :biografia
      t.decimal :costo_consulta, precision: 10, scale: 2
      t.boolean :activo, default: true, null: false

      t.timestamps
    end

    # Índices adicionales
    add_index :medicos, :numero_colegiatura, unique: true
    add_index :medicos, :especialidad_principal
  end
end