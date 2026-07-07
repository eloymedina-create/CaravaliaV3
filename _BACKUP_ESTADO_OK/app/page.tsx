"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { NuevoAutocaravanaIcon } from "@/components/icons/nuevo-autocaravana-icon"
import { obtenerAutocaravanas, inicializarAutocaravanas, limpiarCache } from "@/lib/autocaravanas-store"
import type { Autocaravana } from "@/lib/types"
import { SyncStatus } from "@/components/sync-status"
import { useMockMode, setMockMode } from "@/lib/sheets-api"
import { sincronizacionBidireccional, descargarReservasDesdeNube } from "@/lib/sync-utils"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import { obtenerGastosFirebase } from "@/lib/firebase-adapter"
import { guardarGastosLocal } from "@/lib/rentabilidad-store"

export default function HomePage() {
  const [autocaravanas, setAutocaravanas] = useState<Autocaravana[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mockMode = useMockMode()


  // Nombre de usuario activo desde localStorage o sesión local 
  // En una app real, usarías el store, aquí simulamos que lo leemos si existe
  const [usuarioNombres, setUsuarioNombre] = useState<string>("")

  const [sincronizando, setSincronizando] = useState(false)
  const [resultadoSync, setResultadoSync] = useState<"success" | "error" | null>(null)
  const [mensajeSync, setMensajeSync] = useState("")

  useEffect(() => {
    // Si existe algún store para el usuario activo, podemos recuperarlo aquí
    // El store que usaste guarda el nombre en tu state manager
    // A modo de ejemplo obtenemos el nombre almacenado o default
    const getUsername = () => {
      try {
        const stored = localStorage.getItem("activeUser")
        if (stored) return stored
      } catch (e) {}
      return "Administrador"
    }
    setUsuarioNombre(getUsername())

    const cargarAutocaravanas = async () => {
      try {
        setIsLoading(true)
        limpiarCache()
        inicializarAutocaravanas()
        const todasLasAutocaravanas = obtenerAutocaravanas()
        const autocaravanasActivas = todasLasAutocaravanas.filter((a) => a.activa)
        setAutocaravanas(autocaravanasActivas)
        setError(null)
      } catch (err) {
        console.error("Error al cargar autocaravanas:", err)
        setError("Error al cargar las autocaravanas. Por favor, recarga la página.")
      } finally {
        setIsLoading(false)
      }
    }

    localStorage.removeItem("reservaDetalles")
    localStorage.removeItem("reservaCliente")

    cargarAutocaravanas()

    window.addEventListener("storage", cargarAutocaravanas)
    return () => window.removeEventListener("storage", cargarAutocaravanas)
  }, [])

  useEffect(() => {
    try {
      if (mockMode) {
        console.log("Modo simulación activado por defecto")
      }
    } catch (e) {
      console.error("Error al inicializar el modo de simulación:", e)
      try {
        setMockMode(true)
      } catch (err) {
        console.error("No se pudo activar el modo de simulación:", err)
      }
    }
  }, [mockMode])

  const autocaravanasCards = useMemo(() => {
    return autocaravanas.map((autocaravana) => (
      <Link key={autocaravana.id} href={`/reserva/${encodeURIComponent(autocaravana.modelo)}`} className="w-full flex items-center justify-between bg-[#063b2c] text-white px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md mb-4 group">
        <div className="flex flex-col items-start text-left">
          <span className="font-headline font-bold text-2xl tracking-tighter">{autocaravana.modelo}</span>
          <span className="text-[13px] opacity-80 font-body tracking-wide mt-1">{autocaravana.matricula} • Activa</span>
        </div>
        <span className="material-symbols-outlined text-3xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </Link>
    ))
  }, [autocaravanas])

  if (error) {
    return (
      <main className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-6">
        <div className="bg-[#ffdad6] text-[#93000a] rounded-3xl p-6 max-w-md w-full shadow-sm">
          <h2 className="text-xl font-bold font-headline mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">error</span> Error
          </h2>
          <p className="font-body mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#93000a] text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider w-full hover:opacity-90"
          >
            Recargar
          </button>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F9F9F8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#e1e3e2] border-t-[#063b2c] rounded-full animate-spin"></div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-start w-full min-h-screen bg-[#F9F9F8] selection:bg-[#baeed9] selection:text-[#002117] relative">
      
      {/* Absolute top-right User Profile */}
      <div className="absolute top-6 right-6 flex flex-col items-center cursor-pointer group" onClick={() => {
        localStorage.removeItem("auth-token")
        sessionStorage.removeItem("adminAuthenticated")
        window.location.href = "/login"
      }}>
        <div className="w-10 h-10 rounded-full bg-[#063b2c] text-white flex items-center justify-center mb-1 shadow-sm group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-xl">person</span>
        </div>
        <span className="text-xs font-bold font-headline text-[#063b2c]">{usuarioNombres}</span>
        <span className="text-[9px] uppercase tracking-tighter text-[#3a4a43] opacity-60">Cerrar Sesión</span>
      </div>

      <div className="absolute top-6 left-6">
        <SyncStatus />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center relative px-4 py-16 md:py-24">
        
        {resultadoSync === "success" && (
          <Alert className="mb-8 bg-[#dcfce7] border-[#bbf7d0] w-full rounded-[2rem] shadow-sm">
            <span className="material-symbols-outlined h-5 w-5 text-[#166534] relative top-1">check_circle</span>
            <AlertTitle className="text-[#14532d] ml-8 tracking-tight font-headline font-bold">Sincronización exitosa</AlertTitle>
            <AlertDescription className="text-[#166534] ml-8 font-body text-sm mt-1">{mensajeSync}</AlertDescription>
          </Alert>
        )}

        {resultadoSync === "error" && (
          <Alert variant="destructive" className="mb-8 w-full rounded-[2rem] shadow-sm border-none bg-[#ffdad6]">
            <span className="material-symbols-outlined h-5 w-5 text-[#93000a] relative top-1">error</span>
            <AlertTitle className="text-[#93000a] ml-8 tracking-tight font-headline font-bold">Error de sincronización</AlertTitle>
            <AlertDescription className="text-[#93000a] ml-8 font-body text-sm mt-1">{mensajeSync}</AlertDescription>
          </Alert>
        )}

        {/* Branding Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-32 h-32 relative mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
              alt="Caravalia Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#003829] font-headline">Caravalia</h1>
        </div>

        {/* Section: Autocaravanas Cards */}
        <div className="w-full relative z-10 mb-4">
          {autocaravanasCards}
        </div>

        {/* Actions Stack */}
        <div className="w-full space-y-4 relative z-10">
          
          <Link href="/reservas" className="w-full flex items-center justify-between bg-[#e1e3e2] text-[#3a4a43] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] shadow-sm">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#191c1c]">Listado de Reservas</span>
            </div>
            <span className="material-symbols-outlined text-[1.75rem]">receipt_long</span>
          </Link>

          <button onClick={() => window.open("https://calendar.google.com", "_blank")} className="w-full flex items-center justify-between bg-[#d4e7dd] text-[#1b4d3e] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] shadow-sm">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#003829]">Calendario</span>
            </div>
            <span className="material-symbols-outlined text-[1.75rem]">calendar_today</span>
          </button>

          <Link href="/autocaravanas" className="w-full flex items-center justify-between bg-[#baeed9] text-[#002117] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] shadow-sm">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#002117]">Flota</span>
            </div>
            <NuevoAutocaravanaIcon size={28} className="text-[#002117] opacity-80" />
          </Link>

          <Link href="/precios" className="w-full flex items-center justify-between bg-[#e7e8e7] text-[#191c1c] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] shadow-sm">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#191c1c]">Tarifas</span>
            </div>
            <span className="material-symbols-outlined text-[1.75rem]">sell</span>
          </Link>
          
          <Link href="/documentos" className="w-full flex items-center justify-between bg-[#f3f4f3] text-[#191c1c] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] shadow-sm">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#191c1c]">Documentos</span>
            </div>
            <span className="material-symbols-outlined text-[1.75rem]">description</span>
          </Link>

          <Link href="/vales" className="w-full flex items-center justify-between bg-[#FFF4D6] text-[#784112] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm border border-[#FFECC5]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#784112]">Vales Regalo</span>
            </div>
            <span className="material-symbols-outlined text-[1.75rem]">card_giftcard</span>
          </Link>

          <Link href="/admin" className="w-full flex items-center justify-between bg-[#ffdad6] text-[#93000a] px-8 py-6 rounded-[2.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] shadow-sm">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-xl tracking-tight text-[#410002]">Admin & Sync</span>
            </div>
            <span className="material-symbols-outlined text-[1.75rem]">shield_person</span>
          </Link>
        </div>
        
        {/* Aesthetic Detail */}
        <div className="mt-16 w-full flex flex-col items-center">
          <div className="w-full border-t border-dashed border-[#c0c9c3] mb-6"></div>
          <p className="text-[11px] font-headline tracking-[0.2em] font-medium uppercase text-[#707974]">
            © V3 E.Medina 2026
          </p>
        </div>


      </div>
    </main>
  )
}
