"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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

  // Optional: Eintrag aus news_cache entfernen oder markieren.
  // Gemäß Anforderung wird er nur in deleted_news eingetragen.
  // Die API /api/news wird ihn dann nicht mehr importieren.
  // Um ihn sofort aus der Ansicht zu entfernen, wenn er noch in news_cache ist:
  // const { error: removeFromCacheError } = await supabase
  //   .from('news_cache')
  //   .delete()
  //   .eq('id', newsId);
  // if (removeFromCacheError) {
  //   console.error("Error deleting from news_cache:", removeFromCacheError);
  //   // Fehler hier ist nicht kritisch für die Ausblendfunktion, aber gut zu wissen
  // }

  revalidatePath("/radar") // Sorgt dafür, dass die Radar-Seite neu geladen wird und die Daten aktualisiert werden
  return { success: true, message: "Eintrag erfolgreich ausgeblendet." }
}
