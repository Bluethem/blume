class CreateHorarioMedicos < ActiveRecord::Migration[8.1]
  def change
    create_table :horario_medicos, id: :uuid do |t|
      t.references :medico, type: :uuid, null: false, foreign_key: { to_table: :medicos }, index: true
      t.integer :dia_semana, null: false
      t.time :hora_inicio, null: false
      t.time :hora_fin, null: false
      t.integer :duracion_cita_minutos, default: 30, null: false
      t.boolean :activo, default: true, null: false

      t.timestamps
    end
    
    add_index :horario_medicos, :dia_semana

    add_check_constraint :horario_medicos, "dia_semana >= 0 AND dia_semana <= 6", name: "check_dia_semana_range"
    add_check_constraint :horario_medicos, "hora_fin > hora_inicio", name: "check_hora_fin_mayor_inicio"
    add_check_constraint :horario_medicos, "duracion_cita_minutos > 0", name: "check_duracion_positiva"
  end
end