import { Target, TrendingUp, Users, Building, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AkquiseCaseList } from "./components/akquise-case-list"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"
import { AkquisePageClientContent } from "./components/akquise-page-client-content"

export type AcquisitionCase = Database["public"]["Tables"]["acquisition_cases"]["Row"]

async function getAcquisitionCases(): Promise<AcquisitionCase[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.from("acquisition_cases").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching acquisition cases:", error)
    return []
  }
  return data || []
}

export default async function AkquisePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const acquisitionCases = await getAcquisitionCases()
  const newCaseId = searchParams?.newCase as string | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
      <AkquisePageClientContent newCaseId={newCaseId} />
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Brand & Title */}
            <div className="flex items-center gap-4 lg:ml-0 ml-16">
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
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
                <p className="text-sm text-slate-600">Intelligente Kundengewinnung und Lead-Management</p>
              </div>
            </div>

            {/* Dashboard Stats - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{acquisitionCases.length}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Fälle</div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {acquisitionCases.filter((c) => c.status === "kontaktiert" || c.status === "offen").length}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Aktiv</div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">N/A</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Conversion</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="lg:hidden mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-900">{acquisitionCases.length}</div>
              <div className="text-xs text-slate-500">Fälle</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                {acquisitionCases.filter((c) => c.status === "kontaktiert" || c.status === "offen").length}
              </div>
              <div className="text-xs text-slate-500">Aktiv</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">N/A</div>
              <div className="text-xs text-slate-500">Gewonnen</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">N/A</div>
              <div className="text-xs text-slate-500">Rate</div>
            </div>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {acquisitionCases.filter((c) => c.status === "kontaktiert" || c.status === "offen").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">N/A</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neue Kunden</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">N/A</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Termine heute</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">N/A</div>
              </CardContent>
            </Card>
          </div>

          {/* Akquise Cases List */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Aktuelle Akquise-Fälle</h2>
            {acquisitionCases.length > 0 ? (
              <AkquiseCaseList cases={acquisitionCases} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    Noch keine Akquise-Fälle vorhanden. Erstellen Sie einen neuen Fall aus dem Radar!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
