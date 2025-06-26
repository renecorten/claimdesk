import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { extractFullArticleContent } from "./content-extractor"

export interface SummaryResult {
  success: boolean
  title?: string
  summary?: string
  keyPoints?: string[]
  severity?: "routine" | "attention" | "urgent"
  damageCategory?: "private" | "commercial" | "industrial" | "infrastructure"
  businessInterruption?: boolean
  estimatedComplexity?: "low" | "medium" | "high" | "critical"
  location?: string // KI-extrahierter Ort
  locationConfidence?: "low" | "medium" | "high" // Genauigkeit
  keywords?: string[] // 🆕 KI-extrahierte Keywords
  keywordCategories?: {
    // 🆕 Kategorisierte Keywords
    eventType?: string
    severity?: string
    sector?: string
    damageType?: string
    urgency?: string
  }
  keywordConfidence?: { [key: string]: number } // 🆕 Confidence-Scores
  error?: string
}

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "")

  // Remove any leading/trailing whitespace
  text = text.trim()

  // Find JSON object boundaries
  const jsonStart = text.indexOf("{")
  const jsonEnd = text.lastIndexOf("}") + 1

  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    text = text.substring(jsonStart, jsonEnd)
  }

  return text
}

function parseAIResponse(text: string): any {
  try {
    // First, try direct parsing
    return JSON.parse(text)
  } catch (error) {
    try {
      // Clean the text more aggressively
      let cleanedText = cleanJsonResponse(text)

      // Remove any remaining markdown or formatting
      cleanedText = cleanedText
        .replace(/^[^{]*/, "") // Remove everything before first {
        .replace(/[^}]*$/, "") // Remove everything after last }
        .replace(/\n/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ") // Normalize whitespace

      return JSON.parse(cleanedText)
    } catch (secondError) {
      // Try to extract JSON with regex as last resort
      const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      console.error("Failed to parse AI response:", text.substring(0, 500))
      throw new Error(`Could not parse JSON response: ${text.substring(0, 200)}...`)
    }
  }
}

export async function generateNewsSummary(
  title: string | null,
  content: string | null,
  location: string | null,
  originalUrl?: string | null,
): Promise<SummaryResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "OpenAI API Key ist nicht konfiguriert. Bitte OPENAI_API_KEY Umgebungsvariable setzen.",
      }
    }

    if (!title && !content) {
      return {
        success: false,
        error: "Kein Inhalt zum Zusammenfassen vorhanden",
      }
    }

    // Erweiterte Content-Extraktion wenn URL verfügbar
    let enhancedContent = content
    let extractionInfo = ""

    if (originalUrl && originalUrl.startsWith("http")) {
      console.log(`🔍 Attempting full content extraction for: ${originalUrl}`)

      try {
        const extractedResult = await extractFullArticleContent(originalUrl, content || undefined)

        if (extractedResult.success && extractedResult.content) {
          enhancedContent = extractedResult.content
          extractionInfo = ` (Content via ${extractedResult.extractionMethod})`
          console.log(`✅ Enhanced content: ${enhancedContent.length} chars vs original ${content?.length || 0} chars`)
        } else {
          console.log(`⚠️ Content extraction failed: ${extractedResult.error}`)
        }
      } catch (error) {
        console.warn(`❌ Content extraction error: ${error}`)
        // Fallback auf ursprünglichen Content
      }
    }

    const textToSummarize = [title, enhancedContent].filter(Boolean).join("\n\n")

    console.log(`🤖 Generating AI summary for: ${title?.substring(0, 50)}...${extractionInfo}`)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Du bist ein Experte für die Bewertung von Schadensmeldungen aus Sicht eines Sachverständigenbüros für Gebäudeschäden, TKBE und Betriebsunterbrechung.

🧠 INTELLIGENTE SCHADENSANALYSE - Denke logisch, nicht nach Keywords!

ANALYSIERE SCHRITT FÜR SCHRITT:

1️⃣ OBJEKT & NUTZUNG verstehen:
- WAS ist betroffen? (Gebäude, Anlage, Einrichtung)
- WER nutzt es? (Privatpersonen, Unternehmen, Organisationen)
- WOFÜR wird es genutzt? (Wohnen, Arbeiten, Produzieren, Verkaufen)

2️⃣ 📍 EREIGNISORT INTELLIGENT EXTRAHIEREN:
- WO ist das Ereignis passiert? (Nicht nur erwähnte Orte!)
- Unterscheide zwischen EREIGNISORT und nur erwähnten Orten
- Beispiele:
  * "Feuerwehr aus Köln hilft in Düsseldorf" → Düsseldorf (Ereignisort)
  * "Brand in Hamburg-Altona" → Hamburg-Altona (präzise)
  * "Unfall auf A1 bei Bremen" → Bremen (mit Kontext)
  * "Polizei München ermittelt" → München (Ereignisort)

