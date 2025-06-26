"use client"

import React, { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { hideNewsItemAction, createAcquisitionCaseAction } from "@/app/actions"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"
import {
  ExternalLink,
  EyeOff,
  Clock,
  MapPin,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type NewsItem = Database["public"]["Tables"]["news_cache"]["Row"]

interface NewsItemTableProps {
  items: NewsItem[]
  onHide?: () => void
  onAiGenerated?: () => void
}

// Erweiterte Funktion zum Dekodieren von HTML-Entitäten und Entfernen von HTML-Tags
const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  const decoded = textarea.value
  return decoded.replace(/<[^>]*>/g, "")
}

// 🚦 Ampel-System Badge-Farben (ohne Icons)
const getSeverityBadgeColor = (severity: string | null) => {
  const colorConfig = {
    routine: "bg-green-200 text-green-900 border-green-300",
    attention: "bg-yellow-200 text-yellow-900 border-yellow-300",
    urgent: "bg-red-200 text-red-900 border-red-300",
  }

  return colorConfig[severity as keyof typeof colorConfig] || "bg-gray-200 text-gray-900 border-gray-300"
}

// Komponente für den "Fall erstellen"-Dialog
function CreateCaseDialog({ item, children }: { item: NewsItem; children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createAcquisitionCaseAction(formData)
      if (result?.message) {
        if (result.success === false) {
          toast({ title: "Fehler", description: result.message, variant: "destructive" })
        }
        // Bei Erfolg wird automatisch zur Akquise-Seite weitergeleitet
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Akquise-Fall erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Akquise-Fall aus dieser Radar-Meldung.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              <span className="font-semibold">Meldung:</span> {item.ai_title || item.title}
            </p>
            <input type="hidden" name="newsItemId" value={item.id} />
            <div>
              <Label htmlFor="priority">Priorität</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Priorität auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fall erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function NewsItemTable({ items, onHide, onAiGenerated }: NewsItemTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [hidingItems, setHidingItems] = useState<Set<string>>(new Set())
  const [generatingItems, setGeneratingItems] = useState<Set<string>>(new Set())
  const [showOriginalContent, setShowOriginalContent] = useState<Set<string>>(new Set())

  const toggleContentMode = (id: string) => {
    const newSet = new Set(showOriginalContent)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setShowOriginalContent(newSet)
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleHide = async (id: string) => {
    setHidingItems((prev) => new Set(prev).add(id))
    const result = await hideNewsItemAction(id)
    if (result.success) {
      toast({
        title: "Erfolg",
        description: result.message || "Eintrag ausgeblendet.",
      })
      if (onHide) {
        onHide()
      }
    } else {
      toast({
        title: "Fehler",
        description: result.message || "Konnte Eintrag nicht ausblenden.",
        variant: "destructive",
      })
    }
    setHidingItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const generateAISummary = async (id: string) => {
    setGeneratingItems((prev) => new Set(prev).add(id))
    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: id }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "KI-Zusammenfassung erstellt",
          description: "Die Zusammenfassung wurde erfolgreich generiert.",
        })

        if (onAiGenerated) {
          onAiGenerated()
        }
      } else {
        toast({
          title: "Fehler",
          description: result.error || "Konnte Zusammenfassung nicht erstellen.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Erstellen der Zusammenfassung.",
        variant: "destructive",
      })
    }
    setGeneratingItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unbekannt"
    try {
      return new Date(dateString).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Ungültiges Datum"
    }
  }

  const formatDateMobile = (dateString: string | null) => {
    if (!dateString) return "Unbekannt"
    try {
      return new Date(dateString).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Ungültig"
    }
  }

  // 🚦 Ampel-System Konfiguration (ohne Icons)
  const getSeverityConfig = (severity: string | null) => {
    const severityConfig = {
      routine: {
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "🟢 Routine",
        shortLabel: "🟢",
      },
      attention: {
        textColor: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        label: "🟡 Beachten",
        shortLabel: "🟡",
      },
      urgent: {
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: "🔴 Handeln",
        shortLabel: "🔴",
      },
    }

    return (
      severityConfig[severity as keyof typeof severityConfig] || {
        textColor: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        label: "❓ Unbekannt",
        shortLabel: "❓",
      }
    )
  }

  const getDamageCategoryConfig = (category: string | null) => {
    const categoryConfig = {
      private: {
        color: "bg-blue-200 text-blue-900 border-blue-300",
        icon: "🏠",
        label: "Privat",
        shortLabel: "Priv",
      },
      commercial: {
        color: "bg-purple-200 text-purple-900 border-purple-300",
        icon: "🏢",
        label: "Gewerbe",
        shortLabel: "Gew",
      },
      industrial: {
        color: "bg-orange-200 text-orange-900 border-orange-300",
        icon: "🏭",
        label: "Industrie",
        shortLabel: "Ind",
      },
      infrastructure: {
        color: "bg-green-200 text-green-900 border-green-300",
        icon: "🏗️",
        label: "Infrastruktur",
        shortLabel: "Infra",
      },
    }

    return (
      categoryConfig[category as keyof typeof categoryConfig] || {
        color: "bg-slate-200 text-slate-900 border-slate-300",
        icon: "❓",
        label: "Unbekannt",
        shortLabel: "?",
      }
    )
  }

  // Mobile Card Component - Komplett neu designt
  const MobileNewsCard = ({ item }: { item: NewsItem }) => {
    const isExpanded = expandedRows.has(item.id)
    const severityConfig = getSeverityConfig(item.ai_severity)
    const categoryConfig = getDamageCategoryConfig(item.ai_damage_category)

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 transition-all duration-200 hover:shadow-md">
        {/* Header mit Titel und Meta-Info */}
        <div className="p-4 pb-3">
          {/* Titel */}
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-3 line-clamp-2">
            {showOriginalContent.has(item.id)
              ? item.title
                ? decodeHtmlEntities(item.title)
                : "Ohne Titel"
              : item.ai_title || (item.title ? decodeHtmlEntities(item.title) : "Ohne Titel")}
          </h3>

          {/* Meta-Badges in einer Zeile */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Severity Badge */}
            {item.ai_severity && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeColor(item.ai_severity)}`}
              >
                {severityConfig.shortLabel}
              </span>
            )}

            {/* Damage Category Badge - nur wenn KI-Analyse vorhanden */}
            {item.ai_damage_category && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.color}`}
              >
                {categoryConfig.icon} {categoryConfig.shortLabel}
              </span>
            )}

            {/* Feed Type */}
            {item.feed_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {item.feed_type}
              </span>
            )}
          </div>

          {/* Zeit und Ort */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDateMobile(item.published_at)}</span>
            </div>
            {(item.ai_location || item.location) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-24">
                  {item.ai_location || item.location}
                  {item.ai_location && item.ai_location_confidence && (
                    <span
                      className={`ml-1 inline-block w-2 h-2 rounded-full ${
                        item.ai_location_confidence === "high"
                          ? "bg-green-500"
                          : item.ai_location_confidence === "medium"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      title={`KI-Genauigkeit: ${item.ai_location_confidence}`}
                    />
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Preview Text - nur wenn nicht ausgeklappt */}
          {!isExpanded && (
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-3">
              {showOriginalContent.has(item.id)
                ? item.summary
                  ? decodeHtmlEntities(item.summary)
                  : item.content
                    ? decodeHtmlEntities(item.content)
                    : "Keine Zusammenfassung verfügbar."
                : item.ai_summary ||
                  (item.summary
                    ? decodeHtmlEntities(item.summary)
                    : item.content
                      ? decodeHtmlEntities(item.content)
                      : "Keine Zusammenfassung verfügbar.")}
            </p>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Content Toggle */}
            <div className="flex items-center gap-2">
              {(item.ai_title || item.ai_summary) && (
                <button
                  onClick={() => toggleContentMode(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {showOriginalContent.has(item.id) ? (
                    <>
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>KI</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>Original</span>
                    </>
                  )}
                </button>
              )}

              {/* KI-Analyse Button wenn noch nicht analysiert */}
              {!item.ai_damage_category && !generatingItems.has(item.id) && (
                <button
                  onClick={() => generateAISummary(item.id)}
                  className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Analysieren
                </button>
              )}

              {/* Loading State */}
              {generatingItems.has(item.id) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                  Analysiere...
                </span>
              )}
            </div>

            {/* Expand/Actions */}
            <div className="flex items-center gap-2">
              <CreateCaseDialog item={item}>
                <button
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Fall erstellen"
                >
                  <Briefcase className="h-4 w-4" />
                </button>
              </CreateCaseDialog>

              {item.original_link && (
                <button
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => window.open(item.original_link!, "_blank")}
                  title="Artikel öffnen"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => handleHide(item.id)}
                disabled={hidingItems.has(item.id)}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Ausblenden"
              >
                <EyeOff className="h-4 w-4" />
              </button>

              <button
                onClick={() => toggleRow(item.id)}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                title={isExpanded ? "Zuklappen" : "Aufklappen"}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-200 bg-white">
            {/* Content Mode Indicator */}
            {(item.ai_title || item.ai_summary) && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-gray-50">
                {showOriginalContent.has(item.id) ? (
                  <>
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Original RSS-Content</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">KI-optimierter Content</span>
                  </>
                )}
              </div>
            )}

            {/* Full Content */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-gray-900">
                  {showOriginalContent.has(item.id) ? "Volltext:" : "Optimierter Inhalt:"}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {showOriginalContent.has(item.id)
                    ? item.summary
                      ? decodeHtmlEntities(item.summary)
                      : item.content
                        ? decodeHtmlEntities(item.content)
                        : "Keine Zusammenfassung verfügbar."
                    : item.ai_summary ||
                      (item.summary
                        ? decodeHtmlEntities(item.summary)
                        : item.content
                          ? decodeHtmlEntities(item.content)
                          : "Keine Zusammenfassung verfügbar.")}
                </p>
              </div>

              {/* AI Key Points */}
              {item.ai_summary &&
                !showOriginalContent.has(item.id) &&
                item.ai_key_points &&
                item.ai_key_points.length > 0 && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <h5 className="text-sm font-semibold mb-2 text-blue-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Wichtige Punkte:
                    </h5>
                    <ul className="space-y-2">
                      {item.ai_key_points.slice(0, 3).map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                          <span className="text-blue-800">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Additional Meta Info */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(item.published_at)}</span>
                  </div>
                  {(item.ai_location || item.location) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.ai_location || item.location}</span>
                    </div>
                  )}
                  {item.feed_type && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Feed:</span>
                      <span>{item.feed_type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="block md:hidden space-y-4">
        {items.map((item) => (
          <MobileNewsCard key={item.id} item={item} />
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8 min-w-8"></TableHead>
                <TableHead className="min-w-[300px] lg:min-w-[400px]">Titel</TableHead>
                <TableHead className="w-24 lg:w-32">Datum</TableHead>
                <TableHead className="w-20 lg:w-24">Ort</TableHead>
                <TableHead className="w-32 lg:w-36">Schadenstyp</TableHead>
                <TableHead className="w-32 lg:w-36">Priorität</TableHead>
                <TableHead className="w-32">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleRow(item.id)}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(item.id)}
                        className="h-6 w-6 p-0 touch-manipulation"
                        title={expandedRows.has(item.id) ? "Zuklappen" : "Aufklappen"}
                      >
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm leading-tight line-clamp-2">
                          {showOriginalContent.has(item.id)
                            ? item.title
                              ? decodeHtmlEntities(item.title)
                              : "Ohne Titel"
                            : item.ai_title || (item.title ? decodeHtmlEntities(item.title) : "Ohne Titel")}
                        </div>

                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {showOriginalContent.has(item.id)
                            ? // Original Content
                              item.summary
                              ? decodeHtmlEntities(item.summary).substring(0, 100) + "..."
                              : item.content
                                ? decodeHtmlEntities(item.content).substring(0, 100) + "..."
                                : "Keine Zusammenfassung verfügbar"
                            : // KI Content bevorzugt
                              item.ai_summary?.substring(0, 100) + "..." ||
                              (item.summary
                                ? decodeHtmlEntities(item.summary).substring(0, 100) + "..."
                                : item.content
                                  ? decodeHtmlEntities(item.content).substring(0, 100) + "..."
                                  : "Keine Zusammenfassung verfügbar")}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-muted-foreground">{formatDate(item.published_at)}</div>
                    </TableCell>

                    <TableCell>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={item.ai_location || item.location || "Unbekannt"}
                      >
                        {item.ai_location || item.location || "-"}
                        {/* Genauigkeits-Indikator für KI-Orte */}
                        {item.ai_location && item.ai_location_confidence && (
                          <span
                            className={`ml-1 inline-block w-1.5 h-1.5 rounded-full ${
                              item.ai_location_confidence === "high"
                                ? "bg-green-500"
                                : item.ai_location_confidence === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            title={`KI-Genauigkeit: ${item.ai_location_confidence}`}
                          />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {item.ai_damage_category ? (
                        <Badge
                          className={`text-xs cursor-default pointer-events-none ${getDamageCategoryConfig(item.ai_damage_category).color}`}
                        >
                          <span className="mr-1">{getDamageCategoryConfig(item.ai_damage_category).icon}</span>
                          {getDamageCategoryConfig(item.ai_damage_category).label}
                        </Badge>
                      ) : generatingItems.has(item.id) ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-4 w-4 animate-pulse text-blue-500" />
                          <span>Analysiere...</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            generateAISummary(item.id)
                          }}
                          className="h-6 text-xs px-2 touch-manipulation"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Analysieren
                        </Button>
                      )}
                    </TableCell>

                    <TableCell>
                      {item.ai_severity ? (
                        <Badge
                          className={`text-xs cursor-default pointer-events-none ${getSeverityBadgeColor(item.ai_severity)}`}
                        >
                          {getSeverityConfig(item.ai_severity).label}
                        </Badge>
                      ) : item.ai_summary ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreateCaseDialog item={item}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 touch-manipulation"
                            title="Fall erstellen"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Briefcase className="h-4 w-4" />
                          </Button>
                        </CreateCaseDialog>

                        {(item.ai_title || item.ai_summary) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleContentMode(item.id)
                            }}
                            className="h-6 w-6 p-0 touch-manipulation"
                            title={
                              showOriginalContent.has(item.id) ? "KI-Content anzeigen" : "Original-Content anzeigen"
                            }
                          >
                            {showOriginalContent.has(item.id) ? (
                              <Sparkles className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {item.original_link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 touch-manipulation"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={item.original_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Artikel öffnen"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHide(item.id)
                          }}
                          disabled={hidingItems.has(item.id)}
                          className="h-6 w-6 p-0 touch-manipulation"
                          title="Ausblenden"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Content for Desktop */}
                  {expandedRows.has(item.id) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-6 shadow-inner"
                      >
                        <div className="space-y-4 bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                          {/* Content Toggle für Desktop */}
                          {(item.ai_title || item.ai_summary) && (
                            <div className="flex items-center justify-between pb-3 border-b mb-3">
                              <div className="flex items-center gap-2">
                                {showOriginalContent.has(item.id) ? (
                                  <>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Original RSS-Content</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-blue-600 font-medium">KI-optimierter Content</span>
                                  </>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleContentMode(item.id)}
                                className="h-7 text-xs px-3"
                              >
                                {showOriginalContent.has(item.id) ? "KI anzeigen" : "Original anzeigen"}
                              </Button>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-gray-900">
                              {showOriginalContent.has(item.id) ? "Original-Volltext:" : "Optimierter Inhalt:"}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {showOriginalContent.has(item.id)
                                ? // Original Content
                                  item.summary
                                  ? decodeHtmlEntities(item.summary)
                                  : item.content
                                    ? decodeHtmlEntities(item.content)
                                    : "Keine Zusammenfassung verfügbar."
                                : // KI Content bevorzugt
                                  item.ai_summary ||
                                  (item.summary
                                    ? decodeHtmlEntities(item.summary)
                                    : item.content
                                      ? decodeHtmlEntities(item.content)
                                      : "Keine Zusammenfassung verfügbar.")}
                            </p>
                          </div>

                          {/* KI-Analyse Details (nur wenn nicht im Original-Modus) */}
                          {!showOriginalContent.has(item.id) && item.ai_summary && (
                            <div className="border-t pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                <h4 className="text-sm font-medium text-blue-700">KI-Analyse Details:</h4>
                              </div>

                              {item.ai_key_points && item.ai_key_points.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Wichtige Punkte:</h5>
                                  <ul className="space-y-1">
                                    {item.ai_key_points.slice(0, 3).map((point, index) => (
                                      <li key={index} className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="border-t pt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {(item.ai_location || item.location) && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{item.ai_location || item.location}</span>
                                {/* Genauigkeits-Indikator für KI-Orte */}
                                {item.ai_location && item.ai_location_confidence && (
                                  <span
                                    className={`ml-1 inline-block w-1.5 h-1.5 rounded-full ${
                                      item.ai_location_confidence === "high"
                                        ? "bg-green-500"
                                        : item.ai_location_confidence === "medium"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                    title={`KI-Genauigkeit: ${item.ai_location_confidence}`}
                                  />
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(item.published_at)}</span>
                            </div>
                            {item.feed_type && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Feed:</span>
                                <span>{item.feed_type}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
