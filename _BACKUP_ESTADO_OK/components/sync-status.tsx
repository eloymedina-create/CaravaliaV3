"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CloudIcon as CloudSync, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { isFirebaseActivo, comprobarConexionFirebase, obtenerReservasFirebase } from "@/lib/firebase-adapter"

export function SyncStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [reservasCount, setReservasCount] = useState<number | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true)
      try {
        const useMockMode = localStorage.getItem("useMockApi") === "true"

        if (useMockMode) {
          setStatus("connected")
          setReservasCount(5)
          setLastSyncTime(localStorage.getItem("lastSyncTime") || "Nunca")
          setIsLoading(false)
          return
        }

        if (isFirebaseActivo()) {
          const connected = await comprobarConexionFirebase()
          
          if (connected) {
            setStatus("connected")
            const reservas = await obtenerReservasFirebase()
            setReservasCount(reservas.length)
            setLastSyncTime(localStorage.getItem("lastSyncTime") || "Nunca")
          } else {
            setStatus("error")
          }
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.error("Error al verificar estado de sincronización:", error)
        setStatus("error")
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()

    // Verificar cada 5 minutos
    const interval = setInterval(checkStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 hover:bg-gray-200 gap-1 py-1">
        <CloudSync className="h-3.5 w-3.5 animate-pulse" />
        <span className="text-xs">Verificando...</span>
      </Badge>
    )
  }

  if (status === "error") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="gap-1 py-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs">Sin conexión</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>No se pudo conectar con la Nube (Firebase)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 gap-1 py-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-xs">
              Conectado con Nube (Firebase) {reservasCount !== null ? `(${reservasCount} reservas)` : ""}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>Última sincronización: {lastSyncTime}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
