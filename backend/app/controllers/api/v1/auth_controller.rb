module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_request!, only: [:login, :register, :forgot_password, :reset_password, :validate_reset_token]

      # POST /api/v1/auth/register
      def register
        Rails.logger.info "📥 Params recibidos: #{params.inspect}"
        
        ActiveRecord::Base.transaction do
          # 1. Crear usuario
          user = Usuario.new(register_params)
          user.rol = :paciente
          
          Rails.logger.info "👤 Usuario a crear: #{user.attributes.inspect}"
          
          unless user.save
            Rails.logger.error "❌ Error al crear usuario: #{user.errors.full_messages}"
            return render_error('Error al crear usuario', errors: user.errors.full_messages)
          end
          
          # 2. Crear paciente
          # ✅ SOLUCIÓN: Usar ::Paciente para referenciar el modelo global
          paciente = ::Paciente.new(paciente_params.merge(usuario_id: user.id))
          
          Rails.logger.info "🏥 Paciente a crear: #{paciente.attributes.inspect}"
          
          unless paciente.save
            Rails.logger.error "❌ Error al crear paciente: #{paciente.errors.full_messages}"
            raise ActiveRecord::Rollback, "Error al crear perfil de paciente: #{paciente.errors.full_messages.join(', ')}"
          end
          
          # 3. Generar token y responder
          token = JsonWebToken.encode(user_id: user.id)
          
          render_success(
            {
              token: token,
              user: user_response(user)
            },
            message: 'Registro exitoso',
            status: :created
          )
        end
      rescue ActiveRecord::Rollback => e
        Rails.logger.error("Rollback en registro: #{e.message}")
        render_error("Error en el registro: #{e.message}", status: :unprocessable_entity)
      rescue => e
        Rails.logger.error("Error inesperado en registro: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render_error('Error interno en el registro', status: :internal_server_error)
      end

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
          if current_user.update(password: password_params[:new_password], password_confirmation: password_params[:new_password_confirmation])
            render_success(nil, message: 'Contraseña actualizada exitosamente')
          else
            render_error('Error al actualizar la contraseña', errors: current_user.errors.full_messages)
          end
        else
          render_error('Contraseña actual incorrecta', status: :unauthorized)
        end
      end

      # POST /api/v1/auth/forgot_password
      def forgot_password
        email = params[:email]
        
        if email.blank?
          return render_error('El email es requerido', status: :bad_request)
        end
        
        usuario = Usuario.find_by(email: email.downcase.strip)
        
        if usuario
          usuario.generate_password_reset_token
          
          Rails.logger.info("\n" + "="*80)
          Rails.logger.info("TOKEN DE RESET DE CONTRASEÑA")
          Rails.logger.info("Usuario: #{usuario.email}")
          Rails.logger.info("Token: #{usuario.reset_password_token}")
          Rails.logger.info("URL: http://localhost:4200/reset-password?token=#{usuario.reset_password_token}")
          Rails.logger.info("Expira: #{usuario.reset_password_sent_at + 2.hours}")
          Rails.logger.info("="*80 + "\n")
        end
        
        render_success(
          nil,
          message: 'Si el correo está registrado, recibirás un enlace de recuperación'
        )
      end
      
      # GET /api/v1/auth/validate_reset_token?token=XXXX
      def validate_reset_token
        token = params[:token]
        
        if token.blank?
          return render_error('Token no proporcionado', status: :bad_request)
        end
        
        usuario = Usuario.find_by(reset_password_token: token)
        
        if usuario.nil?
          return render_error('Token inválido', status: :unprocessable_entity)
        end
        
        if usuario.password_reset_token_expired?
          return render_error('El token ha expirado. Solicita uno nuevo.', status: :unprocessable_entity)
        end
        
        render_success(
          { email: usuario.email },
          message: 'Token válido'
        )
      end
      
      # POST /api/v1/auth/reset_password
      def reset_password
        token = params[:token]
        new_password = params[:password]
        password_confirmation = params[:password_confirmation]
        
        if token.blank? || new_password.blank? || password_confirmation.blank?
          return render_error('Todos los campos son requeridos', status: :bad_request)
        end
        
        usuario = Usuario.find_by(reset_password_token: token)
        
        if usuario.nil?
          return render_error('Token inválido', status: :unprocessable_entity)
        end
        
        if usuario.password_reset_token_expired?
          return render_error('El token ha expirado. Solicita uno nuevo.', status: :unprocessable_entity)
        end
        
        if usuario.update(password: new_password, password_confirmation: password_confirmation)
          usuario.clear_password_reset_token
          
          render_success(nil, message: 'Contraseña actualizada exitosamente')
        else
          render_error('Error al actualizar contraseña', errors: usuario.errors.full_messages)
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

      def paciente_params
        return {} unless params[:paciente].present?
        
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

      def medico_params
        return {} unless params[:medico].present?
        
        params.require(:medico).permit(
          :numero_colegiatura,
          :anios_experiencia,
          :biografia,
          :costo_consulta
        )
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
          es_super_admin: user.es_super_admin || false,
          foto_url: absolute_url(user.foto_url),
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
              anios_experiencia: user.medico.anios_experiencia,
              calificacion_promedio: user.medico.calificacion_promedio,
              costo_consulta: user.medico.costo_consulta,
              biografia: user.medico.biografia,
              especialidad_principal: user.medico.especialidad_principal&.nombre,
              especialidades: user.medico.medico_especialidades.includes(:especialidad).map do |me|
                { 
                  id: me.especialidad.id, 
                  nombre: me.especialidad.nombre, 
                  es_principal: me.es_principal 
                }
              end
            }
          end
        when 'administrador'
          response[:admin] = {
            permisos: ['gestionar_usuarios', 'gestionar_medicos', 'gestionar_pacientes', 'ver_reportes']
          }
        end

        response
      end
    end
  end
end