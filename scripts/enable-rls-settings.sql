-- 🔒 Aktiviere RLS für app_settings Tabelle
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 📝 Policy: Erlaube alle Operationen für Service Role
CREATE POLICY "Allow all operations for service role" ON app_settings
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 📖 Policy: Erlaube nur Lesen für anon (falls gewünscht)
CREATE POLICY "Allow read for anon" ON app_settings
FOR SELECT 
TO anon
USING (true);

-- 🚫 Policy: Verhindere Schreibzugriff für anon
-- (Schreibzugriff nur über Service Role / API)

-- ✅ Teste die Policies
SELECT * FROM app_settings; -- Sollte funktionieren
