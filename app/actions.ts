"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import { redirect } from "next/navigation"

export async function hideNewsItemAction(newsId: string) {
  const supabase = createSupabaseServerClient()

  // Zuerst prüfen, ob der Eintrag bereits in deleted_news ist, um Fehler zu vermeiden
  const { data: existingDeleted, error: checkError } = await supabase
    .from("deleted_news")
    .select("id")
    .eq("id", newsId)
    .maybeSingle()

  if (checkError) {
    console.error("Error checking deleted_news:", checkError)
    return { success: false, message: "Fehler beim Überprüfen des Eintrags: " + checkError.message }
  }

  if (existingDeleted) {
    // Eintrag ist bereits ausgeblendet
    revalidatePath("/radar")
    return { success: true, message: "Eintrag war bereits ausgeblendet." }
  }

  // Eintrag in deleted_news einfügen
  const { error: deleteError } = await supabase.from("deleted_news").insert({ id: newsId })

  if (deleteError) {
    console.error("Error inserting into deleted_news:", deleteError)
    return { success: false, message: "Fehler beim Ausblenden: " + deleteError.message }
  }

  revalidatePath("/radar") // Sorgt dafür, dass die Radar-Seite neu geladen wird und die Daten aktualisiert werden
  return { success: true, message: "Eintrag erfolgreich ausgeblendet." }
}

export async function createAcquisitionCaseAction(formData: FormData) {
  console.log("--- [START] createAcquisitionCaseAction ---")
  try {
    const newsItemId = formData.get("newsItemId") as string
    const priority = formData.get("priority") as "low" | "medium" | "high" | "urgent"

    console.log(`[1] Action called with: newsItemId=${newsItemId}, priority=${priority}`)

    if (!newsItemId) {
      console.error("[FAIL] News-ID fehlt im Formular.")
      return { success: false, message: "News-ID fehlt." }
    }

    // Verwende den ADMIN-Client für volle Zugriffsrechte
    const supabase = createAdminClient()
    const supabaseUserClient = createSupabaseServerClient() // Für das Abrufen der News

    console.log("[2] Supabase Admin Client created.")

    // Prüfen, ob bereits ein Fall für diese News existiert
    console.log("[3] Checking for existing case for news_item_id:", newsItemId)
    const { data: existingCase, error: existingError } = await supabase
      .from("acquisition_cases")
      .select("id")
      .eq("news_item_id", newsItemId)
      .maybeSingle()

    if (existingError) {
      console.error("[FAIL] Error checking for existing case:", existingError)
      return { success: false, message: "Fehler bei der Prüfung auf existierende Fälle." }
    }

    if (existingCase) {
      console.warn(`[WARN] Case already exists for news_item_id ${newsItemId}: Case ID ${existingCase.id}`)
      return { success: false, message: "Für diese Meldung existiert bereits ein Akquise-Fall." }
    }
    console.log("[4] No existing case found. Proceeding to fetch news item.")

    // News-Item abrufen
    const { data: newsItem, error: newsItemError } = await supabaseUserClient
      .from("news_cache")
      .select("ai_title, title, summary, content, published_at, ai_location, location")
      .eq("id", newsItemId)
      .single()

    if (newsItemError || !newsItem) {
      console.error("[FAIL] Error fetching news item:", newsItemError)
      return { success: false, message: "Fehler beim Abrufen der ursprünglichen Meldung." }
    }
    console.log("[5] News item fetched successfully.")

    // Eindeutige Fallnummer generieren
    const caseNumber = `CASE-${new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)}`
    console.log("[6] Generated case_number:", caseNumber)

    // Akquise-Fall erstellen
    const caseData = {
      news_item_id: newsItemId,
      case_number: caseNumber,
      priority: priority || "medium",
      status: "offen" as const,
      company_name: newsItem.ai_title || newsItem.title,
      damage_description: newsItem.summary || newsItem.content,
      damage_date: newsItem.published_at ? new Date(newsItem.published_at).toISOString().split("T")[0] : null,
      address: newsItem.ai_location || newsItem.location,
      source: "radar" as const,
    }
    console.log("[7] Attempting to insert new acquisition case with data:", caseData)

    const { data: newCase, error: insertError } = await supabase
      .from("acquisition_cases")
      .insert(caseData)
      .select("id")
      .single()

    if (insertError) {
      console.error("[FAIL] Error creating acquisition case:", insertError)
      return { success: false, message: `Fall konnte nicht erstellt werden: ${insertError.message}` }
    }

    if (!newCase) {
      console.error("[FAIL] Insert operation did not return the new case ID.")
      return { success: false, message: "Fall erstellt, aber ID konnte nicht abgerufen werden." }
    }

    console.log(`[SUCCESS] Acquisition case created. ID: ${newCase.id}`)
    console.log("--- [END] createAcquisitionCaseAction ---")

    revalidatePath("/radar")
    revalidatePath("/akquise")

    redirect(`/akquise?newCase=${newCase.id}`)
  } catch (error) {
    console.error("[FATAL] An unexpected error occurred in createAcquisitionCaseAction:", error)
    return { success: false, message: "Ein unerwarteter Fehler ist aufgetreten." }
  }
}
