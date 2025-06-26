import { createClient } from "@supabase/supabase-js"
import { supabaseUrl } from "./config"
import type { Database } from "@/lib/database.types"

let adminClient: ReturnType<typeof createClient<Database>> | undefined

export function createAdminClient() {
  // Nur auf der Server-Seite verwenden!
  if (typeof window !== "undefined") {
    throw new Error("Admin client can only be used on the server side")
  }

  if (!adminClient) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
    }

    adminClient = createClient<Database>(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
