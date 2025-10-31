# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # En desarrollo permite localhost en diferentes puertos
    origins 'http://localhost:4200', 
            'http://localhost:3000',
            'http://127.0.0.1:4200',
            'http://127.0.0.1:3000',
            'localhost:4200', 
            'localhost:3000',
            '127.0.0.1:4200',
            '127.0.0.1:3000'
    
    # En producción, agrega tu dominio:
    # origins 'https://tudominio.com', 'https://www.tudominio.com'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization']
  end
end

# Para producción, considera usar una variable de entorno:
# origins ENV['ALLOWED_ORIGINS']&.split(',') || 'http://localhost:4200'