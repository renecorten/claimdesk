-- Füge KI-Orts-Spalten zur news_cache Tabelle hinzu
ALTER TABLE news_cache 
ADD COLUMN IF NOT EXISTS ai_location TEXT,
ADD COLUMN IF NOT EXISTS ai_location_confidence TEXT CHECK (ai_location_confidence IN ('low', 'medium', 'high'));

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_news_cache_ai_location ON news_cache(ai_location);
CREATE INDEX IF NOT EXISTS idx_news_cache_ai_location_confidence ON news_cache(ai_location_confidence);

-- Kommentare für Dokumentation
COMMENT ON COLUMN news_cache.ai_location IS 'KI-extrahierter präziser Ereignisort';
COMMENT ON COLUMN news_cache.ai_location_confidence IS 'Genauigkeit der KI-Ortsextraktion (low/medium/high)';

-- Zeige die neuen Spalten zur Bestätigung
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'news_cache' 
AND column_name LIKE 'ai_location%'
ORDER BY column_name;
