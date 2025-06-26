-- 🏗️ Setup-Script für bestehende ClaimDesk RSS Dashboard Datenbank
-- Dieses Script prüft und ergänzt fehlende Strukturen

-- ✅ Die Haupttabellen existieren bereits:
-- - news_cache (mit allen AI-Spalten)
-- - deleted_news
-- - app_settings
-- - app_settings_audit  
-- - feed_fetch_log
-- - acquisition_cases (Akquise-System)
-- - case_activities
-- - case_documents
-- - case_reminders

-- 1️⃣ Prüfe und erstelle fehlende Indizes für Performance
DO $$
BEGIN
    -- News Cache Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_cache_ai_severity') THEN
        CREATE INDEX idx_news_cache_ai_severity ON news_cache(ai_severity);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_cache_ai_damage_category') THEN
        CREATE INDEX idx_news_cache_ai_damage_category ON news_cache(ai_damage_category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_cache_ai_location') THEN
        CREATE INDEX idx_news_cache_ai_location ON news_cache(ai_location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_cache_published_at') THEN
        CREATE INDEX idx_news_cache_published_at ON news_cache(published_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_cache_feed_type') THEN
        CREATE INDEX idx_news_cache_feed_type ON news_cache(feed_type);
    END IF;
    
    -- App Settings Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_app_settings_key') THEN
        CREATE INDEX idx_app_settings_key ON app_settings(setting_key);
    END IF;
    
    -- Feed Fetch Log Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feed_fetch_log_completed') THEN
        CREATE INDEX idx_feed_fetch_log_completed ON feed_fetch_log(fetch_completed_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feed_fetch_log_triggered') THEN
        CREATE INDEX idx_feed_fetch_log_triggered ON feed_fetch_log(triggered_by, fetch_completed_at DESC);
    END IF;
    
    -- Acquisition Cases Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_acquisition_cases_status') THEN
        CREATE INDEX idx_acquisition_cases_status ON acquisition_cases(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_acquisition_cases_priority') THEN
        CREATE INDEX idx_acquisition_cases_priority ON acquisition_cases(priority);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_acquisition_cases_created_at') THEN
        CREATE INDEX idx_acquisition_cases_created_at ON acquisition_cases(created_at DESC);
    END IF;
    
    -- Case Activities Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_activities_case_id') THEN
        CREATE INDEX idx_case_activities_case_id ON case_activities(case_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_activities_scheduled_at') THEN
        CREATE INDEX idx_case_activities_scheduled_at ON case_activities(scheduled_at);
    END IF;
    
    -- Case Reminders Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_reminders_reminder_date') THEN
        CREATE INDEX idx_case_reminders_reminder_date ON case_reminders(reminder_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_case_reminders_is_completed') THEN
        CREATE INDEX idx_case_reminders_is_completed ON case_reminders(is_completed);
    END IF;
    
    RAISE NOTICE 'Indizes erfolgreich geprüft und erstellt.';
END
$$;

-- 2️⃣ Stelle sicher, dass Standard-Einstellungen existieren
INSERT INTO app_settings (setting_key, setting_value) 
VALUES ('auto_refresh_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3️⃣ Prüfe RLS-Status und aktiviere falls nötig
DO $$
BEGIN
    -- Prüfe RLS für app_settings
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'app_settings' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS für app_settings aktiviert.';
    END IF;
    
    -- Prüfe RLS für feed_fetch_log
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'feed_fetch_log' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE feed_fetch_log ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS für feed_fetch_log aktiviert.';
    END IF;
END
$$;

-- 4️⃣ Erstelle Policies falls sie nicht existieren
DO $$
BEGIN
    -- Policies für app_settings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations for service role on settings') THEN
        CREATE POLICY "Allow all operations for service role on settings" ON app_settings
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read for anon on settings') THEN
        CREATE POLICY "Allow read for anon on settings" ON app_settings
        FOR SELECT TO anon USING (true);
    END IF;
    
    -- Policies für feed_fetch_log
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all operations for service role on fetch log') THEN
        CREATE POLICY "Allow all operations for service role on fetch log" ON feed_fetch_log
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read for anon on fetch log') THEN
        CREATE POLICY "Allow read for anon on fetch log" ON feed_fetch_log
        FOR SELECT TO anon USING (true);
    END IF;
    
    RAISE NOTICE 'Policies erfolgreich geprüft und erstellt.';
END
$$;

-- ✅ Setup erfolgreich!
SELECT 
    'Database setup completed successfully!' as status,
    'Existing structure validated and enhanced' as details,
    NOW() as completed_at;
