module Api
  module V1
    class EspecialidadesController < ApplicationController
      skip_before_action :authenticate_request!, only: [:index, :show, :medicos]
      before_action :set_especialidad, only: [:show, :update, :destroy, :medicos]
      before_action :require_admin!, only: [:create, :update, :destroy]

      # GET /api/v1/especialidades
      def index
        @especialidades = Especialidad.all.order(:nombre)

        if params[:q].present?
          @especialidades = @especialidades.por_nombre(params[:q])
        end

        render_success(@especialidades.map { |e| especialidad_response(e) })
      end

      # GET /api/v1/especialidades/:id
      def show
        render_success(especialidad_response(@especialidad, detailed: true))
      end

      # POST /api/v1/especialidades
      def create
        @especialidad = Especialidad.new(especialidad_params)

        if @especialidad.save
          render_success(
            especialidad_response(@especialidad),
            message: 'Especialidad creada exitosamente',
            status: :created
          )
        else
          render_error('Error al crear la especialidad', errors: @especialidad.errors.full_messages)
        end
      end

      # PUT /api/v1/especialidades/:id
      def update
        if @especialidad.update(especialidad_params)
          render_success(
            especialidad_response(@especialidad),
            message: 'Especialidad actualizada exitosamente'
          )
        else
          render_error('Error al actualizar la especialidad', errors: @especialidad.errors.full_messages)
        end
      end

      # DELETE /api/v1/especialidades/:id
      def destroy
        if @especialidad.medicos.exists?
          render_error('No se puede eliminar una especialidad con médicos asociados', status: :unprocessable_entity)
        elsif @especialidad.destroy
          render_success(nil, message: 'Especialidad eliminada exitosamente')
        else
          render_error('Error al eliminar la especialidad')
        end
      end

      # GET /api/v1/especialidades/:id/medicos
      def medicos
        @medicos = @especialidad.medicos
                                .joins(:usuario)
                                .where(usuarios: { activo: true })
                                .includes(:usuario)
                                .order('usuarios.nombre')

        render_success(@medicos.map { |m| medico_simple_response(m) })
      end

      private

      def set_especialidad
        @especialidad = Especialidad.find(params[:id])
      end

      def especialidad_params
        params.require(:especialidad).permit(:nombre, :descripcion)
      end

      def especialidad_response(especialidad, detailed: false)
        response = {
          id: especialidad.id,
          nombre: especialidad.nombre,
          descripcion: especialidad.descripcion
        }

        if detailed
          response.merge!({
            total_medicos: especialidad.medicos.count,
            medicos_activos: especialidad.medicos_activos.count,
            created_at: especialidad.created_at
          })
        end

        response
      end

      def medico_simple_response(medico)
        {
          id: medico.id,
          nombre_completo: medico.nombre_completo,
          numero_colegiatura: medico.numero_colegiatura,
          anos_experiencia: medico.anos_experiencia,
          calificacion_promedio: medico.calificacion_promedio,
          tarifa_consulta: medico.tarifa_consulta
        }
      end
    end
  end
end