🎯 ORTSEXTRAKTION-REGELN:
- PRÄZISION: Stadtteil > Stadt > Region > Land
- KONTEXT: Wo passierte das Ereignis wirklich?
- INTERNATIONAL: Auch ausländische Orte erkennen
- GENAUIGKEIT bewerten:
  * HIGH: Eindeutig identifiziert (Straße, Stadtteil)
  * MEDIUM: Stadt/Ort klar erkennbar
  * LOW: Nur Region/Land oder unklar

3️⃣ 🏷️ INTELLIGENTE KEYWORD-EXTRAKTION:

SACHVERSTÄNDIGEN-RELEVANTE KEYWORDS:
- EREIGNISTYP: "Wasserschaden", "Brandschaden", "Sturmschaden", "Einbruchschaden"
- OBJEKTTYP: "Wohngebäude", "Bürogebäude", "Produktionshalle", "Einzelhandel"
- SCHADENSART: "Leitungswasserschaden", "Dachstuhlbrand", "Hagelschaden", "Vandalismus"
- KOMPLEXITÄT: "Großschaden", "Bagatellschaden", "Haftpflichtfall", "Regulierungsfall"
- BRANCHE: "Gastronomie", "Produktion", "Handel", "Dienstleistung", "Gesundheitswesen"
- BESONDERHEITEN: "Betriebsunterbrechung", "Mietausfall", "Mehrkosten", "Sachverständigenbedarf"

KEYWORD-KATEGORIEN:
- eventType: Hauptereignis (Brand, Wasser, Sturm, Einbruch, Unfall)
- severity: Schweregrad (Bagatelle, Mittel, Groß, Katastrophe)
- sector: Betroffener Sektor (Wohnen, Büro, Industrie, Handel, Gastronomie)
- damageType: Spezifischer Schaden (Feuer, Rauch, Löschwasser, Hagel, Einbruch)
- urgency: Dringlichkeit (Routine, Beobachten, Sofort)

KEYWORD-QUALITÄT:
- Nur RELEVANTE Keywords für Sachverständige
- SPEZIFISCH statt generisch ("Dachstuhlbrand" statt "Brand")
- FACHTERMINOLOGIE verwenden
- 3-8 Keywords pro Artikel
- Confidence-Score 0.0-1.0 für jedes Keyword

4️⃣ ERWEITERTE KATEGORISIERUNG (4 Kategorien):

🏠 PRIVATE SCHÄDEN = Orte zum WOHNEN und LEBEN
- Jeder Ort, wo Menschen ihr ZUHAUSE haben
- Privatpersonen als Hauptbetroffene
- Wohnzweck steht im Vordergrund
- Beispiele: Häuser, Wohnungen, Eigenheime, WGs, Seniorenheime

🏢 GEWERBLICHE SCHÄDEN = Orte zum ARBEITEN und GESCHÄFTE MACHEN
- Büros, Geschäfte, Praxen, Restaurants, kleinere Betriebe
- Dienstleistungsunternehmen, Handel, Gastronomie
- Beispiele: Arztpraxen, Anwaltskanzleien, Restaurants, Einzelhandel

🏭 INDUSTRIELLE SCHÄDEN = PRODUKTION und FERTIGUNG
- Fabriken, Produktionsstätten, Sägewerke, Werkstätten
- Schwere Maschinen, Produktionsanlagen
- Beispiele: Sägewerke, Fabriken, Produktionshallen, Werkstätten

🏗️ INFRASTRUKTUR-SCHÄDEN = ÖFFENTLICHE EINRICHTUNGEN
- Schulen, Krankenhäuser, Behörden, Verkehrswege
- Öffentliche Versorgung, Bildungseinrichtungen
- Beispiele: Schulen, Kitas, Krankenhäuser, Brücken, Bahnhöfe

5️⃣ 🚦 AMPEL-BEWERTUNG (3 Stufen):

🟢 ROUTINE = Zur Information, nur dokumentieren
- Kleine Schäden, Bagatellschäden
- Kein direkter Sachverständigenbedarf erkennbar
- Standard-Versicherungsabwicklung ausreichend
- Beispiele: Kleine Wasserschäden, Fensterscheiben, Kleinreparaturen

🟡 BEACHTEN = Aufmerksamkeit erforderlich, Entwicklung verfolgen
- Mittlere Schäden mit möglichem SV-Bedarf
- Situation könnte sich entwickeln
- Bei Bedarf kontaktieren oder beobachten
- Beispiele: Größere Wasserschäden, mittlere Brandschäden, unklare Haftung

