class AddCalificacionPromedioToMedicos < ActiveRecord::Migration[8.1]
  def up
    # Agregar columna con precisión y default
    add_column :medicos, :calificacion_promedio, :decimal, precision: 3, scale: 1, default: 0.0
    
    # Poblar valores existentes
    reversible do |dir|
      dir.up do
        # Calcular y actualizar calificación promedio para todos los médicos
        execute <<-SQL
          UPDATE medicos
          SET calificacion_promedio = COALESCE(
            (SELECT ROUND(AVG(calificacion)::numeric, 1)
             FROM valoraciones
             WHERE valoraciones.medico_id = medicos.id),
            0.0
          )
        SQL
      end
    end
    
    # Agregar índice para mejorar performance de filtros
    add_index :medicos, :calificacion_promedio
  end
  
  def down
    remove_index :medicos, :calificacion_promedio
    remove_column :medicos, :calificacion_promedio
  end
end
