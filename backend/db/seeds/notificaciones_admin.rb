# Seeds para notificaciones de prueba para administradores
puts "🔔 Creando notificaciones de prueba para administradores..."

# Encontrar usuarios administradores
admins = Usuario.where(rol: :administrador)

if admins.empty?
  puts "⚠️  No hay administradores en el sistema. Creando uno..."
  admin = Usuario.create!(
    nombre: 'Admin',
    apellido: 'Sistema',
    email: 'admin@blume.com',
    password: 'password123',
    password_confirmation: 'password123',
    rol: :administrador,
    activo: true,
    es_super_admin: true
  )
  admins = [admin]
end

# Crear notificaciones variadas para cada admin
admins.each do |admin|
  puts "  Creando notificaciones para #{admin.nombre_completo}..."
  
  # Notificación de cita creada
  Notificacion.create!(
    usuario: admin,
    tipo: 'cita_creada',
    titulo: 'Nueva cita programada',
    mensaje: 'Se ha programado una nueva cita para mañana a las 10:00 AM',
    leida: false
  )
  
  # Notificación de cita cancelada
  Notificacion.create!(
    usuario: admin,
    tipo: 'cita_cancelada',
    titulo: 'Cita cancelada',
    mensaje: 'La cita del paciente Juan Pérez ha sido cancelada',
    leida: false,
    created_at: 1.hour.ago
  )
  
  # Notificación de nueva cita
  Notificacion.create!(
    usuario: admin,
    tipo: 'cita_creada',
    titulo: 'Nueva cita registrada',
    mensaje: 'María González ha registrado una nueva cita para el viernes',
    leida: true,
    fecha_leida: 30.minutes.ago,
    created_at: 2.hours.ago
  )
  
  # Notificación de cita confirmada
  Notificacion.create!(
    usuario: admin,
    tipo: 'cita_confirmada',
    titulo: 'Cita confirmada',
    mensaje: 'El paciente Carlos Ruiz ha confirmado su cita del viernes',
    leida: false,
    created_at: 3.hours.ago
  )
  
  # Notificación de recordatorio
  Notificacion.create!(
    usuario: admin,
    tipo: 'recordatorio',
    titulo: 'Recordatorio de revisión',
    mensaje: 'Recuerda revisar las citas pendientes de confirmación',
    leida: true,
    fecha_leida: 1.day.ago,
    created_at: 1.day.ago
  )
  
  # Notificación de recordatorio
  Notificacion.create!(
    usuario: admin,
    tipo: 'recordatorio',
    titulo: 'Recordatorio de respaldo',
    mensaje: 'Recuerda hacer el respaldo semanal de la base de datos',
    leida: false,
    created_at: 12.hours.ago
  )
  
  puts "    ✅ 6 notificaciones creadas"
end

puts "✅ Seeds de notificaciones completados"
