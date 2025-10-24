class CreateUsuarios < ActiveRecord::Migration[8.1]
  def change
    create_table :usuarios, id: :uuid do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :nombre, null: false
      t.string :apellido, null: false
      t.string :telefono
      t.text :direccion
      t.integer :rol, default: 0, null: false # 0: paciente, 1: medico, 2: administrador
      t.boolean :activo, default: true, null: false

      t.timestamps
    end

    # Índices
    add_index :usuarios, :email, unique: true
    add_index :usuarios, :rol
  end
end