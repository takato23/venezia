-- Create admin_codes_uses table for logging code usage per sale
CREATE TABLE IF NOT EXISTS admin_codes_uses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_id INTEGER NOT NULL,
  sale_id INTEGER NOT NULL,
  user_id INTEGER NULL,
  store_id INTEGER NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(code_id, sale_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_codes_uses_code ON admin_codes_uses(code_id);
CREATE INDEX IF NOT EXISTS idx_admin_codes_uses_sale ON admin_codes_uses(sale_id);
CREATE INDEX IF NOT EXISTS idx_admin_codes_uses_store_code ON admin_codes_uses(store_id, code_id);


