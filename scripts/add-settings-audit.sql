-- 📊 Audit-Tabelle für Einstellungsänderungen
CREATE TABLE IF NOT EXISTS app_settings_audit (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  changed_by TEXT DEFAULT 'api',
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_settings_audit_key_date ON app_settings_audit(setting_key, changed_at);

-- RLS auch für Audit-Tabelle
ALTER TABLE app_settings_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for service role on audit" ON app_settings_audit
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
