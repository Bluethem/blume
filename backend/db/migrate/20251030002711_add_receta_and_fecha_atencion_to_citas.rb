class AddRecetaAndFechaAtencionToCitas < ActiveRecord::Migration[8.1]
  def change
    add_column :citas, :receta, :text
    add_column :citas, :fecha_atencion, :datetime
  end
end
