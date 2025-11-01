class CreatePagos < ActiveRecord::Migration[8.1]
  def change
    create_table :pagos, id: :uuid do |t|
      t.references :cita, type: :uuid, null: false, foreign_key: true
      t.references :paciente, type: :uuid, null: false, foreign_key: true
      
      # Tipos y estados
      t.integer :tipo_pago, default: 0, null: false
      t.integer :estado, default: 0, null: false
      t.integer :metodo_pago, default: 0, null: false
      
      # Montos
      t.decimal :monto, precision: 10, scale: 2, null: false
      t.text :descripcion
      t.text :concepto
      
      # Datos de transacción
      t.string :transaction_id
      t.string :payment_gateway
      t.jsonb :metadata, default: {}
      
      # Fechas importantes
      t.datetime :fecha_pago
      t.datetime :fecha_reembolso
      
      t.timestamps
    end
    
    add_index :pagos, :transaction_id, unique: true
    add_index :pagos, :estado
    add_index :pagos, :tipo_pago
    add_index :pagos, :fecha_pago
    add_index :pagos, [:cita_id, :tipo_pago]
  end
end
