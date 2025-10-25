module JsonWebToken
  extend ActiveSupport::Concern

  SECRET_KEY = Rails.application.credentials.secret_key_base || 'your_secret_key'

  class << self
    # Codificar payload en JWT
    def encode(payload, exp = 24.hours.from_now)
      payload[:exp] = exp.to_i
      JWT.encode(payload, SECRET_KEY)
    end

    # Decodificar JWT
    def decode(token)
      body = JWT.decode(token, SECRET_KEY)[0]
      HashWithIndifferentAccess.new(body)
    rescue JWT::DecodeError => e
      Rails.logger.error("JWT Decode Error: #{e.message}")
      nil
    rescue JWT::ExpiredSignature => e
      Rails.logger.error("JWT Token Expired: #{e.message}")
      nil
    end
  end
end