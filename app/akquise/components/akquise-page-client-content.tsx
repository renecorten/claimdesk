"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

interface AkquisePageClientContentProps {
  newCaseId?: string
}

export function AkquisePageClientContent({ newCaseId }: AkquisePageClientContentProps) {
  useEffect(() => {
    if (newCaseId) {
      toast({
        title: "✅ Akquise-Fall erstellt",
        description: "Der neue Fall wurde erfolgreich erstellt und ist jetzt sichtbar.",
      })
    }
  }, [newCaseId])

  return null
}
