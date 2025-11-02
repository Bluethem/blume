class CreateReprogramaciones < ActiveRecord::Migration[8.1]
  def change
    create_table :reprogramaciones, id: :uuid do |t|
      t.references :cita_original, type: :uuid, null: false, foreign_key: { to_table: :citas }
      t.references :cita_nueva, type: :uuid, null: true, foreign_key: { to_table: :citas }
      t.references :solicitado_por, type: :uuid, null: false, foreign_key: { to_table: :usuarios }
      
      # Motivo y tipo
      t.integer :motivo, default: 0, null: false
      t.integer :estado, default: 0, null: false
      t.text :descripcion
      t.text :justificacion
      
      # Fechas propuestas
      t.datetime :fecha_propuesta_1
      t.datetime :fecha_propuesta_2
      t.datetime :fecha_propuesta_3
      t.datetime :fecha_seleccionada
      
      # Aprobación
      t.references :aprobado_por, type: :uuid, null: true, foreign_key: { to_table: :usuarios }
      t.datetime :fecha_aprobacion
      t.datetime :fecha_rechazo
      t.text :motivo_rechazo
      
      # Metadata
      t.jsonb :metadata, default: {}
      t.boolean :requiere_reembolso, default: false
      t.boolean :reembolso_procesado, default: false
      
      t.timestamps
    end
    
    add_index :reprogramaciones, :estado
    add_index :reprogramaciones, :motivo
    add_index :reprogramaciones, :created_at
    add_index :reprogramaciones, [:cita_original_id, :estado]
  end
end
