# config/routes.rb
Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API v1
  namespace :api do
    namespace :v1 do
      # Rutas de autenticación (sin namespace adicional)
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      get 'auth/me', to: 'auth#me'
      put 'auth/update_profile', to: 'auth#update_profile'
      put 'auth/change_password', to: 'auth#change_password'
      delete 'auth/logout', to: 'auth#logout'
      post 'auth/forgot_password', to: 'auth#forgot_password'
      post 'auth/reset_password', to: 'auth#reset_password'
      get 'auth/validate_reset_token', to: 'auth#validate_reset_token'

      # Rutas específicas de paciente (SIN namespace)
      get 'paciente/dashboard', to: 'paciente_dashboard#index'
      get 'paciente/dashboard/estadisticas', to: 'paciente_dashboard#estadisticas_detalladas'
      
      resources :paciente_citas, path: 'paciente/citas', only: [:index, :show, :create] do
        member do
          put 'cancelar'
          post 'reagendar'
          post 'valorar'
        end
      end

      # Recursos principales
      resources :usuarios, except: [:new, :edit] do
        member do
          put 'activate'
          put 'deactivate'
        end
      end

      resources :pacientes, except: [:new, :edit] do
        member do
          get 'historial_citas'
          get 'proximas_citas'
        end
        resources :citas, only: [:index, :show, :create] do
          member do
            put 'cancelar'
            post 'reagendar'
          end
        end
      end

      resources :medicos, except: [:new, :edit] do
        member do
          get 'horarios'
          get 'citas'
          get 'estadisticas'
          get 'horarios_disponibles'
        end
        collection do
          get 'buscar'
          get 'disponibles'
          get 'especialidades'
        end
      end

      resources :especialidades, except: [:new, :edit] do
        member do
          get 'medicos'
        end
      end

      resources :certificaciones, except: [:new, :edit]

      resources :citas, except: [:new, :edit] do
        member do
          put 'confirmar'
          put 'cancelar'
          put 'completar'
          put 'reagendar'
          post 'valorar'
        end
        collection do
          get 'proximas'
          get 'pendientes'
          get 'historial'
        end
      end

      resources :recetas, except: [:new, :edit]

      resources :diagnosticos, except: [:new, :edit] do
        member do
          get 'historial'
        end
      end

      resources :notificaciones, except: [:new, :edit] do
        member do
          put 'marcar_leida'
        end
        collection do
          put 'marcar_todas_leidas'
          delete 'eliminar_todas'
        end
      end

      resources :valoraciones, except: [:new, :edit]

      resources :horarios_disponibles, except: [:new, :edit], path: 'horarios' do
        collection do
          get 'por_medico/:medico_id', to: 'horarios_disponibles#por_medico'
          get 'disponibles'
        end
      end
    end
  end

  # Root path
  root "rails/health#show"
end