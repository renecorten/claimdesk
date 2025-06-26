import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { parseFeed } from "@/lib/feed-parser"
import { generateNewsSummary } from "@/lib/ai-summarizer"
import type { Database } from "@/lib/database.types"

type NewsCacheInsert = Database["public"]["Tables"]["news_cache"]["Insert"]

const FEEDS = [
  {
    url: "https://www.presseportal.de/rss/polizei/typ/3.rss2",
    type: "Presseportal",
    sourceName: "Presseportal Blaulicht",
  },
  {
    url: "https://www.google.de/alerts/feeds/10045989064387185908/2789314997576740794",
    type: "GoogleAlert",
    sourceName: "Google Alerts Sicherheit",
  },
]

interface FeedProcessingResult {
  feedConfig: (typeof FEEDS)[0]
  success: boolean
  newItemsCount: number
  updatedItemsCount: number
  aiProcessedCount: number
  error?: string
}

// 🆕 Verbesserte Funktion zum Loggen des Fetch-Vorgangs - IMMER loggen
async function logFetchAttempt(
  supabase: ReturnType<typeof createAdminClient>,
  startTime: number,
  results: FeedProcessingResult[],
  triggeredBy = "api",
) {
  const endTime = Date.now()
  const processingTime = endTime - startTime

  const totalFeeds = results.length
  const successfulFeeds = results.filter((r) => r.success).length
  const failedFeeds = totalFeeds - successfulFeeds
  const totalNewItems = results.reduce((sum, r) => sum + r.newItemsCount, 0)
  const totalUpdatedItems = results.reduce((sum, r) => sum + r.updatedItemsCount, 0)
  const totalAiProcessed = results.reduce((sum, r) => sum + r.aiProcessedCount, 0)

  const errorDetails = results.filter((r) => !r.success).map((r) => ({ feed: r.feedConfig.sourceName, error: r.error }))

  try {
    console.log(`📊 Attempting to log fetch: triggered_by=${triggeredBy}, feeds=${totalFeeds}, new=${totalNewItems}`)

    // 🔄 Prüfe erst, ob die Tabelle existiert
    const { data: tableCheck, error: tableError } = await supabase.from("feed_fetch_log").select("id").limit(1)

    if (tableError) {
      console.error("❌ feed_fetch_log table check failed:", tableError)

      // Fallback: Erstelle einen einfachen Log in der Konsole
      console.log(
        `📊 FALLBACK LOG: ${triggeredBy} - ${totalFeeds} feeds, ${totalNewItems} new, ${totalUpdatedItems} updated, ${totalAiProcessed} AI processed in ${processingTime}ms`,
      )
      return
    }

    // 🔄 IMMER einen Log-Eintrag erstellen, auch wenn keine neuen Items
    const logData = {
      fetch_started_at: new Date(startTime).toISOString(),
      fetch_completed_at: new Date(endTime).toISOString(),
      total_feeds: totalFeeds,
      successful_feeds: successfulFeeds,
      failed_feeds: failedFeeds,
      new_items_count: totalNewItems,
      updated_items_count: totalUpdatedItems,
      ai_processed_count: totalAiProcessed,
      error_details: errorDetails.length > 0 ? errorDetails : null,
      triggered_by: triggeredBy,
      processing_time_ms: processingTime,
    }

    console.log(`📊 Inserting log data:`, JSON.stringify(logData, null, 2))

    const { error: logError, data: logResult } = await supabase.from("feed_fetch_log").insert(logData).select("id")

    if (logError) {
      console.error("❌ Could not create fetch log entry:", logError)
      console.error("❌ Log data was:", JSON.stringify(logData, null, 2))

      // Zusätzliche Debugging-Info
      if (logError.code) {
        console.error(`❌ Error code: ${logError.code}`)
      }
      if (logError.details) {
        console.error(`❌ Error details: ${logError.details}`)
      }
      if (logError.hint) {
        console.error(`❌ Error hint: ${logError.hint}`)
      }
    } else {
      console.log(
        `📊 ✅ Successfully logged fetch attempt (ID: ${logResult?.[0]?.id}): ${successfulFeeds}/${totalFeeds} successful, ${totalNewItems} new items, ${totalUpdatedItems} updated, triggered by: ${triggeredBy}`,
      )
    }
  } catch (error) {
    console.error("❌ Exception in logFetchAttempt:", error)
    console.error("❌ Stack trace:", (error as Error).stack)
  }
}

