class Api::V1::Admin::ConfiguracionController < Api::V1::Admin::BaseController
  # GET /api/v1/admin/configuracion
  def index
    # Filtrar por categoría si se especifica
    configuraciones = if params[:categoria].present?
                        ConfiguracionSistema.por_categoria(params[:categoria])
                      else
                        ConfiguracionSistema.all
                      end

    # Si no es super admin, solo mostrar configuraciones no restringidas
    unless @current_user.es_super_admin?
      configuraciones = configuraciones.accesible_para_admin
    end

    configuraciones_data = configuraciones.order(:categoria, :clave).map do |config|
      {
        id: config.id,
        clave: config.clave,
        valor: parse_valor(config.valor),
        descripcion: config.descripcion,
        categoria: config.categoria,
        solo_super_admin: config.solo_super_admin,
        puede_modificar: config.puede_modificar?(@current_user)
      }
    end

    # Agrupar por categoría
    por_categoria = configuraciones_data.group_by { |c| c[:categoria] }

    render_success({
      configuraciones: configuraciones_data,
      por_categoria: por_categoria,
      es_super_admin: @current_user.es_super_admin?
    })
  rescue => e
    Rails.logger.error("Error al cargar configuraciones: #{e.message}")
    render_error('Error al cargar configuraciones', status: :internal_server_error)
  end

  # GET /api/v1/admin/configuracion/:clave
  def show
    config = ConfiguracionSistema.find_by(clave: params[:clave])

    unless config
      return render_error('Configuración no encontrada', status: :not_found)
    end

    # Verificar permisos
    if config.solo_super_admin && !@current_user.es_super_admin?
      return render_error('No tienes permisos para ver esta configuración', status: :forbidden)
    end

    render_success({
      id: config.id,
      clave: config.clave,
      valor: parse_valor(config.valor),
      descripcion: config.descripcion,
      categoria: config.categoria,
      solo_super_admin: config.solo_super_admin,
      puede_modificar: config.puede_modificar?(@current_user)
    })
  rescue => e
    Rails.logger.error("Error al obtener configuración: #{e.message}")
    render_error('Error al obtener configuración', status: :internal_server_error)
  end

  # PUT /api/v1/admin/configuracion/:clave
  def update
    config = ConfiguracionSistema.find_by(clave: params[:clave])

    unless config
      return render_error('Configuración no encontrada', status: :not_found)
    end

    # Verificar permisos
    unless config.puede_modificar?(@current_user)
      return render_error('No tienes permisos para modificar esta configuración', status: :forbidden)
    end

    valor_nuevo = params[:valor]

    # Convertir arrays/objetos a JSON si es necesario
    if valor_nuevo.is_a?(Array) || valor_nuevo.is_a?(Hash)
      valor_nuevo = valor_nuevo.to_json
    end

    if config.update(valor: valor_nuevo.to_s)
      render_success({
        id: config.id,
        clave: config.clave,
        valor: parse_valor(config.valor),
        descripcion: config.descripcion,
        categoria: config.categoria
      }, message: 'Configuración actualizada exitosamente')
    else
      render_error(config.errors.full_messages, status: :unprocessable_entity)
    end
  rescue => e
    Rails.logger.error("Error al actualizar configuración: #{e.message}")
    render_error('Error al actualizar configuración', status: :internal_server_error)
  end

  # PUT /api/v1/admin/configuracion/batch_update
  def batch_update
    configuraciones_params = params[:configuraciones]

    unless configuraciones_params.is_a?(Array)
      return render_error('Formato inválido', status: :bad_request)
    end

    errores = []
    actualizados = []

    configuraciones_params.each do |config_data|
      clave = config_data[:clave]
      valor = config_data[:valor]

      config = ConfiguracionSistema.find_by(clave: clave)

      if config.nil?
        errores << "Configuración '#{clave}' no encontrada"
        next
      end

      unless config.puede_modificar?(@current_user)
        errores << "No tienes permisos para modificar '#{clave}'"
        next
      end

      # Convertir arrays/objetos a JSON
      if valor.is_a?(Array) || valor.is_a?(Hash)
        valor = valor.to_json
      end

      if config.update(valor: valor.to_s)
        actualizados << clave
      else
        errores << "Error al actualizar '#{clave}': #{config.errors.full_messages.join(', ')}"
      end
    end

    if errores.empty?
      render_success({
        actualizados: actualizados,
        total: actualizados.count
      }, message: "#{actualizados.count} configuraciones actualizadas exitosamente")
    else
      render_success({
        actualizados: actualizados,
        errores: errores,
        total: actualizados.count
      }, message: "Actualización completada con algunos errores")
    end
  rescue => e
    Rails.logger.error("Error en actualización masiva: #{e.message}")
    render_error('Error en actualización masiva', status: :internal_server_error)
  end

  # POST /api/v1/admin/configuracion/restablecer
  def restablecer
    categoria = params[:categoria]

    unless categoria.present?
      return render_error('Categoría requerida', status: :bad_request)
    end

    # Solo super admin puede restablecer configuraciones críticas
    if ['permisos', 'integraciones'].include?(categoria) && !@current_user.es_super_admin?
      return render_error('Solo Super Admin puede restablecer esta categoría', status: :forbidden)
    end

    # Cargar seeds específicos de la categoría
    # Por ahora solo retornamos un mensaje
    render_success({
      categoria: categoria
    }, message: 'Para restablecer, ejecute: rails runner db/seeds/configuraciones.rb')
  rescue => e
    Rails.logger.error("Error al restablecer configuración: #{e.message}")
    render_error('Error al restablecer configuración', status: :internal_server_error)
  end

  private

  # Parsear valores especiales (booleanos, JSON, etc.)
  def parse_valor(valor)
    return nil if valor.nil? || valor.empty?

    # Intentar parsear como JSON (arrays, objetos)
    begin
      parsed = JSON.parse(valor)
      return parsed if parsed.is_a?(Array) || parsed.is_a?(Hash)
    rescue JSON::ParserError
      # No es JSON válido, continuar
    end

    # Convertir strings booleanos
    return true if valor.downcase == 'true'
    return false if valor.downcase == 'false'

    # Intentar convertir a número
    return valor.to_i if valor.to_i.to_s == valor
    return valor.to_f if valor.to_f.to_s == valor

    # Retornar como string
    valor
  end
end
