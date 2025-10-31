-- =====================================================
-- DATOS DE PRUEBA PARA SISTEMA BLUME
-- =====================================================

-- NOTA: Las contraseñas están hasheadas con BCrypt
-- Contraseña para todos: "password123"
-- NOTA 2: Al momento de correr el programa utilizar el mismo database que incorpore en la carpeeta
-- de backend /backend/db/seeds.rb, ya que ruby utiliza dicha poblacion (crea las tablas).
-- Los comandos en consola son: rails db:create, rails db:migration, rails db:seed.

-- =====================================================
-- 1. USUARIOS
-- =====================================================

-- Administrador Super Admin
INSERT INTO usuarios (id, email, password_digest, nombre, apellido, telefono, rol, es_super_admin, activo)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'admin@blume.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm', 
'Admin', 'Principal', '987654321', 2, TRUE, TRUE);

-- Médicos
INSERT INTO usuarios (id, email, password_digest, nombre, apellido, telefono, rol, activo)
VALUES 
('m2222222-2222-2222-2222-222222222222', 'dra.garcia@blume.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm',
'María', 'García', '987654322', 1, TRUE),
('m3333333-3333-3333-3333-333333333333', 'dr.rodriguez@blume.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm',
'Carlos', 'Rodríguez', '987654323', 1, TRUE),
('m4444444-4444-4444-4444-444444444444', 'dra.lopez@blume.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm',
'Ana', 'López', '987654324', 1, TRUE);

-- Pacientes
INSERT INTO usuarios (id, email, password_digest, nombre, apellido, telefono, rol, activo)
VALUES 
('p5555555-5555-5555-5555-555555555555', 'juan.perez@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm',
'Juan', 'Pérez', '987654325', 0, TRUE),
('p6666666-6666-6666-6666-666666666666', 'lucia.martinez@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm',
'Lucía', 'Martínez', '987654326', 0, TRUE),
('p7777777-7777-7777-7777-777777777777', 'pedro.gomez@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/L3Fm',
'Pedro', 'Gómez', '987654327', 0, TRUE);

-- =====================================================
-- 2. PACIENTES
-- =====================================================
INSERT INTO pacientes (id, usuario_id, fecha_nacimiento, genero, numero_documento, tipo_documento, grupo_sanguineo)
VALUES 
('pa111111-1111-1111-1111-111111111111', 'p5555555-5555-5555-5555-555555555555', '1990-05-15', 0, '12345678', 0, 'O+'),
('pa222222-2222-2222-2222-222222222222', 'p6666666-6666-6666-6666-666666666666', '1985-08-22', 1, '87654321', 0, 'A+'),
('pa333333-3333-3333-3333-333333333333', 'p7777777-7777-7777-7777-777777777777', '1995-12-10', 0, '11223344', 0, 'B+');

-- =====================================================
-- 3. MÉDICOS
-- =====================================================
INSERT INTO medicos (id, usuario_id, numero_colegiatura, especialidad_principal, anios_experiencia, biografia, costo_consulta, activo)
VALUES 
('me111111-1111-1111-1111-111111111111', 'm2222222-2222-2222-2222-222222222222', 'CMP-12345', 
'Cardiología', 15, 'Especialista en cardiología con más de 15 años de experiencia.', 150.00, TRUE),
('me222222-2222-2222-2222-222222222222', 'm3333333-3333-3333-3333-333333333333', 'CMP-54321', 
'Pediatría', 10, 'Pediatra especializado en atención infantil.', 120.00, TRUE),
('me333333-3333-3333-3333-333333333333', 'm4444444-4444-4444-4444-444444444444', 'CMP-99887', 
'Dermatología', 8, 'Dermatóloga especializada en tratamientos estéticos.', 130.00, TRUE);

-- =====================================================
-- 4. CERTIFICACIONES
-- =====================================================
INSERT INTO certificaciones (id, nombre, institucion_emisora, descripcion)
VALUES 
('c1111111-1111-1111-1111-111111111111', 'Especialidad en Cardiología', 'Universidad Nacional Mayor de San Marcos', 
'Especialización en cardiología clínica e intervencionista'),
('c2222222-2222-2222-2222-222222222222', 'Diplomado en Ecocardiografía', 'Instituto Nacional Cardiovascular', 
'Certificación en ecocardiografía avanzada'),
('c3333333-3333-3333-3333-333333333333', 'Especialidad en Pediatría', 'Universidad Peruana Cayetano Heredia', 
'Especialización en pediatría general'),
('c4444444-4444-4444-4444-444444444444', 'Diplomado en Dermatología Estética', 'Sociedad Peruana de Dermatología', 
'Certificación en procedimientos estéticos dermatológicos');

