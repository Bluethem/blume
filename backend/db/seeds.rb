# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Este archivo se usa para poblar la base de datos con datos iniciales
# Ejecutar: rails db:seed

puts "Iniciando seed de datos..."

# =====================================================
# 1. CREAR USUARIOS ADMINISTRADORES
# =====================================================
puts "\n Creando administradores..."

admin1 = Usuario.create!(
  email: 'admin@hospital.com',
  password: 'password123',
  password_confirmation: 'password123',
  nombre: 'Carlos',
  apellido: 'Administrador',
  telefono: '987654321',
  direccion: 'Av. Administración 123, Lima',
  rol: :administrador,
  activo: true
)

puts "Administrador creado: #{admin1.email}"

# =====================================================
# 2. CREAR CERTIFICACIONES
# =====================================================
puts "\n Creando certificaciones médicas..."

certificaciones = [
  { nombre: 'Medicina General', institucion_emisora: 'Universidad Nacional Mayor de San Marcos', descripcion: 'Certificación en medicina general' },
  { nombre: 'Cardiología', institucion_emisora: 'Colegio Médico del Perú', descripcion: 'Especialización en cardiología' },
  { nombre: 'Pediatría', institucion_emisora: 'Hospital Nacional Cayetano Heredia', descripcion: 'Especialización en pediatría' },
  { nombre: 'Traumatología', institucion_emisora: 'Hospital Rebagliati', descripcion: 'Especialización en traumatología' },
  { nombre: 'Dermatología', institucion_emisora: 'Universidad Peruana Cayetano Heredia', descripcion: 'Especialización en dermatología' },
  { nombre: 'Ginecología', institucion_emisora: 'Instituto Nacional Materno Perinatal', descripcion: 'Especialización en ginecología' }
]

certificaciones_creadas = certificaciones.map do |cert|
  Certificacion.create!(cert)
end

puts "#{certificaciones_creadas.count} certificaciones creadas"

# =====================================================
# 3. CREAR MÉDICOS
# =====================================================
puts "\n Creando médicos..."

medicos_data = [
  {
    usuario: {
      email: 'dr.garcia@hospital.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Juan',
      apellido: 'García Pérez',
      telefono: '987123456',
      direccion: 'Av. Médica 456, Lima',
      rol: :medico
    },
    medico: {
      numero_colegiatura: 'CMP-12345',
      especialidad_principal: 'Cardiología',
      anios_experiencia: 15,
      biografia: 'Cardiólogo con 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares.',
      costo_consulta: 150.00,
      activo: true
    },
    certificaciones: ['Medicina General', 'Cardiología']
  },
  {
    usuario: {
      email: 'dra.martinez@hospital.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'María',
      apellido: 'Martínez López',
      telefono: '987234567',
      direccion: 'Av. Salud 789, Lima',
      rol: :medico
    },
    medico: {
      numero_colegiatura: 'CMP-23456',
      especialidad_principal: 'Pediatría',
      anios_experiencia: 10,
      biografia: 'Pediatra especializada en el cuidado integral de niños y adolescentes.',
      costo_consulta: 120.00,
      activo: true
    },
    certificaciones: ['Medicina General', 'Pediatría']
  },
  {
    usuario: {
      email: 'dr.rodriguez@hospital.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Roberto',
      apellido: 'Rodríguez Sánchez',
      telefono: '987345678',
      direccion: 'Jr. Médicos 321, Lima',
      rol: :medico
    },
    medico: {
      numero_colegiatura: 'CMP-34567',
      especialidad_principal: 'Traumatología',
      anios_experiencia: 12,
      biografia: 'Traumatólogo con amplia experiencia en cirugía ortopédica y tratamiento de lesiones deportivas.',
      costo_consulta: 180.00,
      activo: true
    },
    certificaciones: ['Medicina General', 'Traumatología']
  },
  {
    usuario: {
      email: 'dra.flores@hospital.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Ana',
      apellido: 'Flores Castillo',
      telefono: '987456789',
      direccion: 'Av. Principal 654, Lima',
      rol: :medico
    },
    medico: {
      numero_colegiatura: 'CMP-45678',
      especialidad_principal: 'Dermatología',
      anios_experiencia: 8,
      biografia: 'Dermatóloga especializada en tratamientos estéticos y enfermedades de la piel.',
      costo_consulta: 140.00,
      activo: true
    },
    certificaciones: ['Medicina General', 'Dermatología']
  },
  {
    usuario: {
      email: 'dra.torres@hospital.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Patricia',
      apellido: 'Torres Vega',
      telefono: '987567890',
      direccion: 'Av. Las Flores 987, Lima',
      rol: :medico
    },
    medico: {
      numero_colegiatura: 'CMP-56789',
      especialidad_principal: 'Ginecología',
      anios_experiencia: 14,
      biografia: 'Ginecóloga con amplia experiencia en salud reproductiva y control prenatal.',
      costo_consulta: 160.00,
      activo: true
    },
    certificaciones: ['Medicina General', 'Ginecología']
  }
]

