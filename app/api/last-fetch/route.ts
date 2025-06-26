import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 🆕 Versuche zuerst den letzten Fetch aus der Fetch-Log Tabelle zu holen
    const { data: fetchLogData, error: fetchLogError } = await supabase
      .from("feed_fetch_log")
      .select("fetch_completed_at, triggered_by, successful_feeds, new_items_count")
      .order("fetch_completed_at", { ascending: false })
      .limit(1)
      .single()

    if (!fetchLogError && fetchLogData) {
      return NextResponse.json({
        lastFetch: fetchLogData.fetch_completed_at,
        triggeredBy: fetchLogData.triggered_by,
        successfulFeeds: fetchLogData.successful_feeds,
        newItemsCount: fetchLogData.new_items_count,
        source: "fetch_log",
        success: true,
      })
    }

    // 🔄 Fallback: Hole den neuesten Eintrag aus news_cache
    const { data: newsData, error: newsError } = await supabase
      .from("news_cache")
      .select("created_at, updated_at, source")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (newsError) {
      console.warn("Could not fetch last data refresh time:", newsError)
      return NextResponse.json({
        lastFetch: null,
        source: "none",
        error: "No data available",
      })
    }

    return NextResponse.json({
      lastFetch: newsData.created_at,
      source: "news_cache_fallback",
      success: true,
    })
  } catch (error) {
    console.error("Last fetch API error:", error)
    return NextResponse.json({
      lastFetch: null,
      error: "Failed to fetch last refresh time",
    })
  }
}
