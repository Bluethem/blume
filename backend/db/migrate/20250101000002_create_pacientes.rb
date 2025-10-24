class CreatePacientes < ActiveRecord::Migration[8.1]
  def change
    create_table :pacientes, id: :uuid do |t|
      t.references :usuario, type: :uuid, null: false, foreign_key: true, index: { unique: true }
      t.date :fecha_nacimiento
      t.integer :genero # 0: masculino, 1: femenino, 2: otro
      t.string :numero_documento
      t.integer :tipo_documento # 0: DNI, 1: pasaporte, 2: carnet_extranjeria
      t.string :grupo_sanguineo
      t.text :alergias
      t.text :observaciones

      t.timestamps
    end

    # Índices adicionales
    add_index :pacientes, :numero_documento, unique: true
  end
end