# app/jobs/enviar_recordatorios_citas_job.rb
class EnviarRecordatoriosCitasJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info("🔔 Iniciando envío de recordatorios de citas...")
    
    resultado = Notificacion.enviar_recordatorios_citas
    
    if resultado[:total] > 0
      Rails.logger.info("✅ Job completado: #{resultado[:total]} recordatorios enviados")
      Rails.logger.info("   • Pacientes: #{resultado[:pacientes]}")
      Rails.logger.info("   • Médicos: #{resultado[:medicos]}")
    else
      Rails.logger.info("ℹ️  No hay citas para mañana que requieran recordatorio")
    end
    
    resultado
  rescue => e
    Rails.logger.error("❌ Error en EnviarRecordatoriosCitasJob: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise e # Re-raise para que el job se marque como fallido
  end
end
