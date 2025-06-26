-- 📊 Erstelle Tabelle für detailliertes Fetch-Tracking (mit korrekten Permissions)
CREATE TABLE IF NOT EXISTS feed_fetch_log (
  id SERIAL PRIMARY KEY,
  fetch_started_at TIMESTAMPTZ NOT NULL,
  fetch_completed_at TIMESTAMPTZ,
  total_feeds INTEGER DEFAULT 0,
  successful_feeds INTEGER DEFAULT 0,
  failed_feeds INTEGER DEFAULT 0,
  new_items_count INTEGER DEFAULT 0,
  updated_items_count INTEGER DEFAULT 0,
  ai_processed_count INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by TEXT DEFAULT 'unknown', -- 'cron', 'manual', 'api'
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_feed_fetch_log_completed ON feed_fetch_log(fetch_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_fetch_log_triggered ON feed_fetch_log(triggered_by, fetch_completed_at DESC);

-- 🔒 RLS aktivieren
ALTER TABLE feed_fetch_log ENABLE ROW LEVEL SECURITY;

-- 🔑 Policy für Service Role (für API-Zugriff)
DROP POLICY IF EXISTS "Allow all operations for service role on fetch log" ON feed_fetch_log;
CREATE POLICY "Allow all operations for service role on fetch log" ON feed_fetch_log
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 📖 Policy für anon (nur lesen, falls gewünscht)
DROP POLICY IF EXISTS "Allow read for anon on fetch log" ON feed_fetch_log;
CREATE POLICY "Allow read for anon on fetch log" ON feed_fetch_log
FOR SELECT 
TO anon
USING (true);

-- ✅ Test-Eintrag erstellen
INSERT INTO feed_fetch_log (
  fetch_started_at,
  fetch_completed_at,
  total_feeds,
  successful_feeds,
  new_items_count,
  triggered_by,
  processing_time_ms
) VALUES (
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '4 minutes',
  2,
  2,
  0,
  'setup_test',
  30000
) ON CONFLICT DO NOTHING;

-- 📋 Zeige Tabellen-Info
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'feed_fetch_log';

-- 📋 Zeige RLS-Status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'feed_fetch_log';

-- 📋 Zeige Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'feed_fetch_log';