// Funktion zum Vergleichen von Inhalten (Hash-basiert für Performance)
function generateContentHash(item: any): string {
  const content = `${item.title || ""}|${item.summary || ""}|${item.content || ""}`
  // Einfacher Hash-Algorithmus für Content-Vergleich
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

async function processSingleFeed(
  feedConfig: (typeof FEEDS)[0],
  supabase: ReturnType<typeof createAdminClient>,
): Promise<FeedProcessingResult> {
  const startTime = Date.now()

  try {
    console.log(`🚀 Starting optimized processing of feed: ${feedConfig.sourceName}`)

    // 1. Parse Feed
    const parsedItems = await parseFeed(feedConfig.url, feedConfig.type, feedConfig.sourceName)

    if (parsedItems.length === 0) {
      console.log(`⚠️ No items found for feed: ${feedConfig.sourceName}`)
      return {
        feedConfig,
        success: true,
        newItemsCount: 0,
        updatedItemsCount: 0,
        aiProcessedCount: 0,
      }
    }

    console.log(`📄 Parsed ${parsedItems.length} items from ${feedConfig.sourceName}`)

    // 2. Batch-Abfrage für existierende Artikel mit Content-Hash
    const originalLinks = parsedItems.map((p) => p.originalLink).filter(Boolean) as string[]
    const itemIds = parsedItems.map((p) => p.id).filter(Boolean) as string[]

    const [existingNewsResult, deletedNewsResult] = await Promise.all([
      supabase
        .from("news_cache")
        .select("original_link, id, title, summary, content, ai_summary")
        .in("original_link", originalLinks),
      supabase.from("deleted_news").select("id").in("id", itemIds),
    ])

    if (existingNewsResult.error) {
      throw new Error(`Error fetching existing news: ${existingNewsResult.error.message}`)
    }

    if (deletedNewsResult.error) {
      throw new Error(`Error fetching deleted news: ${deletedNewsResult.error.message}`)
    }

    // 3. Intelligente Daten-Verarbeitung mit Content-Vergleich
    const existingLinksMap = new Map(
      existingNewsResult.data?.map((e) => [
        e.original_link,
        {
          id: e.id,
          contentHash: generateContentHash(e),
          hasAI: !!e.ai_summary,
        },
      ]) || [],
    )
    const deletedIdsSet = new Set(deletedNewsResult.data?.map((d) => d.id))

    const itemsToInsert: NewsCacheInsert[] = []
    const itemsToUpdate: NewsCacheInsert[] = []
    const newItemsForAI: string[] = []

    // Kategorisiere Items für Insert/Update mit Content-Vergleich
    for (const item of parsedItems) {
      if (!item.originalLink || !item.id) continue

      // Überspringe gelöschte Artikel
      if (deletedIdsSet.has(item.id)) {
        continue
      }

      const dbItem: NewsCacheInsert = {
        id: item.id,
        title: item.title,
        summary: item.summary,
        content: item.content,
        published_at: item.publishedAt,
        source: item.source,
        location: item.location,
        keywords: item.keywords, // 🔄 Legacy RSS Keywords bleiben
        original_link: item.originalLink,
        feed_type: item.feedType,
      }

      const existingItem = existingLinksMap.get(item.originalLink)

      if (existingItem) {
        // Artikel existiert bereits - prüfe auf Content-Änderungen
        const newContentHash = generateContentHash(item)

        if (existingItem.contentHash !== newContentHash) {
          // Content hat sich geändert - Update erforderlich
          itemsToUpdate.push({ ...dbItem, id: existingItem.id })
          console.log(`🔄 Content changed for: ${item.title?.substring(0, 50)}...`)

          // Wenn sich Content geändert hat, AI neu ausführen
          if (existingItem.hasAI) {
            newItemsForAI.push(existingItem.id)
          }
        }
        // Wenn Content gleich ist, nichts tun (Performance-Optimierung)
      } else {
        // Neuer Artikel
        itemsToInsert.push(dbItem)
        // Merke neue Items für AI-Verarbeitung
        newItemsForAI.push(item.id)
      }
    }

    // 4. Optimierte Database Operations
    let newItemsCount = 0
    let updatedItemsCount = 0
    let aiProcessedCount = 0

    const dbOperations: Promise<any>[] = []

    // Insert neue Items
    if (itemsToInsert.length > 0) {
      console.log(`📝 Inserting ${itemsToInsert.length} new items for ${feedConfig.sourceName}`)
      dbOperations.push(
        supabase
          .from("news_cache")
          .insert(itemsToInsert)
          .then((result) => {
            if (result.error) throw new Error(`Insert error: ${result.error.message}`)
            newItemsCount = itemsToInsert.length
          }),
      )
    }

    // Update geänderte Items
    if (itemsToUpdate.length > 0) {
      console.log(`🔄 Updating ${itemsToUpdate.length} changed items for ${feedConfig.sourceName}`)
      dbOperations.push(
        supabase
          .from("news_cache")
          .upsert(itemsToUpdate)
          .then((result) => {
            if (result.error) throw new Error(`Update error: ${result.error.message}`)
            updatedItemsCount = itemsToUpdate.length
          }),
      )
    }

    // Warte auf DB-Operationen
    if (dbOperations.length > 0) {
      await Promise.all(dbOperations)
    }

    // 5. 🤖 AUTOMATISCHE KI-VERARBEITUNG für neue/geänderte Items
    if (newItemsForAI.length > 0 && process.env.OPENAI_API_KEY) {
      console.log(
        `🤖 Starting AI processing with enhanced content extraction for ${newItemsForAI.length} items from ${feedConfig.sourceName}`,
      )

      // Hole die Items für AI-Verarbeitung
      const { data: itemsForAI, error: aiItemsError } = await supabase
        .from("news_cache")
        .select("id, title, content, summary, location, original_link")
        .in("id", newItemsForAI)

      if (!aiItemsError && itemsForAI) {
        // Verarbeite Items in kleineren Batches um Rate Limits zu vermeiden
        const batchSize = 3
        for (let i = 0; i < itemsForAI.length; i += batchSize) {
          const batch = itemsForAI.slice(i, i + batchSize)

          const aiPromises = batch.map(async (item) => {
            try {
              const summaryResult = await generateNewsSummary(
                item.title,
                item.content || item.summary,
                item.location,
                item.original_link, // Neue Parameter für URL
              )

              if (summaryResult.success) {
                await supabase
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
                  .eq("id", item.id)

                aiProcessedCount++
                console.log(`✨ AI processed: ${summaryResult.title || item.title?.substring(0, 50)}...`)
              }
            } catch (error) {
              console.error(`❌ AI processing failed for item ${item.id}:`, error)
            }
          })

          await Promise.all(aiPromises)

          // Kurze Pause zwischen Batches
          if (i + batchSize < itemsForAI.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ Successfully processed ${feedConfig.sourceName} in ${processingTime}ms`)
    console.log(
      `📊 ${feedConfig.sourceName}: ${newItemsCount} new, ${updatedItemsCount} updated, ${aiProcessedCount} AI processed`,
    )

    return {
      feedConfig,
      success: true,
      newItemsCount,
      updatedItemsCount,
      aiProcessedCount,
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Error processing feed ${feedConfig.sourceName} after ${processingTime}ms:`, error)

    return {
      feedConfig,
      success: false,
      newItemsCount: 0,
      updatedItemsCount: 0,
      aiProcessedCount: 0,
      error: error.message,
    }
  }
}

export async function GET(request: NextRequest) {
  const overallStartTime = Date.now()

  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("forceRefresh") === "true"
    const skipAI = searchParams.get("skipAI") === "true"

    // 🆕 Bestimme Trigger-Quelle
    const triggeredBy = forceRefresh ? "cron" : "manual"

    console.log(`🔄 Starting feed processing: triggered_by=${triggeredBy}, skipAI=${skipAI}`)

    // 🔄 NEUE PRÜFUNG: Auto-Refresh Status mit Fallback
    let autoRefreshEnabled = true // Default to enabled

    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "auto_refresh_enabled")
        .single()

      if (!settingsError && settingsData) {
        autoRefreshEnabled = settingsData.setting_value === true
      } else if (settingsError?.code === "PGRST116" || settingsError?.message?.includes("does not exist")) {
        console.log("🔧 Settings table doesn't exist yet, using default (enabled)")
        autoRefreshEnabled = true
      }
    } catch (settingsError) {
      console.log("🔧 Could not check settings, using default (enabled)")
      autoRefreshEnabled = true
    }

    // Wenn Auto-Refresh deaktiviert ist und es ein Cron-Call ist (forceRefresh ohne manuelle Anfrage)
    if (!autoRefreshEnabled && forceRefresh) {
      console.log("🚫 Auto-refresh is disabled, skipping feed processing")

      // 🆕 Erstelle leere Results für das Logging
      const emptyResults: FeedProcessingResult[] = FEEDS.map((feedConfig) => ({
        feedConfig,
        success: true,
        newItemsCount: 0,
        updatedItemsCount: 0,
        aiProcessedCount: 0,
      }))

      // 🆕 Logge auch den Skip-Vorgang
      await logFetchAttempt(supabase, overallStartTime, emptyResults, "cron_skipped")

      return NextResponse.json({
        message: "Auto-refresh is currently disabled",
        newItemsCount: 0,
        updatedItemsCount: 0,
        aiProcessedCount: 0,
        processingTimeMs: Date.now() - overallStartTime,
        skipped: true,
      })
    }

    console.log(`🔄 Starting optimized feed processing for ${FEEDS.length} feeds...`)
    if (skipAI) {
      console.log(`⚠️ AI processing disabled for this run`)
    }

    // Temporär AI deaktivieren wenn gewünscht
    const originalApiKey = process.env.OPENAI_API_KEY
    if (skipAI) {
      delete process.env.OPENAI_API_KEY
    }

    // 🚀 PARALLELE VERARBEITUNG - Alle Feeds gleichzeitig!
    const feedResults = await Promise.allSettled(FEEDS.map((feedConfig) => processSingleFeed(feedConfig, supabase)))

    // API Key wiederherstellen
    if (skipAI && originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey
    }

    // Ergebnisse auswerten
    let totalNewItems = 0
    let totalUpdatedItems = 0
    let totalAiProcessed = 0
    const errors: string[] = []
    const successfulFeeds: string[] = []
    const failedFeeds: string[] = []
    const processedResults: FeedProcessingResult[] = []

    feedResults.forEach((result, index) => {
      const feedName = FEEDS[index].sourceName

      if (result.status === "fulfilled") {
        const feedResult = result.value
        processedResults.push(feedResult)

        if (feedResult.success) {
          totalNewItems += feedResult.newItemsCount
          totalUpdatedItems += feedResult.updatedItemsCount
          totalAiProcessed += feedResult.aiProcessedCount
          successfulFeeds.push(feedName)

          console.log(
            `✅ ${feedName}: ${feedResult.newItemsCount} new, ${feedResult.updatedItemsCount} updated, ${feedResult.aiProcessedCount} AI processed`,
          )
        } else {
          failedFeeds.push(feedName)
          if (feedResult.error) {
            errors.push(`${feedName}: ${feedResult.error}`)
          }
        }
      } else {
        // Create failed result for logging
        processedResults.push({
          feedConfig: FEEDS[index],
          success: false,
          newItemsCount: 0,
          updatedItemsCount: 0,
          aiProcessedCount: 0,
          error: result.reason?.message || "Unknown error",
        })

        failedFeeds.push(feedName)
        errors.push(`${feedName}: ${result.reason?.message || "Unknown error"}`)
        console.error(`❌ ${feedName} failed:`, result.reason)
      }
    })

    // 🆕 Logge den Fetch-Versuch - IMMER, auch bei 0 neuen Items
    console.log(`📊 About to log fetch attempt with ${processedResults.length} results`)
    await logFetchAttempt(supabase, overallStartTime, processedResults, triggeredBy)

    const totalProcessingTime = Date.now() - overallStartTime

    console.log(`🏁 Optimized processing completed in ${totalProcessingTime}ms`)
    console.log(`📊 Results: ${totalNewItems} new, ${totalUpdatedItems} updated, ${totalAiProcessed} AI processed`)
    console.log(`✅ Successful feeds: ${successfulFeeds.join(", ")}`)

    if (failedFeeds.length > 0) {
      console.log(`❌ Failed feeds: ${failedFeeds.join(", ")}`)
    }

    // Response mit AI-Statistiken
    const responseData = {
      message:
        errors.length === 0
          ? "All feeds processed successfully"
          : errors.length === successfulFeeds.length
            ? "All feeds failed to process"
            : "Feeds processed with some errors",
      newItemsCount: totalNewItems,
      updatedItemsCount: totalUpdatedItems,
      aiProcessedCount: totalAiProcessed,
      processingTimeMs: totalProcessingTime,
      successfulFeeds,
      failedFeeds,
      triggeredBy,
      ...(errors.length > 0 && { errors }),
    }

    if (errors.length > 0 && successfulFeeds.length === 0) {
      return NextResponse.json(responseData, { status: 500 })
    } else if (errors.length > 0) {
      return NextResponse.json(responseData, { status: 207 })
    } else {
      return NextResponse.json(responseData)
    }
  } catch (error: any) {
    const totalProcessingTime = Date.now() - overallStartTime
    console.error("💥 Fatal error in optimized news API:", error)

    return NextResponse.json(
      {
        message: "Fatal error during optimized feed processing",
        error: error.message,
        processingTimeMs: totalProcessingTime,
      },
      { status: 500 },
    )
  }
}
