import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { RaceProvider } from "./context/race-context"
import { SyncStatus } from "./components/sync-status"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "System pomiaru czasu na zawody pływackie",
  description: "Aplikacja do pomiaru czasu na zawodach pływackich",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RaceProvider>
            {children}
            <SyncStatus />
          </RaceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'