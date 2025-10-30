class Api::V1::MedicoHorariosController < ApplicationController
  before_action :authenticate_request!
  before_action :verificar_medico
  before_action :set_horario, only: [:update, :destroy]

  # GET /api/v1/medico/horarios
  def index
    medico = current_user.medico
    horarios = medico.horario_medicos.order(:dia_semana, :hora_inicio)
    
    render_success(horarios.map { |h| horario_json(h) })
  rescue => e
    Rails.logger.error("Error al listar horarios: #{e.message}")
    render_error('Error al cargar horarios', status: :internal_server_error)
  end

  # POST /api/v1/medico/horarios
  def create
    medico = current_user.medico
    horario = medico.horario_medicos.new(horario_params)
    
    if horario.save
      render_success(horario_json(horario), status: :created)
    else
      render_error('No se pudo crear el horario', errors: horario.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al crear horario: #{e.message}")
    render_error('Error al crear horario', status: :internal_server_error)
  end

  # PUT /api/v1/medico/horarios/:id
  def update
    if @horario.update(horario_params)
      render_success(horario_json(@horario))
    else
      render_error('No se pudo actualizar el horario', errors: @horario.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al actualizar horario: #{e.message}")
    render_error('Error al actualizar horario', status: :internal_server_error)
  end

  # DELETE /api/v1/medico/horarios/:id
  def destroy
    if @horario.destroy
      render_success({ message: 'Horario eliminado exitosamente' })
    else
      render_error('No se pudo eliminar el horario', status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al eliminar horario: #{e.message}")
    render_error('Error al eliminar horario', status: :internal_server_error)
  end

  # GET /api/v1/medico/horarios/disponibles
  def disponibles
    fecha = params[:fecha]
    
    unless fecha.present?
      return render_error('Debe proporcionar una fecha', status: :bad_request)
    end
    
    begin
      fecha_obj = Date.parse(fecha)
    rescue ArgumentError
      return render_error('Formato de fecha inválido. Use YYYY-MM-DD', status: :bad_request)
    end
    
    if fecha_obj < Date.today
      return render_error('No se pueden agendar citas en fechas pasadas', status: :bad_request)
    end
    
    medico = current_user.medico
    slots = generar_slots_disponibles(medico, fecha_obj)
    
    render_success(slots)
  rescue => e
    Rails.logger.error("Error al obtener horarios disponibles: #{e.message}")
    render_error('Error al cargar horarios disponibles', status: :internal_server_error)
  end

  private

  def verificar_medico
    unless current_user.es_medico?
      render_error('Acceso no autorizado', status: :forbidden)
    end
  end

  def set_horario
    medico = current_user.medico
    @horario = medico.horario_medicos.find_by(id: params[:id])
    unless @horario
      render_error('Horario no encontrado', status: :not_found)
    end
  end

  def horario_json(horario)
    {
      id: horario.id,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio.strftime('%H:%M'),
      hora_fin: horario.hora_fin.strftime('%H:%M'),
      duracion_cita_minutos: horario.duracion_cita_minutos,
      activo: horario.activo
    }
  end

  def horario_params
    params.require(:horario).permit(
      :dia_semana,
      :hora_inicio,
      :hora_fin,
      :duracion_cita_minutos,
      :activo
    )
  end

  def generar_slots_disponibles(medico, fecha)
    # Obtener día de la semana (0 = domingo, 1 = lunes, etc.)
    dia_semana = fecha.wday
    
    # Buscar horario del médico para ese día
    horario = medico.horario_medicos.find_by(dia_semana: dia_semana, activo: true)
    
    if horario.nil?
      # Si no hay horario configurado, generar horario por defecto
      return generar_slots_default(medico, fecha)
    end
    
    # Generar slots basados en el horario configurado
    generar_slots_desde_horario(medico, fecha, horario)
  end

  def generar_slots_default(medico, fecha)
    # Horario por defecto: 8:00 AM - 6:00 PM, slots de 30 minutos
    slots = []
    hora_inicio = 8
    hora_fin = 18
    duracion = 30
    
    citas_del_dia = medico.citas.where(
      'DATE(fecha_hora_inicio) = ?', fecha
    ).pluck(:fecha_hora_inicio, :fecha_hora_fin)
    
    (hora_inicio...hora_fin).each do |hora|
      [0, 30].each do |minuto|
        tiempo_inicio = Time.zone.parse("#{fecha} #{hora.to_s.rjust(2, '0')}:#{minuto.to_s.rjust(2, '0')}")
        tiempo_fin = tiempo_inicio + duracion.minutes
        
        # Verificar si el slot está ocupado
        ocupado = citas_del_dia.any? do |inicio, fin|
          (tiempo_inicio >= inicio && tiempo_inicio < fin) ||
          (tiempo_fin > inicio && tiempo_fin <= fin) ||
          (tiempo_inicio <= inicio && tiempo_fin >= fin)
        end
        
        slots << {
          hora_inicio: tiempo_inicio.strftime('%H:%M'),
          hora_fin: tiempo_fin.strftime('%H:%M'),
          disponible: !ocupado
        }
      end
    end
    
    slots
  end

  def generar_slots_desde_horario(medico, fecha, horario)
    slots = []
    duracion = horario.duracion_cita_minutos || 30
    
    # Parsear horas de inicio y fin
    hora_inicio = Time.zone.parse("#{fecha} #{horario.hora_inicio}")
    hora_fin = Time.zone.parse("#{fecha} #{horario.hora_fin}")
    
    citas_del_dia = medico.citas.where(
      'DATE(fecha_hora_inicio) = ?', fecha
    ).pluck(:fecha_hora_inicio, :fecha_hora_fin)
    
    tiempo_actual = hora_inicio
    
    while tiempo_actual < hora_fin
      tiempo_siguiente = tiempo_actual + duracion.minutes
      
      break if tiempo_siguiente > hora_fin
      
      # Verificar si el slot está ocupado
      ocupado = citas_del_dia.any? do |inicio, fin|
        (tiempo_actual >= inicio && tiempo_actual < fin) ||
        (tiempo_siguiente > inicio && tiempo_siguiente <= fin) ||
        (tiempo_actual <= inicio && tiempo_siguiente >= fin)
      end
      
      slots << {
        hora_inicio: tiempo_actual.strftime('%H:%M'),
        hora_fin: tiempo_siguiente.strftime('%H:%M'),
        disponible: !ocupado
      }
      
      tiempo_actual = tiempo_siguiente
    end
    
    slots
  end
end
