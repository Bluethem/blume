# Proyecto Blume
> Plataforma integral para la gestión y digitalización de citas médicas

<p align="center">
  <img src="https://img.shields.io/badge/Status-Finalizado-blueviolet?style=flat-square">
  <img src="https://img.shields.io/badge/Licencia-MIT-green?style=flat-square">
  <img src="https://img.shields.io/badge/Framework-Angular-red?style=flat-square">
  <img src="https://img.shields.io/badge/Backend-Ruby%20on%20Rails-darkred?style=flat-square">
</p>

<div align="center">
  <img src="/frontend/public/images/android-chrome-192x192.png" alt="Blume Cover" style="border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.15);">
</div>

## Descripción general

**Blume** es una aplicación web full-stack desarrollada con **Ruby on Rails 8** (backend) y **Angular 20** (frontend).

El sistema ofrece una solución integral para la **gestión de citas médicas**, permitiendo el registro de pacientes y médicos, la reserva y administración de consultas, el envío de notificaciones y la gestión completa mediante un panel administrativo.

---

## Alcance de proyecto

El proyecto busca ofrecer una alternativa moderna, segura y escalable a los sistemas tradicionales de gestión médica, priorizando la experiencia del usuario y la automatización de tareas administrativas.

**Blume** está orientado a clínicas, consultorios y centros de salud que buscan **digitalizar sus procesos de atención** sin depender de plataformas externas.  
Actualmente, el sistema cubre los siguientes roles:

**1. Paciente:**
- Puede agendar, cancelar y reprogramar citas médicas.
  > La reprogramación se genera automáticamente cuando un médico no asiste a una cita programada, dependiendo de la disponibilidad que tiene.
- Accede al catálogo de médicos disponibles, consulta sus perfiles y agenda citas con ellos.  
- Sistema de pagos con soporte para múltiples métodos (integración con cuentas clínicas pendiente).  

**2.Médicos:**
- Visualiza su lista de citas y el historial de pacientes atendidos.  
- Puede editar información médica relevante y actualizar observaciones.  
- Configura su disponibilidad horaria y revisa estadísticas personales de atención. 

**3.Administrador:**
- Dispone de un panel con **CRUD** para pacientes, citas, médicos y certificaciones.  
- Accede a reportes del sistema y métricas generales.  
- Puede realizar configuraciones limitadas del sistema.  

**4.SuperAdministrador:**
- Posee las mismas funciones que un administrador, con acceso adicional a la gestión de administradores.  
- Tiene control total sobre la configuración general del sistema.  
- Su acceso se establece directamente desde la base de datos.

***Todos los roles:***
- Sistema de notificaciones contextualizado según las acciones del usuario.  
- Personalización de perfil y ajustes individuales por tipo de usuario.
- Chatbot límitado para dar funcionalidades de la plataforma.

## Roadmap / Próximas mejoras

- [ ] Integración con pagos en línea.
- [ ] Módulo de teleconsutlas.
- [ ] Chats con médicos.
- [ ] Integración completa de historiales médicos.

---

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
└── database/                  # Base de datos
    ├── database-diagram.png   # Diagrama ER
    └── README.md              # Documentacion de base de datos (scripts para postgreSQL)
```

---

## Requisitos

### Frontend
<p>
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white&style=for-the-badge" alt="Node.js 20+">
  <img src="https://img.shields.io/badge/Angular%20CLI-20%2B-DD0031?logo=angular&logoColor=white&style=for-the-badge" alt="Angular CLI 20+">
  <img src="https://img.shields.io/badge/npm-10%2B-CB3837?logo=npm&logoColor=white&style=for-the-badge" alt="npm 10+">
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/Ruby-3.3%2B-CC342D?logo=ruby&logoColor=white&style=for-the-badge" alt="Ruby 3.3+">
  <img src="https://img.shields.io/badge/Rails-8.1%2B-D30001?logo=rubyonrails&logoColor=white&style=for-the-badge" alt="Rails 8.1+">
</p>

### Base de datos
<p>
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-336791?logo=postgresql&logoColor=white&style=for-the-badge" alt="PostgreSQL 14+">
</p>

---

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Bluethem/blume
cd blume
```

### 2. Backend (Ruby on Rails)
```bash
Copiar código
cd backend
bundle install
rails db:create db:migrate db:seed
rails server -p 3000
```
El backend estará disponible en http://localhost:3000

*Configurar las credenciales de la base de datos en config/database.yml antes de ejecutar los comandos.*

