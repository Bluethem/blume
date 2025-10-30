Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API v1
  namespace :api do
    namespace :v1 do
      get "medico_notificaciones/index"
      get "medico_notificaciones/marcar_todas_leidas"
      get "medico_notificaciones/marcar_leida"
      get "medico_notificaciones/marcar_no_leida"
      get "medico_notificaciones/destroy"
      get "medico_perfil/show"
      get "medico_perfil/update"
      get "medico_estadisticas/index"
      get "medico_horarios/disponibles"
      get "medico_pacientes/buscar"
      get "medico_pacientes/index"
      get "medico_pacientes/show"
      get "medico_pacientes/create"
      get "medico_citas/index"
      get "medico_citas/show"
      get "medico_citas/create"
      get "medico_citas/completar"
      get "medico_citas/cancelar"
      get "medico_dashboard/index"
      get "medico_dashboard/estadisticas"
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
      # PERFIL
      # =====================================================
      get 'perfil', to: 'perfil#show'
      put 'perfil', to: 'perfil#update'
      post 'perfil/upload_foto', to: 'perfil#upload_foto'

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
      # DASHBOARD MÉDICO
      # =====================================================
      get 'medico/dashboard', to: 'medico_dashboard#index'
      get 'medico/dashboard/estadisticas', to: 'medico_dashboard#estadisticas'

      # =====================================================
      # CITAS MÉDICO
      # =====================================================
      resources :medico_citas, path: 'medico/citas', only: [:index, :show, :create] do
        member do
          put 'completar'
          put 'cancelar'
        end
      end

      # =====================================================
      # PACIENTES MÉDICO
      # =====================================================
      get 'medico/pacientes/buscar', to: 'medico_pacientes#buscar'
      resources :medico_pacientes, path: 'medico/pacientes', only: [:index, :show, :create, :update]

      # =====================================================
      # HORARIOS MÉDICO
      # =====================================================
      get 'medico/horarios/disponibles', to: 'medico_horarios#disponibles'
      resources :medico_horarios, path: 'medico/horarios', only: [:index, :create, :update, :destroy]

      # =====================================================
      # ESTADÍSTICAS MÉDICO
      # =====================================================
      get 'medico/estadisticas', to: 'medico_estadisticas#index'

      # =====================================================
      # PERFIL MÉDICO
      # =====================================================
      get 'medico/perfil', to: 'medico_perfil#show'
      put 'medico/perfil', to: 'medico_perfil#update'

      # =====================================================
      # NOTIFICACIONES MÉDICO
      # =====================================================
      get 'medico/notificaciones', to: 'medico_notificaciones#index'
      post 'medico/notificaciones/marcar_todas_leidas', to: 'medico_notificaciones#marcar_todas_leidas'
      put 'medico/notificaciones/:id/marcar_leida', to: 'medico_notificaciones#marcar_leida'
      put 'medico/notificaciones/:id/marcar_no_leida', to: 'medico_notificaciones#marcar_no_leida'
      delete 'medico/notificaciones/:id', to: 'medico_notificaciones#destroy'

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
          get 'estadisticas_valoraciones', to: 'valoraciones#estadisticas'
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
        
        # ✅ VALORACIONES NESTED
        resources :valoraciones, only: [:index, :create]
      end
      
      # ✅ VALORACIONES (operaciones individuales)
      resources :valoraciones, only: [:show, :update, :destroy]

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
          get 'contadores'
          get 'mis-citas'
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