# lib/tasks/recordatorios.rake
namespace :recordatorios do
  desc "Enviar recordatorios de citas para mañana"
  task enviar: :environment do
    puts "=" * 70
    puts "🔔 Enviando recordatorios de citas"
    puts "=" * 70
    puts ""
    
    # Verificar qué citas tienen mañana
    manana = 1.day.from_now
    citas_manana = Cita
      .includes(:paciente, :medico)
      .where(estado: [:pendiente, :confirmada])
      .where(fecha_hora_inicio: manana.beginning_of_day..manana.end_of_day)
    
    puts "📅 Fecha de mañana: #{manana.strftime('%d/%m/%Y')}"
    puts "📊 Citas programadas: #{citas_manana.count}"
    puts ""
    
    if citas_manana.count > 0
      puts "📋 Citas a recordar:"
      citas_manana.each do |cita|
        puts "   • #{cita.fecha_hora_inicio.strftime('%H:%M')} - #{cita.paciente.nombre_completo} con #{cita.medico.nombre_profesional}"
      end
      puts ""
    end
    
    # Ejecutar el job
    resultado = EnviarRecordatoriosCitasJob.perform_now
    
    puts ""
    puts "=" * 70
    puts "✅ RESULTADO:"
    puts "   Total recordatorios enviados: #{resultado[:total]}"
    puts "   • A pacientes: #{resultado[:pacientes]}"
    puts "   • A médicos: #{resultado[:medicos]}"
    puts "=" * 70
  end
  
  desc "Mostrar citas que recibirán recordatorio"
  task preview: :environment do
    puts "=" * 70
    puts "👀 PREVIEW: Citas que recibirán recordatorio"
    puts "=" * 70
    puts ""
    
    manana = 1.day.from_now
    citas_manana = Cita
      .includes(:paciente, :medico)
      .where(estado: [:pendiente, :confirmada])
      .where(fecha_hora_inicio: manana.beginning_of_day..manana.end_of_day)
    
    puts "📅 Fecha de mañana: #{manana.strftime('%d/%m/%Y')}"
    puts "📊 Total citas: #{citas_manana.count}"
    puts ""
    
    if citas_manana.empty?
      puts "ℹ️  No hay citas programadas para mañana"
    else
      citas_manana.each_with_index do |cita, index|
        puts "#{index + 1}. #{cita.fecha_hora_inicio.strftime('%H:%M')}"
        puts "   Paciente: #{cita.paciente.nombre_completo} (#{cita.paciente.usuario.email})"
        puts "   Médico: #{cita.medico.nombre_profesional} (#{cita.medico.usuario.email})"
        puts "   Estado: #{cita.estado}"
        
        # Verificar si ya tiene recordatorio reciente
        tiene_recordatorio = cita.notificaciones.tipo_recordatorio.where('created_at > ?', 2.days.ago).exists?
        if tiene_recordatorio
          puts "   ⚠️  YA TIENE RECORDATORIO RECIENTE (no se enviará otro)"
        else
          puts "   ✅ Recibirá recordatorio"
        end
        
        puts ""
      end
    end
    
    puts "=" * 70
  end
  
  desc "Probar envío de recordatorio para una cita específica"
  task :test_cita, [:cita_id] => :environment do |t, args|
    unless args[:cita_id]
      puts "❌ Error: Debes proporcionar un cita_id"
      puts "Uso: rails recordatorios:test_cita[CITA_ID]"
      exit 1
    end
    
    cita = Cita.find_by(id: args[:cita_id])
    
    unless cita
      puts "❌ Error: No se encontró la cita con ID #{args[:cita_id]}"
      exit 1
    end
    
    puts "=" * 70
    puts "🧪 TEST: Enviar recordatorio para cita específica"
    puts "=" * 70
    puts ""
    puts "Cita ID: #{cita.id}"
    puts "Fecha: #{cita.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M')}"
    puts "Paciente: #{cita.paciente.nombre_completo}"
    puts "Médico: #{cita.medico.nombre_profesional}"
    puts "Estado: #{cita.estado}"
    puts ""
    
    begin
      # Crear recordatorios de prueba
      notif_paciente = Notificacion.create!(
        usuario: cita.paciente.usuario,
        cita: cita,
        tipo: :recordatorio,
        titulo: '[TEST] Recordatorio de cita',
        mensaje: "[TEST] Recuerda tu cita el #{cita.fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')} con #{cita.medico.nombre_profesional}"
      )
      
      notif_medico = Notificacion.create!(
        usuario: cita.medico.usuario,
        cita: cita,
        tipo: :recordatorio,
        titulo: '[TEST] Recordatorio de cita',
        mensaje: "[TEST] Tienes cita el #{cita.fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')} con #{cita.paciente.nombre_completo}"
      )
      
      puts "✅ Recordatorios de prueba creados:"
      puts "   • Notificación al paciente: ID #{notif_paciente.id}"
      puts "   • Notificación al médico: ID #{notif_medico.id}"
      puts ""
      puts "💡 Los usuarios verán estas notificaciones en su panel"
      
    rescue => e
      puts "❌ Error: #{e.message}"
    end
    
    puts "=" * 70
  end
end
