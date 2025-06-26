import { createClient } from "@supabase/supabase-js"
import { supabaseUrl, supabaseServiceRoleKey } from "./config"
import type { Database } from "@/lib/database.types"

// Für administrative Operationen (nur serverseitig verwenden!)
// Dieser Client umgeht Row Level Security und hat vollen Zugriff
export function createAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }

  return createClient<Database>(supabaseUrl!, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
