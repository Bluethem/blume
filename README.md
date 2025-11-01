# Proyecto Blume

Aplicación web full-stack construida con Ruby on Rails 8 para el backend y Angular 20 para el frontend. El sistema permite la gestión integral de citas médicas, incluyendo registro de pacientes y médicos, reserva de consultas, notificaciones y panel administrativo.

---

## Caso de Estudio: Reserva de Consultas Externas

## Estructura del Proyecto

```
blume/
├── backend/                    # API REST en Ruby on Rails
│   ├── app/
│   │   ├── controllers/       # Controladores API
│   │   ├── models/            # Modelos ActiveRecord
│   │   ├── mailers/           # Mailers para notificaciones
│   │   └── jobs/              # Background jobs (notificaciones)
│   ├── config/
│   │   ├── routes.rb          # Rutas de la API
│   │   └── database.yml       # Configuración de PostgreSQL
│   ├── db/
│   │   ├── migrate/           # Migraciones de base de datos
│   │   └── seeds.rb           # Datos de prueba
│   ├── Gemfile                # Dependencias Ruby
│   └── .github/workflows/     # CI/CD con GitHub Actions
│
├── frontend/                   # Aplicación cliente en Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Componentes reutilizables
│   │   │   ├── pages/         # Páginas principales
│   │   │   ├── services/      # Servicios HTTP
│   │   │   ├── guards/        # Guards de autenticación
│   │   │   └── models/        # Interfaces TypeScript
│   │   ├── assets/            # Recursos estáticos
│   │   └── environments/      # Configuraciones de entorno
│   ├── package.json           # Dependencias npm
│   └── angular.json           # Configuración Angular
│
└── docs/                       # Documentación
    ├── database-diagram.png   # Diagrama ER
    └── api-documentation.md   # Documentación de endpoints
```

---

## Requisitos

### Frontend
- **Node.js:** 20+
- **Angular CLI:** 20+
- **npm:** 10+

### Backend
- **Ruby:** 3.3+
- **Rails:** 8.1+

### Database
- **PostgreSQL:** 14+

---

## Instalación y Ejecución

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Bluethem/blume
cd blume
```

### 2. Backend (Ruby on Rails)

#### Configuración

```bash
cd backend

# Instalar dependencias
bundle install

# Configurar base de datos en config/database.yml
# database: medical_appointments_development
# username: postgres
# password: tu_password
# host: localhost
# port: 5432

# Crear la base de datos
rails db:create

# Ejecutar migraciones
rails db:migrate

# Cargar datos de prueba (opcional)
rails db:seed
```

#### Ejecutar el servidor

```bash
rails server -p 3000
```

El backend correrá en: **http://localhost:3000**

#### Ejecutar tests

```bash
# Todos los tests
rails test

# Tests con cobertura
rails test:system
```

---

### 3. Frontend (Angular)

#### Configuración

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar la URL del backend en src/environments/environment.ts
# apiUrl: 'http://localhost:3000/api/v1'
```

#### Ejecutar el servidor de desarrollo

```bash
ng serve
```

El frontend correrá en: **http://localhost:4200**

#### Build para producción

```bash
ng build --configuration production
```

---

## Requerimientos Funcionales

### RF-01: Gestión de Usuarios
- Registro de nuevos usuarios (pacientes)
- Login y autenticación
- Recuperación de contraseña
- Edición de perfil

### RF-02: Gestión de Médicos
- Registro de médicos por administrador
- Gestión de especialidades
- Registro de certificaciones
- Definición de horarios de atención
- Configuración de costo de consulta

### RF-03: Reserva de Citas
- Visualización de horarios disponibles por médico
- Reserva de cita por paciente
- Confirmación automática o manual de cita
- Cancelación de cita (con motivo)
- Reprogramación de cita

### RF-04: Notificaciones
- Notificación al crear una cita
- Recordatorio 24 horas antes de la cita
- Notificación al cancelar o reprogramar
- Visualización de notificaciones en el sistema
- Envío de correos electrónicos

### RF-05: Panel Administrativo
- Dashboard con estadísticas
- Gestión de usuarios (activar/desactivar)
- Gestión de médicos y certificaciones
- Reportes de citas
- Logs del sistema

### RF-06: Historial
- Historial de citas por paciente
- Historial de atenciones por médico
- Registro de diagnósticos
- Observaciones médicas

---

## Requerimientos No Funcionales

### RNF-01: Seguridad
- **Autenticación:** JWT (JSON Web Tokens) con expiración
- **Autorización:** Roles y permisos (RBAC)
- **Contraseñas:** Hasheadas con BCrypt
- **HTTPS:** Obligatorio en producción
- **CORS:** Configurado correctamente
- **Validación:** Entrada de datos sanitizada
- **SQL Injection:** Prevenido con ActiveRecord

