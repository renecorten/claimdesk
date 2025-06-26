"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, MapPin, MessageSquare, Phone, User } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"

type AcquisitionCase = Database["public"]["Tables"]["acquisition_cases"]["Row"]

interface AkquiseCaseListProps {
  cases: AcquisitionCase[]
}

export function AkquiseCaseList({ cases }: AkquiseCaseListProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")

  const handleSaveNote = async (caseId: string) => {
    // TODO: Hier würde später die Server Action zum Speichern der Notiz aufgerufen
    console.log("Saving note for case:", caseId, "Note:", noteText)

    toast({
      title: "Notiz gespeichert",
      description: "Die Notiz wurde erfolgreich hinzugefügt.",
    })

    setNoteDialogOpen(null)
    setNoteText("")
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "offen":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "kontaktiert":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "kein_bedarf":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((acquisitionCase) => (
        <Card key={acquisitionCase.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {acquisitionCase.company_name || "Unbekanntes Unternehmen"}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Fall #{acquisitionCase.case_number}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={`text-xs ${getStatusColor(acquisitionCase.status)}`}>
                  {acquisitionCase.status === "offen" && "Offen"}
                  {acquisitionCase.status === "kontaktiert" && "Kontaktiert"}
                  {acquisitionCase.status === "kein_bedarf" && "Kein Bedarf"}
                </Badge>
                {acquisitionCase.priority && (
                  <Badge className={`text-xs ${getPriorityColor(acquisitionCase.priority)}`}>
                    {acquisitionCase.priority === "urgent" && "Dringend"}
                    {acquisitionCase.priority === "high" && "Hoch"}
                    {acquisitionCase.priority === "medium" && "Mittel"}
                    {acquisitionCase.priority === "low" && "Niedrig"}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Schadensbeschreibung */}
            {acquisitionCase.damage_description && (
              <p className="text-sm text-gray-700 line-clamp-3">{acquisitionCase.damage_description}</p>
            )}

            {/* Meta-Informationen */}
            <div className="space-y-2 text-sm text-gray-600">
              {acquisitionCase.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{acquisitionCase.address}</span>
                </div>
              )}
              {acquisitionCase.contact_person && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{acquisitionCase.contact_person}</span>
                </div>
              )}
              {acquisitionCase.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{acquisitionCase.phone}</span>
                </div>
              )}
              {acquisitionCase.damage_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schaden: {formatDate(acquisitionCase.damage_date)}</span>
                </div>
              )}
            </div>

            {/* Aktionen */}
            <div className="flex gap-2 pt-2">
              <Dialog
                open={noteDialogOpen === acquisitionCase.id}
                onOpenChange={(open) => setNoteDialogOpen(open ? acquisitionCase.id : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
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
                      <Label htmlFor="note">Notiz</Label>
                      <Textarea
                        id="note"
                        placeholder="Ihre Notiz zu diesem Fall..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNoteDialogOpen(null)
                          setNoteText("")
                        }}
                      >
                        Abbrechen
                      </Button>
                      <Button onClick={() => handleSaveNote(acquisitionCase.id)}>Speichern</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Erstellt am */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              Erstellt: {formatDate(acquisitionCase.created_at)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
