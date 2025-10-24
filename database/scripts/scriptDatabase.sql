-- =====================================================
-- SISTEMA DE CITAS MÉDICAS
-- Base de Datos: PostgreSQL con UUID
-- =====================================================

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. TABLA USUARIOS
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_digest VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    rol INTEGER DEFAULT 0 NOT NULL, -- 0: paciente, 1: medico, 2: administrador
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_usuarios_on_email ON usuarios(email);
CREATE INDEX index_usuarios_on_rol ON usuarios(rol);

-- =====================================================
-- 2. TABLA PACIENTES
-- =====================================================
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_nacimiento DATE,
    genero INTEGER, -- 0: masculino, 1: femenino, 2: otro
    numero_documento VARCHAR(20) UNIQUE,
    tipo_documento INTEGER, -- 0: DNI, 1: pasaporte, 2: carnet_extranjeria
    grupo_sanguineo VARCHAR(5),
    alergias TEXT,
    observaciones TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_pacientes_on_usuario_id ON pacientes(usuario_id);
CREATE INDEX index_pacientes_on_numero_documento ON pacientes(numero_documento);

-- =====================================================
-- 3. TABLA MEDICOS
-- =====================================================
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_colegiatura VARCHAR(50) NOT NULL UNIQUE,
    especialidad_principal VARCHAR(255) NOT NULL,
    anios_experiencia INTEGER,
    biografia TEXT,
    costo_consulta DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_medicos_on_usuario_id ON medicos(usuario_id);
CREATE INDEX index_medicos_on_numero_colegiatura ON medicos(numero_colegiatura);
CREATE INDEX index_medicos_on_especialidad_principal ON medicos(especialidad_principal);

-- =====================================================
-- 4. TABLA CERTIFICACIONES
-- =====================================================
CREATE TABLE certificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    institucion_emisora VARCHAR(255),
    descripcion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_certificaciones_on_nombre ON certificaciones(nombre);

-- =====================================================
-- 5. TABLA MEDICO_CERTIFICACIONES (N:M)
-- =====================================================
CREATE TABLE medico_certificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    certificacion_id UUID NOT NULL REFERENCES certificaciones(id) ON DELETE CASCADE,
    fecha_obtencion DATE,
    fecha_expiracion DATE,
    numero_certificado VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(medico_id, certificacion_id)
);

CREATE INDEX index_medico_certificaciones_on_medico_id ON medico_certificaciones(medico_id);
CREATE INDEX index_medico_certificaciones_on_certificacion_id ON medico_certificaciones(certificacion_id);

-- =====================================================
-- 6. TABLA HORARIO_MEDICOS
-- =====================================================
CREATE TABLE horario_medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL CHECK (hora_fin > hora_inicio),
    duracion_cita_minutos INTEGER DEFAULT 30 NOT NULL CHECK (duracion_cita_minutos > 0),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_horario_medicos_on_medico_id ON horario_medicos(medico_id);
CREATE INDEX index_horario_medicos_on_dia_semana ON horario_medicos(dia_semana);

-- =====================================================
-- 7. TABLA CITAS
-- =====================================================
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    fecha_hora_inicio TIMESTAMP NOT NULL,
    fecha_hora_fin TIMESTAMP NOT NULL CHECK (fecha_hora_fin > fecha_hora_inicio),
    estado INTEGER DEFAULT 0 NOT NULL, -- 0: pendiente, 1: confirmada, 2: cancelada, 3: completada, 4: no_asistio
    motivo_consulta TEXT,
    observaciones TEXT,
    diagnostico TEXT,
    motivo_cancelacion TEXT,
    cancelada_por_id UUID REFERENCES usuarios(id),
    costo DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_citas_on_paciente_id ON citas(paciente_id);
CREATE INDEX index_citas_on_medico_id ON citas(medico_id);
CREATE INDEX index_citas_on_fecha_hora_inicio ON citas(fecha_hora_inicio);
CREATE INDEX index_citas_on_estado ON citas(estado);
CREATE INDEX index_citas_on_medico_fecha ON citas(medico_id, fecha_hora_inicio);

-- =====================================================
-- 8. TABLA NOTIFICACIONES
-- =====================================================
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cita_id UUID REFERENCES citas(id) ON DELETE CASCADE,
    tipo INTEGER NOT NULL, -- 0: cita_creada, 1: cita_confirmada, 2: cita_cancelada, 3: recordatorio
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE NOT NULL,
    fecha_leida TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX index_notificaciones_on_usuario_id ON notificaciones(usuario_id);
CREATE INDEX index_notificaciones_on_cita_id ON notificaciones(cita_id);
CREATE INDEX index_notificaciones_on_leida ON notificaciones(leida);
CREATE INDEX index_notificaciones_on_created_at ON notificaciones(created_at);
CREATE INDEX index_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicos_updated_at BEFORE UPDATE ON medicos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificaciones_updated_at BEFORE UPDATE ON certificaciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medico_certificaciones_updated_at BEFORE UPDATE ON medico_certificaciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horario_medicos_updated_at BEFORE UPDATE ON horario_medicos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notificaciones_updated_at BEFORE UPDATE ON notificaciones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS EN LAS TABLAS
-- =====================================================
COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE pacientes IS 'Información específica de pacientes';
COMMENT ON TABLE medicos IS 'Información específica de médicos';
COMMENT ON TABLE certificaciones IS 'Catálogo de certificaciones médicas';
COMMENT ON TABLE medico_certificaciones IS 'Relación N:M entre médicos y certificaciones';
COMMENT ON TABLE horario_medicos IS 'Horarios de atención de los médicos';
COMMENT ON TABLE citas IS 'Registro de citas médicas';
COMMENT ON TABLE notificaciones IS 'Notificaciones del sistema para usuarios';

-- =====================================================
-- CONSULTAS ÚTILES
-- =====================================================

-- Ver todas las tablas creadas
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Ver estructura de una tabla
-- \d usuarios

-- Ver todos los índices
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verificar extensión pgcrypto
-- SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Generar un UUID
-- SELECT gen_random_uuid();