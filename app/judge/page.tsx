"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Play, Square, RotateCcw, Upload, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRace } from "../context/race-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWakeLock } from "../hooks/use-wake-lock"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function JudgePage() {
  const [currentTime, setCurrentTime] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const {
    isRaceRunning,
    startTime,
    startRace,
    stopRace,
    resetRace,
    competition,
    currentHeat,
    setCurrentHeat,
    getOccupiedLanes,
    getFinishedLanes,
  } = useRace()

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Aktywuj blokadę wygaszania ekranu
  const { isSupported, isActive, error, request } = useWakeLock()

  // Próbuj aktywować Wake Lock tylko raz przy ładowaniu strony
  useEffect(() => {
    if (!isClient) return

    if (isSupported && !isActive && !error) {
      request().catch(() => {
        // Cicha obsługa błędu - już jest obsługiwany w hooku
      })
    }
  }, [isClient, isSupported, isActive, error, request])

  useEffect(() => {
    if (!isClient) return

    let interval: NodeJS.Timeout | null = null

    if (isRaceRunning) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime)

        // Sprawdź, czy wyścig został automatycznie zatrzymany
        const raceStatus = localStorage.getItem("raceStatus")
        if (raceStatus !== "running") {
          clearInterval(interval!)
        }
      }, 10)
    } else {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isClient, isRaceRunning, startTime])

  // Dodaj nasłuchiwanie na zmiany w localStorage, aby aktualizować stan wyścigu

  // Dodaj ten useEffect do istniejących useEffect w komponencie
  useEffect(() => {
    if (!isClient) return

    // Funkcja do aktualizacji stanu wyścigu na podstawie localStorage
    const handleStorageChange = () => {
      const raceStatus = localStorage.getItem("raceStatus")
      const raceStartTime = localStorage.getItem("raceStartTime")

      if (raceStatus === "running" && raceStartTime) {
        setCurrentTime(Date.now() - Number(raceStartTime))
      } else if (raceStatus === "finished") {
        // Wyścig został zatrzymany przez inny komponent
        setCurrentTime(Date.now() - (startTime || Number(raceStartTime || 0)))
      }
    }

    // Nasłuchuj na zmiany w localStorage
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("race-stopped", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("race-stopped", handleStorageChange)
    }
  }, [isClient, startTime])

  const viewResults = () => {
    router.push("/results")
  }

  const goToImport = () => {
    router.push("/judge/import")
  }

  const openLiveDisplay = () => {
    window.open("/live-display", "_blank", "noopener,noreferrer")
  }

  const handleHeatChange = (value: string) => {
    setCurrentHeat(Number(value))
  }

  const nextHeat = () => {
    if (!competition) return

    const heats = competition.heats.map((h) => h.number).sort((a, b) => a - b)
    const currentIndex = heats.indexOf(currentHeat)

    if (currentIndex < heats.length - 1) {
      setCurrentHeat(heats[currentIndex + 1])
    }
  }

  const prevHeat = () => {
    if (!competition) return

    const heats = competition.heats.map((h) => h.number).sort((a, b) => a - b)
    const currentIndex = heats.indexOf(currentHeat)

    if (currentIndex > 0) {
      setCurrentHeat(heats[currentIndex - 1])
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = Math.floor((time % 1000) / 10)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  // Pobierz listę serii
  const heats = competition?.heats.map((h) => h.number).sort((a, b) => a - b) || []

  // Pobierz zawodników w bieżącej serii
  const currentHeatSwimmers = competition?.heats.find((h) => h.number === currentHeat)?.swimmers || []

  // Pobierz zajęte tory i ukończone tory
  const occupiedLanes = getOccupiedLanes()
  const finishedLanes = getFinishedLanes().map(Number)

  if (!isClient) {
    return <div className="container p-8 text-center">Ładowanie...</div>
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-center">Panel sędziego głównego</h1>

      {isSupported && error && (
        <Alert variant="warning" className="mb-4 max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Funkcja zapobiegania wygaszaniu ekranu jest niedostępna. Upewnij się, że ekran telefonu nie wygaśnie podczas
            zawodów.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-md mb-6">
        <CardHeader>
          <CardTitle>Kontrola wyścigu</CardTitle>
          <CardDescription>Rozpocznij i zakończ wyścig</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="text-5xl font-mono font-bold tabular-nums">{formatTime(currentTime)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!isRaceRunning ? (
              <Button onClick={startRace} className="flex items-center justify-center gap-2" size="lg">
                <Play className="w-5 h-5" />
                Start
              </Button>
            ) : (
              <Button
                onClick={stopRace}
                variant="destructive"
                className="flex items-center justify-center gap-2"
                size="lg"
              >
                <Square className="w-5 h-5" />
                Stop
              </Button>
            )}

            <Button onClick={resetRace} variant="outline" className="flex items-center justify-center gap-2" size="lg">
              <RotateCcw className="w-5 h-5" />
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={viewResults} variant="secondary" className="w-full">
              Zobacz wyniki
            </Button>
            <Button onClick={openLiveDisplay} variant="outline" className="w-full flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Wyświetlacz
            </Button>
          </div>
        </CardContent>
      </Card>

      {competition && (
        <Card className="w-full max-w-md mb-6">
          <CardHeader>
            <CardTitle>Seria {currentHeat}</CardTitle>
            <CardDescription>
              {competition.name} - {currentHeatSwimmers.length} zawodników
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevHeat} disabled={heats.indexOf(currentHeat) <= 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select value={currentHeat.toString()} onValueChange={handleHeatChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Wybierz serię" />
                </SelectTrigger>
                <SelectContent>
                  {heats.map((heat) => (
                    <SelectItem key={heat} value={heat.toString()}>
                      Seria {heat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={nextHeat}
                disabled={heats.indexOf(currentHeat) >= heats.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {currentHeatSwimmers.length > 0 ? (
              <div className="border rounded-md">
                <div className="grid grid-cols-7 gap-2 p-2 font-medium border-b text-sm">
                  <div className="col-span-1">Tor</div>
                  <div className="col-span-3">Zawodnik</div>
                  <div className="col-span-2">Klub</div>
                  <div className="col-span-1">Status</div>
                </div>
                <div className="divide-y">
                  {currentHeatSwimmers
                    .sort((a, b) => a.lane - b.lane)
                    .map((swimmer) => (
                      <div key={swimmer.lane} className="grid grid-cols-7 gap-2 p-2 text-sm">
                        <div className="col-span-1">{swimmer.lane}</div>
                        <div className="col-span-3">{swimmer.name}</div>
                        <div className="col-span-2">{swimmer.club}</div>
                        <div className="col-span-1">
                          {finishedLanes.includes(swimmer.lane) ? (
                            <Badge variant="success" className="text-xs">
                              Ukończył
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Czeka
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">Brak zawodników w tej serii</div>
            )}

            {isRaceRunning && (
              <div className="text-sm text-center">
                <span className="font-medium">
                  Ukończono: {finishedLanes.length}/{occupiedLanes.length} torów
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Zarządzanie zawodami</CardTitle>
          <CardDescription>Import list startowych</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={goToImport} className="w-full flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Importuj listę startową
          </Button>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>
            Aby zapobiec wygaszaniu ekranu, ustaw dłuższy czas wygaszania w ustawieniach telefonu przed rozpoczęciem
            zawodów.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
