module Api
  module V1
    class PacientesController < ApplicationController
      before_action :set_paciente, only: [:show, :update, :destroy, :historial_citas, :proximas_citas]
      before_action :require_admin!, only: [:index, :destroy]
      before_action :authorize_paciente_access, only: [:show, :update, :historial_citas, :proximas_citas]

      # GET /api/v1/pacientes
      def index
        @pacientes = Paciente.includes(:usuario).joins(:usuario).where(usuarios: { activo: true })
        @pacientes = filter_pacientes(@pacientes)
        @pacientes = @pacientes.order(created_at: :desc)

        paginated_pacientes = paginate(@pacientes)

        render_success({
          pacientes: paginated_pacientes.map { |p| paciente_response(p) },
          meta: pagination_meta(paginated_pacientes)
        })
      end

      # GET /api/v1/pacientes/:id
      def show
        render_success(paciente_response(@paciente, detailed: true))
      end

      # POST /api/v1/pacientes (solo admin)
      def create
        ActiveRecord::Base.transaction do
          # Crear usuario
          usuario = Usuario.new(usuario_params)
          usuario.rol = 'paciente'
          
          if usuario.save
            # Crear perfil de paciente
            @paciente = Paciente.new(paciente_params)
            @paciente.usuario_id = usuario.id
            
            if @paciente.save
              render_success(
                paciente_response(@paciente),
                message: 'Paciente creado exitosamente',
                status: :created
              )
            else
              raise ActiveRecord::Rollback
              render_error('Error al crear el paciente', errors: @paciente.errors.full_messages)
            end
          else
            render_error('Error al crear el usuario', errors: usuario.errors.full_messages)
          end
        end
      rescue => e
        Rails.logger.error("Error creating paciente: #{e.message}")
        render_error('Error al crear el paciente')
      end

      # PUT /api/v1/pacientes/:id
      def update
        if @paciente.update(paciente_params)
          # Actualizar también el usuario si se proporcionaron datos
          if params[:usuario].present?
            @paciente.usuario.update(usuario_update_params)
          end
          
          render_success(
            paciente_response(@paciente),
            message: 'Paciente actualizado exitosamente'
          )
        else
          render_error('Error al actualizar el paciente', errors: @paciente.errors.full_messages)
        end
      end

      # DELETE /api/v1/pacientes/:id
      def destroy
        if @paciente.usuario.update(activo: false)
          render_success(nil, message: 'Paciente desactivado exitosamente')
        else
          render_error('Error al desactivar el paciente')
        end
      end

      # GET /api/v1/pacientes/:id/historial_citas
      def historial_citas
        @citas = @paciente.citas
                         .includes(:medico)
                         .where('fecha_hora_inicio < ?', Time.current)
                         .order(fecha_hora_inicio: :desc)

        paginated_citas = paginate(@citas)

        render_success({
          citas: paginated_citas.map { |c| cita_response(c) },
          meta: pagination_meta(paginated_citas)
        })
      end

      # GET /api/v1/pacientes/:id/proximas_citas
      def proximas_citas
        @citas = @paciente.citas
                         .includes(:medico)
                         .where('fecha_hora_inicio > ?', Time.current)
                         .where(estado: [:pendiente, :confirmada])
                         .order(fecha_hora_inicio: :asc)

        render_success(@citas.map { |c| cita_response(c) })
      end

      private

      def set_paciente
        @paciente = Paciente.find(params[:id])
      end

      def usuario_params
        params.require(:usuario).permit(:email, :password, :password_confirmation, :nombre, :apellido, :telefono, :direccion)
      end

      def usuario_update_params
        params.require(:usuario).permit(:nombre, :apellido, :telefono, :direccion)
      end

      def paciente_params
        params.require(:paciente).permit(
          :fecha_nacimiento,
          :genero,
          :tipo_documento,
          :numero_documento,
          :grupo_sanguineo,
          :alergias,
          :observaciones
        )
      end

      def authorize_paciente_access
        unless current_user.es_administrador? || (current_user.es_paciente? && current_user.paciente.id == @paciente.id)
          render_error('No tienes permiso para acceder a este paciente', status: :forbidden)
        end
      end

      def filter_pacientes(pacientes)
        if params[:q].present?
          query = "%#{params[:q]}%"
          pacientes = pacientes.where('usuarios.nombre ILIKE ? OR usuarios.apellido ILIKE ? OR usuarios.email ILIKE ?', query, query, query)
        end

        if params[:genero].present?
          pacientes = pacientes.where(genero: params[:genero])
        end

        if params[:tipo_documento].present?
          pacientes = pacientes.where(tipo_documento: params[:tipo_documento])
        end

        pacientes
      end

      def paciente_response(paciente, detailed: false)
        response = {
          id: paciente.id,
          nombre_completo: paciente.nombre_completo,
          email: paciente.email,
          telefono: paciente.telefono,
          fecha_nacimiento: paciente.fecha_nacimiento,
          edad: paciente.edad,
          genero: paciente.genero,
          tipo_documento: paciente.tipo_documento,
          numero_documento: paciente.numero_documento
        }

        if detailed
          response.merge!({
            direccion: paciente.direccion,
            grupo_sanguineo: paciente.grupo_sanguineo,
            alergias: paciente.alergias,
            observaciones: paciente.observaciones,
            tiene_alergias: paciente.tiene_alergias?,
            total_citas: paciente.citas.count,
            citas_completadas: paciente.citas.where(estado: :completada).count,
            created_at: paciente.created_at
          })
        end

        response
      end

      def cita_response(cita)
        {
          id: cita.id,
          medico: {
            id: cita.medico.id,
            nombre_completo: cita.medico.nombre_completo,
            especialidades: cita.medico.especialidades.map { |e| e.nombre }
          },
          fecha_hora_inicio: cita.fecha_hora_inicio,
          fecha_hora_fin: cita.fecha_hora_fin,
          motivo_consulta: cita.motivo_consulta,
          diagnostico: cita.diagnostico,
          estado: cita.estado,
          costo: cita.costo
        }
      end
    end
  end
end