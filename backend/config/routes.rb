# config/routes.rb
Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API v1
  namespace :api do
    namespace :v1 do
      namespace :auth do
        post 'register', to: 'auth#register'
        post 'login', to: 'auth#login'
        get 'me', to: 'auth#me'
        put 'update_profile', to: 'auth#update_profile'
        put 'change_password', to: 'auth#change_password'
        delete 'logout', to: 'auth#logout'
        
        # NUEVAS RUTAS
        post 'forgot_password', to: 'auth#forgot_password'
        post 'reset_password', to: 'auth#reset_password'
        get 'validate_reset_token', to: 'auth#validate_reset_token'
      end

      # Recursos principales
      resources :usuarios, except: [:new, :edit] do
        member do
          put 'activate', to: 'usuarios#activate'
          put 'deactivate', to: 'usuarios#deactivate'
        end
      end

      resources :pacientes, except: [:new, :edit] do
        member do
          get 'historial_citas', to: 'pacientes#historial_citas'
          get 'proximas_citas', to: 'pacientes#proximas_citas'
        end
      end

      resources :medicos, except: [:new, :edit] do
        member do
          get 'horarios', to: 'medicos#horarios'
          get 'citas', to: 'medicos#citas'
          get 'estadisticas', to: 'medicos#estadisticas'
        end
        collection do
          get 'buscar', to: 'medicos#buscar'
          get 'disponibles', to: 'medicos#disponibles'
        end
      end

      resources :especialidades, except: [:new, :edit] do
        member do
          get 'medicos', to: 'especialidades#medicos'
        end
      end

      resources :certificaciones, except: [:new, :edit]

      resources :citas, except: [:new, :edit] do
        member do
          put 'confirmar', to: 'citas#confirmar'
          put 'cancelar', to: 'citas#cancelar'
          put 'completar', to: 'citas#completar'
          put 'reprogramar', to: 'citas#reprogramar'
        end
        collection do
          get 'pendientes', to: 'citas#pendientes'
          get 'proximas', to: 'citas#proximas'
          get 'historial', to: 'citas#historial'
        end
      end

      resources :horarios_disponibles, except: [:new, :edit], path: 'horarios' do
        collection do
          get 'por_medico/:medico_id', to: 'horarios_disponibles#por_medico'
          get 'disponibles', to: 'horarios_disponibles#disponibles'
        end
      end

      resources :notificaciones, only: [:index, :show] do
        member do
          put 'marcar_leida', to: 'notificaciones#marcar_leida'
        end
        collection do
          put 'marcar_todas_leidas', to: 'notificaciones#marcar_todas_leidas'
          get 'no_leidas', to: 'notificaciones#no_leidas'
        end
      end

      # Dashboard y estadísticas
      namespace :dashboard do
        get 'paciente', to: 'dashboard#paciente'
        get 'medico', to: 'dashboard#medico'
        get 'admin', to: 'dashboard#admin'
      end
    end
  end

  # Root path
  root "rails/health#show"
end