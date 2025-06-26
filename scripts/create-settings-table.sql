-- Erstelle Tabelle für App-Einstellungen
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Füge Standard-Einstellung für Auto-Refresh hinzu
INSERT INTO app_settings (setting_key, setting_value) 
VALUES ('auto_refresh_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Zeige die Einstellungen
SELECT * FROM app_settings;
