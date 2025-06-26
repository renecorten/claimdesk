-- 🔧 Erweiterte Wartungs-Scripts für ClaimDesk RSS Dashboard

-- 📊 Datenbank-Übersicht
SELECT 
    'news_cache' as table_name,
    COUNT(*) as total_rows,
    COUNT(ai_summary) as ai_processed,
    ROUND(COUNT(ai_summary) * 100.0 / COUNT(*), 2) as ai_percentage
FROM news_cache
UNION ALL
SELECT 
    'acquisition_cases' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN status != 'offen' THEN 1 END) as processed,
    ROUND(COUNT(CASE WHEN status != 'offen' THEN 1 END) * 100.0 / COUNT(*), 2) as processed_percentage
FROM acquisition_cases
UNION ALL
SELECT 
    'deleted_news' as table_name,
    COUNT(*) as total_rows,
    NULL as processed,
    NULL as processed_percentage
FROM deleted_news;

-- 🎯 AI-Severity Verteilung (erweitert)
SELECT 
    ai_severity, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    COUNT(CASE WHEN ai_damage_category = 'commercial' THEN 1 END) as commercial,
    COUNT(CASE WHEN ai_damage_category = 'industrial' THEN 1 END) as industrial,
    COUNT(CASE WHEN ai_damage_category = 'infrastructure' THEN 1 END) as infrastructure,
    COUNT(CASE WHEN ai_damage_category = 'private' THEN 1 END) as private
FROM news_cache 
WHERE ai_severity IS NOT NULL 
GROUP BY ai_severity 
ORDER BY 
    CASE ai_severity 
        WHEN 'urgent' THEN 1 
        WHEN 'attention' THEN 2 
        WHEN 'routine' THEN 3 
    END;

-- 🏢 Erweiterte Damage Category Verteilung
SELECT 
    ai_damage_category, 
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(CASE WHEN ai_business_interruption THEN 1.0 ELSE 0.0 END) * 100 as business_interruption_rate,
    COUNT(CASE WHEN ai_severity = 'urgent' THEN 1 END) as urgent_cases
FROM news_cache 
WHERE ai_damage_category IS NOT NULL 
GROUP BY ai_damage_category 
ORDER BY count DESC;

-- 📈 Fetch-Log Statistiken (letzte 30 Tage)
SELECT 
    DATE(fetch_completed_at) as date,
    COUNT(*) as total_fetches,
    AVG(new_items_count) as avg_new_items,
    AVG(ai_processed_count) as avg_ai_processed,
    AVG(processing_time_ms) as avg_processing_time_ms,
    SUM(CASE WHEN error_details IS NOT NULL THEN 1 ELSE 0 END) as error_count,
    triggered_by
FROM feed_fetch_log 
WHERE fetch_completed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(fetch_completed_at), triggered_by
ORDER BY date DESC, triggered_by;

-- 🔍 Top-Locations (KI-extrahiert vs RSS)
SELECT 
    'AI-extracted' as source,
    ai_location as location,
    COUNT(*) as count
FROM news_cache 
WHERE ai_location IS NOT NULL 
GROUP BY ai_location
UNION ALL
SELECT 
    'RSS-original' as source,
    location as location,
    COUNT(*) as count
FROM news_cache 
WHERE location IS NOT NULL AND ai_location IS NULL
GROUP BY location
ORDER BY count DESC
LIMIT 20;

-- 📊 Akquise-Pipeline Übersicht
SELECT 
    status,
    COUNT(*) as count,
    AVG(probability) as avg_probability,
    SUM(expected_revenue) as total_expected_revenue,
    AVG(expected_revenue) as avg_expected_revenue,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_cases
FROM acquisition_cases 
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'offen' THEN 1 
        WHEN 'kontaktiert' THEN 2 
        WHEN 'kein_bedarf' THEN 3 
    END;

-- 🗓️ Anstehende Termine und Erinnerungen
SELECT 
    'reminders' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN reminder_date <= NOW() + INTERVAL '1 day' THEN 1 END) as due_soon,
    COUNT(CASE WHEN reminder_date <= NOW() THEN 1 END) as overdue
FROM case_reminders 
WHERE is_completed = false
UNION ALL
SELECT 
    'activities' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN scheduled_at <= NOW() + INTERVAL '1 day' THEN 1 END) as due_soon,
    COUNT(CASE WHEN scheduled_at <= NOW() THEN 1 END) as overdue
FROM case_activities 
WHERE is_completed = false AND scheduled_at IS NOT NULL;

-- 🔧 Datenbank-Performance Metriken
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
    AND tablename IN ('news_cache', 'acquisition_cases', 'feed_fetch_log')
    AND n_distinct IS NOT NULL
ORDER BY tablename, attname;

-- 📋 Audit-Log Zusammenfassung
SELECT 
    setting_key,
    COUNT(*) as total_changes,
    COUNT(DISTINCT ip_address) as unique_ips,
    MIN(changed_at) as first_change,
    MAX(changed_at) as last_change,
    COUNT(CASE WHEN changed_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_changes
FROM app_settings_audit 
GROUP BY setting_key
ORDER BY total_changes DESC;
