class AddPasswordResetToUsuarios < ActiveRecord::Migration[8.0]
  def change
    add_column :usuarios, :reset_password_token, :string
    add_column :usuarios, :reset_password_sent_at, :datetime
    add_index :usuarios, :reset_password_token, unique: true
  end
end