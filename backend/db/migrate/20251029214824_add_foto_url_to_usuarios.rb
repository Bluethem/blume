class AddFotoUrlToUsuarios < ActiveRecord::Migration[8.1]
  def change
    add_column :usuarios, :foto_url, :string
  end
end
