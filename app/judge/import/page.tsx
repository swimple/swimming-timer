"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRace } from "../../context/race-context"
import { useRouter } from "next/navigation"
import type { Competition, Heat } from "../../types/swimmer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function ImportPage() {
  const [csvData, setCsvData] = useState("")
  const [competitionName, setCompetitionName] = useState("Zawody pływackie")
  const [importError, setImportError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const { importCompetition } = useRace()
  const router = useRouter()

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  const parseCSV = () => {
    if (!isClient) return

    try {
      setImportError(null)

      if (!csvData.trim()) {
        setImportError("Dane CSV są puste")
        return
      }

      // Podziel na wiersze
      const rows = csvData.trim().split("\n")

      if (rows.length < 2) {
        setImportError("Za mało wierszy danych")
        return
      }

      // Przygotuj obiekt zawodów
      const competition: Competition = {
        name: competitionName,
        heats: [],
        currentHeat: 1,
      }

      // Mapa do śledzenia serii
      const heatsMap = new Map<number, Heat>()

      // Przetwórz każdy wiersz (pomijając nagłówek)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(",").map((cell) => cell.trim())

        // Sprawdź, czy wiersz ma wystarczającą liczbę kolumn
        if (row.length < 3) {
          continue // Pomiń niepełne wiersze
        }

        // Przykładowy format: Seria,Tor,Imię i Nazwisko,Klub,Rok
        const heatNumber = Number.parseInt(row[0])
        const laneNumber = Number.parseInt(row[1])
        const swimmerName = row[2]
        const club = row.length > 3 ? row[3] : ""
        const year = row.length > 4 ? row[4] : ""

        if (isNaN(heatNumber) || isNaN(laneNumber)) {
          continue // Pomiń wiersze z nieprawidłowymi numerami
        }

        // Utwórz lub pobierz serię
        if (!heatsMap.has(heatNumber)) {
          heatsMap.set(heatNumber, {
            number: heatNumber,
            swimmers: [],
          })
        }

        // Dodaj zawodnika do serii
        const heat = heatsMap.get(heatNumber)!
        heat.swimmers.push({
          name: swimmerName,
          club,
          year,
          heat: heatNumber,
          lane: laneNumber,
        })
      }

      // Konwertuj mapę na tablicę i sortuj serie
      competition.heats = Array.from(heatsMap.values()).sort((a, b) => a.number - b.number)

      if (competition.heats.length === 0) {
        setImportError("Nie udało się zaimportować żadnych danych")
        return
      }

      // Ustaw pierwszą serię jako bieżącą
      competition.currentHeat = competition.heats[0].number

      // Importuj zawody
      importCompetition(competition)

      toast({
        title: "Import zakończony",
        description: `Zaimportowano ${competition.heats.length} serii i ${competition.heats.reduce(
          (sum, heat) => sum + heat.swimmers.length,
          0,
        )} zawodników. Ustawiono serię ${competition.currentHeat}.`,
      })

      // Przekieruj do panelu sędziego
      router.push("/judge")
    } catch (error) {
      console.error("Błąd podczas importu:", error)
      setImportError("Wystąpił błąd podczas przetwarzania danych")
    }
  }

  if (!isClient) {
    return <div className="container p-8 text-center">Ładowanie...</div>
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-center">Import listy startowej</h1>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Import CSV</CardTitle>
          <CardDescription>Zaimportuj listę startową w formacie CSV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="competition-name">Nazwa zawodów</Label>
            <Input
              id="competition-name"
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              placeholder="Nazwa zawodów"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-data">Dane CSV</Label>
            <Textarea
              id="csv-data"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Seria,Tor,Imię i Nazwisko,Klub,Rok"
              className="min-h-[200px] font-mono"
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Format danych</AlertTitle>
            <AlertDescription>
              Dane powinny być w formacie CSV z nagłówkiem i kolumnami:
              <code className="block mt-2 p-2 bg-muted rounded text-xs">Seria,Tor,Imię i Nazwisko,Klub,Rok</code>
              Przykład:
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                Seria,Tor,Imię i Nazwisko,Klub,Rok
                <br />
                1,1,Jan Kowalski,KS Neptun,2005
                <br />
                1,2,Anna Nowak,UKS Delfin,2006
                <br />
                1,3,Piotr Wiśniewski,MKS Fala,2005
                <br />
                2,1,Katarzyna Zielińska,KS Orka,2007
                <br />
                2,2,Michał Szymański,UKS Rekin,2006
              </code>
            </AlertDescription>
          </Alert>

          {importError && (
            <Alert variant="destructive">
              <AlertTitle>Błąd importu</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button onClick={parseCSV} className="w-full sm:w-auto">
            Importuj dane
          </Button>
          <Button variant="outline" onClick={() => router.push("/judge")} className="w-full sm:w-auto">
            Anuluj
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
