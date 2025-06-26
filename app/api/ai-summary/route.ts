import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { generateNewsSummary } from "@/lib/ai-summarizer"

export async function POST(request: Request) {
  try {
    const { newsId } = await request.json()

    if (!newsId) {
      return NextResponse.json({ success: false, error: "News ID ist erforderlich" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Hole den News-Artikel
    const { data: newsItem, error: fetchError } = await supabase
      .from("news_cache")
      .select("id, title, content, summary, location, original_link")
      .eq("id", newsId)
      .single()

    if (fetchError || !newsItem) {
      return NextResponse.json({ success: false, error: "News-Artikel nicht gefunden" }, { status: 404 })
    }

    // Generiere KI-Zusammenfassung
    const summaryResult = await generateNewsSummary(
      newsItem.title,
      newsItem.content || newsItem.summary,
      newsItem.location,
      newsItem.original_link,
    )

    if (!summaryResult.success) {
      return NextResponse.json({ success: false, error: summaryResult.error }, { status: 500 })
    }

    // Speichere die Ergebnisse in der Datenbank
    const { error: updateError } = await supabase
      .from("news_cache")
      .update({
        ai_title: summaryResult.title,
        ai_summary: summaryResult.summary,
        ai_key_points: summaryResult.keyPoints,
        ai_severity: summaryResult.severity,
        ai_damage_category: summaryResult.damageCategory,
        ai_business_interruption: summaryResult.businessInterruption,
        ai_estimated_complexity: summaryResult.estimatedComplexity,
        ai_location: summaryResult.location,
        ai_location_confidence: summaryResult.locationConfidence,
        ai_keywords: summaryResult.keywords, // 🆕 KI-Keywords
        ai_keyword_categories: summaryResult.keywordCategories, // 🆕 Kategorien
        ai_keyword_confidence: summaryResult.keywordConfidence, // 🆕 Confidence
        updated_at: new Date().toISOString(),
      })
      .eq("id", newsId)

    if (updateError) {
      console.error("Error updating news item:", updateError)
      return NextResponse.json({ success: false, error: "Fehler beim Speichern der KI-Analyse" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      title: summaryResult.title,
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints,
      severity: summaryResult.severity,
      damageCategory: summaryResult.damageCategory,
      businessInterruption: summaryResult.businessInterruption,
      estimatedComplexity: summaryResult.estimatedComplexity,
      location: summaryResult.location,
      locationConfidence: summaryResult.locationConfidence,
      keywords: summaryResult.keywords, // 🆕 KI-Keywords
      keywordCategories: summaryResult.keywordCategories, // 🆕 Kategorien
      keywordConfidence: summaryResult.keywordConfidence, // 🆕 Confidence
    })
  } catch (error: any) {
    console.error("AI Summary API Error:", error)
    return NextResponse.json({ success: false, error: "Interner Serverfehler bei der KI-Analyse" }, { status: 500 })
  }
}