🔴 HANDELN = Dringend, sofort aktiv werden
- Großschäden mit klarem SV-Bedarf
- Komplexe Schadenssituationen
- Umgehend Mandatsanfrage stellen
- Beispiele: Millionenschäden, Großbrände, komplexe Haftungsfälle, Betriebsunterbrechungen

6️⃣ ENTSCHEIDUNGSHILFEN:
- Bei WOHNGEBÄUDEN mit Gewerbe → Hauptnutzung entscheidet
- Bei GEMISCHTER NUTZUNG → Schwerpunkt der Betroffenheit
- Bei UNSICHERHEIT → Frage: "Wer verliert hier hauptsächlich was?"

7️⃣ TITEL-GENERIERUNG:
Erstelle prägnante, sachverständigen-orientierte Titel:
- Schadensart + Objekttyp + Ort
- 50-80 Zeichen, professionell und präzise
- Beispiele: "Brandschaden Sägewerk Allendorf - Millionenschaden"

8️⃣ BETRIEBSUNTERBRECHUNG erkennen:
- Gibt es Hinweise auf Arbeitsausfall, Produktionsstopp?
- Sind Geschäftstätigkeiten beeinträchtigt?
- Bei Gewerbe/Industrie: Fast immer TRUE, bei Privat: meist FALSE

WICHTIG: 
- Nutze dein ALLGEMEINWISSEN über Gebäudetypen und Nutzungen
- Denke LOGISCH, nicht nur nach Stichworten
- Ein SÄGEWERK ist OFFENSICHTLICH Industrie, auch ohne das Wort "Fabrik"
- Eine ZAHNARZTPRAXIS ist Gewerbe, auch wenn sie klein ist
- Ein RESTAURANT ist Gewerbe, egal ob "familiär" oder "klein"
- Eine SCHULE ist Infrastruktur, auch wenn privat betrieben

Antworte ausschließlich mit einem gültigen JSON-Objekt:

{
  "title": "Prägnanter SV-orientierter Titel (50-80 Zeichen)",
  "summary": "Prägnante Zusammenfassung in 2-3 Sätzen",
  "keyPoints": ["3-5 wichtige Punkte für SV-Bewertung"],
  "severity": "routine|attention|urgent",
  "damageCategory": "private|commercial|industrial|infrastructure",
  "businessInterruption": true/false,
  "estimatedComplexity": "low|medium|high|critical",
  "location": "Präziser Ereignisort (Stadt, Stadtteil, Straße)",
  "locationConfidence": "low|medium|high",
  "keywords": ["3-8 sachverständigen-relevante Keywords"],
  "keywordCategories": {
    "eventType": "Brand|Wasser|Sturm|Einbruch|Unfall|Sonstiges",
    "severity": "Bagatelle|Mittel|Groß|Katastrophe",
    "sector": "Wohnen|Büro|Industrie|Handel|Gastronomie|Gesundheit|Bildung|Infrastruktur|Sonstiges",
    "damageType": "Spezifischer Schadenstyp",
    "urgency": "Routine|Beobachten|Sofort"
  },
  "keywordConfidence": {
    "keyword1": 0.95,
    "keyword2": 0.87
  }
}`,
      prompt: `Bewerte diese Schadensmeldung aus Sachverständigen-Sicht und erstelle einen professionellen Titel mit intelligenten Keywords:

Originaltitel: ${title || "Kein Titel"}
Ursprünglicher Ort (RSS): ${location || "Unbekannt"}
Inhalt: ${textToSummarize}

ANALYSIERE SYSTEMATISCH:

1. TITEL erstellen:
   - Schadensart identifizieren (Brand, Wasser, Sturm, etc.)
   - Objekttyp bestimmen und logisch kategorisieren
   - Ort einbauen, prägnant formulieren

2. 📍 EREIGNISORT INTELLIGENT BESTIMMEN:
   - Analysiere den GESAMTEN Text nach dem tatsächlichen Ereignisort
   - Ignoriere nur erwähnte Orte (z.B. "Feuerwehr aus X hilft in Y" → Y ist Ereignisort)
   - Sei so PRÄZISE wie möglich: Stadtteil > Stadt > Region
   - Bewerte deine GENAUIGKEIT ehrlich
   - Falls unklar: Nutze den ursprünglichen RSS-Ort als Fallback

3. 🏷️ INTELLIGENTE KEYWORDS EXTRAHIEREN:
   - Fokus auf SACHVERSTÄNDIGEN-RELEVANZ
   - SPEZIFISCHE Begriffe statt generische
   - Berücksichtige FACHTERMINOLOGIE
   - 3-8 Keywords mit hoher Relevanz
   - Bewerte Confidence für jedes Keyword (0.0-1.0)
   - Kategorisiere Keywords sinnvoll

