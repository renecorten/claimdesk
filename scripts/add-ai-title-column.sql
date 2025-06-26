-- Füge Spalte für KI-generierten Titel hinzu
ALTER TABLE news_cache 
ADD COLUMN IF NOT EXISTS ai_title TEXT;

-- Index für bessere Performance bei Titel-Suchen
CREATE INDEX IF NOT EXISTS idx_news_cache_ai_title ON news_cache (ai_title);

-- Kommentar für Dokumentation
COMMENT ON COLUMN news_cache.ai_title IS 'KI-generierter, sachverständigen-orientierter Titel';
