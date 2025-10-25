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

ActiveRecord::Schema[8.1].define(version: 2025_10_25_044145) do
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
    t.datetime "fecha_hora_fin", null: false
    t.datetime "fecha_hora_inicio", null: false
    t.uuid "medico_id", null: false
    t.text "motivo_cancelacion"
    t.text "motivo_consulta"
    t.text "observaciones"
    t.uuid "paciente_id", null: false
    t.datetime "updated_at", null: false
    t.index ["cancelada_por_id"], name: "index_citas_on_cancelada_por_id"
    t.index ["estado"], name: "index_citas_on_estado"
    t.index ["fecha_hora_inicio"], name: "index_citas_on_fecha_hora_inicio"
    t.index ["medico_id", "fecha_hora_inicio"], name: "index_citas_on_medico_fecha"
    t.index ["medico_id"], name: "index_citas_on_medico_id"
    t.index ["paciente_id"], name: "index_citas_on_paciente_id"
    t.check_constraint "fecha_hora_fin > fecha_hora_inicio", name: "check_fecha_fin_mayor_inicio"
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

  create_table "medicos", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.integer "anios_experiencia"
    t.text "biografia"
    t.decimal "costo_consulta", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.string "especialidad_principal", null: false
    t.string "numero_colegiatura", null: false
    t.datetime "updated_at", null: false
    t.uuid "usuario_id", null: false
    t.index ["especialidad_principal"], name: "index_medicos_on_especialidad_principal"
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

  create_table "usuarios", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "activo", default: true, null: false
    t.string "apellido", null: false
    t.datetime "created_at", null: false
    t.text "direccion"
    t.string "email", null: false
    t.string "nombre", null: false
    t.string "password_digest", null: false
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "rol", default: 0, null: false
    t.string "telefono"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_usuarios_on_email", unique: true
    t.index ["rol"], name: "index_usuarios_on_rol"
  end

  add_foreign_key "citas", "medicos"
  add_foreign_key "citas", "pacientes"
  add_foreign_key "citas", "usuarios", column: "cancelada_por_id"
  add_foreign_key "horario_medicos", "medicos"
  add_foreign_key "medico_certificaciones", "certificaciones"
  add_foreign_key "medico_certificaciones", "medicos"
  add_foreign_key "medicos", "usuarios"
  add_foreign_key "notificaciones", "citas"
  add_foreign_key "notificaciones", "usuarios"
  add_foreign_key "pacientes", "usuarios"
end
