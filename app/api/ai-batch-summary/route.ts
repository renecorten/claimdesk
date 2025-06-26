import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { generateNewsSummary } from "@/lib/ai-summarizer"

export async function POST(request: NextRequest) {
  try {
    const { newsIds } = await request.json()

    if (!newsIds || !Array.isArray(newsIds) || newsIds.length === 0) {
      return NextResponse.json({ error: "News IDs sind erforderlich" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API Key ist nicht konfiguriert. Bitte setzen Sie die OPENAI_API_KEY Umgebungsvariable.",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Hole alle News-Artikel
    const { data: newsItems, error } = await supabase
      .from("news_cache")
      .select("id, title, content, summary, location, original_link")
      .in("id", newsIds)

    if (error || !newsItems) {
      return NextResponse.json({ error: "News-Artikel nicht gefunden" }, { status: 404 })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Verarbeite jeden Artikel einzeln
    for (const newsItem of newsItems) {
      try {
        // Generiere KI-Zusammenfassung
        const summaryResult = await generateNewsSummary(
          newsItem.title,
          newsItem.content || newsItem.summary,
          newsItem.location,
          newsItem.original_link,
        )

        if (!summaryResult.success) {
          results.push({
            id: newsItem.id,
            success: false,
            error: summaryResult.error,
          })
          errorCount++
          continue
        }

        // Speichere in Datenbank
        const { error: updateError } = await supabase
          .from("news_cache")
          .update({
            ai_summary: summaryResult.summary,
            ai_key_points: summaryResult.keyPoints,
            ai_severity: summaryResult.severity,
            ai_damage_category: summaryResult.damageCategory,
            ai_business_interruption: summaryResult.businessInterruption,
            ai_estimated_complexity: summaryResult.estimatedComplexity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", newsItem.id)

        if (updateError) {
          results.push({
            id: newsItem.id,
            success: false,
            error: "Database update failed: " + updateError.message,
          })
          errorCount++
        } else {
          // Update success result
          results.push({
            id: newsItem.id,
            success: true,
            summary: summaryResult.summary,
            keyPoints: summaryResult.keyPoints,
            severity: summaryResult.severity,
            damageCategory: summaryResult.damageCategory,
          })
          successCount++
        }

        // Kleine Pause zwischen Requests um Rate Limits zu vermeiden
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        results.push({
          id: newsItem.id,
          success: false,
          error: error.message,
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: newsItems.length,
      successCount,
      errorCount,
      results,
    })
  } catch (error: any) {
    console.error("Batch AI Summary API Error:", error)
    return NextResponse.json({ error: "Interner Server-Fehler" }, { status: 500 })
  }
}