### 3. Frontend (Angular)
```bash
Copiar código
cd frontend
npm install
ng serve
```
El frontend estará disponible en http://localhost:4200

*Ajustar la variable apiUrl en src/environments/environment.ts para apuntar al backend.*

---

## Requerimientos Funcionales

| ID        | Categoría            | Descripción                                      | Prioridad |
| --------- | -------------------- | ------------------------------------------------ | --------- |
| **RF-01** | Gestión de Usuarios  | Registro de nuevos usuarios (pacientes)          | Alta      |
|           |                      | Login y autenticación de usuarios                | Alta      |
|           |                      | Recuperación de contraseña                       | Media     |
|           |                      | Edición de perfil personal                       | Media     |
| **RF-02** | Gestión de Médicos   | Registro de médicos por parte del administrador  | Alta      |
|           |                      | Gestión de especialidades y certificaciones      | Alta      |
|           |                      | Definición de horarios de atención               | Alta      |
|           |                      | Configuración de costos de consulta              | Media     |
| **RF-03** | Reserva de Citas     | Visualización de horarios disponibles por médico | Alta      |
|           |                      | Reserva de cita por paciente                     | Alta      |
|           |                      | Confirmación automática o manual de cita         | Alta      |
|           |                      | Cancelación de cita (con motivo)                 | Media     |
|           |                      | Reprogramación automática según disponibilidad   | Alta      |
| **RF-04** | Notificaciones       | Notificación al crear una cita                   | Alta      |
|           |                      | Recordatorio 24h antes de la cita                | Media     |
|           |                      | Notificación al cancelar o reprogramar           | Media     |
|           |                      | Visualización de notificaciones en el sistema    | Media     |
|           |                      | Envío de correos electrónicos automáticos        | Media     |
| **RF-05** | Panel Administrativo | Dashboard con estadísticas globales              | Alta      |
|           |                      | Gestión de usuarios (activar/desactivar)         | Alta      |
|           |                      | Gestión de médicos y certificaciones             | Alta      |
|           |                      | Reportes de citas médicas                        | Media     |
|           |                      | Logs del sistema                                 | Media     |
| **RF-06** | Historial            | Historial de citas por paciente                  | Alta      |
|           |                      | Historial de atenciones por médico               | Alta      |
|           |                      | Registro de diagnósticos y observaciones médicas | Alta      |

---

## Requerimientos No Funcionales

| ID         | Categoría          | Descripción                                                     | Prioridad |
| ---------- | ------------------ | --------------------------------------------------------------- | --------- |
| **RNF-01** | Seguridad          | Autenticación JWT y contraseñas hasheadas con BCrypt            | Alta      |
|            |                    | Autorización por roles (RBAC)                                   | Alta      |
|            |                    | Validación de entrada y prevención de inyecciones SQL           | Alta      |
|            |                    | Uso obligatorio de HTTPS en producción                          | Alta      |
| **RNF-02** | Rendimiento        | Tiempo de respuesta API < 200ms                                 | Alta      |
|            |                    | Tiempo de carga inicial < 2s                                    | Media     |
|            |                    | Soporte para 1000 usuarios concurrentes                         | Alta      |
|            |                    | Cache con Solid Cache (sin Redis)                               | Media     |
| **RNF-03** | Escalabilidad      | Arquitectura desacoplada (frontend/backend REST)                | Alta      |
|            |                    | Uso de Solid Queue para tareas asíncronas                       | Alta      |
|            |                    | WebSockets con Solid Cable                                      | Media     |
| **RNF-04** | Disponibilidad     | Uptime del 99.5%                                                | Alta      |
|            |                    | Backup diario y recuperación ante desastres                     | Alta      |
|            |                    | Health checks automáticos cada 30s                              | Media     |
| **RNF-05** | Usabilidad         | Diseño responsive y accesibilidad (WCAG 2.1 AA)                 | Alta      |
|            |                    | Mensajes claros e interfaz intuitiva                            | Media     |
|            |                    | Soporte multidioma (i18n)                                       | Media     |
| **RNF-06** | Mantenibilidad     | Código limpio con principios SOLID                              | Alta      |
|            |                    | Documentación de API con Swagger/OpenAPI                        | Alta      |
|            |                    | Cobertura de tests ≥ 80%                                        | Alta      |
|            |                    | CI/CD automatizado con GitHub Actions                           | Media     |
| **RNF-07** | Compatibilidad     | Soporte de navegadores modernos (Chrome, Firefox, Edge, Safari) | Media     |
|            |                    | API REST versionada (v1, v2, …)                                 | Media     |
|            |                    | Compatibilidad Ruby 3.3+, Node 20+ y PostgreSQL 14+             | Alta      |
| **RNF-08** | Cumplimiento Legal | Cumplimiento GDPR y derecho al olvido                           | Alta      |
|            |                    | Registro de auditorías y logs de acciones críticas              | Alta      |
|            |                    | Consentimiento y retención de datos según normativa             | Media     |

