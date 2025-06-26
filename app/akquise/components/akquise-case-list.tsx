"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, MapPin, Building, MessageSquare, Clock } from "lucide-react"
import type { AcquisitionCase } from "../page"

interface AkquiseCaseListProps {
  cases: AcquisitionCase[]
}

export function AkquiseCaseList({ cases }: AkquiseCaseListProps) {
  const [selectedCase, setSelectedCase] = useState<AcquisitionCase | null>(null)
  const [note, setNote] = useState("")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "niedrig":
        return "bg-green-100 text-green-800 border-green-200"
      case "mittel":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hoch":
        return "bg-red-100 text-red-800 border-red-200"
      case "dringend":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "offen":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "kontaktiert":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "abgeschlossen":
        return "bg-green-100 text-green-800 border-green-200"
      case "abgelehnt":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nicht verfügbar"
    return new Date(dateString).toLocaleDateString("de-DE")
  }

  const handleAddNote = () => {
    // TODO: Implement note saving functionality
    console.log("Adding note:", note, "for case:", selectedCase?.id)
    setNote("")
    setSelectedCase(null)
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Akquise-Fälle vorhanden</h3>
        <p className="text-gray-600">
          Erstellen Sie Ihren ersten Akquise-Fall, indem Sie im Radar auf das Briefcase-Symbol klicken.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((acquisitionCase) => (
        <Card key={acquisitionCase.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  {acquisitionCase.company_name || "Unbekanntes Unternehmen"}
                </CardTitle>
                <p className="text-sm text-gray-600 font-mono">{acquisitionCase.case_number}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getPriorityColor(acquisitionCase.priority || "mittel")}>
                  {acquisitionCase.priority || "mittel"}
                </Badge>
                <Badge className={getStatusColor(acquisitionCase.status || "offen")}>
                  {acquisitionCase.status || "offen"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {acquisitionCase.damage_description && (
              <p className="text-sm text-gray-700 line-clamp-3">{acquisitionCase.damage_description}</p>
            )}

            <div className="space-y-2 text-sm text-gray-600">
              {acquisitionCase.damage_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schaden: {formatDate(acquisitionCase.damage_date)}</span>
                </div>
              )}

              {acquisitionCase.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{acquisitionCase.address}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Erstellt: {formatDate(acquisitionCase.created_at)}</span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedCase(acquisitionCase)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Notiz hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Notiz hinzufügen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Fall: {selectedCase?.company_name} ({selectedCase?.case_number})
                      </p>
                    </div>
                    <Textarea
                      placeholder="Ihre Notiz hier eingeben..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedCase(null)}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleAddNote} disabled={!note.trim()}>
                        Notiz speichern
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
