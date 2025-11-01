# app/services/excel_generator_service.rb
require 'caxlsx'

class ExcelGeneratorService
  # Generar Excel de estadísticas del médico
  def self.generar_estadisticas_medico(medico, fecha_inicio, fecha_fin)
    citas = medico.citas
                  .where(fecha_hora_inicio: fecha_inicio..fecha_fin)
                  .order(fecha_hora_inicio: :desc)
    
    p = Axlsx::Package.new
    p.workbook.add_worksheet(name: 'Estadísticas') do |sheet|
      # Estilos
      header_style = sheet.styles.add_style(
        bg_color: '2563EB',
        fg_color: 'FFFFFF',
        b: true,
        alignment: { horizontal: :center }
      )
      
      # RESUMEN GENERAL
      sheet.add_row ['ESTADÍSTICAS - ' + medico.nombre_profesional], style: header_style
      sheet.add_row []
      sheet.add_row ['Período:', "#{fecha_inicio.strftime('%d/%m/%Y')} - #{fecha_fin.strftime('%d/%m/%Y')}"]
      sheet.add_row []
      
      # Estadísticas resumidas
      sheet.add_row ['Métrica', 'Valor'], style: header_style
      sheet.add_row ['Total de citas', citas.count]
      sheet.add_row ['Citas completadas', citas.where(estado: :completada).count]
      sheet.add_row ['Citas canceladas', citas.where(estado: :cancelada).count]
      sheet.add_row ['Citas pendientes', citas.where(estado: :pendiente).count]
      sheet.add_row ['Ingresos totales', "S/ #{citas.where(estado: :completada).sum(:costo).to_f}"]
      sheet.add_row []
      
      # DETALLE DE CITAS
      sheet.add_row ['DETALLE DE CITAS'], style: header_style
      sheet.add_row []
      sheet.add_row [
        'Fecha',
        'Hora',
        'Paciente',
        'Motivo',
        'Estado',
        'Costo'
      ], style: header_style
      
      citas.each do |cita|
        sheet.add_row [
          cita.fecha_hora_inicio.strftime('%d/%m/%Y'),
          cita.fecha_hora_inicio.strftime('%H:%M'),
          cita.paciente.nombre_completo,
          cita.motivo_consulta.truncate(50),
          estado_traducido(cita.estado),
          "S/ #{cita.costo.to_f}"
        ]
      end
      
      # Ajustar anchos de columna
      sheet.column_widths 15, 10, 30, 40, 15, 12
    end
    
    p.to_stream.read
  end
  
  # Generar Excel de listado de médicos (Admin)
  def self.generar_listado_medicos(medicos)
    p = Axlsx::Package.new
    p.workbook.add_worksheet(name: 'Médicos') do |sheet|
      # Estilos
      header_style = sheet.styles.add_style(
        bg_color: '2563EB',
        fg_color: 'FFFFFF',
        b: true,
        alignment: { horizontal: :center }
      )
      
      # Header
      sheet.add_row ['LISTADO DE MÉDICOS - BLUME'], style: header_style
      sheet.add_row ['Generado el', Time.current.strftime('%d/%m/%Y %H:%M')]
      sheet.add_row []
      
      # Columnas
      sheet.add_row [
        'ID',
        'Nombre',
        'Email',
        'Teléfono',
        'Especialidad',
        'N° Colegiatura',
        'Años Experiencia',
        'Costo Consulta',
        'Calificación',
        'Total Citas',
        'Estado',
        'Fecha Registro'
      ], style: header_style
      
      # Datos
      medicos.each do |medico|
        sheet.add_row [
          medico.id,
          medico.nombre_profesional,
          medico.email,
          medico.telefono || 'N/A',
          medico.especialidad_principal&.nombre || 'General',
          medico.numero_colegiatura,
          medico.anios_experiencia || 0,
          "S/ #{medico.costo_consulta.to_f}",
          medico.calificacion_promedio.to_f.round(1),
          medico.citas.count,
          medico.activo? ? 'Activo' : 'Inactivo',
          medico.created_at.strftime('%d/%m/%Y')
        ]
      end
      
      # Ajustar anchos
      sheet.column_widths 15, 25, 25, 15, 20, 15, 12, 12, 10, 10, 10, 12
    end
    
    p.to_stream.read
  end
  
  # Generar Excel de listado de pacientes (Admin)
  def self.generar_listado_pacientes(pacientes)
    p = Axlsx::Package.new
    p.workbook.add_worksheet(name: 'Pacientes') do |sheet|
      # Estilos
      header_style = sheet.styles.add_style(
        bg_color: '2563EB',
        fg_color: 'FFFFFF',
        b: true,
        alignment: { horizontal: :center }
      )
      
      # Header
      sheet.add_row ['LISTADO DE PACIENTES - BLUME'], style: header_style
      sheet.add_row ['Generado el', Time.current.strftime('%d/%m/%Y %H:%M')]
      sheet.add_row []
      
      # Columnas
      sheet.add_row [
        'ID',
        'Nombre',
        'Email',
        'Teléfono',
        'Documento',
        'Tipo Doc',
        'Fecha Nacimiento',
        'Edad',
        'Género',
        'Grupo Sanguíneo',
        'Total Citas',
        'Última Cita',
        'Fecha Registro'
      ], style: header_style
      
      # Datos
      pacientes.each do |paciente|
        ultima_cita = paciente.citas.order(fecha_hora_inicio: :desc).first
        
        sheet.add_row [
          paciente.id,
          paciente.nombre_completo,
          paciente.email,
          paciente.telefono || 'N/A',
          paciente.numero_documento || 'N/A',
          paciente.tipo_documento&.titleize || 'N/A',
          paciente.fecha_nacimiento&.strftime('%d/%m/%Y') || 'N/A',
          paciente.edad || 'N/A',
          paciente.genero&.titleize || 'N/A',
          paciente.grupo_sanguineo || 'N/A',
          paciente.citas.count,
          ultima_cita&.fecha_hora_inicio&.strftime('%d/%m/%Y') || 'N/A',
          paciente.created_at.strftime('%d/%m/%Y')
        ]
      end
      
      # Ajustar anchos
      sheet.column_widths 15, 25, 25, 15, 12, 12, 15, 8, 10, 12, 10, 12, 12
    end
    
    p.to_stream.read
  end
  
  # Generar Excel de reportes admin (Citas)
  def self.generar_reporte_citas_admin(citas, fecha_inicio, fecha_fin)
    p = Axlsx::Package.new
    p.workbook.add_worksheet(name: 'Reporte Citas') do |sheet|
      # Estilos
      header_style = sheet.styles.add_style(
        bg_color: '2563EB',
        fg_color: 'FFFFFF',
        b: true,
        alignment: { horizontal: :center }
      )
      
      # Header
      sheet.add_row ['REPORTE DE CITAS - BLUME'], style: header_style
      sheet.add_row ['Período', "#{fecha_inicio.strftime('%d/%m/%Y')} - #{fecha_fin.strftime('%d/%m/%Y')}"]
      sheet.add_row ['Generado el', Time.current.strftime('%d/%m/%Y %H:%M')]
      sheet.add_row []
      
      # Resumen
      sheet.add_row ['RESUMEN'], style: header_style
      sheet.add_row ['Total de citas', citas.count]
      sheet.add_row ['Completadas', citas.where(estado: :completada).count]
      sheet.add_row ['Canceladas', citas.where(estado: :cancelada).count]
      sheet.add_row ['Pendientes', citas.where(estado: :pendiente).count]
      sheet.add_row ['Ingresos totales', "S/ #{citas.where(estado: :completada).sum(:costo).to_f}"]
      sheet.add_row []
      
      # Detalle
      sheet.add_row ['DETALLE DE CITAS'], style: header_style
      sheet.add_row []
      sheet.add_row [
        'Fecha',
        'Hora',
        'Médico',
        'Especialidad',
        'Paciente',
        'Motivo',
        'Estado',
        'Costo'
      ], style: header_style
      
      citas.order(fecha_hora_inicio: :desc).each do |cita|
        sheet.add_row [
          cita.fecha_hora_inicio.strftime('%d/%m/%Y'),
          cita.fecha_hora_inicio.strftime('%H:%M'),
          cita.medico.nombre_profesional,
          cita.medico.especialidad_principal&.nombre || 'General',
          cita.paciente.nombre_completo,
          cita.motivo_consulta.truncate(40),
          estado_traducido(cita.estado),
          "S/ #{cita.costo.to_f}"
        ]
      end
      
      # Ajustar anchos
      sheet.column_widths 12, 8, 25, 18, 25, 35, 12, 10
    end
    
    p.to_stream.read
  end
  
  private
  
  def self.estado_traducido(estado)
    {
      'pendiente' => 'Pendiente',
      'confirmada' => 'Confirmada',
      'completada' => 'Completada',
      'cancelada' => 'Cancelada',
      'no_asistio' => 'No asistió'
    }[estado.to_s] || estado.to_s.titleize
  end
end
