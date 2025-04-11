"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi } from "lucide-react"
import { getDeviceId } from "../utils/sync-service"

export function SyncStatus() {
  const [isClient, setIsClient] = useState(false)
  const [deviceId, setDeviceId] = useState("")

  // Check if we're in the browser
  useEffect(() => {
    setIsClient(true)
    setDeviceId(getDeviceId().substring(0, 8) + "...")
  }, [])

  if (!isClient) return null

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      >
        <Wifi className="w-3 h-3" />
        {deviceId}
      </Badge>
    </div>
  )
}
