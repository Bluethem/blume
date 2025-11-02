class AddPagoAdicionalToNotificaciones < ActiveRecord::Migration[8.1]
  def up
    puts "Tipo de notificación 'pago_adicional' agregado al enum"
  end

  def down
    puts "Revirtiendo cambio de tipo 'pago_adicional'"
  end
end