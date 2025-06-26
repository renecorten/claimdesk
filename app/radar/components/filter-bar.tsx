"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { XIcon, SearchIcon, FilterIcon } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// Füge den Import hinzu:
import AutoRefreshToggle from "./auto-refresh-toggle"

export interface Filters {
  searchTerm: string
  feedType: string
  location: string
  timeRange: string
  severity: string
  damageCategory: string
}

interface FilterBarProps {
  filters: Filters
  setFilters: Dispatch<SetStateAction<Filters>>
  availableLocations: string[]
  availableDamageCategories: string[]
  onRefresh: () => void
  isRefreshing: boolean
  autoRefreshRef?: React.MutableRefObject<{ refreshTimestamp: () => void } | null> // 🆕 Neue Prop
}

export default function FilterBar({
  filters,
  setFilters,
  availableLocations,
  availableDamageCategories,
  onRefresh,
  isRefreshing,
  autoRefreshRef, // 🆕 Neue Prop
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
  }

  const handleSelectChange = (name: keyof Filters) => (value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      feedType: "all",
      location: "all",
      timeRange: "all",
      severity: "all",
      damageCategory: "all",
    })
  }

  const hasActiveFilters =
    filters.searchTerm !== "" ||
    filters.feedType !== "all" ||
    filters.location !== "all" ||
    filters.timeRange !== "all" ||
    filters.severity !== "all" ||
    filters.damageCategory !== "all"

  return (
    <div className="p-2 sm:p-4 bg-card border-b space-y-4">
      {/* Auto-Refresh Toggle - Prominent platziert */}
      <AutoRefreshToggle ref={autoRefreshRef} /> {/* 🆕 Übergebe die Ref */}
      {/* Mobile: Suchfeld und Buttons immer sichtbar */}
      <div className="space-y-3">
        {/* Suchfeld - immer sichtbar, Mobile optimiert */}
        <div>
          <Label htmlFor="searchTerm" className="sr-only sm:not-sr-only text-sm font-medium">
            Volltextsuche
          </Label>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchTerm"
              type="text"
              placeholder="Suchen in Titel, Summary, Content..."
              value={filters.searchTerm}
              onChange={handleInputChange}
              className="pl-8 h-10 text-sm"
            />
          </div>
        </div>

        {/* Action Buttons - Mobile optimiert */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none h-10 text-sm touch-manipulation"
          >
            {isRefreshing ? "Aktualisiere..." : "Jetzt aktualisieren"}
          </Button>

          {/* Mobile: Collapsible Filter Toggle */}
          <div className="sm:hidden">
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full h-10 text-sm touch-manipulation">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter {hasActiveFilters && "(aktiv)"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="feedType-mobile" className="text-sm font-medium">
                      Feed Typ
                    </Label>
                    <Select value={filters.feedType} onValueChange={handleSelectChange("feedType")}>
                      <SelectTrigger id="feedType-mobile" className="mt-1 h-10">
                        <SelectValue placeholder="Feed Typ wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Typen</SelectItem>
                        <SelectItem value="Presseportal">Presseportal</SelectItem>
                        <SelectItem value="GoogleAlert">Google Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location-mobile" className="text-sm font-medium">
                      Ort
                    </Label>
                    <LocationAutocomplete
                      value={filters.location}
                      onChange={handleSelectChange("location")}
                      availableLocations={availableLocations}
                      placeholder="Ort suchen..."
                      id="location-mobile"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeRange-mobile" className="text-sm font-medium">
                      Zeitraum
                    </Label>
                    <Select value={filters.timeRange} onValueChange={handleSelectChange("timeRange")}>
                      <SelectTrigger id="timeRange-mobile" className="mt-1 h-10">
                        <SelectValue placeholder="Zeitraum wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Gesamter Zeitraum</SelectItem>
                        <SelectItem value="7days">Letzte 7 Tage</SelectItem>
                        <SelectItem value="30days">Letzte 30 Tage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="severity-mobile" className="text-sm font-medium">
                      Priorität
                    </Label>
                    <Select value={filters.severity} onValueChange={handleSelectChange("severity")}>
                      <SelectTrigger id="severity-mobile" className="mt-1 h-10">
                        <SelectValue placeholder="Priorität wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Prioritäten</SelectItem>
                        <SelectItem value="routine">🟢 Routine</SelectItem>
                        <SelectItem value="attention">🟡 Beachten</SelectItem>
                        <SelectItem value="urgent">🔴 Handeln</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="damageCategory-mobile" className="text-sm font-medium">
                      Schadentyp
                    </Label>
                    <Select value={filters.damageCategory} onValueChange={handleSelectChange("damageCategory")}>
                      <SelectTrigger id="damageCategory-mobile" className="mt-1 h-10">
                        <SelectValue placeholder="Schadentyp wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Schadentypen</SelectItem>
                        {availableDamageCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === "private"
                              ? "🏠 Privat"
                              : category === "commercial"
                                ? "🏢 Gewerbe"
                                : category === "industrial"
                                  ? "🏭 Industrie"
                                  : category === "infrastructure"
                                    ? "🏗️ Infrastruktur"
                                    : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Desktop: Filter immer sichtbar */}
          <div className="hidden sm:contents">
            <Button
              variant="outline"
              onClick={clearFilters}
              title="Filter zurücksetzen"
              className="h-10 text-sm touch-manipulation"
            >
              <XIcon className="h-4 w-4 mr-2" />
              Filter löschen
            </Button>
          </div>
        </div>

        {/* Mobile: Filter löschen Button (nur wenn Filter aktiv) */}
        {hasActiveFilters && (
          <div className="sm:hidden">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full h-10 text-sm touch-manipulation"
              size="sm"
            >
              <XIcon className="h-4 w-4 mr-2" />
              Filter löschen
            </Button>
          </div>
        )}
      </div>
      {/* Desktop: Horizontale Filter-Leiste */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <div>
          <Label htmlFor="feedType" className="text-sm font-medium">
            Feed Typ
          </Label>
          <Select value={filters.feedType} onValueChange={handleSelectChange("feedType")}>
            <SelectTrigger id="feedType" className="mt-1 h-10">
              <SelectValue placeholder="Feed Typ wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="Presseportal">Presseportal</SelectItem>
              <SelectItem value="GoogleAlert">Google Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location" className="text-sm font-medium">
            Ort
          </Label>
          <LocationAutocomplete
            value={filters.location}
            onChange={handleSelectChange("location")}
            availableLocations={availableLocations}
            placeholder="Ort suchen..."
            id="location"
          />
        </div>

        <div>
          <Label htmlFor="timeRange" className="text-sm font-medium">
            Zeitraum
          </Label>
          <Select value={filters.timeRange} onValueChange={handleSelectChange("timeRange")}>
            <SelectTrigger id="timeRange" className="mt-1 h-10">
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Gesamter Zeitraum</SelectItem>
              <SelectItem value="7days">Letzte 7 Tage</SelectItem>
              <SelectItem value="30days">Letzte 30 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="severity" className="text-sm font-medium">
            Priorität
          </Label>
          <Select value={filters.severity} onValueChange={handleSelectChange("severity")}>
            <SelectTrigger id="severity" className="mt-1 h-10">
              <SelectValue placeholder="Priorität wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Prioritäten</SelectItem>
              <SelectItem value="routine">🟢 Routine</SelectItem>
              <SelectItem value="attention">🟡 Beachten</SelectItem>
              <SelectItem value="urgent">🔴 Handeln</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="damageCategory" className="text-sm font-medium">
            Schadentyp
          </Label>
          <Select value={filters.damageCategory} onValueChange={handleSelectChange("damageCategory")}>
            <SelectTrigger id="damageCategory" className="mt-1 h-10">
              <SelectValue placeholder="Schadentyp wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Schadentypen</SelectItem>
              {availableDamageCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "private"
                    ? "🏠 Privat"
                    : category === "commercial"
                      ? "🏢 Gewerbe"
                      : category === "industrial"
                        ? "🏭 Industrie"
                        : category === "infrastructure"
                          ? "🏗️ Infrastruktur"
                          : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// Autocomplete-Komponente für Orte
interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  availableLocations: string[]
  placeholder: string
  id: string
}

function LocationAutocomplete({ value, onChange, availableLocations, placeholder, id }: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Gefilterte Orte basierend auf Suchterm
  const filteredLocations = availableLocations
    .filter((location) => location.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10) // Maximal 10 Ergebnisse anzeigen

  // Aktueller Anzeigewert
  const displayValue = value === "all" ? "" : value

  // Schließe Dropdown wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true)
        setHighlightedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredLocations.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredLocations[highlightedIndex]) {
          selectLocation(filteredLocations[highlightedIndex])
        } else if (filteredLocations.length === 1) {
          selectLocation(filteredLocations[0])
        }
        break
      case "Escape":
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const selectLocation = (location: string) => {
    onChange(location)
    setSearchTerm("")
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
  }

  const clearSelection = () => {
    onChange("all")
    setSearchTerm("")
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)

    // Wenn Input geleert wird, setze Filter zurück
    if (newValue === "") {
      onChange("all")
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (searchTerm === "" && filteredLocations.length > 0) {
      setHighlightedIndex(0)
    }
  }

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={searchTerm || displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pr-8 h-10"
          autoComplete="off"
        />

        {/* Icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {displayValue && (
            <button
              type="button"
              onClick={clearSelection}
              className="h-4 w-4 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-white text-xs font-bold"
              title="Auswahl löschen"
            >
              ×
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown Liste */}
      {isOpen && (
        <div className="absolute z-50 w-full min-w-[200px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul ref={listRef} className="py-1">
            {/* "Alle Orte" Option */}
            <li>
              <button
                type="button"
                onClick={clearSelection}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  value === "all" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                }`}
              >
                Alle Orte
              </button>
            </li>

            {/* Separator */}
            {filteredLocations.length > 0 && <li className="border-t border-gray-100 my-1"></li>}

            {/* Gefilterte Orte */}
            {filteredLocations.length > 0
              ? filteredLocations.map((location, index) => (
                  <li key={location}>
                    <button
                      type="button"
                      onClick={() => selectLocation(location)}
                      className={`w-full px-3 py-2 text-left text-sm ${
                        index === highlightedIndex
                          ? "bg-blue-100 text-blue-700"
                          : value === location
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title={location} // Vollständiger Name im Tooltip
                    >
                      <span className="block truncate">
                        {location.length > 25 ? `${location.substring(0, 25)}...` : location}
                      </span>
                    </button>
                  </li>
                ))
              : searchTerm && (
                  <li className="px-3 py-2 text-sm text-gray-500 italic">
                    <span className="block truncate">Keine Orte gefunden für "{searchTerm}"</span>
                  </li>
                )}
          </ul>
        </div>
      )}
    </div>
  )
}
