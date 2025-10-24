class CreateNotificaciones < ActiveRecord::Migration[8.1]
  def change
    create_table :notificaciones, id: :uuid do |t|
      t.references :usuario, type: :uuid, null: false, foreign_key: { to_table: :usuarios }
      t.references :cita, type: :uuid, foreign_key: { to_table: :citas }
      t.integer :tipo, null: false
      t.string :titulo, null: false
      t.text :mensaje, null: false
      t.boolean :leida, default: false, null: false
      t.datetime :fecha_leida

      t.timestamps
    end

    add_index :notificaciones, :leida
    add_index :notificaciones, :created_at
    add_index :notificaciones, [:usuario_id, :leida], name: 'index_notificaciones_usuario_leida'
  end
end