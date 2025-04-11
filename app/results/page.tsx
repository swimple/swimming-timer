"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRace } from "../context/race-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ResultsPage() {
  const { toast } = useToast()
  const { results, competition, currentHeat } = useRace()
  const [selectedHeat, setSelectedHeat] = useState<string>(currentHeat.toString())
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("heats")
  const [isClient, setIsClient] = useState(false)

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
    setSelectedHeat(currentHeat.toString())
  }, [currentHeat])

  // Pobierz unikalne numery serii z wyników
  const heats = [...new Set(results.map((r) => r.heat))].sort((a, b) => a - b)

  // Pobierz unikalne roczniki z wyników
  const years = [...new Set(results.filter((r) => r.year).map((r) => r.year))].sort()

  // Filtruj wyniki według wybranej serii i/lub rocznika
  const getFilteredResults = () => {
    let filtered = [...results]

    if (activeTab === "heats") {
      if (selectedHeat !== "all") {
        filtered = filtered.filter((r) => r.heat === Number.parseInt(selectedHeat))
      }
    } else if (activeTab === "years") {
      if (selectedYear !== "all") {
        filtered = filtered.filter((r) => r.year === selectedYear)
      }
    }

    // Sortuj według czasu (najszybszy pierwszy)
    return filtered.sort((a, b) => a.time - b.time)
  }

  const filteredResults = getFilteredResults()

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = Math.floor((time % 1000) / 10)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  const downloadResults = () => {
    if (!isClient) return

    if (results.length === 0) {
      toast({
        title: "Brak wyników",
        description: "Nie ma żadnych wyników do pobrania",
        variant: "destructive",
      })
      return
    }

    let csvContent = "Miejsce,Seria,Tor,Zawodnik,Klub,Rocznik,Czas\n"

    filteredResults.forEach((result, index) => {
      csvContent += `${index + 1},${result.heat},${result.lane},${result.name},${result.club || ""},${result.year || ""},${formatTime(result.time)}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `wyniki_zawodow_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Wyniki pobrane",
      description: "Plik CSV z wynikami został pobrany",
    })
  }

  const openLiveDisplay = () => {
    if (!isClient) return
    window.open("/live-display", "_blank", "noopener,noreferrer")
  }

  if (!isClient) {
    return <div className="container p-8 text-center">Ładowanie...</div>
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-center">Wyniki zawodów</h1>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Tabela wyników</CardTitle>
          <CardDescription>
            {competition?.name || "Zawody pływackie"} - wyniki posortowane według najlepszego czasu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {results.length > 0 ? (
            <>
              <Tabs defaultValue="heats" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="heats">Według serii</TabsTrigger>
                  <TabsTrigger value="years">Według roczników</TabsTrigger>
                </TabsList>
                <TabsContent value="heats" className="space-y-4">
                  <div className="flex items-center gap-4 mt-4">
                    <Label htmlFor="heat-filter" className="whitespace-nowrap">
                      Filtruj serię:
                    </Label>
                    <Select value={selectedHeat} onValueChange={setSelectedHeat}>
                      <SelectTrigger id="heat-filter" className="flex-1">
                        <SelectValue placeholder="Wszystkie serie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie serie</SelectItem>
                        {heats.map((heat) => (
                          <SelectItem key={heat} value={heat.toString()}>
                            Seria {heat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="years" className="space-y-4">
                  <div className="flex items-center gap-4 mt-4">
                    <Label htmlFor="year-filter" className="whitespace-nowrap">
                      Filtruj rocznik:
                    </Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger id="year-filter" className="flex-1">
                        <SelectValue placeholder="Wszystkie roczniki" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Wszystkie roczniki</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Miejsce</TableHead>
                      <TableHead className="w-16">Seria</TableHead>
                      <TableHead className="w-16">Tor</TableHead>
                      <TableHead>Zawodnik</TableHead>
                      <TableHead>Klub</TableHead>
                      {activeTab === "years" && <TableHead className="w-24">Rocznik</TableHead>}
                      <TableHead className="text-right">Czas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={`${result.heat}-${result.lane}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{result.heat}</TableCell>
                        <TableCell>{result.lane}</TableCell>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>{result.club || "-"}</TableCell>
                        {activeTab === "years" && <TableCell>{result.year || "-"}</TableCell>}
                        <TableCell className="text-right font-mono">{formatTime(result.time)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Brak wyników do wyświetlenia</div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={downloadResults}
              disabled={results.length === 0}
              className="flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Pobierz wyniki (CSV)
            </Button>

            <Button onClick={openLiveDisplay} variant="outline" className="flex items-center justify-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Wyświetlacz zewnętrzny
            </Button>

            <Link href="/" className="sm:ml-auto">
              <Button variant="outline">Powrót do strony głównej</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
