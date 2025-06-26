import { createBrowserClient } from "@supabase/ssr"
import { supabaseUrl, supabaseAnonKey } from "./config"
import type { Database } from "@/lib/database.types"

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
  }
  return client
}

// Singleton instance für direkten Import
export const supabase = createClient()
