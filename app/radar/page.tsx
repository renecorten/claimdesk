"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import FilterBar, { type Filters } from "./components/filter-bar"
import NewsItemTable from "./components/news-item-table"
import Pagination from "./components/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"
import { X, Radar, Activity, TrendingUp, AlertTriangle } from "lucide-react"

type NewsItem = Database["public"]["Tables"]["news_cache"]["Row"]

export default function RadarPage() {
  const supabase = createClient()
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [filters, setFilters] = useState<Filters>({
    searchTerm: "",
    feedType: "all",
    location: "all",
    timeRange: "all",
    severity: "all",
    damageCategory: "all",
  })

  const autoRefreshRef = useRef<{ refreshTimestamp: () => void } | null>(null)

  const fetchNews = async () => {
    setIsLoading(true)
    const { data: deletedNewsData, error: deletedError } = await supabase.from("deleted_news").select("id")

    if (deletedError) {
      toast({ title: "Fehler", description: "Konnte ausgeblendete Nachrichten nicht laden.", variant: "destructive" })
    }
    const deletedIds = new Set(deletedNewsData?.map((d) => d.id) || [])

    const { data, error } = await supabase.from("news_cache").select("*").order("published_at", { ascending: false })

    if (error) {
      toast({ title: "Fehler", description: "Nachrichten konnten nicht geladen werden.", variant: "destructive" })
      setNewsItems([])
    } else {
      const visibleItems = data.filter((item) => !deletedIds.has(item.id))
      setNewsItems(visibleItems || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/news?forceRefresh=true")
      const result = await response.json()
      if (response.ok) {
        const aiInfo = result.aiProcessedCount > 0 ? `, ${result.aiProcessedCount} KI-analysiert` : ""
        toast({
          title: "Erfolg",
          description: `Feeds aktualisiert. ${result.newItemsCount || 0} neue, ${result.updatedItemsCount || 0} aktualisierte Einträge${aiInfo}.`,
        })

        if (autoRefreshRef.current?.refreshTimestamp) {
          setTimeout(() => {
            autoRefreshRef.current?.refreshTimestamp()
          }, 500)
        }
      } else {
        toast({
          title: "Fehler bei Aktualisierung",
          description: result.message || "Unbekannter Fehler",
          variant: "destructive",
        })
        if (result.errors) console.error("API Errors:", result.errors)
      }
    } catch (e) {
      toast({ title: "Netzwerkfehler", description: "Konnte Feeds nicht aktualisieren.", variant: "destructive" })
    }
    await fetchNews()
    setIsRefreshing(false)
  }

  const removeFilter = (filterType: keyof Filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: filterType === "searchTerm" ? "" : "all",
    }))
    setCurrentPage(1)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const availableLocations = useMemo(() => {
    const locations = new Set<string>()
    newsItems.forEach((item) => {
      const location = item.ai_location || item.location
      if (location) {
        locations.add(location)
      }
    })
    return Array.from(locations).sort()
  }, [newsItems])

  const availableDamageCategories = useMemo(() => {
    const categories = new Set(newsItems.map((item) => item.ai_damage_category).filter(Boolean) as string[])
    return Array.from(categories).sort()
  }, [newsItems])

  const filteredNewsItems = useMemo(() => {
    let items = newsItems

    if (filters.timeRange !== "all" && items.length > 0) {
      const now = new Date()
      const startDate = new Date()
      if (filters.timeRange === "7days") {
        startDate.setDate(now.getDate() - 7)
      } else if (filters.timeRange === "30days") {
        startDate.setDate(now.getDate() - 30)
      }
      items = items.filter((item) => {
        if (!item.published_at) return false
        try {
          return new Date(item.published_at) >= startDate
        } catch (e) {
          return false
        }
      })
    }

    if (filters.feedType !== "all") {
      items = items.filter((item) => item.feed_type === filters.feedType)
    }

    if (filters.location !== "all") {
      items = items.filter((item) => item.ai_location === filters.location || item.location === filters.location)
    }

    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase()
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchTermLower) ||
          item.summary?.toLowerCase().includes(searchTermLower) ||
          item.content?.toLowerCase().includes(searchTermLower),
      )
    }

    if (filters.severity !== "all") {
      items = items.filter((item) => item.ai_severity === filters.severity)
    }

    if (filters.damageCategory !== "all") {
      items = items.filter((item) => item.ai_damage_category === filters.damageCategory)
    }

    return items
  }, [newsItems, filters])

  const totalPages = Math.ceil(filteredNewsItems.length / itemsPerPage)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredNewsItems.slice(startIndex, endIndex)
  }, [filteredNewsItems, currentPage, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const dashboardStats = useMemo(() => {
    const total = newsItems.length
    const urgent = newsItems.filter((item) => item.ai_severity === "urgent").length
    const attention = newsItems.filter((item) => item.ai_severity === "attention").length
    const routine = newsItems.filter((item) => item.ai_severity === "routine").length
    const commercial = newsItems.filter((item) => item.ai_damage_category === "commercial").length
    const private_items = newsItems.filter((item) => item.ai_damage_category === "private").length
    const aiAnalyzed = newsItems.filter((item) => item.ai_summary).length

    return {
      total,
      urgent,
      attention,
      routine,
      commercial,
      private: private_items,
      aiAnalyzed,
      aiPercentage: total > 0 ? Math.round((aiAnalyzed / total) * 100) : 0,
    }
  }, [newsItems])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Brand & Title */}
            <div className="flex items-center gap-4 lg:ml-0 ml-16">
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Radar className="h-6 w-6 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-medium text-slate-500">ClaimDesk</h1>
                  <div className="h-6 w-px bg-slate-200"></div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Radar
                  </h1>
                </div>
                <p className="text-sm text-slate-600">Intelligente Überwachung sicherheitsrelevanter Ereignisse</p>
              </div>
            </div>

            {/* Dashboard Stats - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{dashboardStats.total}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Meldungen</div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.aiAnalyzed}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">KI-Analysiert</div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-slate-700">{dashboardStats.urgent}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-slate-700">{dashboardStats.attention}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-slate-700">{dashboardStats.routine}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="lg:hidden mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-900">{dashboardStats.total}</div>
              <div className="text-xs text-slate-500">Meldungen</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{dashboardStats.aiAnalyzed}</div>
              <div className="text-xs text-slate-500">KI-Analysiert</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-600">{dashboardStats.urgent}</div>
              <div className="text-xs text-slate-500">🔴 Handeln</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-600">{dashboardStats.attention}</div>
              <div className="text-xs text-slate-500">🟡 Beachten</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        availableLocations={availableLocations}
        availableDamageCategories={availableDamageCategories}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        autoRefreshRef={autoRefreshRef}
      />

      {/* Statistik-Anzeige */}
      {!isLoading && (
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <span className="font-medium text-center sm:text-left flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                {filteredNewsItems.length} {filteredNewsItems.length === 1 ? "Meldung" : "Meldungen"}
                {filteredNewsItems.length !== newsItems.length && (
                  <span className="text-muted-foreground ml-1">(von {newsItems.length} gesamt)</span>
                )}
              </span>

              {/* Filter Badges */}
              <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                {filters.searchTerm && (
                  <button
                    onClick={() => removeFilter("searchTerm")}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs hover:bg-blue-200 transition-colors cursor-pointer group"
                    title="Suchfilter entfernen"
                  >
                    <span className="truncate max-w-20 sm:max-w-none">Suche: "{filters.searchTerm}"</span>
                    <X className="ml-1 h-3 w-3 group-hover:text-blue-900 flex-shrink-0" />
                  </button>
                )}
                {filters.feedType !== "all" && (
                  <button
                    onClick={() => removeFilter("feedType")}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs hover:bg-green-200 transition-colors cursor-pointer group"
                    title="Feed-Typ Filter entfernen"
                  >
                    <span>Typ: {filters.feedType}</span>
                    <X className="ml-1 h-3 w-3 group-hover:text-green-900" />
                  </button>
                )}
                {filters.location !== "all" && (
                  <button
                    onClick={() => removeFilter("location")}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs hover:bg-purple-200 transition-colors cursor-pointer group"
                    title="Orts-Filter entfernen"
                  >
                    <span className="truncate max-w-16 sm:max-w-none">Ort: {filters.location}</span>
                    <X className="ml-1 h-3 w-3 group-hover:text-purple-900 flex-shrink-0" />
                  </button>
                )}
                {filters.timeRange !== "all" && (
                  <button
                    onClick={() => removeFilter("timeRange")}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs hover:bg-red-200 transition-colors cursor-pointer group"
                    title="Zeitraum-Filter entfernen"
                  >
                    <span>{filters.timeRange === "7days" ? "7 Tage" : "30 Tage"}</span>
                    <X className="ml-1 h-3 w-3 group-hover:text-red-900" />
                  </button>
                )}
                {filters.severity !== "all" && (
                  <button
                    onClick={() => removeFilter("severity")}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs hover:bg-indigo-200 transition-colors cursor-pointer group"
                    title="Schweregrad-Filter entfernen"
                  >
                    <span>Schweregrad: {filters.severity}</span>
                    <X className="ml-1 h-3 w-3 group-hover:text-indigo-900" />
                  </button>
                )}
                {filters.damageCategory !== "all" && (
                  <button
                    onClick={() => removeFilter("damageCategory")}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-teal-100 text-teal-800 text-xs hover:bg-teal-200 transition-colors cursor-pointer group"
                    title="Schadentyp-Filter entfernen"
                  >
                    <span>
                      {filters.damageCategory === "private"
                        ? "🏠 Privat"
                        : filters.damageCategory === "commercial"
                          ? "🏢 Gewerbe"
                          : filters.damageCategory === "industrial"
                            ? "🏭 Industrie"
                            : filters.damageCategory === "infrastructure"
                              ? "🏗️ Infrastruktur"
                              : `Schadentyp: ${filters.damageCategory}`}
                    </span>
                    <X className="ml-1 h-3 w-3 group-hover:text-teal-900" />
                  </button>
                )}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground text-center sm:text-right flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Seite {currentPage} von {totalPages}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="p-2 sm:p-4 lg:p-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-white/60 backdrop-blur-sm">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : filteredNewsItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/60 shadow-sm">
              <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-base sm:text-lg">
                Keine Meldungen gefunden, die den Kriterien entsprechen.
              </p>
              <p className="text-slate-500 text-sm mt-2">Versuchen Sie, die Filter anzupassen oder zu entfernen.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <NewsItemTable items={paginatedItems} onHide={fetchNews} onAiGenerated={fetchNews} />
          </div>
        )}
      </main>

      {/* Paginierung */}
      {!isLoading && filteredNewsItems.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredNewsItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  )
}
