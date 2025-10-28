class MigrarEspecialidadesExistentes < ActiveRecord::Migration[8.1]
  def up
    # Verificar si la columna especialidad_principal existe
    unless column_exists?(:medicos, :especialidad_principal)
      puts "⚠️  La columna especialidad_principal no existe. Saltando migración."
      return
    end
    
    # 1. Extraer especialidades únicas de especialidad_principal
    especialidades_unicas = execute(
      "SELECT DISTINCT especialidad_principal FROM medicos WHERE especialidad_principal IS NOT NULL"
    ).map { |row| row['especialidad_principal'] }
    
    puts "📋 Encontradas #{especialidades_unicas.count} especialidades únicas"
    
    # 2. Crear registros en tabla especialidades
    especialidades_unicas.each do |nombre|
      # Usar SQL directo para evitar problemas de pluralización
      result = execute(
        "SELECT id FROM especialidades WHERE nombre = '#{nombre.gsub("'", "''")}'"
      )
      
      if result.count == 0
        execute(
          "INSERT INTO especialidades (id, nombre, created_at, updated_at) 
           VALUES (gen_random_uuid(), '#{nombre.gsub("'", "''")}', NOW(), NOW())"
        )
        puts "✅ Creada especialidad: #{nombre}"
      else
        puts "⏭️  Especialidad ya existe: #{nombre}"
      end
    end
    
    # 3. Asignar especialidades a médicos usando SQL directo
    medicos_con_especialidad = execute(
      "SELECT id, especialidad_principal FROM medicos WHERE especialidad_principal IS NOT NULL"
    )
    
    medicos_con_especialidad.each do |medico|
      medico_id = medico['id']
      especialidad_nombre = medico['especialidad_principal']
      
      # Obtener el ID de la especialidad
      especialidad = execute(
        "SELECT id FROM especialidades WHERE nombre = '#{especialidad_nombre.gsub("'", "''")}'"
      ).first
      
      if especialidad
        especialidad_id = especialidad['id']
        
        # Verificar si ya existe la relación
        existe = execute(
          "SELECT id FROM medico_especialidades 
           WHERE medico_id = '#{medico_id}' AND especialidad_id = '#{especialidad_id}'"
        )
        
        if existe.count == 0
          execute(
            "INSERT INTO medico_especialidades (id, medico_id, especialidad_id, es_principal, created_at, updated_at)
             VALUES (gen_random_uuid(), '#{medico_id}', '#{especialidad_id}', true, NOW(), NOW())"
          )
          puts "✅ Asignada especialidad '#{especialidad_nombre}' al médico #{medico_id}"
        end
      end
    end
    
    puts "✅ Migración de especialidades completada"
  end
  
  def down
    # Restaurar especialidad_principal desde la relación
    if column_exists?(:medicos, :especialidad_principal)
      medicos_con_especialidad = execute(
        "SELECT m.id, e.nombre 
         FROM medicos m
         INNER JOIN medico_especialidades me ON me.medico_id = m.id AND me.es_principal = true
         INNER JOIN especialidades e ON e.id = me.especialidad_id"
      )
      
      medicos_con_especialidad.each do |row|
        execute(
          "UPDATE medicos SET especialidad_principal = '#{row['nombre'].gsub("'", "''")}' 
           WHERE id = '#{row['id']}'"
        )
      end
    end
    
    # Limpiar tablas
    execute("DELETE FROM medico_especialidades")
    execute("DELETE FROM especialidades")
    
    puts "✅ Rollback completado"
  end
end