import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabaseUrl, supabaseAnonKey } from "./config"
import type { Database } from "@/lib/database.types"

let serverClient: ReturnType<typeof createServerClient<Database>> | undefined

export async function createSupabaseServerClient() {
  if (!serverClient) {
    const cookieStore = await cookies()
    serverClient = createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            /* ignorieren, wenn aus Server-Component aufgerufen */
          }
        },
      },
    })
  }
  return serverClient
}

/* Alias für alte Imports – vermeidet zukünftige Fehler */
export { createSupabaseServerClient as createClient }
