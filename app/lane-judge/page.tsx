"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Flag, Timer, User, AlertTriangle } from "lucide-react"
import { useRace } from "../context/race-context"
import { useWakeLock } from "../hooks/use-wake-lock"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { listenForDataChanges } from "../utils/sync-service"

export default function LaneJudgePage() {
  const [laneNumber, setLaneNumber] = useState("")
  const [swimmerName, setSwimmerName] = useState("")
  const [swimmerClub, setSwimmerClub] = useState("")
  const [swimmerYear, setSwimmerYear] = useState("")
  const [currentTime, setCurrentTime] = useState(0)
  const [finishTime, setFinishTime] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const { isRaceRunning, startTime, getSwimmerByLane, currentHeat, addResult } = useRace()

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

  // Obsługa przycisku głośności
  useEffect(() => {
    if (!isClient) return

    const handleVolumeUp = (e: KeyboardEvent) => {
      // Kod 38 to strzałka w górę, używamy jej do testowania na komputerze
      // W rzeczywistości przyciski głośności nie są dostępne przez JavaScript w przeglądarce
      if (e.keyCode === 38 && isRaceRunning && !finishTime) {
        stopTimer()
      }
    }

    window.addEventListener("keydown", handleVolumeUp)

    return () => {
      window.removeEventListener("keydown", handleVolumeUp)
    }
  }, [isClient, isRaceRunning, finishTime])

  useEffect(() => {
    if (!isClient) return

    let interval: NodeJS.Timeout | null = null

    if (isRaceRunning && !finishTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime)
      }, 10)
    } else {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isClient, isRaceRunning, startTime, finishTime])

  // Automatycznie wypełnij dane zawodnika na podstawie wybranego toru
  useEffect(() => {
    if (!isClient) return

    if (laneNumber) {
      const swimmer = getSwimmerByLane(Number(laneNumber))
      if (swimmer) {
        setSwimmerName(swimmer.name)
        setSwimmerClub(swimmer.club || "")
        setSwimmerYear(swimmer.year || "")
      } else {
        setSwimmerName("")
        setSwimmerClub("")
        setSwimmerYear("")
      }
    }
  }, [isClient, laneNumber, currentHeat, getSwimmerByLane])

  // Nasłuchuj na zmiany w danych
  useEffect(() => {
    if (!isClient) return

    const handleDataChange = () => {
      // Jeśli zmienił się numer serii, zaktualizuj dane zawodnika
      if (laneNumber) {
        const swimmer = getSwimmerByLane(Number(laneNumber))
        if (swimmer) {
          setSwimmerName(swimmer.name)
          setSwimmerClub(swimmer.club || "")
          setSwimmerYear(swimmer.year || "")
        }
      }

      // Jeśli wyścig został zatrzymany, a ten tor jeszcze nie ma czasu, ustaw czas
      if (!isRaceRunning && finishTime === null && laneNumber) {
        // Sprawdź, czy wyścig został zatrzymany
        const raceStatus = localStorage.getItem("raceStatus_synced")
        if (raceStatus === "finished") {
          const stopTime = Date.now() - startTime
          setFinishTime(stopTime)

          // Dodaj wynik do kontekstu
          const result = {
            lane: laneNumber,
            name: swimmerName,
            club: swimmerClub,
            year: swimmerYear,
            heat: currentHeat,
            time: stopTime,
          }

          console.log("Race stopped event - adding result:", result)
          addResult(result)

          toast({
            title: "Wyścig zakończony",
            description: `Automatyczne zatrzymanie czasu dla toru ${laneNumber}: ${formatTime(stopTime)}`,
          })
        }
      }
    }

    const unsubscribe = listenForDataChanges(handleDataChange)

    return () => {
      unsubscribe()
    }
  }, [
    isClient,
    isRaceRunning,
    finishTime,
    laneNumber,
    startTime,
    addResult,
    currentHeat,
    swimmerName,
    swimmerClub,
    swimmerYear,
    toast,
    getSwimmerByLane,
  ])

  const stopTimer = () => {
    if (!isClient) return
    if (!isRaceRunning || !laneNumber || finishTime !== null) return

    const stopTime = Date.now() - startTime
    setFinishTime(stopTime)

    // Dodaj wynik do kontekstu
    const result = {
      lane: laneNumber,
      name: swimmerName,
      club: swimmerClub,
      year: swimmerYear,
      heat: currentHeat,
      time: stopTime,
    }

    console.log("Lane judge stopping timer with result:", result)
    addResult(result)

    toast({
      title: "Czas zatrzymany",
      description: `Tor ${laneNumber}: ${formatTime(stopTime)}`,
    })

    // Wibracja telefonu (jeśli dostępna)
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
  }

  // Dodaj nasłuchiwanie na zdarzenie zatrzymania wyścigu
  useEffect(() => {
    if (!isClient) return

    const handleRaceStopped = () => {
      if (isRaceRunning && !finishTime && laneNumber) {
        // Jeśli wyścig został zatrzymany, a ten tor jeszcze nie ma czasu, ustaw czas
        const stopTime = Date.now() - startTime
        setFinishTime(stopTime)

        // Dodaj wynik do kontekstu
        const result = {
          lane: laneNumber,
          name: swimmerName,
          club: swimmerClub,
          year: swimmerYear,
          heat: currentHeat,
          time: stopTime,
        }

        console.log("Race stopped event - adding result:", result)
        addResult(result)

        toast({
          title: "Wyścig zakończony",
          description: `Automatyczne zatrzymanie czasu dla toru ${laneNumber}: ${formatTime(stopTime)}`,
        })
      }
    }

    window.addEventListener("race-stopped", handleRaceStopped)

    return () => {
      window.removeEventListener("race-stopped", handleRaceStopped)
    }
  }, [
    isClient,
    isRaceRunning,
    finishTime,
    laneNumber,
    startTime,
    addResult,
    currentHeat,
    swimmerName,
    swimmerClub,
    swimmerYear,
    toast,
  ])

  const resetLaneJudge = () => {
    setLaneNumber("")
    setSwimmerName("")
    setSwimmerClub("")
    setSwimmerYear("")
    setFinishTime(null)
  }

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
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-center">Panel sędziego torowego</h1>

      {isSupported && error && (
        <Alert variant="warning" className="mb-4 max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Funkcja zapobiegania wygaszaniu ekranu jest niedostępna. Upewnij się, że ekran telefonu nie wygaśnie podczas
            zawodów.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pomiar czasu - Seria {currentHeat}</CardTitle>
          <CardDescription>Zatrzymaj czas dla swojego toru</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lane">Numer toru</Label>
              <Input
                id="lane"
                type="number"
                min="1"
                placeholder="Np. 1, 2, 3..."
                value={laneNumber}
                onChange={(e) => setLaneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swimmer">Imię i nazwisko zawodnika</Label>
              <div className="relative">
                <Input
                  id="swimmer"
                  placeholder="Np. Jan Kowalski"
                  value={swimmerName}
                  onChange={(e) => setSwimmerName(e.target.value)}
                />
                {swimmerName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            {swimmerClub && <div className="text-sm text-muted-foreground">Klub: {swimmerClub}</div>}
            {swimmerYear && <div className="text-sm text-muted-foreground">Rocznik: {swimmerYear}</div>}
          </div>

          <div className="flex justify-center">
            <div className="text-5xl font-mono font-bold tabular-nums">
              {finishTime ? formatTime(finishTime) : formatTime(currentTime)}
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={stopTimer}
              disabled={!isRaceRunning || !laneNumber || finishTime !== null}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <Flag className="w-5 h-5" />
              Zatrzymaj czas
            </Button>

            <Button onClick={resetLaneJudge} variant="outline" className="w-full">
              Resetuj dane
            </Button>

            <div className="text-center text-sm">
              {!isRaceRunning ? (
                <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Timer className="w-4 h-4" />
                  Oczekiwanie na rozpoczęcie wyścigu...
                </div>
              ) : finishTime ? (
                <div className="text-green-600 dark:text-green-400">Czas zatrzymany!</div>
              ) : (
                <div className="text-red-600 dark:text-red-400 animate-pulse">
                  Wyścig w toku - naciśnij przycisk, gdy zawodnik dotknie ściany!
                </div>
              )}
            </div>
          </div>
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