medicos_creados = []

medicos_data.each do |data|
  usuario = Usuario.create!(data[:usuario])
  medico = Medico.create!(data[:medico].merge(usuario: usuario))
  
  # Asignar certificaciones
  data[:certificaciones].each do |cert_nombre|
    certificacion = certificaciones_creadas.find { |c| c.nombre == cert_nombre }
    if certificacion
      MedicoCertificacion.create!(
        medico: medico,
        certificacion: certificacion,
        fecha_obtencion: rand(5..15).years.ago,
        numero_certificado: "CERT-#{SecureRandom.hex(4).upcase}"
      )
    end
  end
  
  medicos_creados << medico
  puts " Médico creado: Dr(a). #{usuario.nombre} #{usuario.apellido} - #{medico.especialidad_principal}"
end

# =====================================================
# 4. CREAR HORARIOS PARA LOS MÉDICOS
# =====================================================
puts "\n Creando horarios de atención..."

medicos_creados.each do |medico|
  # Lunes a Viernes: 9:00 AM - 1:00 PM
  (1..5).each do |dia|
    HorarioMedico.create!(
      medico: medico,
      dia_semana: dia,
      hora_inicio: '09:00',
      hora_fin: '13:00',
      duracion_cita_minutos: 30,
      activo: true
    )
  end
  
  # Lunes a Viernes: 3:00 PM - 7:00 PM
  (1..5).each do |dia|
    HorarioMedico.create!(
      medico: medico,
      dia_semana: dia,
      hora_inicio: '15:00',
      hora_fin: '19:00',
      duracion_cita_minutos: 30,
      activo: true
    )
  end
  
  # Sábados: 9:00 AM - 1:00 PM
  HorarioMedico.create!(
    medico: medico,
    dia_semana: 6,
    hora_inicio: '09:00',
    hora_fin: '13:00',
    duracion_cita_minutos: 30,
    activo: true
  )
  
  puts " Horarios creados para Dr(a). #{medico.usuario.nombre} #{medico.usuario.apellido}"
end

# =====================================================
# 5. CREAR PACIENTES
# =====================================================
puts "\n Creando pacientes..."

pacientes_data = [
  {
    usuario: {
      email: 'juan.perez@email.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Juan',
      apellido: 'Pérez Gómez',
      telefono: '912345678',
      direccion: 'Av. Los Rosales 123, Lima',
      rol: :paciente
    },
    paciente: {
      fecha_nacimiento: '1985-05-15',
      genero: :masculino,
      numero_documento: '12345678',
      tipo_documento: :dni,
      grupo_sanguineo: 'O+',
      alergias: 'Penicilina',
      observaciones: 'Paciente con hipertensión controlada'
    }
  },
  {
    usuario: {
      email: 'maria.lopez@email.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'María',
      apellido: 'López Silva',
      telefono: '923456789',
      direccion: 'Jr. Las Flores 456, Lima',
      rol: :paciente
    },
    paciente: {
      fecha_nacimiento: '1990-08-22',
      genero: :femenino,
      numero_documento: '23456789',
      tipo_documento: :dni,
      grupo_sanguineo: 'A+',
      alergias: 'Ninguna',
      observaciones: nil
    }
  },
  {
    usuario: {
      email: 'carlos.rodriguez@email.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Carlos',
      apellido: 'Rodríguez Vega',
      telefono: '934567890',
      direccion: 'Av. Principal 789, Lima',
      rol: :paciente
    },
    paciente: {
      fecha_nacimiento: '1978-12-10',
      genero: :masculino,
      numero_documento: '34567890',
      tipo_documento: :dni,
      grupo_sanguineo: 'B+',
      alergias: 'Polen, ácaros',
      observaciones: 'Paciente con diabetes tipo 2'
    }
  },
  {
    usuario: {
      email: 'ana.martinez@email.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Ana',
      apellido: 'Martínez Flores',
      telefono: '945678901',
      direccion: 'Jr. Los Pinos 321, Lima',
      rol: :paciente
    },
    paciente: {
      fecha_nacimiento: '1995-03-18',
      genero: :femenino,
      numero_documento: '45678901',
      tipo_documento: :dni,
      grupo_sanguineo: 'AB+',
      alergias: 'Mariscos',
      observaciones: nil
    }
  },
  {
    usuario: {
      email: 'pedro.sanchez@email.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Pedro',
      apellido: 'Sánchez Castro',
      telefono: '956789012',
      direccion: 'Av. Las Palmeras 654, Lima',
      rol: :paciente
    },
    paciente: {
      fecha_nacimiento: '1982-07-25',
      genero: :masculino,
      numero_documento: '56789012',
      tipo_documento: :dni,
      grupo_sanguineo: 'O-',
      alergias: 'Ninguna',
      observaciones: 'Paciente deportista'
    }
  },
  {
    usuario: {
      email: 'lucia.torres@email.com',
      password: 'password123',
      password_confirmation: 'password123',
      nombre: 'Lucía',
      apellido: 'Torres Mendoza',
      telefono: '967890123',
      direccion: 'Jr. Los Eucaliptos 987, Lima',
      rol: :paciente
    },
    paciente: {
      fecha_nacimiento: '2000-11-30',
      genero: :femenino,
      numero_documento: '67890123',
      tipo_documento: :dni,
      grupo_sanguineo: 'A-',
      alergias: 'Aspirina',
      observaciones: nil
    }
  }
]