-- =====================================================
-- 5. MÉDICO_CERTIFICACIONES
-- =====================================================
INSERT INTO medico_certificaciones (medico_id, certificacion_id, fecha_obtencion, numero_certificado)
VALUES 
('me111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '2010-03-15', 'CERT-2010-001'),
('me111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', '2015-06-20', 'CERT-2015-045'),
('me222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', '2013-05-10', 'CERT-2013-023'),
('me333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', '2018-09-15', 'CERT-2018-067');

-- =====================================================
-- 6. HORARIOS MÉDICOS
-- =====================================================
-- Dra. García (Cardiología) - Lunes a Viernes 9am-5pm
INSERT INTO horario_medicos (medico_id, dia_semana, hora_inicio, hora_fin, duracion_cita_minutos, activo)
VALUES 
('me111111-1111-1111-1111-111111111111', 1, '09:00', '17:00', 30, TRUE),
('me111111-1111-1111-1111-111111111111', 2, '09:00', '17:00', 30, TRUE),
('me111111-1111-1111-1111-111111111111', 3, '09:00', '17:00', 30, TRUE),
('me111111-1111-1111-1111-111111111111', 4, '09:00', '17:00', 30, TRUE),
('me111111-1111-1111-1111-111111111111', 5, '09:00', '17:00', 30, TRUE);

-- Dr. Rodríguez (Pediatría) - Lunes a Sábado 10am-6pm
INSERT INTO horario_medicos (medico_id, dia_semana, hora_inicio, hora_fin, duracion_cita_minutos, activo)
VALUES 
('me222222-2222-2222-2222-222222222222', 1, '10:00', '18:00', 30, TRUE),
('me222222-2222-2222-2222-222222222222', 2, '10:00', '18:00', 30, TRUE),
('me222222-2222-2222-2222-222222222222', 3, '10:00', '18:00', 30, TRUE),
('me222222-2222-2222-2222-222222222222', 4, '10:00', '18:00', 30, TRUE),
('me222222-2222-2222-2222-222222222222', 5, '10:00', '18:00', 30, TRUE),
('me222222-2222-2222-2222-222222222222', 6, '10:00', '14:00', 30, TRUE);

-- Dra. López (Dermatología) - Martes a Sábado 2pm-8pm
INSERT INTO horario_medicos (medico_id, dia_semana, hora_inicio, hora_fin, duracion_cita_minutos, activo)
VALUES 
('me333333-3333-3333-3333-333333333333', 2, '14:00', '20:00', 45, TRUE),
('me333333-3333-3333-3333-333333333333', 3, '14:00', '20:00', 45, TRUE),
('me333333-3333-3333-3333-333333333333', 4, '14:00', '20:00', 45, TRUE),
('me333333-3333-3333-3333-333333333333', 5, '14:00', '20:00', 45, TRUE),
('me333333-3333-3333-3333-333333333333', 6, '14:00', '20:00', 45, TRUE);

-- =====================================================
-- 7. CITAS
-- =====================================================
-- Citas pendientes
INSERT INTO citas (paciente_id, medico_id, fecha_hora_inicio, fecha_hora_fin, estado, motivo_consulta, costo)
VALUES 
('pa111111-1111-1111-1111-111111111111', 'me111111-1111-1111-1111-111111111111', 
NOW() + INTERVAL '2 days' + INTERVAL '10 hours', NOW() + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes', 
0, 'Control de presión arterial', 150.00),
('pa222222-2222-2222-2222-222222222222', 'me222222-2222-2222-2222-222222222222', 
NOW() + INTERVAL '3 days' + INTERVAL '11 hours', NOW() + INTERVAL '3 days' + INTERVAL '11 hours 30 minutes', 
0, 'Control pediátrico de rutina', 120.00);

-- Citas confirmadas
INSERT INTO citas (paciente_id, medico_id, fecha_hora_inicio, fecha_hora_fin, estado, motivo_consulta, costo)
VALUES 
('pa333333-3333-3333-3333-333333333333', 'me333333-3333-3333-3333-333333333333', 
NOW() + INTERVAL '1 day' + INTERVAL '15 hours', NOW() + INTERVAL '1 day' + INTERVAL '15 hours 45 minutes', 
1, 'Consulta dermatológica por acné', 130.00);

-- Citas completadas
INSERT INTO citas (paciente_id, medico_id, fecha_hora_inicio, fecha_hora_fin, estado, motivo_consulta, diagnostico, costo)
VALUES 
('pa111111-1111-1111-1111-111111111111', 'me111111-1111-1111-1111-111111111111', 
NOW() - INTERVAL '7 days' + INTERVAL '10 hours', NOW() - INTERVAL '7 days' + INTERVAL '10 hours 30 minutes', 
3, 'Dolor en el pecho', 'Hipertensión arterial leve. Se receta enalapril 10mg cada 24 horas.', 150.00);

-- =====================================================
-- 8. NOTIFICACIONES
-- =====================================================
-- Notificación para paciente
INSERT INTO notificaciones (usuario_id, cita_id, tipo, titulo, mensaje, leida)
VALUES 
('p5555555-5555-5555-5555-555555555555', 
(SELECT id FROM citas WHERE paciente_id = 'pa111111-1111-1111-1111-111111111111' AND estado = 0 LIMIT 1),
0, 'Cita Creada', 
'Tu cita con Dra. García ha sido agendada para dentro de 2 días a las 10:00 AM.', FALSE);

-- Notificación para médico
INSERT INTO notificaciones (usuario_id, cita_id, tipo, titulo, mensaje, leida)
VALUES 
('m2222222-2222-2222-2222-222222222222', 
(SELECT id FROM citas WHERE paciente_id = 'pa111111-1111-1111-1111-111111111111' AND estado = 0 LIMIT 1),
0, 'Nueva Cita Agendada', 
'Juan Pérez ha agendado una cita contigo para dentro de 2 días a las 10:00 AM.', FALSE);

-- Recordatorio
INSERT INTO notificaciones (usuario_id, cita_id, tipo, titulo, mensaje, leida)
VALUES 
('p6666666-6666-6666-6666-666666666666', 
(SELECT id FROM citas WHERE paciente_id = 'pa222222-2222-2222-2222-222222222222' AND estado = 0 LIMIT 1),
3, 'Recordatorio de Cita', 
'Recuerda tu cita con Dr. Rodríguez mañana a las 11:00 AM.', FALSE);

-- =====================================================
-- CONSULTAS ÚTILES PARA VERIFICACIÓN
-- =====================================================

-- Ver todos los usuarios y sus roles
-- SELECT nombre, apellido, email, 
--        CASE rol 
--            WHEN 0 THEN 'Paciente'
--            WHEN 1 THEN 'Médico'
--            WHEN 2 THEN 'Administrador'
--        END as rol_nombre
-- FROM usuarios ORDER BY rol, nombre;

-- Ver médicos con sus especialidades
-- SELECT u.nombre, u.apellido, m.especialidad_principal, m.anios_experiencia, m.costo_consulta
-- FROM usuarios u
-- JOIN medicos m ON u.id = m.usuario_id
-- ORDER BY m.especialidad_principal;

-- Ver citas programadas
-- SELECT 
--     p_user.nombre || ' ' || p_user.apellido as paciente,
--     m_user.nombre || ' ' || m_user.apellido as medico,
--     c.fecha_hora_inicio,
--     CASE c.estado 
--         WHEN 0 THEN 'Pendiente'
--         WHEN 1 THEN 'Confirmada'
--         WHEN 2 THEN 'Cancelada'
--         WHEN 3 THEN 'Completada'
--         WHEN 4 THEN 'No asistió'
--     END as estado,
--     c.motivo_consulta
-- FROM citas c
-- JOIN pacientes p ON c.paciente_id = p.id
-- JOIN usuarios p_user ON p.usuario_id = p_user.id
-- JOIN medicos m ON c.medico_id = m.id
-- JOIN usuarios m_user ON m.usuario_id = m_user.id
-- ORDER BY c.fecha_hora_inicio DESC;

-- Ver horarios de atención por médico
-- SELECT 
--     u.nombre || ' ' || u.apellido as medico,
--     m.especialidad_principal,
--     CASE h.dia_semana
--         WHEN 0 THEN 'Domingo'
--         WHEN 1 THEN 'Lunes'
--         WHEN 2 THEN 'Martes'
--         WHEN 3 THEN 'Miércoles'
--         WHEN 4 THEN 'Jueves'
--         WHEN 5 THEN 'Viernes'
--         WHEN 6 THEN 'Sábado'
--     END as dia,
--     h.hora_inicio,
--     h.hora_fin,
--     h.duracion_cita_minutos
-- FROM horario_medicos h
-- JOIN medicos m ON h.medico_id = m.id
-- JOIN usuarios u ON m.usuario_id = u.id
-- ORDER BY u.nombre, h.dia_semana, h.hora_inicio;

-- Ver certificaciones de médicos
-- SELECT 
--     u.nombre || ' ' || u.apellido as medico,
--     c.nombre as certificacion,
--     c.institucion_emisora,
--     mc.fecha_obtencion,
--     mc.numero_certificado
-- FROM medico_certificaciones mc
-- JOIN medicos m ON mc.medico_id = m.id
-- JOIN usuarios u ON m.usuario_id = u.id
-- JOIN certificaciones c ON mc.certificacion_id = c.id
-- ORDER BY u.nombre, mc.fecha_obtencion;

-- Ver notificaciones no leídas por usuario
-- SELECT 
--     u.nombre || ' ' || u.apellido as usuario,
--     n.titulo,
--     n.mensaje,
--     n.created_at
-- FROM notificaciones n
-- JOIN usuarios u ON n.usuario_id = u.id
-- WHERE n.leida = FALSE
-- ORDER BY n.created_at DESC;
