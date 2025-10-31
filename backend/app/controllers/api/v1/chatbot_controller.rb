class Api::V1::ChatbotController < ApplicationController
  before_action :authenticate_request!
  before_action :check_rate_limit

  # POST /api/v1/chatbot/message
  def message
    mensaje_usuario = params[:message]

    if mensaje_usuario.blank?
      return render_error('El mensaje no puede estar vacío', status: :bad_request)
    end

    # Obtener contexto seguro del usuario
    contexto = obtener_contexto_usuario

    # Construir mensajes para Gemini
    messages = [
      {
        role: 'system',
        content: sistema_prompt(contexto)
      },
      {
        role: 'user',
        content: mensaje_usuario
      }
    ]

    # Llamar a Gemini
    gemini = GeminiService.new
    resultado = gemini.chat(messages: messages, max_tokens: 600, temperature: 0.7)

    if resultado[:success]
      # Registrar interacción (opcional, para analytics)
      registrar_interaccion(mensaje_usuario, resultado[:content])

      render_success({
        respuesta: resultado[:content],
        timestamp: Time.current
      })
    else
      render_error('Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.', status: :internal_server_error)
    end
  rescue => e
    Rails.logger.error("Error en chatbot: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render_error('Error interno del servidor', status: :internal_server_error)
  end

  private

  def sistema_prompt(contexto)
    <<~PROMPT
      Eres un asistente virtual del sistema médico Blume, una plataforma de gestión de citas médicas.
      
      INFORMACIÓN DEL USUARIO:
      - Nombre: #{contexto[:nombre]}
      - Rol: #{contexto[:rol_humanizado]}
      
      TU ROL ES ÚNICAMENTE:
      1. Ayudar a los usuarios a entender cómo usar el sistema Blume
      2. Responder preguntas sobre funcionalidades del sistema
      3. Guiar en procesos como:
         - Agendar citas (para pacientes)
         - Gestionar horarios (para médicos)
         - Administrar el sistema (para administradores)
         - Ver historial médico
         - Actualizar perfil
         - Gestionar notificaciones
      4. Explicar el significado de estados (Pendiente, Confirmada, Completada, Cancelada)
      5. Dar instrucciones paso a paso para tareas comunes
      
      LO QUE NO PUEDES HACER:
      - Acceder directamente a la base de datos
      - Modificar información de usuarios, pacientes o médicos
      - Ejecutar comandos del sistema
      - Compartir información confidencial de otros usuarios
      - Realizar acciones en nombre del usuario (solo guiar)
      - Dar consejos médicos o diagnósticos
      
      ESTILO DE RESPUESTA:
      - Amigable y profesional
      - Conciso pero completo
      - En español
      - Usa emojis ocasionalmente para ser más amigable
      - Si no sabes algo, admítelo y sugiere contactar soporte
      
      FUNCIONALIDADES PRINCIPALES DEL SISTEMA BLUME:
      
      Para PACIENTES:
      - Buscar médicos por especialidad
      - Agendar citas con médicos
      - Ver historial de citas
      - Cancelar citas (con 24h de anticipación)
      - Ver y descargar recetas médicas
      - Actualizar perfil personal
      - Dejar reseñas a médicos
      
      Para MÉDICOS:
      - Ver agenda de citas
      - Confirmar/completar citas
      - Gestionar horarios de atención
      - Ver lista de pacientes
      - Registrar diagnósticos
      - Ver estadísticas personales
      - Actualizar perfil profesional
      
      Para ADMINISTRADORES:
      - Gestionar médicos, pacientes y administradores
      - Ver reportes y estadísticas generales
      - Gestionar especialidades y certificaciones
      - Ver logs de actividad
      - Gestionar notificaciones del sistema
      
      Si el usuario pregunta algo fuera de tu alcance, responde amablemente que no puedes ayudar con eso y sugiere alternativas.
    PROMPT
  end

  def obtener_contexto_usuario
    # Determinar el rol humanizado
    rol_humanizado = if current_user.es_medico?
      'Médico'
    elsif current_user.es_paciente?
      'Paciente'
    elsif current_user.es_administrador?
      'Administrador'
    else
      'Usuario'
    end

    {
      nombre: current_user.nombre_completo,
      rol: current_user.rol, # 'paciente', 'medico' o 'administrador'
      rol_humanizado: rol_humanizado
    }
  end

  def check_rate_limit
    # Rate limiting simple: máximo 10 mensajes por minuto por usuario
    cache_key = "chatbot_rate_limit:#{current_user.id}"
    count = Rails.cache.read(cache_key) || 0

    if count >= 10
      return render_error('Has excedido el límite de mensajes. Espera un momento.', status: :too_many_requests)
    end

    Rails.cache.write(cache_key, count + 1, expires_in: 1.minute)
  end

  def registrar_interaccion(pregunta, respuesta)
    # Opcional: Guardar en BD para analytics
    # ChatbotInteraction.create(
    #   usuario: current_user,
    #   pregunta: pregunta,
    #   respuesta: respuesta
    # )
  rescue => e
    # No fallar si esto falla
    Rails.logger.error("Error al registrar interacción: #{e.message}")
  end
end
