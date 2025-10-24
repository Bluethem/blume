class EnablePgcryptoExtension < ActiveRecord::Migration[8.1]
  def change
    # Habilitar extensión pgcrypto para generar UUIDs
    enable_extension 'pgcrypto'
  end
end