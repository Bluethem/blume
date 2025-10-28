Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API v1
  namespace :api do
    namespace :v1 do
      # =====================================================
      # AUTENTICACIÓN
      # =====================================================
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      get 'auth/me', to: 'auth#me'
      put 'auth/update_profile', to: 'auth#update_profile'
      put 'auth/change_password', to: 'auth#change_password'
      delete 'auth/logout', to: 'auth#logout'
      post 'auth/forgot_password', to: 'auth#forgot_password'
      post 'auth/reset_password', to: 'auth#reset_password'
      get 'auth/validate_reset_token', to: 'auth#validate_reset_token'

      # =====================================================
      # DASHBOARD PACIENTE
      # =====================================================
      get 'paciente/dashboard', to: 'paciente_dashboard#index'
      get 'paciente/dashboard/estadisticas', to: 'paciente_dashboard#estadisticas_detalladas'
      
      resources :paciente_citas, path: 'paciente/citas', only: [:index, :show, :create] do
        member do
          put 'cancelar'
          post 'reagendar'
          post 'valorar'
        end
      end

      # =====================================================
      # USUARIOS
      # =====================================================
      resources :usuarios, except: [:new, :edit] do
        member do
          put 'activate'
          put 'deactivate'
        end
      end

      # =====================================================
      # PACIENTES
      # =====================================================
      resources :pacientes, except: [:new, :edit] do
        member do
          get 'historial_citas'
          get 'proximas_citas'
        end
      end

      # =====================================================
      # MÉDICOS
      # =====================================================
      resources :medicos, except: [:new, :edit] do
        collection do
          get 'buscar'
          get 'disponibles'
        end
        member do
          get 'citas'
          get 'estadisticas'
        end
        
        # ✅ HORARIOS NESTED (única definición)
        resources :horarios, controller: 'horario_medicos', except: [:show] do
          collection do
            get :disponibles
            get :semana
          end
          member do
            post :activar
          end
        end
      end

      # =====================================================
      # ESPECIALIDADES
      # =====================================================
      resources :especialidades, except: [:new, :edit] do
        member do
          get 'medicos'
        end
      end

      # =====================================================
      # CERTIFICACIONES
      # =====================================================
      resources :certificaciones, except: [:new, :edit]

      # =====================================================
      # CITAS
      # =====================================================
      resources :citas, except: [:new, :edit] do
        collection do
          get 'proximas'
          get 'pendientes'
          get 'historial'
        end
        member do
          put 'confirmar'
          put 'cancelar'
          put 'completar'
          put 'reagendar'
          post 'valorar'
        end
      end

      # =====================================================
      # RECETAS Y DIAGNÓSTICOS
      # =====================================================
      resources :recetas, except: [:new, :edit]
      
      resources :diagnosticos, except: [:new, :edit] do
        member do
          get 'historial'
        end
      end

      # =====================================================
      # NOTIFICACIONES
      # =====================================================
      resources :notificaciones, except: [:new, :edit] do
        collection do
          put 'marcar_todas_leidas'
          delete 'eliminar_todas'
          get 'no_leidas'
        end
        member do
          put 'marcar_leida'
        end
      end

      # =====================================================
      # VALORACIONES
      # =====================================================
      resources :valoraciones, except: [:new, :edit]
    end
  end

  # Root path
  root "rails/health#show"
end