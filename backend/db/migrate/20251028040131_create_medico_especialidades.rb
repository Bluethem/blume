class CreateMedicoEspecialidades < ActiveRecord::Migration[8.1]
  def change
    create_table :medico_especialidades, id: :uuid do |t|
      # ✅ CORREGIDO: Especificar explícitamente el nombre de la tabla
      t.references :medico, type: :uuid, null: false, foreign_key: { to_table: :medicos }
      t.references :especialidad, type: :uuid, null: false, foreign_key: { to_table: :especialidades }
      t.boolean :es_principal, default: false, null: false
      t.timestamps
    end
    
    add_index :medico_especialidades, [:medico_id, :especialidad_id], 
              unique: true, name: 'index_medico_especialidades_unique'
  end
end