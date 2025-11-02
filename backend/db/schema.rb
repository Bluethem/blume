# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_11_01_060122) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "certificaciones", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "descripcion"
    t.string "institucion_emisora"
    t.string "nombre", null: false
    t.datetime "updated_at", null: false
    t.index ["nombre"], name: "index_certificaciones_on_nombre"
  end

  create_table "citas", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cancelada_por_id"
    t.decimal "costo", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.text "diagnostico"
    t.integer "estado", default: 0, null: false
    t.datetime "fecha_atencion"
    t.datetime "fecha_hora_fin", null: false
    t.datetime "fecha_hora_inicio", null: false
    t.datetime "fecha_no_asistencia"
    t.uuid "medico_id", null: false
    t.decimal "monto_adicional", precision: 10, scale: 2, default: "0.0"
    t.text "motivo_cancelacion"
    t.text "motivo_consulta"
    t.text "motivo_no_asistencia"
    t.boolean "notificado_no_asistencia", default: false
    t.text "observaciones"
    t.uuid "paciente_id", null: false
    t.boolean "pagado", default: false, null: false
    t.boolean "permite_reprogramacion", default: true, null: false
    t.integer "quien_no_asistio"
    t.text "receta"
    t.integer "reprogramaciones_count", default: 0, null: false
    t.boolean "requiere_pago_adicional", default: false, null: false
    t.datetime "updated_at", null: false
    t.index ["cancelada_por_id"], name: "index_citas_on_cancelada_por_id"
    t.index ["estado"], name: "index_citas_on_estado"
    t.index ["fecha_hora_inicio"], name: "index_citas_on_fecha_hora_inicio"
    t.index ["medico_id", "fecha_hora_inicio"], name: "index_citas_on_medico_fecha"
    t.index ["medico_id"], name: "index_citas_on_medico_id"
    t.index ["paciente_id"], name: "index_citas_on_paciente_id"
    t.index ["pagado"], name: "index_citas_on_pagado"
    t.index ["quien_no_asistio"], name: "index_citas_on_quien_no_asistio"
    t.index ["requiere_pago_adicional"], name: "index_citas_on_requiere_pago_adicional"
    t.check_constraint "fecha_hora_fin > fecha_hora_inicio", name: "check_fecha_fin_mayor_inicio"
  end

  create_table "configuracion_sistemas", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "categoria", null: false
    t.string "clave", null: false
    t.datetime "created_at", null: false
    t.text "descripcion"
    t.boolean "solo_super_admin", default: false, null: false
    t.datetime "updated_at", null: false
    t.text "valor"
    t.index ["categoria"], name: "index_configuracion_sistemas_on_categoria"
    t.index ["clave"], name: "index_configuracion_sistemas_on_clave", unique: true
  end

  create_table "especialidades", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "descripcion"
    t.string "nombre", null: false
    t.datetime "updated_at", null: false
    t.index ["nombre"], name: "index_especialidades_on_nombre", unique: true
  end

  create_table "horario_medicos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.datetime "created_at", null: false
    t.integer "dia_semana", null: false
    t.integer "duracion_cita_minutos", default: 30, null: false
    t.time "hora_fin", null: false
    t.time "hora_inicio", null: false
    t.uuid "medico_id", null: false
    t.datetime "updated_at", null: false
    t.index ["dia_semana"], name: "index_horario_medicos_on_dia_semana"
    t.index ["medico_id"], name: "index_horario_medicos_on_medico_id"
    t.check_constraint "dia_semana >= 0 AND dia_semana <= 6", name: "check_dia_semana_range"
    t.check_constraint "duracion_cita_minutos > 0", name: "check_duracion_positiva"
    t.check_constraint "hora_fin > hora_inicio", name: "check_hora_fin_mayor_inicio"
  end

  create_table "medico_certificaciones", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "certificacion_id", null: false
    t.datetime "created_at", null: false
    t.date "fecha_expiracion"
    t.date "fecha_obtencion"
    t.uuid "medico_id", null: false
    t.string "numero_certificado"
    t.datetime "updated_at", null: false
    t.index ["certificacion_id"], name: "index_medico_certificaciones_on_certificacion_id"
    t.index ["medico_id", "certificacion_id"], name: "index_unique_medico_certificacion", unique: true
    t.index ["medico_id"], name: "index_medico_certificaciones_on_medico_id"
  end

  create_table "medico_especialidades", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "es_principal", default: false, null: false
    t.uuid "especialidad_id", null: false
    t.uuid "medico_id", null: false
    t.datetime "updated_at", null: false
    t.index ["especialidad_id"], name: "index_medico_especialidades_on_especialidad_id"
    t.index ["medico_id", "especialidad_id"], name: "index_medico_especialidades_unique", unique: true
    t.index ["medico_id"], name: "index_medico_especialidades_on_medico_id"
  end

  create_table "medicos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.integer "anios_experiencia"
    t.text "biografia"
    t.decimal "calificacion_promedio", precision: 3, scale: 1, default: "0.0"
    t.decimal "costo_consulta", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.string "numero_colegiatura", null: false
    t.datetime "updated_at", null: false
    t.uuid "usuario_id", null: false
    t.index ["calificacion_promedio"], name: "index_medicos_on_calificacion_promedio"
    t.index ["numero_colegiatura"], name: "index_medicos_on_numero_colegiatura", unique: true
    t.index ["usuario_id"], name: "index_medicos_on_usuario_id", unique: true
  end

  create_table "notificaciones", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cita_id"
    t.datetime "created_at", null: false
    t.datetime "fecha_leida"
    t.boolean "leida", default: false, null: false
    t.text "mensaje", null: false
    t.integer "tipo", null: false
    t.string "titulo", null: false
    t.datetime "updated_at", null: false
    t.uuid "usuario_id", null: false
    t.index ["cita_id"], name: "index_notificaciones_on_cita_id"
    t.index ["created_at"], name: "index_notificaciones_on_created_at"
    t.index ["leida"], name: "index_notificaciones_on_leida"
    t.index ["usuario_id", "leida"], name: "index_notificaciones_usuario_leida"
    t.index ["usuario_id"], name: "index_notificaciones_on_usuario_id"
  end

  create_table "pacientes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "alergias"
    t.datetime "created_at", null: false
    t.date "fecha_nacimiento"
    t.integer "genero"
    t.string "grupo_sanguineo"
    t.string "numero_documento"
    t.text "observaciones"
    t.integer "tipo_documento"
    t.datetime "updated_at", null: false
    t.uuid "usuario_id", null: false
    t.index ["numero_documento"], name: "index_pacientes_on_numero_documento", unique: true
    t.index ["usuario_id"], name: "index_pacientes_on_usuario_id", unique: true
  end

  create_table "pagos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cita_id", null: false
    t.text "concepto"
    t.datetime "created_at", null: false
    t.text "descripcion"
    t.integer "estado", default: 0, null: false
    t.datetime "fecha_pago"
    t.datetime "fecha_reembolso"
    t.jsonb "metadata", default: {}
    t.integer "metodo_pago", default: 0, null: false
    t.decimal "monto", precision: 10, scale: 2, null: false
    t.uuid "paciente_id", null: false
    t.string "payment_gateway"
    t.integer "tipo_pago", default: 0, null: false
    t.string "transaction_id"
    t.datetime "updated_at", null: false
    t.index ["cita_id", "tipo_pago"], name: "index_pagos_on_cita_id_and_tipo_pago"
    t.index ["cita_id"], name: "index_pagos_on_cita_id"
    t.index ["estado"], name: "index_pagos_on_estado"
    t.index ["fecha_pago"], name: "index_pagos_on_fecha_pago"
    t.index ["paciente_id"], name: "index_pagos_on_paciente_id"
    t.index ["tipo_pago"], name: "index_pagos_on_tipo_pago"
    t.index ["transaction_id"], name: "index_pagos_on_transaction_id", unique: true
  end

  create_table "reprogramaciones", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "aprobado_por_id"
    t.uuid "cita_nueva_id"
    t.uuid "cita_original_id", null: false
    t.datetime "created_at", null: false
    t.text "descripcion"
    t.integer "estado", default: 0, null: false
    t.datetime "fecha_aprobacion"
    t.datetime "fecha_propuesta_1"
    t.datetime "fecha_propuesta_2"
    t.datetime "fecha_propuesta_3"
    t.datetime "fecha_rechazo"
    t.datetime "fecha_seleccionada"
    t.text "justificacion"
    t.jsonb "metadata", default: {}
    t.integer "motivo", default: 0, null: false
    t.text "motivo_rechazo"
    t.boolean "reembolso_procesado", default: false
    t.boolean "requiere_reembolso", default: false
    t.uuid "solicitado_por_id", null: false
    t.datetime "updated_at", null: false
    t.index ["aprobado_por_id"], name: "index_reprogramaciones_on_aprobado_por_id"
    t.index ["cita_nueva_id"], name: "index_reprogramaciones_on_cita_nueva_id"
    t.index ["cita_original_id", "estado"], name: "index_reprogramaciones_on_cita_original_id_and_estado"
    t.index ["cita_original_id"], name: "index_reprogramaciones_on_cita_original_id"
    t.index ["created_at"], name: "index_reprogramaciones_on_created_at"
    t.index ["estado"], name: "index_reprogramaciones_on_estado"
    t.index ["motivo"], name: "index_reprogramaciones_on_motivo"
    t.index ["solicitado_por_id"], name: "index_reprogramaciones_on_solicitado_por_id"
  end

  create_table "usuarios", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.string "apellido", null: false
    t.integer "creado_por_id"
    t.datetime "created_at", null: false
    t.text "direccion"
    t.string "email", null: false
    t.boolean "es_super_admin", default: false, null: false
    t.string "foto_url"
    t.string "nombre", null: false
    t.string "password_digest", null: false
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "rol", default: 0, null: false
    t.string "telefono"
    t.datetime "ultimo_acceso"
    t.datetime "updated_at", null: false
    t.index ["activo"], name: "index_usuarios_on_activo"
    t.index ["creado_por_id"], name: "index_usuarios_on_creado_por_id"
    t.index ["email"], name: "index_usuarios_on_email", unique: true
    t.index ["es_super_admin"], name: "index_usuarios_on_es_super_admin"
    t.index ["reset_password_token"], name: "index_usuarios_on_reset_password_token", unique: true
    t.index ["rol"], name: "index_usuarios_on_rol"
  end

  create_table "valoraciones", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "anonimo", default: false, null: false
    t.integer "calificacion", null: false
    t.uuid "cita_id"
    t.text "comentario"
    t.datetime "created_at", null: false
    t.uuid "medico_id", null: false
    t.uuid "paciente_id", null: false
    t.datetime "updated_at", null: false
    t.index ["calificacion"], name: "index_valoraciones_on_calificacion"
    t.index ["cita_id"], name: "index_valoraciones_on_cita_id"
    t.index ["medico_id", "created_at"], name: "index_valoraciones_on_medico_id_and_created_at"
    t.index ["medico_id"], name: "index_valoraciones_on_medico_id"
    t.index ["paciente_id", "medico_id"], name: "index_unique_valoracion_paciente_medico", unique: true
    t.index ["paciente_id"], name: "index_valoraciones_on_paciente_id"
    t.check_constraint "calificacion >= 1 AND calificacion <= 5", name: "check_calificacion_range"
  end

  add_foreign_key "citas", "medicos"
  add_foreign_key "citas", "pacientes"
  add_foreign_key "citas", "usuarios", column: "cancelada_por_id"
  add_foreign_key "horario_medicos", "medicos"
  add_foreign_key "medico_certificaciones", "certificaciones"
  add_foreign_key "medico_certificaciones", "medicos"
  add_foreign_key "medico_especialidades", "especialidades"
  add_foreign_key "medico_especialidades", "medicos"
  add_foreign_key "medicos", "usuarios"
  add_foreign_key "notificaciones", "citas"
  add_foreign_key "notificaciones", "usuarios"
  add_foreign_key "pacientes", "usuarios"
  add_foreign_key "pagos", "citas"
  add_foreign_key "pagos", "pacientes"
  add_foreign_key "reprogramaciones", "citas", column: "cita_nueva_id"
  add_foreign_key "reprogramaciones", "citas", column: "cita_original_id"
  add_foreign_key "reprogramaciones", "usuarios", column: "aprobado_por_id"
  add_foreign_key "reprogramaciones", "usuarios", column: "solicitado_por_id"
  add_foreign_key "valoraciones", "citas"
  add_foreign_key "valoraciones", "medicos"
  add_foreign_key "valoraciones", "pacientes"
end
