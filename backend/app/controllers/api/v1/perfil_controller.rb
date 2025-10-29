# frozen_string_literal: true

module Api
  module V1
    class PerfilController < ApplicationController
      before_action :authenticate_request!

      # GET /api/v1/perfil
      def show
        render_success({
          id: current_user.id,
          nombre: current_user.nombre,
          apellido: current_user.apellido,
          email: current_user.email,
          telefono: current_user.telefono,
          direccion: current_user.direccion,
          rol: current_user.rol,
          foto_url: current_user.foto_perfil_url
        })
      end

      # PUT /api/v1/perfil
      def update
        if current_user.update(perfil_params)
          render_success({
            message: 'Perfil actualizado exitosamente',
            usuario: {
              id: current_user.id,
              nombre: current_user.nombre,
              apellido: current_user.apellido,
              email: current_user.email,
              telefono: current_user.telefono,
              direccion: current_user.direccion,
              foto_url: current_user.foto_perfil_url
            }
          })
        else
          render_error('Error al actualizar el perfil', errors: current_user.errors.full_messages)
        end
      end

      # POST /api/v1/perfil/upload_foto
      def upload_foto
        unless params[:foto].present?
          return render_error('No se proporcionó ninguna imagen')
        end

        foto = params[:foto]
        
        # Validar tipo de archivo
        unless foto.content_type.start_with?('image/')
          return render_error('El archivo debe ser una imagen')
        end

        # Validar tamaño (máx 5MB)
        if foto.size > 5.megabytes
          return render_error('La imagen no debe superar los 5MB')
        end

        # Crear directorio si no existe
        uploads_dir = Rails.root.join('public', 'uploads', 'avatars')
        FileUtils.mkdir_p(uploads_dir) unless File.directory?(uploads_dir)

        # Generar nombre único
        extension = File.extname(foto.original_filename)
        filename = "#{current_user.id}_#{Time.current.to_i}#{extension}"
        filepath = uploads_dir.join(filename)

        # Guardar archivo
        File.open(filepath, 'wb') do |file|
          file.write(foto.read)
        end

        # Actualizar URL en base de datos
        foto_url = "/uploads/avatars/#{filename}"
        current_user.update(foto_url: foto_url)

        render_success({
          message: 'Foto de perfil actualizada exitosamente',
          foto_url: current_user.foto_perfil_url
        })
      rescue => e
        Rails.logger.error("Error uploading foto: #{e.message}")
        render_error('Error al subir la imagen')
      end

      private

      def perfil_params
        params.require(:usuario).permit(:nombre, :apellido, :telefono, :direccion)
      end
    end
  end
end
