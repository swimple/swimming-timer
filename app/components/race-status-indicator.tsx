"use client"

import { useEffect, useState } from "react"
import { useRace } from "../context/race-context"
import { Badge } from "@/components/ui/badge"
import { Timer, CheckCircle, AlertCircle } from "lucide-react"
import { getSyncedData, listenForDataChanges } from "../utils/sync-service"

export function RaceStatusIndicator() {
  const { isRaceRunning } = useRace()
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [raceStatus, setRaceStatus] = useState<string>("ready")
  const [isClient, setIsClient] = useState(false)

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Sprawdź, czy wyścig jest w toku
    const checkStatus = () => {
      const storedRaceStatus = getSyncedData<string>("raceStatus_synced", "ready")
      const raceStartTime = getSyncedData<number>("raceStartTime_synced", 0)

      setRaceStatus(storedRaceStatus)

      if (storedRaceStatus === "running" && raceStartTime > 0) {
        const elapsed = Date.now() - raceStartTime
        setCurrentTime(elapsed)
      } else {
        setCurrentTime(null)
      }
    }

    checkStatus()

    // Nasłuchuj na zmiany w danych
    const unsubscribe = listenForDataChanges(checkStatus)

    // Aktualizuj co 100ms, jeśli wyścig jest w toku
    const interval = setInterval(() => {
      if (isRaceRunning) {
        checkStatus()
      }
    }, 100)

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [isClient, isRaceRunning])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  if (!isClient) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 flex items-center gap-1"
      >
        <AlertCircle className="w-3 h-3" />
        Ładowanie...
      </Badge>
    )
  }

  if (isRaceRunning && currentTime !== null) {
    return (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 animate-pulse flex items-center gap-1"
      >
        <Timer className="w-3 h-3" />
        Wyścig w toku {formatTime(currentTime)}
      </Badge>
    )
  }

  if (!isRaceRunning && raceStatus === "finished") {
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center gap-1"
      >
        <CheckCircle className="w-3 h-3" />
        Wyścig zakończony
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 flex items-center gap-1"
    >
      <AlertCircle className="w-3 h-3" />
      Oczekiwanie na start
    </Badge>
  )
}
