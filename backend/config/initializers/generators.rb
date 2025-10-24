# Configurar generadores para usar UUID por defecto
Rails.application.config.generators do |g|
  g.orm :active_record, primary_key_type: :uuid
  g.test_framework :test_unit
end