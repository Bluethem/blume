# app/services/pdf_generator_service.rb
require 'prawn'
require 'prawn/table'

# Ocultar warning de fuentes UTF-8
Prawn::Fonts::AFM.hide_m17n_warning = true

class PdfGeneratorService
  # Generar PDF de resumen de cita individual
  def self.generar_resumen_cita(cita)
    Prawn::Document.new(page_size: 'A4', margin: 40) do |pdf|
      # ========== HEADER ==========
      pdf.font 'Helvetica'
      
      # Logo y título (simular header)
      pdf.bounding_box([0, pdf.cursor], width: pdf.bounds.width) do
        pdf.text 'Blume - Sistema de Gestión Médica', 
                 size: 20, 
                 style: :bold, 
                 color: '2563EB',
                 align: :center
        pdf.move_down 5
        pdf.stroke_horizontal_rule
      end
      
      pdf.move_down 20
      
      # ========== TÍTULO DEL DOCUMENTO ==========
      pdf.text 'RESUMEN DE CITA MÉDICA', 
               size: 16, 
               style: :bold, 
               align: :center
      
      pdf.move_down 20
      
      # ========== INFORMACIÓN DE LA CITA ==========
      info_data = [
        ['Fecha:', cita.fecha_hora_inicio.strftime('%d/%m/%Y')],
        ['Hora:', cita.fecha_hora_inicio.strftime('%H:%M')],
        ['Estado:', estado_traducido(cita.estado)],
        ['Costo:', "S/ #{cita.costo}"]
      ]
      
      pdf.table(info_data, 
                cell_style: { borders: [], padding: [5, 10] },
                column_widths: [120, 350]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      pdf.stroke_horizontal_rule
      pdf.move_down 20
      
      # ========== INFORMACIÓN DEL PACIENTE ==========
      pdf.text 'PACIENTE', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      
      paciente_data = [
        ['Nombre:', cita.paciente.nombre_completo],
        ['Documento:', cita.paciente.numero_documento || 'No especificado'],
        ['Teléfono:', cita.paciente.telefono || 'No especificado'],
        ['Email:', cita.paciente.email]
      ]
      
      pdf.table(paciente_data, 
                cell_style: { borders: [], padding: [3, 10] },
                column_widths: [120, 350]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      
      # ========== INFORMACIÓN DEL MÉDICO ==========
      pdf.text 'MÉDICO', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      
      medico_data = [
        ['Nombre:', cita.medico.nombre_profesional],
        ['Especialidad:', cita.medico.especialidad_principal&.nombre || 'General'],
        ['N° Colegiatura:', cita.medico.numero_colegiatura],
        ['Teléfono:', cita.medico.telefono || 'No especificado']
      ]
      
      if cita.medico.direccion.present?
        medico_data << ['Consultorio:', cita.medico.direccion]
      end
      
      pdf.table(medico_data, 
                cell_style: { borders: [], padding: [3, 10] },
                column_widths: [120, 350]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      pdf.stroke_horizontal_rule
      pdf.move_down 20
      
      # ========== MOTIVO DE CONSULTA ==========
      pdf.text 'MOTIVO DE CONSULTA', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      pdf.text cita.motivo_consulta, align: :justify, size: 11
      
      pdf.move_down 20
      
      # ========== DIAGNÓSTICO (si existe) ==========
      if cita.diagnostico.present?
        pdf.text 'DIAGNÓSTICO', size: 14, style: :bold, color: '1F2937'
        pdf.move_down 10
        pdf.text cita.diagnostico, align: :justify, size: 11
        pdf.move_down 20
      end
      
      # ========== OBSERVACIONES / INDICACIONES (si existen) ==========
      if cita.observaciones.present?
        pdf.text 'OBSERVACIONES / INDICACIONES', size: 14, style: :bold, color: '1F2937'
        pdf.move_down 10
        pdf.text cita.observaciones, align: :justify, size: 11
        pdf.move_down 20
      end
      
      # ========== FOOTER ==========
      pdf.move_down 30
      pdf.stroke_horizontal_rule
      pdf.move_down 10
      
      pdf.text "Documento generado el #{Time.current.strftime('%d/%m/%Y a las %H:%M')}", 
               size: 9, 
               color: '9CA3AF',
               align: :center
      
      pdf.text 'Este documento es válido sin firma ni sello', 
               size: 8, 
               color: '9CA3AF',
               align: :center
    end.render
  end
  
  # Generar PDF de cita desde perspectiva del médico
  def self.generar_resumen_cita_medico(cita)
    Prawn::Document.new(page_size: 'A4', margin: 40) do |pdf|
      pdf.font 'Helvetica'
      
      # ========== HEADER ==========
      pdf.bounding_box([0, pdf.cursor], width: pdf.bounds.width) do
        pdf.text 'Blume - Sistema de Gestión Médica', 
                 size: 20, 
                 style: :bold, 
                 color: '2563EB',
                 align: :center
        pdf.move_down 5
        pdf.stroke_horizontal_rule
      end
      
      pdf.move_down 20
      
      # ========== TÍTULO ==========
      pdf.text 'REGISTRO DE CONSULTA MÉDICA', 
               size: 16, 
               style: :bold, 
               align: :center
      
      pdf.move_down 20
      
      # ========== INFORMACIÓN DE LA CITA ==========
      info_data = [
        ['Fecha:', cita.fecha_hora_inicio.strftime('%d/%m/%Y')],
        ['Hora:', cita.fecha_hora_inicio.strftime('%H:%M')],
        ['Duración:', "#{cita.duracion_minutos || 30} minutos"],
        ['Estado:', estado_traducido(cita.estado)],
        ['Costo:', "S/ #{cita.costo}"]
      ]
      
      pdf.table(info_data, 
                cell_style: { borders: [], padding: [5, 10] },
                column_widths: [120, 350]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      pdf.stroke_horizontal_rule
      pdf.move_down 20
      
      # ========== INFORMACIÓN DEL MÉDICO ==========
      pdf.text 'MÉDICO TRATANTE', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      
      medico_data = [
        ['Nombre:', cita.medico.nombre_profesional],
        ['Especialidad:', cita.medico.especialidad_principal&.nombre || 'General'],
        ['N° Colegiatura:', cita.medico.numero_colegiatura],
        ['Email:', cita.medico.email]
      ]
      
      pdf.table(medico_data, 
                cell_style: { borders: [], padding: [3, 10] },
                column_widths: [120, 350]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      
      # ========== INFORMACIÓN DEL PACIENTE ==========
      pdf.text 'DATOS DEL PACIENTE', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      
      paciente_data = [
        ['Nombre:', cita.paciente.nombre_completo],
        ['Documento:', cita.paciente.numero_documento || 'No especificado'],
        ['Edad:', cita.paciente.edad ? "#{cita.paciente.edad} años" : 'No especificado'],
        ['Teléfono:', cita.paciente.telefono || 'No especificado']
      ]
      
      pdf.table(paciente_data, 
                cell_style: { borders: [], padding: [3, 10] },
                column_widths: [120, 350]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      pdf.stroke_horizontal_rule
      pdf.move_down 20
      
      # ========== MOTIVO DE CONSULTA ==========
      pdf.text 'MOTIVO DE CONSULTA', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      pdf.text cita.motivo_consulta, align: :justify, size: 11
      
      pdf.move_down 20
      
      # ========== DIAGNÓSTICO ==========
      if cita.diagnostico.present?
        pdf.text 'DIAGNÓSTICO', size: 14, style: :bold, color: '1F2937'
        pdf.move_down 10
        pdf.text cita.diagnostico, align: :justify, size: 11
        pdf.move_down 20
      end
      
      # ========== OBSERVACIONES ==========
      if cita.observaciones.present?
        pdf.text 'INDICACIONES / TRATAMIENTO', size: 14, style: :bold, color: '1F2937'
        pdf.move_down 10
        pdf.text cita.observaciones, align: :justify, size: 11
        pdf.move_down 20
      end
      
      # ========== FIRMA ==========
      pdf.move_down 40
      pdf.stroke_horizontal_rule
      pdf.move_down 30
      
      pdf.text cita.medico.nombre_profesional, 
               size: 11, 
               style: :bold,
               align: :center
      pdf.text "CMP: #{cita.medico.numero_colegiatura}", 
               size: 10,
               align: :center
      
      # ========== FOOTER ==========
      pdf.move_down 30
      pdf.stroke_horizontal_rule
      pdf.move_down 10
      
      pdf.text "Documento generado el #{Time.current.strftime('%d/%m/%Y a las %H:%M')}", 
               size: 9, 
               color: '9CA3AF',
               align: :center
    end.render
  end
  
  # Generar PDF de historial médico completo
  def self.generar_historial_medico(paciente)
    citas = paciente.citas
                    .includes(:medico)
                    .where(estado: :completada)
                    .order(fecha_hora_inicio: :desc)
    
    Prawn::Document.new(page_size: 'A4', margin: 40) do |pdf|
      pdf.font 'Helvetica'
      
      # ========== HEADER ==========
      pdf.bounding_box([0, pdf.cursor], width: pdf.bounds.width) do
        pdf.text 'Blume - Sistema de Gestión Médica', 
                 size: 20, 
                 style: :bold, 
                 color: '2563EB',
                 align: :center
        pdf.move_down 5
        pdf.stroke_horizontal_rule
      end
      
      pdf.move_down 20
      
      # ========== TÍTULO ==========
      pdf.text 'HISTORIAL MÉDICO', 
               size: 18, 
               style: :bold, 
               align: :center
      
      pdf.move_down 20
      
      # ========== INFORMACIÓN DEL PACIENTE ==========
      pdf.text 'DATOS DEL PACIENTE', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      
      paciente_info = [
        ['Nombre:', paciente.nombre_completo],
        ['Documento:', paciente.numero_documento || 'No especificado'],
        ['Fecha de Nacimiento:', paciente.fecha_nacimiento&.strftime('%d/%m/%Y') || 'No especificado'],
        ['Teléfono:', paciente.telefono || 'No especificado'],
        ['Email:', paciente.email]
      ]
      
      pdf.table(paciente_info, 
                cell_style: { borders: [], padding: [3, 10] },
                column_widths: [150, 330]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 20
      pdf.stroke_horizontal_rule
      pdf.move_down 20
      
      # ========== RESUMEN ESTADÍSTICO ==========
      pdf.text 'RESUMEN', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 10
      
      resumen_data = [
        ['Total de consultas:', citas.count.to_s],
        ['Primera consulta:', citas.last&.fecha_hora_inicio&.strftime('%d/%m/%Y') || 'N/A'],
        ['Última consulta:', citas.first&.fecha_hora_inicio&.strftime('%d/%m/%Y') || 'N/A']
      ]
      
      pdf.table(resumen_data, 
                cell_style: { borders: [], padding: [3, 10] },
                column_widths: [150, 330]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '6B7280'
      end
      
      pdf.move_down 30
      
      # ========== HISTORIAL DE CITAS ==========
      pdf.text 'HISTORIAL DE CONSULTAS', size: 14, style: :bold, color: '1F2937'
      pdf.move_down 15
      
      if citas.empty?
        pdf.text 'No hay consultas registradas', 
                 size: 11, 
                 color: '9CA3AF',
                 style: :italic
      else
        citas.each_with_index do |cita, index|
          # Saltar a nueva página si queda poco espacio
          if pdf.cursor < 150
            pdf.start_new_page
          end
          
          # Número y fecha de la consulta
          pdf.text "#{index + 1}. Consulta del #{cita.fecha_hora_inicio.strftime('%d/%m/%Y')}", 
                   size: 12, 
                   style: :bold,
                   color: '374151'
          
          pdf.move_down 8
          
          # Información de la consulta
          consulta_info = [
            ['Médico:', cita.medico.nombre_profesional],
            ['Especialidad:', cita.medico.especialidad_principal&.nombre || 'General'],
            ['Motivo:', cita.motivo_consulta]
          ]
          
          if cita.diagnostico.present?
            consulta_info << ['Diagnóstico:', cita.diagnostico]
          end
          
          if cita.observaciones.present?
            consulta_info << ['Observaciones:', cita.observaciones]
          end
          
          pdf.table(consulta_info, 
                    cell_style: { 
                      borders: [], 
                      padding: [2, 10],
                      size: 10
                    },
                    column_widths: [100, 380]) do |table|
            table.columns(0).font_style = :bold
            table.columns(0).text_color = '6B7280'
            table.columns(1).text_color = '1F2937'
          end
          
          pdf.move_down 15
          pdf.stroke_horizontal_rule
          pdf.move_down 15
        end
      end
      
      # ========== FOOTER ==========
      pdf.move_down 20
      
      pdf.text "Documento generado el #{Time.current.strftime('%d/%m/%Y a las %H:%M')}", 
               size: 9, 
               color: '9CA3AF',
               align: :center
      
      pdf.text 'Historial médico confidencial - Uso exclusivo del paciente', 
               size: 8, 
               color: '9CA3AF',
               align: :center
    end.render
  end
  
  # Generar PDF de reporte de citas para admin
  def self.generar_reporte_citas_admin(citas, fecha_inicio, fecha_fin)
    Prawn::Document.new(page_size: 'A4', margin: 40, page_layout: :landscape) do |pdf|
      pdf.font 'Helvetica'
      
      # ========== HEADER ==========
      pdf.bounding_box([0, pdf.cursor], width: pdf.bounds.width) do
        pdf.text 'Blume - Sistema de Gestión Médica', 
                 size: 18, 
                 style: :bold, 
                 color: '2563EB',
                 align: :center
        pdf.move_down 3
        pdf.stroke_horizontal_rule
      end
      
      pdf.move_down 15
      
      # ========== TÍTULO ==========
      pdf.text 'REPORTE DE CITAS', 
               size: 16, 
               style: :bold, 
               align: :center
      
      pdf.move_down 5
      pdf.text "Período: #{fecha_inicio.strftime('%d/%m/%Y')} - #{fecha_fin.strftime('%d/%m/%Y')}", 
               size: 11,
               align: :center,
               color: '6B7280'
      
      pdf.move_down 15
      
      # ========== RESUMEN EJECUTIVO ==========
      resumen_data = [
        ['Total de Citas', citas.count.to_s],
        ['Completadas', citas.where(estado: :completada).count.to_s],
        ['Canceladas', citas.where(estado: :cancelada).count.to_s],
        ['Pendientes', citas.where(estado: :pendiente).count.to_s],
        ['Ingresos Totales', "S/ #{citas.where(estado: :completada).sum(:costo).to_f}"]
      ]
      
      pdf.table(resumen_data, 
                position: :center,
                cell_style: { borders: [:top, :bottom], padding: [5, 15] },
                column_widths: [150, 100]) do |table|
        table.columns(0).font_style = :bold
        table.columns(0).text_color = '374151'
        table.columns(1).align = :right
        table.columns(1).text_color = '2563EB'
        table.columns(1).font_style = :bold
      end
      
      pdf.move_down 20
      
      # ========== DETALLE DE CITAS ==========
      if citas.any?
        pdf.text 'DETALLE DE CITAS', size: 12, style: :bold, color: '1F2937'
        pdf.move_down 10
        
        tabla_data = [['Fecha', 'Médico', 'Especialidad', 'Paciente', 'Motivo', 'Estado', 'Costo']]
        
        citas.order(fecha_hora_inicio: :desc).limit(50).each do |cita|
          tabla_data << [
            cita.fecha_hora_inicio.strftime('%d/%m %H:%M'),
            cita.medico.nombre_profesional.truncate(20),
            cita.medico.especialidad_principal&.nombre&.truncate(15) || 'General',
            cita.paciente.nombre_completo.truncate(20),
            cita.motivo_consulta.truncate(30),
            estado_traducido(cita.estado),
            "S/ #{cita.costo.to_f}"
          ]
        end
        
        pdf.table(tabla_data, 
                  width: pdf.bounds.width,
                  cell_style: { size: 8, padding: [3, 5] },
                  header: true) do |table|
          table.row(0).font_style = :bold
          table.row(0).background_color = 'E5E7EB'
          table.row(0).text_color = '1F2937'
          table.columns(6).align = :right
        end
        
        if citas.count > 50
          pdf.move_down 10
          pdf.text "Mostrando 50 de #{citas.count} citas", 
                   size: 8, 
                   color: '9CA3AF',
                   style: :italic
        end
      else
        pdf.text 'No hay citas en el período seleccionado', 
                 size: 10, 
                 color: '9CA3AF',
                 align: :center,
                 style: :italic
      end
      
      # ========== FOOTER ==========
      pdf.move_down 20
      pdf.stroke_horizontal_rule
      pdf.move_down 5
      
      pdf.text "Documento generado el #{Time.current.strftime('%d/%m/%Y a las %H:%M')}", 
               size: 8, 
               color: '9CA3AF',
               align: :center
    end.render
  end
  
  private
  
  def self.estado_traducido(estado)
    estados = {
      'pendiente' => 'Pendiente',
      'confirmada' => 'Confirmada',
      'completada' => 'Completada',
      'cancelada' => 'Cancelada'
    }
    estados[estado.to_s] || estado.to_s.titleize
  end
end
