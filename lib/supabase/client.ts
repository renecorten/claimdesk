import { createBrowserClient } from "@supabase/ssr"
import { supabaseUrl, supabaseAnonKey } from "./config"
import type { Database } from "@/lib/database.types"

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
}
