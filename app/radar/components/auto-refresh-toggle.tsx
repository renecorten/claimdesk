"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Clock, Settings } from "lucide-react"

// 🆕 Interface für die Ref-Methoden
export interface AutoRefreshToggleRef {
  refreshTimestamp: () => void
}

const AutoRefreshToggle = forwardRef<AutoRefreshToggleRef, {}>((props, ref) => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [lastDataFetch, setLastDataFetch] = useState<Date | null>(null)

  // 🆕 Expose refreshTimestamp method via ref
  useImperativeHandle(ref, () => ({
    refreshTimestamp: fetchLastDataRefresh,
  }))

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      setAutoRefreshEnabled(data.auto_refresh_enabled === true)
    } catch (error) {
      console.warn("Could not fetch settings:", error)
      setAutoRefreshEnabled(true) // Default to enabled
    }
  }

  const fetchLastDataRefresh = async () => {
    try {
      const response = await fetch("/api/last-fetch")
      const data = await response.json()

      if (response.ok && data.lastFetch) {
        setLastDataFetch(new Date(data.lastFetch))
      } else {
        setLastDataFetch(null)
      }
    } catch (error) {
      console.warn("Could not fetch last data refresh time:", error)
      setLastDataFetch(null)
    }
  }

  const updateAutoRefreshSetting = async (enabled: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_refresh_enabled: enabled }),
      })

      const result = await response.json()

      if (response.ok) {
        setAutoRefreshEnabled(enabled)
        toast({
          title: "Einstellung gespeichert",
          description: `Auto-Refresh wurde ${enabled ? "aktiviert" : "deaktiviert"}.`,
        })
      } else {
        toast({
          title: "Fehler",
          description: result.error || "Konnte Einstellung nicht speichern.",
          variant: "destructive",
        })
        // Revert the switch state on error
        setAutoRefreshEnabled(!enabled)
      }
    } catch (error) {
      toast({
        title: "Netzwerkfehler",
        description: "Konnte Einstellung nicht speichern.",
        variant: "destructive",
      })
      setAutoRefreshEnabled(!enabled)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSettings()
    fetchLastDataRefresh()

    // Refresh timestamp every 10 seconds
    const interval = setInterval(fetchLastDataRefresh, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatLastFetch = (date: Date | null) => {
    if (!date) return "Unbekannt"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return "Gerade eben"
    if (diffMinutes === 1) return "vor 1 Minute"
    if (diffMinutes < 60) return `vor ${diffMinutes} Minuten`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours === 1) return "vor 1 Stunde"
    if (diffHours < 24) return `vor ${diffHours} Stunden`

    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/60">
      {/* Auto-Refresh Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
          <Settings className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={autoRefreshEnabled}
            onCheckedChange={updateAutoRefreshSetting}
            disabled={isLoading}
            className="data-[state=checked]:bg-blue-600"
          />
          <Label className="text-sm font-medium text-slate-700 cursor-pointer">Auto-Refresh</Label>
          <Badge
            variant={autoRefreshEnabled ? "default" : "secondary"}
            className={`text-xs ${
              autoRefreshEnabled
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {autoRefreshEnabled ? "Aktiv" : "Inaktiv"}
          </Badge>
        </div>
      </div>

      {/* Last Update Info */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock className="h-4 w-4 text-slate-500" />
        <span className="font-medium">Letzte Aktualisierung:</span>
        <span className="text-slate-700 font-mono">{formatLastFetch(lastDataFetch)}</span>
      </div>
    </div>
  )
})

AutoRefreshToggle.displayName = "AutoRefreshToggle"

export default AutoRefreshToggle
