# lib/tasks/crear_horarios_medicos.rake
namespace :medicos do
  desc "Crear horarios predeterminados para todos los médicos que no tienen horarios"
  task crear_horarios: :environment do
    puts "=" * 60
    puts "Creando horarios para médicos sin horarios configurados"
    puts "=" * 60
    puts ""
    
    medicos_sin_horarios = Medico.activos.select { |m| m.horario_medicos.activos.empty? }
    
    if medicos_sin_horarios.empty?
      puts "✅ Todos los médicos activos ya tienen horarios configurados"
      exit
    end
    
    puts "📋 Médicos sin horarios: #{medicos_sin_horarios.count}"
    puts ""
    
    medicos_sin_horarios.each_with_index do |medico, index|
      puts "#{index + 1}. Configurando horarios para: #{medico.nombre_completo}"
      
      begin
        # Lunes a Viernes: 9:00 AM - 1:00 PM (Turno Mañana)
        (1..5).each do |dia|
          medico.horario_medicos.create!(
            dia_semana: dia,
            hora_inicio: '09:00',
            hora_fin: '13:00',
            duracion_cita_minutos: 30,
            activo: true
          )
        end
        
        # Lunes a Viernes: 3:00 PM - 7:00 PM (Turno Tarde)
        (1..5).each do |dia|
          medico.horario_medicos.create!(
            dia_semana: dia,
            hora_inicio: '15:00',
            hora_fin: '19:00',
            duracion_cita_minutos: 30,
            activo: true
          )
        end
        
        puts "   ✅ Horarios creados exitosamente (10 horarios)"
        puts "      - Lunes a Viernes: 9:00-13:00 y 15:00-19:00"
        puts "      - Duración de cita: 30 minutos"
        puts ""
      rescue => e
        puts "   ❌ Error: #{e.message}"
        puts ""
      end
    end
    
    puts "=" * 60
    puts "✅ Proceso completado"
    puts "=" * 60
    puts ""
    
    # Resumen final
    total_medicos = Medico.activos.count
    con_horarios = Medico.activos.select { |m| m.horario_medicos.activos.any? }.count
    
    puts "📊 RESUMEN:"
    puts "   Total médicos activos: #{total_medicos}"
    puts "   Con horarios configurados: #{con_horarios}"
    puts "   Sin horarios: #{total_medicos - con_horarios}"
    puts ""
  end
  
  desc "Mostrar estadísticas de horarios de médicos"
  task estadisticas_horarios: :environment do
    puts "=" * 60
    puts "Estadísticas de Horarios de Médicos"
    puts "=" * 60
    puts ""
    
    Medico.activos.each do |medico|
      horarios_count = medico.horario_medicos.activos.count
      
      puts "👨‍⚕️  #{medico.nombre_completo}"
      puts "   📅 Horarios activos: #{horarios_count}"
      
      if horarios_count > 0
        dias_atencion = medico.horario_medicos.activos.pluck(:dia_semana).uniq.sort
        nombres_dias = dias_atencion.map { |d| HorarioMedico.dias_semana_hash[d] }
        puts "   📍 Días de atención: #{nombres_dias.join(', ')}"
        
        # Mostrar horarios por día
        dias_atencion.each do |dia|
          horarios_dia = medico.horario_medicos.activos.where(dia_semana: dia).order(:hora_inicio)
          puts "      #{HorarioMedico.dias_semana_hash[dia]}:"
          horarios_dia.each do |h|
            puts "        • #{h.hora_inicio.strftime('%H:%M')} - #{h.hora_fin.strftime('%H:%M')} (#{h.duracion_cita_minutos} min/cita)"
          end
        end
      else
        puts "   ⚠️  SIN HORARIOS CONFIGURADOS"
      end
      
      puts ""
    end
    
    # Resumen
    total = Medico.activos.count
    con_horarios = Medico.activos.select { |m| m.horario_medicos.activos.any? }.count
    sin_horarios = total - con_horarios
    
    puts "=" * 60
    puts "📊 RESUMEN GENERAL:"
    puts "   Total médicos activos: #{total}"
    puts "   Con horarios: #{con_horarios} (#{(con_horarios.to_f / total * 100).round(1)}%)"
    puts "   Sin horarios: #{sin_horarios} (#{(sin_horarios.to_f / total * 100).round(1)}%)"
    puts "=" * 60
  end
end
