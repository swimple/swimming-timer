"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRace } from "../context/race-context"
import { Badge } from "@/components/ui/badge"
import type { Result } from "../types/swimmer"

export default function LiveDisplayPage() {
  const [currentResults, setCurrentResults] = useState<Result[]>([])
  const [displayMode, setDisplayMode] = useState<"current" | "last">("current")
  const [isClient, setIsClient] = useState(false)
  const { isRaceRunning, currentHeat, results, competition } = useRace()

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Dodajmy logowanie, aby zdiagnozować problem
  useEffect(() => {
    if (!isClient) return

    console.log("LiveDisplay - Current Heat:", currentHeat)
    console.log("LiveDisplay - Results:", results)
    console.log("LiveDisplay - Competition:", competition)
  }, [isClient, currentHeat, results, competition])

  // Aktualizuj wyniki co 1 sekundę
  useEffect(() => {
    if (!isClient) return

    const updateResults = () => {
      // Logowanie dla debugowania
      console.log("Updating results. Current heat:", currentHeat)
      console.log("All results:", results)

      // Filtruj wyniki dla bieżącej serii
      const currentHeatResults = results.filter((r) => r.heat === currentHeat)
      console.log("Filtered results for current heat:", currentHeatResults)

      if (isRaceRunning) {
        // Podczas wyścigu pokazuj wyniki bieżącej serii
        setCurrentResults(currentHeatResults.sort((a, b) => a.time - b.time))
        setDisplayMode("current")
      } else if (results.length > 0) {
        // Sprawdź, czy są wyniki dla bieżącej serii
        if (currentHeatResults.length > 0) {
          // Jeśli są wyniki dla bieżącej serii, pokaż je
          setCurrentResults(currentHeatResults.sort((a, b) => a.time - b.time))
          setDisplayMode("current")
        } else {
          // W przeciwnym razie pokaż wyniki ostatniej serii z wynikami
          const heatsWithResults = [...new Set(results.map((r) => r.heat))]
          console.log("Heats with results:", heatsWithResults)

          if (heatsWithResults.length > 0) {
            const lastHeat = Math.max(...heatsWithResults)
            console.log("Last heat with results:", lastHeat)

            const lastHeatResults = results.filter((r) => r.heat === lastHeat)
            console.log("Last heat results:", lastHeatResults)

            setCurrentResults(lastHeatResults.sort((a, b) => a.time - b.time))
            setDisplayMode("last")
          } else {
            setCurrentResults([])
          }
        }
      } else {
        setCurrentResults([])
      }
    }

    // Wywołaj od razu przy montowaniu komponentu
    updateResults()

    // Ustaw interwał aktualizacji
    const interval = setInterval(updateResults, 1000)

    return () => clearInterval(interval)
  }, [isClient, isRaceRunning, currentHeat, results])

  // Pobierz zawodników w bieżącej serii
  const currentHeatSwimmers = competition?.heats.find((h) => h.number === currentHeat)?.swimmers || []

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = Math.floor((time % 1000) / 10)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  if (!isClient) {
    return <div className="container p-8 text-center">Ładowanie...</div>
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{competition?.name || "Zawody pływackie"}</h1>
          <div className="flex justify-center gap-4">
            {isRaceRunning ? (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                WYŚCIG W TOKU - SERIA {currentHeat}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-lg px-4 py-2">
                {displayMode === "last" && currentResults.length > 0
                  ? `WYNIKI - SERIA ${currentResults[0]?.heat}`
                  : `OCZEKIWANIE NA START - SERIA ${currentHeat}`}
              </Badge>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wyniki bieżącej/ostatniej serii */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{displayMode === "current" ? "Wyniki bieżącej serii" : "Wyniki ostatniej serii"}</CardTitle>
              <CardDescription>
                {currentResults.length > 0
                  ? `Seria ${currentResults[0]?.heat} - ${currentResults.length} zawodników ukończyło`
                  : `Brak wyników do wyświetlenia`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Miejsce</TableHead>
                      <TableHead className="w-16">Tor</TableHead>
                      <TableHead>Zawodnik</TableHead>
                      <TableHead>Klub</TableHead>
                      <TableHead className="text-right">Czas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentResults.map((result, index) => (
                      <TableRow
                        key={`${result.heat}-${result.lane}`}
                        className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950" : ""}
                      >
                        <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                        <TableCell>{result.lane}</TableCell>
                        <TableCell className="font-medium">{result.name}</TableCell>
                        <TableCell>{result.club || "-"}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg">
                          {formatTime(result.time)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">Brak wyników do wyświetlenia</div>
              )}
            </CardContent>
          </Card>

          {/* Lista startowa następnej serii */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Lista startowa</CardTitle>
              <CardDescription>
                Seria {currentHeat} - {currentHeatSwimmers.length} zawodników
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentHeatSwimmers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Tor</TableHead>
                      <TableHead>Zawodnik</TableHead>
                      <TableHead>Klub</TableHead>
                      <TableHead>Rocznik</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentHeatSwimmers
                      .sort((a, b) => a.lane - b.lane)
                      .map((swimmer) => {
                        const hasFinished = results.some(
                          (r) => Number(r.lane) === swimmer.lane && r.heat === currentHeat,
                        )
                        return (
                          <TableRow key={swimmer.lane}>
                            <TableCell className="font-bold">{swimmer.lane}</TableCell>
                            <TableCell className="font-medium">{swimmer.name}</TableCell>
                            <TableCell>{swimmer.club || "-"}</TableCell>
                            <TableCell>{swimmer.year || "-"}</TableCell>
                            <TableCell>
                              {hasFinished ? (
                                <Badge variant="success">Ukończył</Badge>
                              ) : isRaceRunning ? (
                                <Badge variant="destructive">W trakcie</Badge>
                              ) : (
                                <Badge variant="outline">Oczekuje</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">Brak zawodników w tej serii</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dodajmy debugowanie - to pomoże zidentyfikować problem */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono overflow-auto max-h-40 hidden">
          <div>Debug Info:</div>
          <div>Current Heat: {currentHeat}</div>
          <div>Display Mode: {displayMode}</div>
          <div>Results Count: {results.length}</div>
          <div>Current Results Count: {currentResults.length}</div>
          <div>Race Running: {isRaceRunning ? "Yes" : "No"}</div>
          <pre>{JSON.stringify({ results }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
