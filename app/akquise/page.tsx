import { Target, TrendingUp, Users, Building, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AkquisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
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
                  <div className="text-2xl font-bold text-slate-900">24</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Fälle</div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">18</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Aktiv</div>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">25%</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Conversion</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="lg:hidden mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-slate-900">24</div>
              <div className="text-xs text-slate-500">Fälle</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">18</div>
              <div className="text-xs text-slate-500">Aktiv</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">6</div>
              <div className="text-xs text-slate-500">Gewonnen</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">25%</div>
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
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% seit letztem Monat</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23.5%</div>
                <p className="text-xs text-muted-foreground">+2.1% seit letztem Monat</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neue Kunden</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">+7 seit letzter Woche</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Termine heute</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 abgeschlossen</p>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Lead-Scoring
                </CardTitle>
                <CardDescription>
                  Automatische Bewertung und Priorisierung von Leads basierend auf KI-Algorithmen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Intelligente Analyse von Kundenverhalten und -eigenschaften zur optimalen Lead-Qualifizierung.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  CRM Integration
                </CardTitle>
                <CardDescription>Nahtlose Integration mit bestehenden CRM-Systemen</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Synchronisation mit Salesforce, HubSpot und anderen führenden CRM-Plattformen.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>Detaillierte Analysen und Berichte zur Akquise-Performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Umfassende Dashboards mit Echtzeit-Metriken und Trend-Analysen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
