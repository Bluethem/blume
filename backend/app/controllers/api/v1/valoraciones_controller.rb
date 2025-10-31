# frozen_string_literal: true

module Api
  module V1
    class ValoracionesController < ApplicationController
      before_action :authenticate_request!
      before_action :set_medico, only: [:index, :create]
      before_action :set_valoracion, only: [:show, :update, :destroy]
      before_action :authorize_paciente!, only: [:create, :update, :destroy]

      # GET /api/v1/medicos/:medico_id/valoraciones
      def index
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 10).to_i
        
        valoraciones_query = @medico.valoraciones
                                    .includes(paciente: :usuario)
                                    .recientes
        
        total = valoraciones_query.count
        total_pages = (total.to_f / per_page).ceil
        offset = (page - 1) * per_page
        
        @valoraciones = valoraciones_query.limit(per_page).offset(offset)

        render json: {
          success: true,
          data: @valoraciones.map { |v| valoracion_json(v) },
          estadisticas: {
            calificacion_promedio: @medico.calificacion_promedio,
            total_valoraciones: @medico.total_resenas,
            distribucion: @medico.distribucion_calificaciones
          },
          meta: {
            page: page,
            per_page: per_page,
            total: total,
            total_pages: total_pages
          }
        }
      end

      # GET /api/v1/valoraciones/:id
      def show
        render json: {
          success: true,
          data: valoracion_json(@valoracion)
        }
      end

      # POST /api/v1/medicos/:medico_id/valoraciones
      def create
        paciente = current_user.paciente
        
        unless paciente
          return render json: {
            success: false,
            error: 'Solo los pacientes pueden crear valoraciones'
          }, status: :forbidden
        end

        # Verificar si ya valoró a este médico
        if paciente.valoraciones.exists?(medico_id: @medico.id)
          return render json: {
            success: false,
            error: 'Ya has valorado a este médico'
          }, status: :unprocessable_entity
        end

        # Verificar que el paciente haya tenido al menos una cita completada con el médico
        unless paciente.citas.where(medico_id: @medico.id, estado: :completada).exists?
          return render json: {
            success: false,
            error: 'Solo puedes valorar a médicos con los que hayas tenido una cita completada'
          }, status: :unprocessable_entity
        end

        @valoracion = @medico.valoraciones.build(valoracion_params)
        @valoracion.paciente = paciente

        if @valoracion.save
          render json: {
            success: true,
            message: 'Valoración creada exitosamente',
            data: valoracion_json(@valoracion)
          }, status: :created
        else
          render json: {
            success: false,
            error: 'Error al crear la valoración',
            errors: @valoracion.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/valoraciones/:id
      def update
        unless @valoracion.paciente.usuario_id == current_user.id
          return render json: {
            success: false,
            error: 'No autorizado'
          }, status: :forbidden
        end

        if @valoracion.update(valoracion_params)
          render json: {
            success: true,
            message: 'Valoración actualizada exitosamente',
            data: valoracion_json(@valoracion)
          }
        else
          render json: {
            success: false,
            error: 'Error al actualizar la valoración',
            errors: @valoracion.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/valoraciones/:id
      def destroy
        unless @valoracion.paciente.usuario_id == current_user.id
          return render json: {
            success: false,
            error: 'No autorizado'
          }, status: :forbidden
        end

        if @valoracion.destroy
          render json: {
            success: true,
            message: 'Valoración eliminada exitosamente'
          }
        else
          render json: {
            success: false,
            error: 'Error al eliminar la valoración'
          }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/medicos/:medico_id/estadisticas_valoraciones
      def estadisticas
        @medico = Medico.find(params[:medico_id])
        
        render json: {
          success: true,
          data: {
            calificacion_promedio: @medico.calificacion_promedio,
            total_valoraciones: @medico.total_resenas,
            distribucion: @medico.distribucion_calificaciones
          }
        }
      end

      private

      def set_medico
        @medico = Medico.find(params[:medico_id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          error: 'Médico no encontrado'
        }, status: :not_found
      end

      def set_valoracion
        @valoracion = Valoracion.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          success: false,
          error: 'Valoración no encontrada'
        }, status: :not_found
      end

      def authorize_paciente!
        unless current_user.es_paciente?
          render json: {
            success: false,
            error: 'Solo los pacientes pueden realizar esta acción'
          }, status: :forbidden
        end
      end

      def valoracion_params
        params.require(:valoracion).permit(:calificacion, :comentario, :anonimo, :cita_id)
      end

      def valoracion_json(valoracion)
        {
          id: valoracion.id,
          calificacion: valoracion.calificacion,
          comentario: valoracion.comentario,
          anonimo: valoracion.anonimo,
          nombre_paciente: valoracion.nombre_paciente,
          iniciales_paciente: valoracion.iniciales_paciente,
          created_at: valoracion.created_at,
          fecha_formateada: I18n.l(valoracion.created_at, format: :long)
        }
      end
    end
  end
end
