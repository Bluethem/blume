class CreateMedicoCertificaciones < ActiveRecord::Migration[8.1]
  def change
    create_table :medico_certificaciones, id: :uuid do |t|
      t.references :medico, type: :uuid, null: false, foreign_key: true
      t.references :certificacion, type: :uuid, null: false, foreign_key: { to_table: :certificaciones }
      t.date :fecha_obtencion
      t.date :fecha_expiracion
      t.string :numero_certificado

      t.timestamps
    end

    add_index :medico_certificaciones, [:medico_id, :certificacion_id], 
              unique: true, 
              name: 'index_unique_medico_certificacion'
  end
end