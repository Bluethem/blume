class CreateCitas < ActiveRecord::Migration[8.1]
  def change
    create_table :citas, id: :uuid do |t|
      t.references :paciente, type: :uuid, null: false, foreign_key: { to_table: :pacientes }
      t.references :medico, type: :uuid, null: false, foreign_key: { to_table: :medicos }
      t.datetime :fecha_hora_inicio, null: false
      t.datetime :fecha_hora_fin, null: false
      t.integer :estado, default: 0, null: false
      t.text :motivo_consulta
      t.text :observaciones
      t.text :diagnostico
      t.text :motivo_cancelacion
      t.references :cancelada_por, type: :uuid, foreign_key: { to_table: :usuarios }
      t.decimal :costo, precision: 10, scale: 2

      t.timestamps
    end

    add_index :citas, :fecha_hora_inicio
    add_index :citas, :estado
    add_index :citas, [:medico_id, :fecha_hora_inicio], name: 'index_citas_on_medico_fecha'

    add_check_constraint :citas, "fecha_hora_fin > fecha_hora_inicio", name: "check_fecha_fin_mayor_inicio"
  end
end