pacientes_creados = []

pacientes_data.each do |data|
  usuario = Usuario.create!(data[:usuario])
  paciente = Paciente.create!(data[:paciente].merge(usuario: usuario))
  pacientes_creados << paciente
  puts "✅ Paciente creado: #{usuario.nombre} #{usuario.apellido}"
end

# =====================================================
# 6. CREAR CITAS DE EJEMPLO
# =====================================================
puts "\n Creando citas de ejemplo..."

# Cita 1: Pendiente - Próxima semana
cita1 = Cita.create!(
  paciente: pacientes_creados[0],
  medico: medicos_creados[0],
  fecha_hora_inicio: 1.week.from_now.beginning_of_week.change(hour: 10, min: 0), # Lunes
  fecha_hora_fin: 1.week.from_now.beginning_of_week.change(hour: 10, min: 30),
  estado: :pendiente,
  motivo_consulta: 'Control de presión arterial',
  costo: medicos_creados[0].costo_consulta
)

Notificacion.create!(
  usuario: pacientes_creados[0].usuario,
  cita: cita1,
  tipo: :cita_creada,
  titulo: 'Cita creada exitosamente',
  mensaje: "Tu cita con Dr. #{medicos_creados[0].usuario.nombre} #{medicos_creados[0].usuario.apellido} ha sido creada para el #{cita1.fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')}",
  leida: false
)

puts " Cita creada: Paciente #{pacientes_creados[0].usuario.nombre} con Dr. #{medicos_creados[0].usuario.nombre}"

# Cita 2: Confirmada - En 3 días
fecha_cita2 = 3.days.from_now
fecha_cita2 = fecha_cita2.next_occurring(:monday) if fecha_cita2.sunday? || fecha_cita2.saturday?
cita2 = Cita.create!(
  paciente: pacientes_creados[1],
  medico: medicos_creados[1],
  fecha_hora_inicio: fecha_cita2.change(hour: 15, min: 30),
  fecha_hora_fin: fecha_cita2.change(hour: 16, min: 0),
  estado: :confirmada,
  motivo_consulta: 'Control de niño sano',
  costo: medicos_creados[1].costo_consulta
)

Notificacion.create!(
  usuario: pacientes_creados[1].usuario,
  cita: cita2,
  tipo: :cita_confirmada,
  titulo: 'Cita confirmada',
  mensaje: "Tu cita con Dra. #{medicos_creados[1].usuario.nombre} #{medicos_creados[1].usuario.apellido} ha sido confirmada",
  leida: true,
  fecha_leida: 1.day.ago
)

puts " Cita creada: Paciente #{pacientes_creados[1].usuario.nombre} con Dra. #{medicos_creados[1].usuario.nombre}"

# Cita 3: Completada - Hace 1 semana
cita3 = Cita.create!(
  paciente: pacientes_creados[2],
  medico: medicos_creados[2],
  fecha_hora_inicio: 1.week.ago.beginning_of_week.change(hour: 11, min: 0), # Lunes pasado
  fecha_hora_fin: 1.week.ago.beginning_of_week.change(hour: 11, min: 30),
  estado: :completada,
  motivo_consulta: 'Dolor de rodilla',
  observaciones: 'Paciente presenta inflamación leve',
  diagnostico: 'Tendinitis rotuliana. Se recomienda reposo y fisioterapia.',
  costo: medicos_creados[2].costo_consulta
)

