"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle } from "lucide-react"

interface AkquisePageClientContentProps {
  newCaseId?: string
}

export function AkquisePageClientContent({ newCaseId }: AkquisePageClientContentProps) {
  useEffect(() => {
    if (newCaseId) {
      toast({
        title: "Akquise-Fall erstellt",
        description: "Der neue Fall wurde erfolgreich erstellt und ist jetzt in der Liste sichtbar.",
        action: <CheckCircle className="h-4 w-4 text-green-600" />,
      })
    }
  }, [newCaseId])

  return null
}
