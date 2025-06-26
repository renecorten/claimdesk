import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server-admin"

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("app_settings")
      .select("setting_key, setting_value")
      .eq("setting_key", "auto_refresh_enabled")
      .single()

    if (error) {
      // If table doesn't exist, return default value
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        console.log("Settings table doesn't exist yet, returning default value")
        return NextResponse.json({
          auto_refresh_enabled: true, // Default to enabled
        })
      }

      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({
      auto_refresh_enabled: data?.setting_value === true,
    })
  } catch (error) {
    console.error("Settings API Error:", error)
    // Return default value on any error
    return NextResponse.json({
      auto_refresh_enabled: true, // Default to enabled
    })
  }
}

export async function POST(request: Request) {
  try {
    const { auto_refresh_enabled } = await request.json()

    if (typeof auto_refresh_enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid setting value" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 🔒 Erweiterte Sicherheit: IP und User-Agent für Audit
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Hole aktuellen Wert für Audit
    const { data: currentSetting } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "auto_refresh_enabled")
      .single()

    // Try to upsert the setting directly
    const { error } = await supabase.from("app_settings").upsert(
      {
        setting_key: "auto_refresh_enabled",
        setting_value: auto_refresh_enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "setting_key",
        ignoreDuplicates: false,
      },
    )

    if (error) {
      // If table doesn't exist, return helpful error message
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        return NextResponse.json(
          {
            error: "Settings table doesn't exist. Please run the SQL script first.",
            instruction: "Execute the create-settings-table.sql script in your Supabase dashboard",
            sqlScript: `
-- Run this SQL script in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

INSERT INTO app_settings (setting_key, setting_value) 
VALUES ('auto_refresh_enabled', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 🔒 Aktiviere RLS für bessere Sicherheit
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for service role" ON app_settings
FOR ALL TO service_role USING (true) WITH CHECK (true);
            `.trim(),
          },
          { status: 400 },
        )
      }

      console.error("Error updating settings:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    // 📊 Audit-Log erstellen (optional, nur wenn Audit-Tabelle existiert)
    try {
      await supabase.from("app_settings_audit").insert({
        setting_key: "auto_refresh_enabled",
        old_value: currentSetting?.setting_value || null,
        new_value: auto_refresh_enabled,
        changed_by: "dashboard_api",
        ip_address: clientIP,
        user_agent: userAgent,
      })
    } catch (auditError) {
      // Audit-Fehler sind nicht kritisch
      console.warn("Could not create audit log:", auditError)
    }

    return NextResponse.json({
      success: true,
      auto_refresh_enabled,
    })
  } catch (error) {
    console.error("Settings API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
