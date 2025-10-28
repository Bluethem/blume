module Api
  module V1
    class CitasController < ApplicationController
      before_action :set_cita, only: [:show, :update, :destroy, :confirmar, :cancelar, :completar, :reprogramar]
      before_action :authorize_cita_access, only: [:show, :update, :destroy, :cancelar, :reprogramar, :completar]

      # GET /api/v1/citas
      def index
        @citas = if current_user.es_administrador?
                   Cita.all
                 elsif current_user.es_medico?
                   current_user.medico.citas
                 elsif current_user.es_paciente?
                   current_user.paciente.citas
                 else
                   Cita.none
                 end

        @citas = filter_citas(@citas)
        @citas = @citas.includes(:paciente, :medico).order(fecha_hora_inicio: :desc)

        paginated_citas = paginate(@citas)

        render_success({
          citas: paginated_citas.map { |c| cita_response(c) },
          meta: pagination_meta(paginated_citas)
        })
      end

      # GET /api/v1/citas/:id
      def show
        render_success(cita_response(@cita))
      end

      # POST /api/v1/citas
      def create
        @cita = Cita.new(cita_params)
        
        # Si es paciente, asignar automáticamente su ID
        if current_user.es_paciente?
          @cita.paciente_id = current_user.paciente.id
        end

        # Validar disponibilidad del médico
        unless horario_disponible?(@cita)
          render_error('El médico no está disponible en ese horario')
          return
        end

        # Validar que no haya conflictos
        if existe_conflicto?(@cita)
          render_error('Ya existe una cita en ese horario')
          return
        end

        if @cita.save
          # Crear notificación para el médico
          crear_notificacion_nueva_cita(@cita)
          
          render_success(
            cita_response(@cita),
            message: 'Cita creada exitosamente',
            status: :created
          )
        else
          render_error('Error al crear la cita', errors: @cita.errors.full_messages)
        end
      end

      # PUT /api/v1/citas/:id
      def update
        if @cita.update(cita_params)
          render_success(
            cita_response(@cita),
            message: 'Cita actualizada exitosamente'
          )
        else
          render_error('Error al actualizar la cita', errors: @cita.errors.full_messages)
        end
      end

      # DELETE /api/v1/citas/:id
      def destroy
        if @cita.destroy
          render_success(nil, message: 'Cita eliminada exitosamente')
        else
          render_error('Error al eliminar la cita')
        end
      end

      # PUT /api/v1/citas/:id/confirmar
      def confirmar
        unless current_user.es_medico? || current_user.es_administrador?
          render_error('Solo el médico puede confirmar citas', status: :forbidden)
          return
        end

        if @cita.update(estado: :confirmada)
          crear_notificacion_cambio_estado(@cita, 'confirmada')
          render_success(cita_response(@cita), message: 'Cita confirmada exitosamente')
        else
          render_error('Error al confirmar la cita', errors: @cita.errors.full_messages)
        end
      end

      # PUT /api/v1/citas/:id/cancelar
      def cancelar
        motivo = params[:motivo_cancelacion]
        
        unless motivo.present?
          render_error('Debe proporcionar un motivo de cancelación')
          return
        end

        if @cita.update(
          estado: :cancelada,
          motivo_cancelacion: motivo,
          cancelada_por_id: current_user.id
        )
          crear_notificacion_cambio_estado(@cita, 'cancelada')
          render_success(cita_response(@cita), message: 'Cita cancelada exitosamente')
        else
          render_error('Error al cancelar la cita', errors: @cita.errors.full_messages)
        end
      end

      # PUT /api/v1/citas/:id/completar
      def completar
        unless current_user.es_medico? || current_user.es_administrador?
          render_error('Solo el médico puede completar citas', status: :forbidden)
          return
        end

        @cita.diagnostico = params[:diagnostico] if params[:diagnostico].present?
        @cita.observaciones = params[:observaciones] if params[:observaciones].present?

        if @cita.update(estado: :completada)
          crear_notificacion_cambio_estado(@cita, 'completada')
          render_success(cita_response(@cita), message: 'Cita completada exitosamente')
        else
          render_error('Error al completar la cita', errors: @cita.errors.full_messages)
        end
      end

      # PUT /api/v1/citas/:id/reprogramar
      def reprogramar
        nueva_fecha = params[:nueva_fecha_hora_inicio]
        
        unless nueva_fecha.present?
          render_error('Debe proporcionar la nueva fecha y hora')
          return
        end

        # Calcular nueva fecha de fin
        duracion = @cita.fecha_hora_fin - @cita.fecha_hora_inicio
        nueva_fecha_fin = nueva_fecha.to_datetime + duracion.seconds

        # Validar disponibilidad
        cita_temporal = @cita.dup
        cita_temporal.fecha_hora_inicio = nueva_fecha
        cita_temporal.fecha_hora_fin = nueva_fecha_fin

        unless horario_disponible?(cita_temporal)
          render_error('El médico no está disponible en ese horario')
          return
        end

        if existe_conflicto?(cita_temporal, excluir_id: @cita.id)
          render_error('Ya existe una cita en ese horario')
          return
        end

        if @cita.update(
          fecha_hora_inicio: nueva_fecha,
          fecha_hora_fin: nueva_fecha_fin,
          estado: :pendiente
        )
          crear_notificacion_reprogramacion(@cita)
          render_success(cita_response(@cita), message: 'Cita reprogramada exitosamente')
        else
          render_error('Error al reprogramar la cita', errors: @cita.errors.full_messages)
        end
      end

      # GET /api/v1/citas/pendientes
      def pendientes
        @citas = obtener_citas_por_usuario.where(estado: :pendiente)
                                          .order(fecha_hora_inicio: :asc)
        
        render_success(@citas.map { |c| cita_response(c) })
      end

      # GET /api/v1/citas/proximas
      def proximas
        @citas = obtener_citas_por_usuario
                   .where('fecha_hora_inicio > ?', Time.current)
                   .where(estado: [:pendiente, :confirmada])
                   .order(fecha_hora_inicio: :asc)
                   .limit(10)
        
        render_success(@citas.map { |c| cita_response(c) })
      end

      # GET /api/v1/citas/historial
      def historial
        @citas = obtener_citas_por_usuario
                   .where('fecha_hora_inicio < ?', Time.current)
                   .order(fecha_hora_inicio: :desc)
        
        paginated_citas = paginate(@citas)
        
        render_success({
          citas: paginated_citas.map { |c| cita_response(c) },
          meta: pagination_meta(paginated_citas)
        })
      end

      # GET /api/v1/citas/contadores
      def contadores
        citas = obtener_citas_por_usuario
        
        contadores = {
          todas: citas.count,
          proximas: citas.where('fecha_hora_inicio > ?', Time.current)
                       .where(estado: [:pendiente, :confirmada])
                       .count,
          completadas: citas.where(estado: :completada).count,
          canceladas: citas.where(estado: :cancelada).count
        }
        
        render_success(contadores)
      end

      # GET /api/v1/citas/mis-citas
      def mis_citas
        citas = obtener_citas_por_usuario
        
        # Aplicar filtros
        citas = citas.where(estado: params[:estado].split(',')) if params[:estado].present?
        citas = citas.where(medico_id: params[:medico_id]) if params[:medico_id].present?
        
        if params[:fecha_desde].present?
          citas = citas.where('fecha_hora_inicio >= ?', params[:fecha_desde])
        end
        
        if params[:fecha_hasta].present?
          citas = citas.where('fecha_hora_inicio <= ?', params[:fecha_hasta])
        end
        
        # Ordenar y paginar
        citas = citas.includes(medico: :usuario, paciente: :usuario).order(fecha_hora_inicio: :desc)
        paginated_citas = paginate(citas)
        
        render_success(paginated_citas.map { |c| cita_response(c) }, meta: pagination_meta(citas))
      end

      private

      def set_cita
        @cita = Cita.find(params[:id])
      end

      def cita_params
        params.require(:cita).permit(
          :paciente_id,
          :medico_id,
          :fecha_hora_inicio,
          :fecha_hora_fin,
          :motivo_consulta,
          :observaciones,
          :diagnostico,
          :costo
        )
      end

      def authorize_cita_access
        unless current_user.es_administrador? ||
               (current_user.es_paciente? && @cita.paciente_id == current_user.paciente.id) ||
               (current_user.es_medico? && @cita.medico_id == current_user.medico.id)
          render_error('No tienes permiso para acceder a esta cita', status: :forbidden)
        end
      end

      def filter_citas(citas)
        citas = citas.where(estado: params[:estado]) if params[:estado].present?
        citas = citas.where(medico_id: params[:medico_id]) if params[:medico_id].present?
        citas = citas.where(paciente_id: params[:paciente_id]) if params[:paciente_id].present?
        
        if params[:fecha_desde].present?
          citas = citas.where('fecha_hora_inicio >= ?', params[:fecha_desde])
        end
        
        if params[:fecha_hasta].present?
          citas = citas.where('fecha_hora_inicio <= ?', params[:fecha_hasta])
        end
        
        citas
      end

      def obtener_citas_por_usuario
        if current_user.es_administrador?
          Cita.all
        elsif current_user.es_medico?
          current_user.medico.citas
        elsif current_user.es_paciente?
          current_user.paciente.citas
        else
          Cita.none
        end
      end

      def horario_disponible?(cita)
        HorarioDisponible.exists?(
          medico_id: cita.medico_id,
          dia_semana: cita.fecha_hora_inicio.wday,
          activo: true
        )
      end

      def existe_conflicto?(cita, excluir_id: nil)
        conflictos = Cita.where(medico_id: cita.medico_id)
                         .where.not(estado: [:cancelada])
                         .where('(fecha_hora_inicio < ? AND fecha_hora_fin > ?) OR (fecha_hora_inicio < ? AND fecha_hora_fin > ?)',
                                cita.fecha_hora_fin, cita.fecha_hora_inicio,
                                cita.fecha_hora_fin, cita.fecha_hora_inicio)
        
        conflictos = conflictos.where.not(id: excluir_id) if excluir_id
        conflictos.exists?
      end

      def crear_notificacion_nueva_cita(cita)
        Notificacion.create(
          usuario_id: cita.medico.usuario_id,
          tipo: :cita_nueva,
          titulo: 'Nueva cita programada',
          mensaje: "Nueva cita con #{cita.paciente.nombre_completo} para el #{cita.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M')}"
        )
      end

      def crear_notificacion_cambio_estado(cita, nuevo_estado)
        # Notificar al paciente
        Notificacion.create(
          usuario_id: cita.paciente.usuario_id,
          tipo: "cita_#{nuevo_estado}".to_sym,
          titulo: "Cita #{nuevo_estado}",
          mensaje: "Su cita del #{cita.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M')} ha sido #{nuevo_estado}"
        )
      end

      def crear_notificacion_reprogramacion(cita)
        # Notificar a ambos
        [cita.paciente.usuario_id, cita.medico.usuario_id].each do |usuario_id|
          Notificacion.create(
            usuario_id: usuario_id,
            tipo: :cita_reprogramada,
            titulo: 'Cita reprogramada',
            mensaje: "La cita ha sido reprogramada para el #{cita.fecha_hora_inicio.strftime('%d/%m/%Y %H:%M')}"
          )
        end
      end

      def cita_response(cita)
        {
          id: cita.id,
          paciente_id: cita.paciente_id,
          medico_id: cita.medico_id,
          fecha_hora_inicio: cita.fecha_hora_inicio,
          fecha_hora_fin: cita.fecha_hora_fin,
          estado: cita.estado,
          motivo_consulta: cita.motivo_consulta,
          observaciones: cita.observaciones,
          diagnostico: cita.diagnostico,
          motivo_cancelacion: cita.motivo_cancelacion,
          cancelada_por_id: cita.cancelada_por_id,
          costo: cita.costo,
          created_at: cita.created_at,
          updated_at: cita.updated_at,
          paciente: {
            id: cita.paciente.id,
            nombre_completo: cita.paciente.nombre_completo,
            edad: cita.paciente.edad,
            grupo_sanguineo: cita.paciente.grupo_sanguineo,
            alergias: cita.paciente.alergias,
            email: cita.paciente.usuario.email,
            telefono: cita.paciente.usuario.telefono
          },
          medico: {
            id: cita.medico.id,
            nombre_completo: cita.medico.nombre_completo,
            nombre_profesional: cita.medico.nombre_profesional,
            numero_colegiatura: cita.medico.numero_colegiatura,
            foto_url: nil,
            especialidad: cita.medico.especialidad_principal&.nombre || 'General',
            especialidades: cita.medico.especialidades.map { |e| e.nombre }
          }
        }
      end
    end
  end
end