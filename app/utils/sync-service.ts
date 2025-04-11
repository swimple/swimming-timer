// Unikalny identyfikator dla tego urządzenia
let deviceId = ""

// Inicjalizacja identyfikatora urządzenia
export function initDeviceId() {
  if (typeof window === "undefined") return

  // Sprawdź, czy mamy już identyfikator urządzenia
  let storedDeviceId = localStorage.getItem("deviceId")

  if (!storedDeviceId) {
    // Jeśli nie, wygeneruj nowy
    storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem("deviceId", storedDeviceId)
  }

  deviceId = storedDeviceId
  return deviceId
}

// Pobierz identyfikator urządzenia
export function getDeviceId() {
  if (typeof window === "undefined") return ""

  if (!deviceId) {
    return initDeviceId()
  }

  return deviceId
}

// Funkcja do synchronizacji danych między urządzeniami
export function syncData(key: string, data: any, forceUpdate = false) {
  if (typeof window === "undefined") return

  try {
    // Dodaj znacznik czasowy i identyfikator urządzenia
    const syncedData = {
      data,
      timestamp: Date.now(),
      deviceId: getDeviceId(),
      forceUpdate,
    }

    // Zapisz dane w localStorage
    localStorage.setItem(key, JSON.stringify(syncedData))

    // Zapisz czas ostatniej synchronizacji
    localStorage.setItem("lastSync", Date.now().toString())

    // Wyemituj zdarzenie storage dla innych kart/okien
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error(`Error syncing data for key ${key}:`, error)
  }
}

// Funkcja do pobierania zsynchronizowanych danych
export function getSyncedData<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const storedData = localStorage.getItem(key)

    if (!storedData) {
      return defaultValue
    }

    const parsedData = JSON.parse(storedData)
    return parsedData.data
  } catch (e) {
    console.error(`Error parsing synced data for key ${key}:`, e)
    return defaultValue
  }
}

// Funkcja do nasłuchiwania zmian w danych
export function listenForDataChanges(callback: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorageChange = () => {
    callback()
  }

  window.addEventListener("storage", handleStorageChange)

  return () => {
    window.removeEventListener("storage", handleStorageChange)
  }
}

// Funkcja do regularnego sprawdzania zmian
export function startPolling(callback: () => void, interval = 1000) {
  if (typeof window === "undefined") return () => {}

  const intervalId = setInterval(() => {
    callback()
  }, interval)

  return () => {
    clearInterval(intervalId)
  }
}
