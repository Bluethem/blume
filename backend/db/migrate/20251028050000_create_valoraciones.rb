class CreateValoraciones < ActiveRecord::Migration[8.1]
  def change
    create_table :valoraciones, id: :uuid do |t|
      t.references :paciente, type: :uuid, null: false, foreign_key: true
      t.references :medico, type: :uuid, null: false, foreign_key: true
      t.references :cita, type: :uuid, null: true, foreign_key: true
      
      t.integer :calificacion, null: false
      t.text :comentario
      t.boolean :anonimo, default: false, null: false
      
      t.timestamps
    end

    # Índices para optimizar consultas
    add_index :valoraciones, [:medico_id, :created_at]
    add_index :valoraciones, [:paciente_id, :medico_id], unique: true, name: 'index_unique_valoracion_paciente_medico'
    add_index :valoraciones, :calificacion
    
    # Constraint para asegurar calificación entre 1 y 5
    add_check_constraint :valoraciones, 'calificacion >= 1 AND calificacion <= 5', name: 'check_calificacion_range'
  end
end
