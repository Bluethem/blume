class GeminiService
  include HTTParty
  base_uri 'https://api.groq.com/openai'

  def initialize
    @api_key = ENV['GROQ_API_KEY'] || Rails.application.credentials.dig(:groq, :api_key)
    raise 'GROQ_API_KEY no está configurada' if @api_key.blank?
  end

  def chat(messages:, max_tokens: 800, temperature: 0.7)
    # Formatear mensajes para Groq (compatible con OpenAI)
    formatted_messages = messages.map do |msg|
      {
        role: msg[:role] == 'assistant' ? 'assistant' : (msg[:role] == 'system' ? 'system' : 'user'),
        content: msg[:content]
      }
    end

    # Usar Groq Chat API (GRATIS, RÁPIDO, SIN LÍMITES)
    response = self.class.post(
      "/v1/chat/completions",
      headers: { 
        'Content-Type' => 'application/json',
        'Authorization' => "Bearer #{@api_key}"
      },
      body: {
        model: "llama-3.3-70b-versatile",
        messages: formatted_messages,
        temperature: temperature,
        max_tokens: max_tokens,
        stream: false
      }.to_json
    )

    if response.success?
      {
        success: true,
        content: response.dig('choices', 0, 'message', 'content')
      }
    else
      Rails.logger.error("Error en Groq API: #{response.body}")
      {
        success: false,
        error: response['error']&.dig('message') || 'Error desconocido'
      }
    end
  rescue => e
    Rails.logger.error("Excepción en Groq Service: #{e.message}")
    {
      success: false,
      error: e.message
    }
  end
end