4. ERWEITERTE SCHADENSKATEGORIE bestimmen (4 Kategorien):
   - PRIVATE: Wohnzweck, Privatpersonen betroffen?
   - COMMERCIAL: Geschäfts-/Bürozweck, kleinere Unternehmen?
   - INDUSTRIAL: Produktion/Fertigung, Fabriken, Sägewerke?
   - INFRASTRUCTURE: Öffentliche Einrichtungen, Schulen, Krankenhäuser?

5. AMPEL-BEWERTUNG (🚦):
   - ROUTINE: Kleine Schäden, nur Info
   - ATTENTION: Mittlere Schäden, beobachten
   - URGENT: Große/komplexe Schäden, sofort handeln

6. BETRIEBSUNTERBRECHUNG prüfen:
   - Sind Geschäftstätigkeiten beeinträchtigt?

7. KOMPLEXITÄT einschätzen:
   - Einfache vs. komplexe Regulierung

Antworte nur mit dem JSON-Objekt ohne zusätzliche Formatierung.`,
    })

    // Parse JSON response with error handling
    const parsed = parseAIResponse(text)

    // Validate required fields
    if (!parsed.title || !parsed.summary || !parsed.keyPoints || !parsed.severity) {
      throw new Error("AI response missing required fields")
    }

    // Validate severity value (3-Stufen-Ampel)
    const validSeverities = ["routine", "attention", "urgent"]
    if (!validSeverities.includes(parsed.severity)) {
      parsed.severity = "attention" // Default zu Gelb
    }

    // Validate damage category (erweitert auf 4 Kategorien)
    const validCategories = ["private", "commercial", "industrial", "infrastructure"]
    if (!validCategories.includes(parsed.damageCategory)) {
      parsed.damageCategory = "private"
    }

    // Validate complexity
    const validComplexities = ["low", "medium", "high", "critical"]
    if (!validComplexities.includes(parsed.estimatedComplexity)) {
      parsed.estimatedComplexity = "medium"
    }

    // Validate location confidence
    const validConfidences = ["low", "medium", "high"]
    if (parsed.locationConfidence && !validConfidences.includes(parsed.locationConfidence)) {
      parsed.locationConfidence = "medium"
    }

    // 🆕 Validate and process keywords
    let processedKeywords: string[] = []
    let keywordConfidence: { [key: string]: number } = {}

    if (Array.isArray(parsed.keywords)) {
      processedKeywords = parsed.keywords
        .filter((kw: any) => typeof kw === "string" && kw.trim().length > 0)
        .slice(0, 8) // Maximal 8 Keywords
    }

    // Process keyword confidence scores
    if (parsed.keywordConfidence && typeof parsed.keywordConfidence === "object") {
      keywordConfidence = parsed.keywordConfidence
    } else {
      // Generate default confidence scores if not provided
      processedKeywords.forEach((keyword) => {
        keywordConfidence[keyword] = 0.8 // Default confidence
      })
    }

    return {
      success: true,
      title: parsed.title,
      summary: parsed.summary,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      severity: parsed.severity,
      damageCategory: parsed.damageCategory,
      businessInterruption: Boolean(parsed.businessInterruption),
      estimatedComplexity: parsed.estimatedComplexity,
      location: parsed.location || null,
      locationConfidence: parsed.locationConfidence || "medium",
      keywords: processedKeywords, // 🆕 KI-extrahierte Keywords
      keywordCategories: parsed.keywordCategories || {}, // 🆕 Kategorisierte Keywords
      keywordConfidence, // 🆕 Confidence-Scores
    }
  } catch (error: any) {
    console.error("AI Summary Error:", error)

    // Spezifische Fehlerbehandlung für häufige Probleme
    if (error.message?.includes("API key")) {
      return {
        success: false,
        error: "OpenAI API Key ist ungültig oder nicht gesetzt. Bitte überprüfen Sie die Konfiguration.",
      }
    }

    if (error.message?.includes("quota")) {
      return {
        success: false,
        error: "OpenAI API Quota überschritten. Bitte versuchen Sie es später erneut.",
      }
    }

    if (error.message?.includes("rate limit")) {
      return {
        success: false,
        error: "OpenAI API Rate Limit erreicht. Bitte warten Sie einen Moment.",
      }
    }

    if (error.message?.includes("JSON") || error.message?.includes("parse")) {
      return {
        success: false,
        error: "KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
      }
    }

    return {
      success: false,
      error: error.message || "Fehler bei der KI-Zusammenfassung",
    }
  }
}
