import type React from "react"
// v1.0.2 - Identidad de autor verificada


import "./globals.css"
import "./themes.css"
import "./print.css"
import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AuthCheck from "@/components/auth-check"
import FirebaseRealtimeSync from "@/components/firebase-realtime-sync"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })

export const metadata: Metadata = {
  title: "Caravalia - Digital Concierge",
  description: "Sistema de gestión y reservas premium para Caravalia",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Caravalia',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#003829',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${manrope.variable} bg-surface text-on-surface font-body min-h-screen antialiased`}>
        <ThemeProvider>
          <FirebaseRealtimeSync />
          <AuthCheck>{children}</AuthCheck>
        </ThemeProvider>
      </body>
    </html>
  )
}
