class AddNoShowTrackingToCitas < ActiveRecord::Migration[8.1]
  def change
    add_column :citas, :quien_no_asistio, :integer, default: nil
    add_column :citas, :motivo_no_asistencia, :text
    add_column :citas, :fecha_no_asistencia, :datetime
    add_column :citas, :notificado_no_asistencia, :boolean, default: false
    
    add_index :citas, :quien_no_asistio
  end
end
