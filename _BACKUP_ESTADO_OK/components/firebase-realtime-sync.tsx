"use client"

import { useEffect } from "react"
import { isFirebaseActivo } from "@/lib/firebase-client"
import {
  escucharReservasFirebase,
  escucharAutocaravanasFirebase,
  escucharGastosFirebase,
  escucharPreciosReferenciaFirebase,
  escucharRegistrosPreciosFirebase,
  escucharUsuariosFirebase,
  escucharValesFirebase,
  escucharPlantillasFirebase,
} from "@/lib/firebase-adapter"

/**
 * Componente invisible encargado de gestionar las suscripciones en tiempo real a Firebase.
 * Actualiza el localStorage local cuando ocurren cambios en la nube.
 */
export default function FirebaseRealtimeSync() {
  useEffect(() => {
    // Solo activar si Firebase está configurado y activo
    if (!isFirebaseActivo()) {
      console.log("FirebaseRealtimeSync: Firebase no activo. Saltando suscripciones.")
      return
    }

    console.log("FirebaseRealtimeSync: Iniciando suscripciones en tiempo real...")

    // 1. Reservas
    const unsubReservas = escucharReservasFirebase((reservas) => {
      if (reservas && Array.isArray(reservas)) {
        console.log(`[Realtime] Recibidas ${reservas.length} reservas de Firebase.`)
        
        // Obtener las reservas actuales de localStorage
        const reservasLocalesJSON = localStorage.getItem("caravalia-reservas")
        let reservasLocales: any[] = []
        try {
          if (reservasLocalesJSON) {
            reservasLocales = JSON.parse(reservasLocalesJSON)
          }
        } catch (e) {
          console.error("Error al parsear reservas locales:", e)
        }

        // --- LÓGICA DE FUSIÓN (MERGE) INTELIGENTE ---
        // 1. Empezamos con todas las reservas que vienen de la nube (la verdad del servidor)
        const mapaReservas = new Map<string, any>()
        reservas.forEach(r => mapaReservas.set(r.id, r))

        // 2. Buscamos reservas locales que NO estén en la nube aún
        // Esto suele ocurrir si se creó una reserva sin internet o se cerró la app muy rápido
        const ahora = new Date().getTime()
        const UN_DIA_EN_MS = 24 * 60 * 60 * 1000

        reservasLocales.forEach(local => {
          if (!mapaReservas.has(local.id)) {
            // Si la reserva local es "reciente" (menos de 24h), la mantenemos
            // porque probablemente sea una reserva nueva pendiente de subir.
            // Si es muy antigua y no está en la nube, probablemente fue eliminada en otro dispositivo.
            let esReciente = true
            if (local.fechaCreacion) {
              const fechaCreacion = new Date(local.fechaCreacion).getTime()
              esReciente = (ahora - fechaCreacion) < UN_DIA_EN_MS
            }

            if (esReciente) {
              console.log(`[Realtime] Preservando reserva local pendiente de sincronizar: ${local.numeroReserva}`)
              mapaReservas.set(local.id, local)
            }
          }
        })

        const listaFinal = Array.from(mapaReservas.values())
        
        // Guardar la lista fusionada
        localStorage.setItem("caravalia-reservas", JSON.stringify(listaFinal))
        
        // Disparar evento para que otras partes de la UI se enteren
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 2. Autocaravanas
    const unsubAutos = escucharAutocaravanasFirebase((autos) => {
      if (autos && autos.length >= 0) {
        console.log(`[Realtime] Actualizando ${autos.length} autocaravanas...`)
        localStorage.setItem("caravalia-autocaravanas", JSON.stringify(autos))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 3. Gastos
    const unsubGastos = escucharGastosFirebase((gastos) => {
      if (gastos && gastos.length >= 0) {
        console.log(`[Realtime] Actualizando ${gastos.length} gastos...`)
        localStorage.setItem("gastos", JSON.stringify(gastos))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 4. Precios de Referencia
    const unsubPreciosRef = escucharPreciosReferenciaFirebase((precios) => {
      if (precios && precios.length >= 0) {
        localStorage.setItem("preciosReferencia", JSON.stringify(precios))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 5. Registros de Precios
    const unsubRegistros = escucharRegistrosPreciosFirebase((registros) => {
      if (registros && registros.length >= 0) {
        localStorage.setItem("registrosPrecios", JSON.stringify(registros))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 6. Usuarios
    const unsubUsuarios = escucharUsuariosFirebase((usuarios) => {
      if (usuarios && usuarios.length >= 0) {
        localStorage.setItem("caravalia-usuarios", JSON.stringify(usuarios))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 7. Vales
    const unsubVales = escucharValesFirebase((vales) => {
      if (vales && vales.length >= 0) {
        localStorage.setItem("caravalia-vales", JSON.stringify(vales))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // 8. Plantillas
    const unsubPlantillas = escucharPlantillasFirebase((plantillas) => {
      if (plantillas && plantillas.length >= 0) {
        localStorage.setItem("plantillasDocumentos", JSON.stringify(plantillas))
        window.dispatchEvent(new Event("storage"))
      }
    })

    // Limpieza al desmontar
    return () => {
      console.log("FirebaseRealtimeSync: Cerrando suscripciones...")
      unsubReservas()
      unsubAutos()
      unsubGastos()
      unsubPreciosRef()
      unsubRegistros()
      unsubUsuarios()
      unsubVales()
      unsubPlantillas()
    }
  }, [])

  return null // Componente invisible
}
