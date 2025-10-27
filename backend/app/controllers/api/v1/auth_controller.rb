module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request!, only: [:login, :register]

      # POST /api/v1/auth/login
      def login
        user = Usuario.find_by(email: login_params[:email].downcase)

        if user&.authenticate(login_params[:password])
          if user.activo?
            token = JsonWebToken.encode(user_id: user.id)
            
            render_success(
              {
                token: token,
                user: user_response(user)
              },
              message: 'Inicio de sesión exitoso'
            )
          else
            render_error('Usuario inactivo. Contacte al administrador.', status: :forbidden)
          end
        else
          render_error('Email o contraseña incorrectos', status: :unauthorized)
        end
      end

      # POST /api/v1/auth/register
      def register
        ActiveRecord::Base.transaction do
          # Crear usuario
          user = Usuario.new(register_params)
          user.rol = :paciente # ← Usar símbolo directamente
          
          if user.save
            # Crear perfil según el rol
            profile = create_user_profile(user)
            
            if profile.persisted?
              token = JsonWebToken.encode(user_id: user.id)
              
              render_success(
                {
                  token: token,
                  user: user_response(user)
                },
                message: 'Registro exitoso',
                status: :created
              )
            else
              raise ActiveRecord::Rollback
              render_error('Error al crear el perfil', errors: profile.errors.full_messages)
            end
          else
            render_error('Error al crear el usuario', errors: user.errors.full_messages)
          end
        end
      rescue => e
        Rails.logger.error("Registration error: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render_error('Error en el registro. Intente nuevamente.', status: :internal_server_error)
      end

      # GET /api/v1/auth/me
      def me
        render_success(user_response(current_user))
      end

      # PUT /api/v1/auth/update_profile
      def update_profile
        if current_user.update(update_profile_params)
          render_success(
            user_response(current_user),
            message: 'Perfil actualizado exitosamente'
          )
        else
          render_error('Error al actualizar el perfil', errors: current_user.errors.full_messages)
        end
      end

      # PUT /api/v1/auth/change_password
      def change_password
        if current_user.authenticate(password_params[:current_password])
          if current_user.update(password: password_params[:new_password])
            render_success(nil, message: 'Contraseña actualizada exitosamente')
          else
            render_error('Error al actualizar la contraseña', errors: current_user.errors.full_messages)
          end
        else
          render_error('Contraseña actual incorrecta', status: :unauthorized)
        end
      end

      private

      def login_params
        params.require(:auth).permit(:email, :password)
      end

      def register_params
        params.require(:auth).permit(
          :email, 
          :password, 
          :password_confirmation,
          :nombre, 
          :apellido, 
          :telefono, 
          :direccion
        )
      end

      def update_profile_params
        params.require(:user).permit(
          :nombre, 
          :apellido, 
          :telefono, 
          :direccion
        )
      end

      def password_params
        params.require(:password).permit(:current_password, :new_password, :new_password_confirmation)
      end

      def create_user_profile(user)
        case user.rol
        when 'paciente'
          Paciente.create!(
            usuario_id: user.id,
            fecha_nacimiento: params[:fecha_nacimiento],
            genero: params[:genero],
            tipo_documento: params[:tipo_documento],
            numero_documento: params[:numero_documento]
          )
        when 'medico'
          Medico.create!(
            usuario_id: user.id,
            numero_colegiatura: params[:numero_colegiatura],
            anos_experiencia: params[:anos_experiencia] || 0,
            biografia: params[:biografia]
          )
        else
          # Para administradores no se crea perfil adicional
          OpenStruct.new(persisted?: true)
        end
      end

      def user_response(user)
        response = {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          nombre_completo: user.nombre_completo,
          telefono: user.telefono,
          direccion: user.direccion,
          rol: user.rol,
          activo: user.activo,
          created_at: user.created_at
        }

        # Agregar datos del perfil según el rol
        case user.rol
        when 'paciente'
          if user.paciente
            response[:paciente] = {
              id: user.paciente.id,
              fecha_nacimiento: user.paciente.fecha_nacimiento,
              edad: user.paciente.edad,
              genero: user.paciente.genero,
              tipo_documento: user.paciente.tipo_documento,
              numero_documento: user.paciente.numero_documento,
              grupo_sanguineo: user.paciente.grupo_sanguineo,
              alergias: user.paciente.alergias
            }
          end
        when 'medico'
          if user.medico
            response[:medico] = {
              id: user.medico.id,
              numero_colegiatura: user.medico.numero_colegiatura,
              anos_experiencia: user.medico.anos_experiencia,
              calificacion_promedio: user.medico.calificacion_promedio,
              tarifa_consulta: user.medico.tarifa_consulta,
              biografia: user.medico.biografia,
              especialidades: user.medico.especialidades.map { |e| { id: e.id, nombre: e.nombre } }
            }
          end
        end

        response
      end

      def forgot_password
        email = params[:email]      
        if email.blank?
          return render json: { 
            success: false, 
            error: 'El email es requerido' 
          }, status: :bad_request
        end
        
        usuario = Usuario.find_by(email: email.downcase.strip)
        
        if usuario
          # Generar token
          usuario.generate_password_reset_token
          
          # TODO: Enviar email con el token
          # UserMailer.password_reset(usuario).deliver_later
          
          # Por ahora, imprimir el token en consola para testing
          puts "\n" + "="*80
          puts "TOKEN DE RESET DE CONTRASEÑA"
          puts "Usuario: #{usuario.email}"
          puts "Token: #{usuario.reset_password_token}"
          puts "URL: http://localhost:4200/reset-password?token=#{usuario.reset_password_token}"
          puts "Expira: #{usuario.reset_password_sent_at + 2.hours}"
          puts "="*80 + "\n"
        end
        
        # Por seguridad, siempre devolver éxito aunque el email no exista
        # Esto previene que atacantes descubran qué emails están registrados
        render json: { 
          success: true, 
          message: 'Si el correo está registrado, recibirás un enlace de recuperación' 
        }, status: :ok
      end
      
      # GET /api/v1/auth/validate_reset_token?token=XXXX
      def validate_reset_token
        token = params[:token]
        
        if token.blank?
          return render json: { 
            success: false, 
            error: 'Token no proporcionado' 
          }, status: :bad_request
        end
        
        usuario = Usuario.find_by(reset_password_token: token)
        
        if usuario.nil?
          return render json: { 
            success: false, 
            error: 'Token inválido' 
          }, status: :unprocessable_entity
        end
        
        if usuario.password_reset_token_expired?
          return render json: { 
            success: false, 
            error: 'El token ha expirado. Solicita uno nuevo.' 
          }, status: :unprocessable_entity
        end
        
        render json: { 
          success: true, 
          message: 'Token válido',
          data: {
            email: usuario.email
          }
        }, status: :ok
      end
      
      # POST /api/v1/auth/reset_password
      def reset_password
        token = params[:token]
        new_password = params[:password]
        password_confirmation = params[:password_confirmation]
        
        # Validar que los parámetros estén presentes
        if token.blank? || new_password.blank? || password_confirmation.blank?
          return render json: { 
            success: false, 
            error: 'Todos los campos son requeridos' 
          }, status: :bad_request
        end
        
        # Buscar usuario por token
        usuario = Usuario.find_by(reset_password_token: token)
        
        if usuario.nil?
          return render json: { 
            success: false, 
            error: 'Token inválido' 
          }, status: :unprocessable_entity
        end
        
        # Verificar que el token no haya expirado
        if usuario.password_reset_token_expired?
          return render json: { 
            success: false, 
            error: 'El token ha expirado. Solicita uno nuevo.' 
          }, status: :unprocessable_entity
        end
        
        # Verificar que las contraseñas coincidan
        if new_password != password_confirmation
          return render json: { 
            success: false, 
            error: 'Las contraseñas no coinciden' 
          }, status: :unprocessable_entity
        end
        
        # Actualizar contraseña
        if usuario.update(
          password: new_password, 
          password_confirmation: password_confirmation
        )
          # Limpiar token de reset
          usuario.clear_password_reset_token
          
          render json: { 
            success: true, 
            message: 'Contraseña actualizada exitosamente' 
          }, status: :ok
        else
          render json: { 
            success: false, 
            error: 'Error al actualizar contraseña',
            details: usuario.errors.full_messages 
          }, status: :unprocessable_entity
        end
      end
    end
  end
end