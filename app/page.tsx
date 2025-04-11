import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RaceStatusIndicator } from "./components/race-status-indicator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-center">System pomiaru czasu na zawody pływackie</h1>
      <div className="mb-6 flex justify-center">
        <RaceStatusIndicator />
      </div>

      <Alert className="mb-6 max-w-md">
        <Info className="h-4 w-4" />
        <AlertTitle>Ważna informacja</AlertTitle>
        <AlertDescription>
          Aby korzystać z systemu na wielu urządzeniach, należy otworzyć tę samą stronę na wszystkich urządzeniach.
          Sędzia główny powinien korzystać z panelu sędziego głównego, a sędziowie torowi z panelu sędziego torowego.
          <br />
          <br />
          <strong>Uwaga:</strong> Synchronizacja działa tylko w obrębie jednej przeglądarki (np. między kartami). Aby
          uzyskać najlepsze wyniki, zaleca się korzystanie z tej samej przeglądarki na wszystkich urządzeniach.
        </AlertDescription>
      </Alert>

      <div className="grid w-full max-w-md gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sędzia główny</CardTitle>
            <CardDescription>Rozpocznij wyścig i kontroluj pomiar czasu</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/judge" className="w-full">
              <Button className="w-full">Panel sędziego głównego</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sędzia torowy</CardTitle>
            <CardDescription>Zatrzymaj czas dla przypisanego toru</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/lane-judge" className="w-full">
              <Button className="w-full">Panel sędziego torowego</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wyniki</CardTitle>
            <CardDescription>Zobacz i zapisz wyniki zawodów</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/results" className="w-full">
              <Button className="w-full">Zobacz wyniki</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
