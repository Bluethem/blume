## Diseño de Base de Datos (PostgreSQL)

### Diagrama Entidad-Relación

![Diagrama relacional](/database/DiagramaRelacionalPC2.png)

### Tablas Detalladas

#### 1. USUARIO
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE, NOT NULL, INDEX)
- password_digest (VARCHAR, NOT NULL)
- nombre (VARCHAR, NOT NULL)
- apellido (VARCHAR, NOT NULL)
- telefono (VARCHAR)
- direccion (TEXT)
- rol (ENUM: 'paciente', 'medico', 'administrador')
- activo (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_usuarios_on_email` (UNIQUE)
- `index_usuarios_on_rol`

---

#### 2. PACIENTE
```sql
- id (UUID, PK)
- usuario_id (UUID, FK → Usuario, UNIQUE, NOT NULL)
- fecha_nacimiento (DATE)
- genero (ENUM: 'masculino', 'femenino', 'otro')
- numero_documento (VARCHAR, UNIQUE)
- tipo_documento (ENUM: 'DNI', 'pasaporte', 'carnet_extranjeria')
- grupo_sanguineo (VARCHAR)
- alergias (TEXT)
- observaciones (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_pacientes_on_usuario_id` (UNIQUE)
- `index_pacientes_on_numero_documento` (UNIQUE)

---

#### 3. MEDICO
```sql
- id (UUID, PK)
- usuario_id (UUID, FK → Usuario, UNIQUE, NOT NULL)
- numero_colegiatura (VARCHAR, UNIQUE, NOT NULL)
- especialidad_principal (VARCHAR, NOT NULL)
- años_experiencia (INTEGER)
- biografia (TEXT)
- costo_consulta (DECIMAL(10,2))
- activo (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_medicos_on_usuario_id` (UNIQUE)
- `index_medicos_on_numero_colegiatura` (UNIQUE)
- `index_medicos_on_especialidad_principal`

---

#### 4. CERTIFICACION
```sql
- id (UUID, PK)
- nombre (VARCHAR, NOT NULL)
- institucion_emisora (VARCHAR)
- descripcion (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

#### 5. MEDICO_CERTIFICACION
```sql
- id (UUID, PK)
- medico_id (UUID, FK → Medico, NOT NULL)
- certificacion_id (UUID, FK → Certificacion, NOT NULL)
- fecha_obtencion (DATE)
- fecha_expiracion (DATE, NULLABLE)
- numero_certificado (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_medico_certificaciones_on_medico_id`
- `index_medico_certificaciones_on_certificacion_id`
- `index_unique_medico_certificacion` (UNIQUE: medico_id, certificacion_id)

---

#### 6. HORARIO_MEDICO
```sql
- id (UUID, PK)
- medico_id (UUID, FK → Medico, NOT NULL)
- dia_semana (INTEGER, 0=domingo, 1=lunes, ..., 6=sábado)
- hora_inicio (TIME, NOT NULL)
- hora_fin (TIME, NOT NULL)
- duracion_cita_minutos (INTEGER, DEFAULT: 30)
- activo (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_horarios_on_medico_id`
- `index_horarios_on_dia_semana`

**Validaciones:**
- hora_fin > hora_inicio
- dia_semana BETWEEN 0 AND 6
- duracion_cita_minutos > 0

---

#### 7. CITA
```sql
- id (UUID, PK)
- paciente_id (UUID, FK → Paciente, NOT NULL)
- medico_id (UUID, FK → Medico, NOT NULL)
- fecha_hora_inicio (TIMESTAMP, NOT NULL, INDEX)
- fecha_hora_fin (TIMESTAMP, NOT NULL)
- estado (ENUM: 'pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio')
- motivo_consulta (TEXT)
- observaciones (TEXT)
- diagnostico (TEXT, NULLABLE)
- motivo_cancelacion (TEXT, NULLABLE)
- cancelada_por_id (UUID, FK → Usuario, NULLABLE)
- costo (DECIMAL(10,2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_citas_on_paciente_id`
- `index_citas_on_medico_id`
- `index_citas_on_fecha_hora_inicio`
- `index_citas_on_estado`
- `index_citas_on_medico_fecha` (medico_id, fecha_hora_inicio)

**Validaciones:**
- fecha_hora_fin > fecha_hora_inicio
- No permitir superposición de citas del mismo médico
- fecha_hora_inicio >= CURRENT_TIMESTAMP (no reservar en el pasado)

---

#### 8. NOTIFICACION
```sql
- id (UUID, PK)
- usuario_id (UUID, FK → Usuario, NOT NULL)
- cita_id (UUID, FK → Cita, NULLABLE)
- tipo (ENUM: 'cita_creada', 'cita_confirmada', 'cita_cancelada', 'recordatorio')
- titulo (VARCHAR, NOT NULL)
- mensaje (TEXT, NOT NULL)
- leida (BOOLEAN, DEFAULT: false)
- fecha_leida (TIMESTAMP, NULLABLE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Índices:**
- `index_notificaciones_on_usuario_id`
- `index_notificaciones_on_cita_id`
- `index_notificaciones_on_leida`
- `index_notificaciones_on_created_at`

---

### Relaciones

```
Usuario 1:1 Paciente
Usuario 1:1 Medico
Medico N:M Certificacion (a través de Medico_Certificacion)
Medico 1:N Horario_Medico
Medico 1:N Cita
Paciente 1:N Cita
Usuario 1:N Notificacion
Cita 1:N Notificacion
```

### Scripts SQL:

#### Creación de tablas

![Creacion de tablas para PostgreSQL](./scripts/scriptDatabase.sql)

#### Poblamiento inicial de datos

![Datos de prueba para PostgreSQL](./scripts/datos_prueba.sql)