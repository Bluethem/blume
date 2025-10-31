# Seeds para Configuraciones del Sistema

puts "🔧 Creando configuraciones del sistema..."

configuraciones = [
  # === CONFIGURACIÓN GENERAL ===
  {
    clave: 'sistema_nombre',
    valor: 'Blume',
    descripcion: 'Nombre del sistema',
    categoria: 'general',
    solo_super_admin: false
  },
  {
    clave: 'sistema_logo_url',
    valor: '',
    descripcion: 'URL del logo del sistema',
    categoria: 'general',
    solo_super_admin: false
  },
  {
    clave: 'sistema_timezone',
    valor: 'America/Lima',
    descripcion: 'Zona horaria del sistema',
    categoria: 'general',
    solo_super_admin: true
  },
  {
    clave: 'sistema_formato_fecha',
    valor: 'DD/MM/YYYY',
    descripcion: 'Formato de fecha predeterminado',
    categoria: 'general',
    solo_super_admin: false
  },
  {
    clave: 'sistema_formato_hora',
    valor: 'hh:mm A',
    descripcion: 'Formato de hora predeterminado',
    categoria: 'general',
    solo_super_admin: false
  },
  {
    clave: 'sistema_dias_festivos',
    valor: '["2025-01-01","2025-12-25","2025-07-28","2025-07-29"]',
    descripcion: 'Días festivos en formato JSON',
    categoria: 'general',
    solo_super_admin: false
  },

  # === CONFIGURACIÓN DE CITAS ===
  {
    clave: 'citas_duracion_default',
    valor: '30',
    descripcion: 'Duración predeterminada de citas en minutos',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_tiempo_minimo_agendar',
    valor: '2',
    descripcion: 'Tiempo mínimo en horas para agendar una cita',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_tiempo_minimo_cancelar',
    valor: '24',
    descripcion: 'Tiempo mínimo en horas para cancelar una cita sin penalización',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_politica_cancelacion',
    valor: 'Las cancelaciones deben realizarse con al menos 24 horas de antelación. En caso contrario, se podrá aplicar un cargo administrativo.',
    descripcion: 'Política de cancelación de citas',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_recordatorio_email',
    valor: 'true',
    descripcion: 'Habilitar recordatorios por email',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_recordatorio_email_horas',
    valor: '24',
    descripcion: 'Horas antes para enviar recordatorio por email',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_recordatorio_sms',
    valor: 'false',
    descripcion: 'Habilitar recordatorios por SMS',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_recordatorio_sms_horas',
    valor: '2',
    descripcion: 'Horas antes para enviar recordatorio por SMS',
    categoria: 'citas',
    solo_super_admin: false
  },
  {
    clave: 'citas_costo_default',
    valor: '50.00',
    descripcion: 'Costo predeterminado de una cita',
    categoria: 'citas',
    solo_super_admin: false
  },

  # === ROLES Y PERMISOS (Solo Super Admin) ===
  {
    clave: 'permisos_admin_puede_eliminar_usuarios',
    valor: 'false',
    descripcion: 'Permitir a admins normales eliminar usuarios',
    categoria: 'permisos',
    solo_super_admin: true
  },
  {
    clave: 'permisos_admin_puede_gestionar_medicos',
    valor: 'true',
    descripcion: 'Permitir a admins normales gestionar médicos',
    categoria: 'permisos',
    solo_super_admin: true
  },
  {
    clave: 'permisos_admin_puede_gestionar_citas',
    valor: 'true',
    descripcion: 'Permitir a admins normales gestionar citas',
    categoria: 'permisos',
    solo_super_admin: true
  },
  {
    clave: 'permisos_admin_puede_ver_reportes',
    valor: 'true',
    descripcion: 'Permitir a admins normales ver reportes',
    categoria: 'permisos',
    solo_super_admin: true
  },

  # === INTEGRACIONES (Solo Super Admin) ===
  {
    clave: 'integracion_email_proveedor',
    valor: 'smtp',
    descripcion: 'Proveedor de email (smtp, sendgrid, mailgun)',
    categoria: 'integraciones',
    solo_super_admin: true
  },
  {
    clave: 'integracion_email_host',
    valor: 'smtp.gmail.com',
    descripcion: 'Host del servidor SMTP',
    categoria: 'integraciones',
    solo_super_admin: true
  },
  {
    clave: 'integracion_email_puerto',
    valor: '587',
    descripcion: 'Puerto del servidor SMTP',
    categoria: 'integraciones',
    solo_super_admin: true
  },
  {
    clave: 'integracion_sms_proveedor',
    valor: '',
    descripcion: 'Proveedor de SMS (twilio, nexmo)',
    categoria: 'integraciones',
    solo_super_admin: true
  },
  {
    clave: 'integracion_pago_proveedor',
    valor: '',
    descripcion: 'Proveedor de pagos (stripe, paypal, culqi)',
    categoria: 'integraciones',
    solo_super_admin: true
  },

  # === APARIENCIA ===
  {
    clave: 'apariencia_tema_default',
    valor: 'light',
    descripcion: 'Tema predeterminado (light, dark, system)',
    categoria: 'apariencia',
    solo_super_admin: false
  },
  {
    clave: 'apariencia_color_primario',
    valor: '#D93B3B',
    descripcion: 'Color primario del sistema',
    categoria: 'apariencia',
    solo_super_admin: false
  },
  {
    clave: 'apariencia_idioma_default',
    valor: 'es',
    descripcion: 'Idioma predeterminado (es, en)',
    categoria: 'apariencia',
    solo_super_admin: false
  }
]

configuraciones.each do |config|
  ConfiguracionSistema.find_or_create_by(clave: config[:clave]) do |c|
    c.valor = config[:valor]
    c.descripcion = config[:descripcion]
    c.categoria = config[:categoria]
    c.solo_super_admin = config[:solo_super_admin]
  end
end

puts "✅ Configuraciones creadas exitosamente!"
puts "   - #{ConfiguracionSistema.por_categoria('general').count} configuraciones generales"
puts "   - #{ConfiguracionSistema.por_categoria('citas').count} configuraciones de citas"
puts "   - #{ConfiguracionSistema.por_categoria('permisos').count} configuraciones de permisos"
puts "   - #{ConfiguracionSistema.por_categoria('integraciones').count} configuraciones de integraciones"
puts "   - #{ConfiguracionSistema.por_categoria('apariencia').count} configuraciones de apariencia"
puts "   - #{ConfiguracionSistema.solo_super_admin.count} configuraciones exclusivas de Super Admin"
