class RemoveEspecialidadPrincipalFromMedicos < ActiveRecord::Migration[8.1]
  def up
    # Verificar que todos los médicos tengan al menos una especialidad asignada
    medicos_sin_especialidad = Medico.left_joins(:especialidades)
                                      .where(especialidades: { id: nil })
                                      .pluck(:id)
    
    if medicos_sin_especialidad.any?
      puts "⚠️  ADVERTENCIA: Los siguientes médicos no tienen especialidades asignadas:"
      puts "IDs: #{medicos_sin_especialidad.join(', ')}"
      puts "Ejecuta primero la migración MigrarEspecialidadesExistentes"
      raise ActiveRecord::IrreversibleMigration, "Hay médicos sin especialidades asignadas"
    end
    
    # Eliminar la columna
    remove_column :medicos, :especialidad_principal
  end
  
  def down
    # Restaurar la columna (por si necesitas hacer rollback)
    add_column :medicos, :especialidad_principal, :string
    
    # Restaurar los valores desde la tabla de especialidades
    Medico.find_each do |medico|
      especialidad_principal = medico.especialidad_principal
      if especialidad_principal
        medico.update_column(:especialidad_principal, especialidad_principal.nombre)
      end
    end
    
    # Restaurar la restricción NOT NULL
    change_column_null :medicos, :especialidad_principal, false
  end
end