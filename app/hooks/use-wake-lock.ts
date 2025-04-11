"use client"

import { useState, useEffect, useCallback } from "react"

interface WakeLockSentinel {
  release: () => Promise<void>
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
}

interface WakeLock {
  request: (type: string) => Promise<WakeLockSentinel>
}

interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: WakeLock
}

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sprawdź, czy API Wake Lock jest dostępne
  useEffect(() => {
    if (!isClient) return

    const nav = navigator as NavigatorWithWakeLock
    setIsSupported(!!nav.wakeLock)
  }, [isClient])

  // Funkcja do żądania blokady wygaszania ekranu
  const request = useCallback(async () => {
    if (!isClient) return false
    if (!isSupported) return false

    try {
      const nav = navigator as NavigatorWithWakeLock
      const sentinel = await nav.wakeLock!.request("screen")

      setWakeLockSentinel(sentinel)
      setIsActive(true)
      setError(null)

      // Nasłuchuj zdarzenia zwolnienia blokady
      const handleRelease = () => {
        setIsActive(false)
        setWakeLockSentinel(null)
      }

      sentinel.addEventListener("release", handleRelease as EventListener)

      return true
    } catch (err) {
      // Zapisz błąd, ale nie przerywaj działania aplikacji
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      console.warn("Wake Lock API niedostępne:", errorMessage)
      return false
    }
  }, [isClient, isSupported])

  // Funkcja do zwalniania blokady wygaszania ekranu
  const release = useCallback(async () => {
    if (!isClient) return false
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release()
        setIsActive(false)
        setWakeLockSentinel(null)
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        console.warn("Nie udało się zwolnić blokady wygaszania ekranu:", errorMessage)
        return false
      }
    }
    return false
  }, [isClient, wakeLockSentinel])

  // Automatycznie próbuj ponownie zablokować ekran po powrocie do karty
  // ale tylko jeśli poprzednia próba się powiodła
  useEffect(() => {
    if (!isClient) return

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isActive && !wakeLockSentinel && !error) {
        await request()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isClient, isActive, wakeLockSentinel, request, error])

  return { isSupported, isActive, error, request, release }
}
