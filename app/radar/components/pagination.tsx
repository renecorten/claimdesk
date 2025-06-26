"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Berechne sichtbare Seitenzahlen - Mobile optimiert
  const getVisiblePages = () => {
    const delta = window.innerWidth < 640 ? 1 : 2 // Weniger Seiten auf mobilen Geräten
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  // Optimierte Optionen für Tabellendarstellung
  const getItemsPerPageOptions = () => {
    return ["25", "50", "100", "200"]
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6 py-4 border-t bg-background">
      {/* Items per page selector - Mobile optimiert */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm order-2 sm:order-1">
          <span className="text-muted-foreground">Zeige</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getItemsPerPageOptions().map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-center sm:text-left">
            von {totalItems} Meldungen
            <span className="hidden sm:inline">
              {" "}
              ({startItem}-{endItem})
            </span>
          </span>
        </div>

        {/* Pagination controls - Mobile optimiert */}
        <div className="flex items-center gap-1 order-1 sm:order-2">
          {/* First page - Nur auf größeren Bildschirmen */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="hidden sm:flex h-8 w-8 p-0"
            title="Erste Seite"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 touch-manipulation"
            title="Vorherige Seite"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers - Mobile optimiert */}
          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="px-2 py-1 text-muted-foreground text-xs">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="h-8 w-8 p-0 text-xs touch-manipulation"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 touch-manipulation"
            title="Nächste Seite"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page - Nur auf größeren Bildschirmen */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="hidden sm:flex h-8 w-8 p-0"
            title="Letzte Seite"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
