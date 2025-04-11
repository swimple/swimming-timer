"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Competition, Swimmer, Result } from "../types/swimmer"
import { initDeviceId, syncData, getSyncedData, listenForDataChanges, startPolling } from "../utils/sync-service"

interface RaceContextType {
  isRaceRunning: boolean
  startTime: number
  competition: Competition | null
  currentHeat: number
  results: Result[]
  startRace: () => void
  stopRace: () => void
  resetRace: () => void
  importCompetition: (competition: Competition) => void
  setCurrentHeat: (heatNumber: number) => void
  getSwimmerByLane: (lane: number) => Swimmer | undefined
  addResult: (result: Result) => void
  getOccupiedLanes: () => number[]
  getFinishedLanes: () => string[]
  checkAllFinished: () => boolean
}

const defaultCompetition: Competition = {
  name: "Zawody pływackie",
  heats: [],
  currentHeat: 1,
}

const RaceContext = createContext<RaceContextType | undefined>(undefined)

export function RaceProvider({ children }: { children: ReactNode }) {
  const [isRaceRunning, setIsRaceRunning] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [currentHeat, setCurrentHeat] = useState(1)
  const [results, setResults] = useState<Result[]>([])
  const [isClient, setIsClient] = useState(false)
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(0)

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
    // Inicjalizuj identyfikator urządzenia
    initDeviceId()
  }, [])

  // Funkcja do aktualizacji stanu na podstawie zsynchronizowanych danych
  const updateStateFromSync = () => {
    if (!isClient) return

    try {
      // Pobierz ostatni czas synchronizacji
      const lastSync = localStorage.getItem("lastSync")
      if (lastSync) {
        const syncTimestamp = Number(lastSync)
        if (syncTimestamp <= lastSyncTimestamp) {
          // Dane nie zostały zaktualizowane od ostatniego sprawdzenia
          return
        }
        setLastSyncTimestamp(syncTimestamp)
      }

      // Pobierz status wyścigu
      const raceStatus = getSyncedData<string>("raceStatus_synced", "ready")
      const raceStartTime = getSyncedData<number>("raceStartTime_synced", 0)

      if (raceStatus === "running" && raceStartTime > 0) {
        setIsRaceRunning(true)
        setStartTime(raceStartTime)
      } else if (raceStatus === "finished" || raceStatus === "ready") {
        setIsRaceRunning(false)
      }

      // Pobierz zawody
      const syncedCompetition = getSyncedData<Competition | null>("competition_synced", null)
      if (syncedCompetition) {
        setCompetition(syncedCompetition)
      }

      // Pobierz bieżącą serię
      const syncedHeat = getSyncedData<number>("currentHeat_synced", 1)
      setCurrentHeat(syncedHeat)

      // Pobierz wyniki
      const syncedResults = getSyncedData<Result[]>("raceResults_synced", [])
      setResults(syncedResults)
    } catch (error) {
      console.error("Error updating state from sync:", error)
    }
  }

  // Inicjalizacja stanu na podstawie localStorage
  useEffect(() => {
    if (!isClient) return

    try {
      // Pobierz dane z localStorage
      updateStateFromSync()

      // Nasłuchuj na zmiany w localStorage
      const unsubscribeStorage = listenForDataChanges(updateStateFromSync)

      // Regularnie sprawdzaj zmiany (polling)
      const unsubscribePolling = startPolling(updateStateFromSync, 1000)

      return () => {
        unsubscribeStorage()
        unsubscribePolling()
      }
    } catch (error) {
      console.error("Error initializing state from localStorage:", error)
    }
  }, [isClient])

  // Funkcja do rozpoczęcia wyścigu
  const startRace = () => {
    if (!isClient) return

    try {
      const now = Date.now()

      // Synchronizuj dane
      syncData("raceStatus_synced", "running")
      syncData("raceStartTime_synced", now)

      // Aktualizuj stan lokalny
      setStartTime(now)
      setIsRaceRunning(true)
    } catch (error) {
      console.error("Error starting race:", error)
    }
  }

  // Funkcja do zatrzymania wyścigu
  const stopRace = () => {
    if (!isClient) return

    try {
      // Synchronizuj dane
      syncData("raceStatus_synced", "finished")

      // Aktualizuj stan lokalny
      setIsRaceRunning(false)

      // Wyemituj zdarzenie zatrzymania wyścigu
      window.dispatchEvent(new Event("race-stopped"))
    } catch (error) {
      console.error("Error stopping race:", error)
    }
  }

  // Funkcja do resetowania wyścigu
  const resetRace = () => {
    if (!isClient) return

    try {
      // Synchronizuj dane
      syncData("raceStatus_synced", "ready")
      syncData("raceStartTime_synced", 0)

      // Aktualizuj stan lokalny
      setIsRaceRunning(false)
      setStartTime(0)
    } catch (error) {
      console.error("Error resetting race:", error)
    }
  }

  // Funkcja do importowania zawodów
  const importCompetition = (newCompetition: Competition) => {
    if (!isClient) return

    try {
      // Synchronizuj dane
      syncData("competition_synced", newCompetition)

      // Ustaw bieżącą serię na 1 lub pierwszą dostępną
      const firstHeatNumber = newCompetition.heats.length > 0 ? newCompetition.heats[0].number : 1
      syncData("currentHeat_synced", firstHeatNumber)

      // Aktualizuj stan lokalny
      setCompetition(newCompetition)
      setCurrentHeat(firstHeatNumber)
    } catch (error) {
      console.error("Error importing competition:", error)
    }
  }

  // Funkcja do ustawiania bieżącej serii
  const updateCurrentHeat = (heatNumber: number) => {
    if (!isClient) return

    try {
      // Synchronizuj dane
      syncData("currentHeat_synced", heatNumber)

      // Aktualizuj stan lokalny
      setCurrentHeat(heatNumber)
    } catch (error) {
      console.error("Error updating current heat:", error)
    }
  }

  // Funkcja do pobierania danych zawodnika na podstawie toru
  const getSwimmerByLane = (lane: number): Swimmer | undefined => {
    if (!competition) return undefined

    try {
      const currentHeatData = competition.heats.find((heat) => heat.number === currentHeat)
      if (!currentHeatData) return undefined

      return currentHeatData.swimmers.find((swimmer) => swimmer.lane === Number(lane))
    } catch (error) {
      console.error("Error getting swimmer by lane:", error)
      return undefined
    }
  }

  // Funkcja do dodawania wyniku
  const addResult = (result: Result) => {
    if (!isClient) return

    try {
      console.log("Adding result:", result)

      // Dodaj wynik do stanu
      setResults((prevResults) => {
        // Sprawdź, czy wynik dla tego toru i serii już istnieje
        const existingIndex = prevResults.findIndex((r) => r.lane === result.lane && r.heat === result.heat)

        let newResults
        if (existingIndex >= 0) {
          // Aktualizuj istniejący wynik
          newResults = [...prevResults]
          newResults[existingIndex] = result
        } else {
          // Dodaj nowy wynik
          newResults = [...prevResults, result]
        }

        // Synchronizuj dane
        syncData("raceResults_synced", newResults)

        return newResults
      })

      // Sprawdź, czy wszyscy zawodnicy ukończyli wyścig
      setTimeout(() => {
        if (isRaceRunning && checkAllFinished()) {
          console.log("All swimmers finished, stopping race")
          stopRace()
        }
      }, 100) // Małe opóźnienie, aby stan wyników został zaktualizowany
    } catch (error) {
      console.error("Error adding result:", error)
    }
  }

  // Funkcja do pobierania zajętych torów w bieżącej serii
  const getOccupiedLanes = (): number[] => {
    if (!competition) return []

    try {
      const currentHeatData = competition.heats.find((heat) => heat.number === currentHeat)
      if (!currentHeatData) return []

      return currentHeatData.swimmers.map((swimmer) => swimmer.lane)
    } catch (error) {
      console.error("Error getting occupied lanes:", error)
      return []
    }
  }

  // Funkcja do pobierania torów, które ukończyły wyścig w bieżącej serii
  const getFinishedLanes = (): string[] => {
    try {
      return results.filter((result) => result.heat === currentHeat).map((result) => result.lane)
    } catch (error) {
      console.error("Error getting finished lanes:", error)
      return []
    }
  }

  // Funkcja sprawdzająca, czy wszyscy zawodnicy ukończyli wyścig
  const checkAllFinished = (): boolean => {
    try {
      const occupiedLanes = getOccupiedLanes()
      const finishedLanes = getFinishedLanes().map(Number)

      console.log("Checking if all finished. Occupied lanes:", occupiedLanes, "Finished lanes:", finishedLanes)

      // Sprawdź, czy wszystkie zajęte tory mają już wyniki
      return (
        occupiedLanes.length > 0 &&
        finishedLanes.length > 0 &&
        occupiedLanes.every((lane) => finishedLanes.includes(lane))
      )
    } catch (error) {
      console.error("Error checking if all finished:", error)
      return false
    }
  }

  return (
    <RaceContext.Provider
      value={{
        isRaceRunning,
        startTime,
        competition,
        currentHeat,
        results,
        startRace,
        stopRace,
        resetRace,
        importCompetition,
        setCurrentHeat: updateCurrentHeat,
        getSwimmerByLane,
        addResult,
        getOccupiedLanes,
        getFinishedLanes,
        checkAllFinished,
      }}
    >
      {children}
    </RaceContext.Provider>
  )
}

export function useRace() {
  const context = useContext(RaceContext)
  if (context === undefined) {
    throw new Error("useRace must be used within a RaceProvider")
  }
  return context
}
