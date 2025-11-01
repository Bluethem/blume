class AddPaymentFieldsToCitas < ActiveRecord::Migration[8.1]
  def change
    add_column :citas, :pagado, :boolean, default: false, null: false
    add_column :citas, :requiere_pago_adicional, :boolean, default: false, null: false
    add_column :citas, :monto_adicional, :decimal, precision: 10, scale: 2, default: 0.0
    add_column :citas, :reprogramaciones_count, :integer, default: 0, null: false
    add_column :citas, :permite_reprogramacion, :boolean, default: true, null: false
    
    add_index :citas, :pagado
    add_index :citas, :requiere_pago_adicional
  end
end