### RNF-02: Rendimiento
- **Tiempo de respuesta API:** < 200ms para consultas simples
- **Tiempo de carga página:** < 2s en la primera carga
- **Capacidad:** Soporte para 1000 usuarios concurrentes
- **Cache:** Implementado con Redis para datos frecuentes
- **Índices:** En columnas de búsqueda frecuente
- **Paginación:** En listados con más de 50 registros

### RNF-03: Escalabilidad
- **Arquitectura:** Separación frontend/backend (API REST)
- **Base de datos:** PostgreSQL con índices optimizados
- **Jobs asíncronos:** Solid Queue para tareas pesadas
- **Websockets:** Solid Cable para notificaciones en tiempo real
- **Horizontal scaling:** Compatible con load balancers

### RNF-04: Disponibilidad
- **Uptime:** 99.5% de disponibilidad
- **Backup:** Diario automático de base de datos
- **Recuperación:** Plan de disaster recovery
- **Monitoreo:** Logs centralizados
- **Salud del sistema:** Health checks cada 30s

### RNF-05: Usabilidad
- **Responsive design:** Compatible con desktop, tablet y móvil
- **Accesibilidad:** WCAG 2.1 nivel AA
- **Idioma:** Español (con soporte i18n para futuros idiomas)
- **Mensajes:** Claros y orientados al usuario
- **Loading states:** Indicadores de carga en operaciones

### RNF-06: Mantenibilidad
- **Código:** Clean code y principios SOLID
- **Testing:** Cobertura mínima del 80%
- **Documentación:** API documentada con Swagger/OpenAPI
- **Versionado:** Git con flujo GitFlow
- **CI/CD:** GitHub Actions para tests automáticos
- **Logs:** Estructurados y con niveles apropiados

### RNF-07: Compatibilidad
- **Navegadores:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **API:** RESTful con versionado (v1, v2, ...)
- **Base de datos:** PostgreSQL 14+
- **Ruby:** 3.3+
- **Node.js:** 20+

### RNF-08: Cumplimiento Legal
- **GDPR:** Protección de datos personales
- **Consentimiento:** Aceptación de términos y privacidad
- **Retención de datos:** Según normativa local
- **Auditoría:** Logs de acciones críticas
- **Eliminación:** Derecho al olvido implementado

---

## Tecnologías Utilizadas

### Características Destacadas

Este proyecto utiliza las **últimas tecnologías modernas** de Rails 8 y Angular 20:

- **Rails 8.1** - Sin necesidad de Redis gracias a Solid Queue, Solid Cache y Solid Cable
- **Angular 20** - Con las últimas mejoras de performance y DX
- **TailwindCSS 3.4** - Diseño moderno y responsive
- **Chart.js 4.5** - Visualización de datos interactiva
- **JWT + BCrypt** - Autenticación y seguridad robusta
- **PostgreSQL** - Base de datos escalable y confiable
- **TypeScript 5.9** - Type-safety en el frontend
- **Kamal** - Deploy simplificado con Docker

### Backend
- **Ruby on Rails 8.1.0** - Framework web full-stack
- **Ruby 3.3+** - Lenguaje de programación
- **PostgreSQL 14+** - Base de datos relacional
- **Puma** - Servidor web de alta performance
- **Solid Queue** - Background jobs sin Redis
- **Solid Cache** - Cache de aplicación
- **Solid Cable** - WebSockets en tiempo real
- **BCrypt 3.1.7** - Encriptación de contraseñas
- **JWT** - Autenticación stateless con tokens
- **Rack-CORS** - Manejo de CORS para Angular
- **HTTParty** - Cliente HTTP para APIs externas
- **Image Processing** - Procesamiento de imágenes
- **RuboCop Rails Omakase** - Linter de código
- **Brakeman** - Análisis estático de seguridad
- **Bundler Audit** - Auditoría de dependencias
- **Dotenv** - Gestión de variables de entorno
- **Kamal** - Deploy con Docker
- **Thruster** - HTTP caching y compresión

### Frontend
- **Angular 20.3** - Framework SPA moderno
- **TypeScript 5.9** - Lenguaje tipado para JavaScript
- **RxJS 7.8** - Programación reactiva
- **TailwindCSS 3.4** - Framework CSS utility-first
- **@tailwindcss/forms** - Estilos para formularios
- **Chart.js 4.5** - Gráficos y visualización de datos
- **Jasmine 5.9** - Framework de testing
- **Karma 6.4** - Test runner
- **Autoprefixer** - PostCSS para compatibilidad CSS
- **Zone.js 0.15** - Change detection de Angular

### DevOps & Tools
- **Git** - Control de versiones
- **GitHub** - Repositorio y colaboración
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Containerización (via Kamal)
- **PostgreSQL** - Base de datos en producción
- **Prettier** - Formateo de código
- **ESLint/TSLint** - Linting JavaScript/TypeScript

---

## Autores

Desarrollado por:
1. **David Luza Ccorimanya**

### Contactos
1. david.luza.c@uni.pe

---

## Licencia

Este proyecto es privado y de uso académico para la Universidad Nacional de Ingeniería (UNI).

---