puts " Cita creada: Paciente #{pacientes_creados[2].usuario.nombre} con Dr. #{medicos_creados[2].usuario.nombre}"

# Cita 4: Cancelada
fecha_cita4 = 5.days.ago
fecha_cita4 = fecha_cita4.next_occurring(:tuesday) unless fecha_cita4.tuesday?
cita4 = Cita.create!(
  paciente: pacientes_creados[3],
  medico: medicos_creados[3],
  fecha_hora_inicio: fecha_cita4.change(hour: 16, min: 0),
  fecha_hora_fin: fecha_cita4.change(hour: 16, min: 30),
  estado: :cancelada,
  motivo_consulta: 'Consulta dermatológica',
  motivo_cancelacion: 'Paciente tuvo un imprevisto laboral',
  cancelada_por_id: pacientes_creados[3].usuario.id,
  costo: medicos_creados[3].costo_consulta
)

Notificacion.create!(
  usuario: pacientes_creados[3].usuario,
  cita: cita4,
  tipo: :cita_cancelada,
  titulo: 'Cita cancelada',
  mensaje: 'Tu cita ha sido cancelada exitosamente',
  leida: true,
  fecha_leida: 2.days.ago
)

puts " Cita creada: Paciente #{pacientes_creados[3].usuario.nombre} con Dra. #{medicos_creados[3].usuario.nombre}"

# Cita 5: Pendiente - Próximo día hábil
fecha_cita5 = 1.day.from_now
# Asegurar que sea día hábil (lunes a viernes)
while fecha_cita5.saturday? || fecha_cita5.sunday?
  fecha_cita5 += 1.day
end

cita5 = Cita.create!(
  paciente: pacientes_creados[4],
  medico: medicos_creados[4], # Ginecóloga
  fecha_hora_inicio: fecha_cita5.change(hour: 9, min: 30),
  fecha_hora_fin: fecha_cita5.change(hour: 10, min: 0),
  estado: :pendiente,
  motivo_consulta: 'Control prenatal',
  costo: medicos_creados[4].costo_consulta
)

# Recordatorio de cita
Notificacion.create!(
  usuario: pacientes_creados[4].usuario,
  cita: cita5,
  tipo: :recordatorio,
  titulo: 'Recordatorio de cita',
  mensaje: "Recuerda tu cita el #{cita5.fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M')} con Dra. #{medicos_creados[4].usuario.nombre} #{medicos_creados[4].usuario.apellido}",
  leida: false
)

puts "✅ Cita creada: Paciente #{pacientes_creados[4].usuario.nombre} con Dra. #{medicos_creados[4].usuario.nombre}"

# Cita 6: Confirmada - Próximo día hábil + 1
fecha_cita6 = 2.days.from_now
# Asegurar que sea día hábil (lunes a viernes)
while fecha_cita6.saturday? || fecha_cita6.sunday?
  fecha_cita6 += 1.day
end

cita6 = Cita.create!(
  paciente: pacientes_creados[5],
  medico: medicos_creados[0], # Cardiólogo
  fecha_hora_inicio: fecha_cita6.change(hour: 17, min: 0),
  fecha_hora_fin: fecha_cita6.change(hour: 17, min: 30),
  estado: :confirmada,
  motivo_consulta: 'Chequeo cardiológico preventivo',
  costo: medicos_creados[0].costo_consulta
)

puts "✅ Cita creada: Paciente #{pacientes_creados[5].usuario.nombre} con Dr. #{medicos_creados[0].usuario.nombre}"

# =====================================================
# RESUMEN
# =====================================================
puts "\n" + "="*60
puts "¡SEED COMPLETADO EXITOSAMENTE!"
puts "="*60
puts "Resumen de datos creados:"
puts "   - Administradores: #{Usuario.administrador.count}"
puts "   - Médicos: #{Medico.count}"
puts "   - Pacientes: #{Paciente.count}"
puts "   - Certificaciones: #{Certificacion.count}"
puts "   - Horarios médicos: #{HorarioMedico.count}"
puts "   - Citas: #{Cita.count}"
puts "   - Notificaciones: #{Notificacion.count}"
puts "="*60
puts "\nCredenciales de acceso:"
puts "   Admin: admin@hospital.com / password123"
puts "\n   Médicos:"
medicos_creados.each do |medico|
  puts "   - #{medico.usuario.email} / password123"
end
puts "\n   Pacientes:"
pacientes_creados.each do |paciente|
  puts "   - #{paciente.usuario.email} / password123"
end
puts "="*60
puts "\n¡Listo para usar!"