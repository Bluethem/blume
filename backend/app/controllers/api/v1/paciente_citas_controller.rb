module Api
  module V1
    class PacienteCitasController < ApplicationController
      before_action :authenticate_request!
      before_action :require_paciente!
      before_action :set_cita, only: [:show, :cancelar, :descargar_pdf]

      # GET /api/v1/paciente/citas
      def index
        paciente = current_user.paciente
        
        # Filtros
        estado = params[:estado]
        proximas = params[:proximas] == 'true'

        citas = paciente.citas.includes(medico: :usuario)

        # Aplicar filtros
        citas = citas.where(estado: estado) if estado.present?
        citas = proximas ? citas.proximas : citas.pasadas

        # Paginar
        page = params[:page] || 1
        per_page = params[:per_page] || 10
        citas_paginadas = citas.page(page).per(per_page)

        render_success({
          citas: citas_paginadas.map { |c| cita_response(c) },
          total: citas.count,
          page: page.to_i,
          per_page: per_page.to_i,
          total_pages: citas_paginadas.total_pages
        })
      end

      # GET /api/v1/paciente/citas/:id
      def show
        render_success(cita_detallada(@cita))
      end

      # POST /api/v1/paciente/citas
      def create
        paciente = current_user.paciente
        
        cita = paciente.citas.build(cita_params)
        cita.estado = :pendiente

        if cita.save
          # Crear notificación para el médico
          crear_notificacion_medico(cita)
          
          render_success(
            cita_response(cita),
            message: 'Cita agendada exitosamente',
            status: :created
          )
        else
          render_error('Error al agendar la cita', errors: cita.errors.full_messages)
        end
      end

      # PUT /api/v1/paciente/citas/:id/cancelar
      def cancelar
        unless @cita.puede_cancelarse?
          return render_error('No se puede cancelar esta cita')
        end

        if @cita.update(
          estado: :cancelada,
          motivo_cancelacion: params[:motivo_cancelacion],
          cancelada_por: current_user
        )
          # Notificar al médico
          Notificacion.create!(
            usuario: @cita.medico.usuario,
            cita: @cita,
            tipo: :cita_cancelada,
            titulo: 'Cita cancelada',
            mensaje: "El paciente #{@cita.paciente.nombre_completo} ha cancelado su cita del #{I18n.l(@cita.fecha_hora_inicio, format: :long)}"
          )

          render_success(
            cita_response(@cita),
            message: 'Cita cancelada exitosamente'
          )
        else
          render_error('Error al cancelar la cita', errors: @cita.errors.full_messages)
        end
      end

      # POST /api/v1/paciente/citas/:id/reagendar
      def reagendar
        cita_antigua = Cita.find(params[:id])
        
        unless cita_antigua.paciente_id == current_user.paciente.id
          return render_error('No tienes permiso para reagendar esta cita', status: :forbidden)
        end

        unless cita_antigua.puede_cancelarse?
          return render_error('No se puede reagendar esta cita')
        end

        # Cancelar la cita antigua
        cita_antigua.update(
          estado: :cancelada,
          motivo_cancelacion: 'Reagendada',
          cancelada_por: current_user
        )

        # Crear nueva cita
        nueva_cita = current_user.paciente.citas.build(
          medico_id: params[:medico_id] || cita_antigua.medico_id,
          fecha_hora_inicio: params[:fecha_hora_inicio],
          motivo_consulta: params[:motivo_consulta] || cita_antigua.motivo_consulta,
          estado: :pendiente
        )

        if nueva_cita.save
          render_success(
            cita_response(nueva_cita),
            message: 'Cita reagendada exitosamente'
          )
        else
          render_error('Error al reagendar la cita', errors: nueva_cita.errors.full_messages)
        end
      end

      # GET /api/v1/paciente/citas/:id/descargar_pdf
      def descargar_pdf
        begin
          pdf = PdfGeneratorService.generar_resumen_cita(@cita)
          
          send_data pdf,
                    filename: "cita_#{@cita.id}_#{Date.current.strftime('%Y%m%d')}.pdf",
                    type: 'application/pdf',
                    disposition: 'attachment'
        rescue => e
          Rails.logger.error("Error generando PDF de cita: #{e.message}")
          render_error('Error al generar el PDF', status: :internal_server_error)
        end
      end

      # GET /api/v1/paciente/citas/descargar_historial_pdf
      def descargar_historial_pdf
        begin
          paciente = current_user.paciente
          pdf = PdfGeneratorService.generar_historial_medico(paciente)
          
          send_data pdf,
                    filename: "historial_medico_#{paciente.id}_#{Date.current.strftime('%Y%m%d')}.pdf",
                    type: 'application/pdf',
                    disposition: 'attachment'
        rescue => e
          Rails.logger.error("Error generando PDF de historial: #{e.message}")
          render_error('Error al generar el PDF del historial', status: :internal_server_error)
        end
      end

      private

      def require_paciente!
        unless current_user.paciente?
          render_error('Acceso denegado. Solo para pacientes.', status: :forbidden)
        end
      end

      def set_cita
        @cita = current_user.paciente.citas.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error('Cita no encontrada', status: :not_found)
      end

      def cita_params
        params.require(:cita).permit(
          :medico_id,
          :fecha_hora_inicio,
          :motivo_consulta,
          :observaciones
        )
      end

      def cita_response(cita)
        {
          id: cita.id,
          fecha_hora_inicio: cita.fecha_hora_inicio,
          fecha_hora_fin: cita.fecha_hora_fin,
          estado: cita.estado,
          estado_label: estado_label(cita.estado),
          motivo_consulta: cita.motivo_consulta,
          observaciones: cita.observaciones,
          diagnostico: cita.diagnostico,
          costo: cita.costo,
          puede_cancelar: cita.puede_cancelarse?,
          medico: {
            id: cita.medico.id,
            nombre_completo: cita.medico.nombre_profesional,
            especialidad: cita.medico.especialidad_principal,
            foto_url: nil
          },
          created_at: cita.created_at
        }
      end

      def cita_detallada(cita)
        {
          id: cita.id,
          fecha_hora_inicio: cita.fecha_hora_inicio,
          fecha_hora_fin: cita.fecha_hora_fin,
          duracion_minutos: cita.duracion_minutos,
          estado: cita.estado,
          estado_label: estado_label(cita.estado),
          motivo_consulta: cita.motivo_consulta,
          observaciones: cita.observaciones,
          diagnostico: cita.diagnostico,
          motivo_cancelacion: cita.motivo_cancelacion,
          costo: cita.costo,
          puede_cancelar: cita.puede_cancelarse?,
          medico: {
            id: cita.medico.id,
            nombre_completo: cita.medico.nombre_profesional,
            especialidad: cita.medico.especialidad_principal,
            anos_experiencia: cita.medico.anios_experiencia,
            numero_colegiatura: cita.medico.numero_colegiatura,
            foto_url: nil,
            telefono: cita.medico.usuario.telefono,
            email: cita.medico.usuario.email,
            direccion: cita.medico.usuario.direccion
          },
          created_at: cita.created_at,
          updated_at: cita.updated_at
        }
      end

      def estado_label(estado)
        {
          'pendiente' => 'Pendiente',
          'confirmada' => 'Confirmada',
          'cancelada' => 'Cancelada',
          'completada' => 'Completada',
          'no_asistio' => 'No asistió'
        }[estado] || estado
      end

      def crear_notificacion_medico(cita)
        Notificacion.create!(
          usuario: cita.medico.usuario,
          cita: cita,
          tipo: :cita_creada,
          titulo: 'Nueva cita agendada',
          mensaje: "#{cita.paciente.nombre_completo} ha agendado una cita para el #{I18n.l(cita.fecha_hora_inicio, format: :long)}"
        )
      end
    end
  end
end