import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AkquiseCaseList } from "./components/akquise-case-list"
import { AkquisePageClientContent } from "./components/akquise-page-client-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, TrendingUp, Clock, CheckCircle, Users, Briefcase } from "lucide-react"
import type { Database } from "@/lib/database.types"

export type AcquisitionCase = Database["public"]["Tables"]["acquisition_cases"]["Row"]

interface AkquisePageProps {
  searchParams: Promise<{ newCaseId?: string }>
}

export default async function AkquisePage({ searchParams }: AkquisePageProps) {
  try {
    const { newCaseId } = await searchParams
    const supabase = await createSupabaseServerClient()

    // Akquise-Fälle laden
    const { data: cases, error } = await supabase
      .from("acquisition_cases")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading acquisition cases:", error)
    }

    const acquisitionCases = cases || []

    // Statistiken berechnen
    const stats = {
      total: acquisitionCases.length,
      offen: acquisitionCases.filter((c) => c.status === "offen").length,
      kontaktiert: acquisitionCases.filter((c) => c.status === "kontaktiert").length,
      abgeschlossen: acquisitionCases.filter((c) => c.status === "abgeschlossen").length,
      hochPriorität: acquisitionCases.filter((c) => c.priority === "hoch").length,
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
        {/* Header */}
        <div className="bg-white border-b border-slate-200/60 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Brand & Title */}
              <div className="flex items-center gap-4 lg:ml-0 ml-16">
                <div className="relative">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-medium text-slate-500">ClaimDesk</h1>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Akquise
                    </h1>
                  </div>
                  <p className="text-sm text-slate-600">Verwaltung von Akquisitionsfällen und Kundenbeziehungen</p>
                </div>
              </div>

              {/* Dashboard Stats - Desktop */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Gesamt</div>
                  </div>

                  <div className="h-8 w-px bg-slate-200"></div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.offen}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Offen</div>
                  </div>

                  <div className="h-8 w-px bg-slate-200"></div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.abgeschlossen}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Abgeschlossen</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Stats */}
            <div className="lg:hidden mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-900">{stats.total}</div>
                <div className="text-xs text-slate-500">Gesamt</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{stats.offen}</div>
                <div className="text-xs text-slate-500">Offen</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{stats.abgeschlossen}</div>
                <div className="text-xs text-slate-500">Abgeschlossen</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{stats.hochPriorität}</div>
                <div className="text-xs text-slate-500">Hoch Priorität</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {acquisitionCases.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/60 shadow-sm max-w-md mx-auto">
                <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Noch keine Akquise-Fälle</h3>
                <p className="text-slate-600 text-sm">
                  Erstellen Sie Ihren ersten Akquise-Fall, indem Sie im Radar auf das Briefcase-Symbol klicken.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistik-Karten */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Offene Fälle</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.offen}</div>
                    <p className="text-xs text-slate-600">Benötigen Aufmerksamkeit</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Kontaktiert</CardTitle>
                    <Users className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.kontaktiert}</div>
                    <p className="text-xs text-slate-600">In Bearbeitung</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.abgeschlossen}</div>
                    <p className="text-xs text-slate-600">Erfolgreich beendet</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hohe Priorität</CardTitle>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.hochPriorität}</div>
                    <p className="text-xs text-slate-600">Dringend zu bearbeiten</p>
                  </CardContent>
                </Card>
              </div>

              {/* Akquise-Fälle Liste */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Akquise-Fälle</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Übersicht aller {acquisitionCases.length} Akquisitionsfälle
                    </p>
                  </div>
                </div>

                <AkquiseCaseList cases={acquisitionCases} />
              </div>
            </div>
          )}
        </main>

        {/* Client-seitige Komponente für Toast-Nachrichten */}
        <AkquisePageClientContent newCaseId={newCaseId} />
      </div>
    )
  } catch (error) {
    console.error("Error in AkquisePage:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-slate-200/60 shadow-sm max-w-md mx-auto text-center">
          <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Fehler beim Laden</h3>
          <p className="text-slate-600 text-sm">
            Die Akquise-Seite konnte nicht geladen werden. Bitte versuchen Sie es später erneut.
          </p>
        </div>
      </div>
    )
  }
}
