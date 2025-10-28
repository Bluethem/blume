class CreateEspecialidades < ActiveRecord::Migration[8.1]
  def change
    create_table :especialidades, id: :uuid do |t|
      t.string :nombre, null: false
      t.text :descripcion
      t.timestamps
    end
    
    add_index :especialidades, :nombre, unique: true
  end
end