---

## Tecnologías Utilizadas

| Categoría          | Tecnología            | Versión | Descripción                         |
| ------------------ | --------------------- | ------- | ----------------------------------- |
| **Backend**        | Ruby on Rails         | 8.1.0   | Framework web full-stack            |
|                    | Ruby                  | 3.3+    | Lenguaje de programación            |
|                    | PostgreSQL            | 14+     | Base de datos relacional            |
|                    | Puma                  | -       | Servidor web de alta performance    |
|                    | Solid Queue           | -       | Background jobs sin Redis           |
|                    | Solid Cache           | -       | Caché de aplicación                 |
|                    | Solid Cable           | -       | WebSockets en tiempo real           |
|                    | BCrypt                | 3.1.7   | Encriptación de contraseñas         |
|                    | JWT                   | -       | Autenticación stateless con tokens  |
|                    | Rack-CORS             | -       | Manejo de CORS para Angular         |
|                    | HTTParty              | -       | Cliente HTTP para APIs externas     |
|                    | Image Processing      | -       | Procesamiento de imágenes           |
|                    | RuboCop Rails Omakase | -       | Linter de código Ruby on Rails      |
|                    | Brakeman              | -       | Análisis estático de seguridad      |
|                    | Bundler Audit         | -       | Auditoría de dependencias           |
|                    | Dotenv                | -       | Gestión de variables de entorno     |
|                    | Kamal                 | -       | Deploy con Docker                   |
|                    | Thruster              | -       | HTTP caching y compresión           |
| **Frontend**       | Angular               | 20.3    | Framework SPA moderno               |
|                    | TypeScript            | 5.9     | Lenguaje tipado para JavaScript     |
|                    | RxJS                  | 7.8     | Programación reactiva               |
|                    | TailwindCSS           | 3.4     | Framework CSS utility-first         |
|                    | @tailwindcss/forms    | -       | Estilos para formularios            |
|                    | Chart.js              | 4.5     | Gráficos y visualización de datos   |
|                    | Jasmine               | 5.9     | Framework de testing                |
|                    | Karma                 | 6.4     | Test runner                         |
|                    | Autoprefixer          | -       | PostCSS para compatibilidad CSS     |
|                    | Zone.js               | 0.15    | Change detection de Angular         |
| **DevOps & Tools** | Git                   | -       | Control de versiones                |
|                    | GitHub                | -       | Repositorio y colaboración          |
|                    | GitHub Actions        | -       | CI/CD pipeline automatizado         |
|                    | Docker                | -       | Containerización (via Kamal)        |
|                    | PostgreSQL            | -       | Base de datos en entorno productivo |
|                    | Prettier              | -       | Formateo automático de código       |
|                    | ESLint / TSLint       | -       | Linter de JavaScript/TypeScript     |
| **Destacadas**     | Rails + Solid Stack   | 8.1     | Jobs, Cache y WebSockets sin Redis  |
|                    | JWT + BCrypt          | -       | Autenticación y seguridad robusta   |
|                    | Kamal                 | -       | Deploy simplificado con Docker      |
|                    | TailwindCSS           | 3.4     | Diseño moderno y responsive         |
|                    | TypeScript            | 5.9     | Type-safety en el frontend          |
|                    | Chart.js              | 4.5     | Visualización de datos interactiva  |

---

## Autor

**David Luza Ccorimanya**  
Desarrollador del proyecto **Blume**, responsable del diseño, desarrollo e integración del sistema.

### Contacto
- **Correo institucional:** [david.luza.c@uni.pe](mailto:david.luza.c@uni.pe)  
- **Correo personal:** [davidlc226@gmail.com](mailto:davidlc226@gmail.com)  
- **Correo alternativo:** [davidlc1234@hotmail.com](mailto:davidlc1234@hotmail.com)  
- **GitHub:** [Bluethem](https://github.com/Bluethem)

---

## Licencia

Proyecto académico desarrollado en el marco de la Universidad Nacional de Ingeniería (UNI).  
Este proyecto es de carácter educativo y no está destinado a uso comercial.

---