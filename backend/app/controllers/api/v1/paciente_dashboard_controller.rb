module Api
  module V1
    class PacienteDashboardController < ApplicationController
      before_action :authenticate_request!
      before_action :require_paciente!

      # GET /api/v1/paciente/dashboard
      def index
        paciente = current_user.paciente

        render_success({
          paciente: paciente_info(paciente),
          proxima_cita: proxima_cita(paciente),
          estadisticas: estadisticas(paciente),
          medicos_disponibles: medicos_disponibles,
          notificaciones_recientes: notificaciones_recientes
        })
      end

      # GET /api/v1/paciente/dashboard/estadisticas
      def estadisticas_detalladas
        paciente = current_user.paciente
        
        render_success({
          total_citas: paciente.citas.count,
          citas_completadas: paciente.citas.completada.count,
          citas_pendientes: paciente.citas.where(estado: [:pendiente, :confirmada]).count,
          citas_canceladas: paciente.citas.cancelada.count,
          proximas_citas: paciente.citas.proximas.count,
          ultima_cita: ultima_cita(paciente),
          medicos_visitados: medicos_visitados(paciente)
        })
      end

      private

      def require_paciente!
        unless current_user.paciente?
          render_error('Acceso denegado. Solo para pacientes.', status: :forbidden)
        end
      end

      def paciente_info(paciente)
        {
          id: paciente.id,
          nombre_completo: paciente.nombre_completo,
          edad: paciente.edad,
          genero: paciente.genero,
          email: paciente.usuario.email,
          telefono: paciente.usuario.telefono,
          direccion: paciente.usuario.direccion,
          fecha_nacimiento: paciente.fecha_nacimiento,
          tipo_documento: paciente.tipo_documento,
          numero_documento: paciente.numero_documento,
          grupo_sanguineo: paciente.grupo_sanguineo,
          alergias: paciente.alergias
        }
      end

      def proxima_cita(paciente)
        cita = paciente.citas
          .where(estado: [:pendiente, :confirmada])
          .where('fecha_hora_inicio > ?', Time.current)
          .order(:fecha_hora_inicio)
          .includes(medico: :usuario)
          .first

        return nil unless cita

        {
          id: cita.id,
          fecha_hora_inicio: cita.fecha_hora_inicio,
          fecha_hora_fin: cita.fecha_hora_fin,
          estado: cita.estado,
          estado_label: estado_label(cita.estado),
          motivo_consulta: cita.motivo_consulta,
          costo: cita.costo,
          medico: {
            id: cita.medico.id,
            nombre_completo: cita.medico.nombre_profesional,
            especialidad: cita.medico.especialidad_principal,
            foto_url: nil, # Agregar si tienen fotos
            telefono: cita.medico.usuario.telefono,
            direccion: cita.medico.usuario.direccion
          },
          dias_restantes: dias_restantes(cita.fecha_hora_inicio),
          puede_cancelar: cita.puede_cancelarse?
        }
      end

      def estadisticas(paciente)
        {
          total_citas: paciente.citas.count,
          citas_pendientes: paciente.citas.where(estado: [:pendiente, :confirmada])
            .where('fecha_hora_inicio > ?', Time.current).count,
          citas_completadas: paciente.citas.completada.count,
          citas_canceladas: paciente.citas.cancelada.count
        }
      end

      def medicos_disponibles
        # Obtener médicos activos con sus datos
        medicos = Medico.where(activo: true)
          .includes(:usuario, :certificaciones)
          .limit(6)
          .order('RANDOM()') # Orden aleatorio para variedad

        medicos.map do |medico|
          {
            id: medico.id,
            nombre_completo: medico.nombre_profesional,
            especialidad: medico.especialidad_principal,
            anos_experiencia: medico.anios_experiencia,
            costo_consulta: medico.costo_consulta,
            biografia: medico.biografia&.truncate(100),
            calificacion: 4.5, # Calcular calificación real si implementas reviews
            total_reviews: rand(10..50), # Temporal
            foto_url: nil, # Agregar si tienen fotos
            certificaciones: medico.certificaciones.map(&:nombre).take(2),
            disponible_hoy: tiene_horario_disponible_hoy?(medico)
          }
        end
      end

      def notificaciones_recientes
        current_user.notificaciones
          .where(leida: false)
          .order(created_at: :desc)
          .limit(5)
          .map do |notif|
            {
              id: notif.id,
              tipo: notif.tipo,
              titulo: notif.titulo,
              mensaje: notif.mensaje,
              leida: notif.leida,
              created_at: notif.created_at,
              tiempo_relativo: tiempo_relativo(notif.created_at),
              icono: icono_notificacion(notif.tipo),
              color: color_notificacion(notif.tipo)
            }
          end
      end

      def ultima_cita(paciente)
        cita = paciente.citas
          .where('fecha_hora_inicio < ?', Time.current)
          .order(fecha_hora_inicio: :desc)
          .includes(medico: :usuario)
          .first

        return nil unless cita

        {
          id: cita.id,
          fecha: cita.fecha_hora_inicio,
          medico: cita.medico.nombre_profesional,
          especialidad: cita.medico.especialidad_principal,
          diagnostico: cita.diagnostico
        }
      end

      def medicos_visitados(paciente)
        paciente.citas
          .completada
          .includes(medico: :usuario)
          .group(:medico_id)
          .count
          .size
      end

      def tiene_horario_disponible_hoy?(medico)
        dia_semana = Date.current.wday
        medico.horarios.where(dia_semana: dia_semana, activo: true).exists?
      end

      def estado_label(estado)
        {
          'pendiente' => 'Pendiente',
          'confirmada' => 'Confirmada',
          'cancelada' => 'Cancelada',
          'completada' => 'Completada',
          'no_asistio' => 'No asistió'
        }[estado] || estado
      end

      def dias_restantes(fecha)
        ((fecha.to_date - Date.current).to_i).abs
      end

      def tiempo_relativo(time)
        seconds = (Time.current - time).to_i
        
        case seconds
        when 0..59
          'hace unos segundos'
        when 60..3599
          minutes = seconds / 60
          "hace #{minutes} #{'minuto'.pluralize(minutes)}"
        when 3600..86399
          hours = seconds / 3600
          "hace #{hours} #{'hora'.pluralize(hours)}"
        else
          days = seconds / 86400
          "hace #{days} #{'día'.pluralize(days)}"
        end
      end

      def icono_notificacion(tipo)
        {
          'cita_creada' => 'event_available',
          'cita_confirmada' => 'check_circle',
          'cita_cancelada' => 'cancel',
          'recordatorio' => 'alarm'
        }[tipo] || 'notifications'
      end

      def color_notificacion(tipo)
        {
          'cita_creada' => 'blue',
          'cita_confirmada' => 'green',
          'cita_cancelada' => 'red',
          'recordatorio' => 'orange'
        }[tipo] || 'gray'
      end
    end
  end
end