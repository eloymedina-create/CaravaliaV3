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
  escucharBloqueosFirebase,
  escucharEventosFirebase,
  escucharConfigFirebase,
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

        // --- LÓGICA DE FUSIÓN (MERGE) INTELIGENTE (v2) ---
        // 1. Las reservas de la nube son la "Verdad Absoluta". Las marcamos como sincronizadas.
        const mapaReservas = new Map<string, any>()
        reservas.forEach(r => {
          mapaReservas.set(r.id, { ...r, sincronizado: true })
        })

        // 2. Procesamos las reservas locales para decidir si mantenerlas o borrarlas
        const ahora = new Date().getTime()
        const CINCO_MIN_EN_MS = 5 * 60 * 1000 // Margen de seguridad para reservas recién creadas

        reservasLocales.forEach(local => {
          if (!mapaReservas.has(local.id)) {
            // SI LA RESERVA LOCAL NO ESTÁ EN LA NUBE:
            
            // CASO A: Ya estaba sincronizada anteriormente.
            // Significa que existía en la nube pero ha sido BORRADA en otro dispositivo.
            if (local.sincronizado === true) {
              console.log(`[Realtime] Eliminando reserva local borrada en nube: ${local.numeroReserva}`)
              return // No la añadimos al mapa (se borra)
            }
            
            // CASO B: NO estaba sincronizada o es una reserva antigua (undefined).
            // La preservamos para no perder datos históricos que podrían no estar en Firebase.
            console.log(`[Realtime] Preservando reserva local (offline o antigua): ${local.numeroReserva}`)
            mapaReservas.set(local.id, local)
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

    // 3. Bloqueos
    const unsubBloqueos = escucharBloqueosFirebase((bloqueosNube) => {
      try {
        const rawLocal = localStorage.getItem("caravalia-bloqueos")
        const bloqueosLocales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapaBloqueos = new Map(bloqueosNube.map(b => [b.id, { ...b, sincronizado: true }]))

        bloqueosLocales.forEach(local => {
          if (!mapaBloqueos.has(local.id)) {
            if (local.sincronizado === true) return
            mapaBloqueos.set(local.id, local)
          }
        })

        const listaFinal = Array.from(mapaBloqueos.values())
        localStorage.setItem("caravalia-bloqueos", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
        console.log(`[Realtime] Sincronizados ${listaFinal.length} bloqueos`)
      } catch (error) {
        console.error("Error sincronizando bloqueos:", error)
      }
    })

    // 4. Eventos
    const unsubEventos = escucharEventosFirebase((eventosNube) => {
      try {
        const rawLocal = localStorage.getItem("caravalia_eventos_especiales")
        const eventosLocales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapaEventos = new Map(eventosNube.map(e => [e.id, { ...e, sincronizado: true }]))

        eventosLocales.forEach(local => {
          if (!mapaEventos.has(local.id)) {
            if (local.sincronizado === true) return
            mapaEventos.set(local.id, local)
          }
        })

        const listaFinal = Array.from(mapaEventos.values())
        localStorage.setItem("caravalia_eventos_especiales", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
        console.log(`[Realtime] Sincronizados ${listaFinal.length} eventos especiales`)
      } catch (error) {
        console.error("Error sincronizando eventos:", error)
      }
    })

    // 5. Configuración
    const unsubConfig = escucharConfigFirebase((configNube) => {
      try {
        if (configNube) {
          console.log("[Realtime] Actualizando configuración global...")
          localStorage.setItem("caravalia_app_config", JSON.stringify(configNube))
          window.dispatchEvent(new Event("storage"))
        }
      } catch (error) {
        console.error("Error sincronizando configuración:", error)
      }
    })

    // 6. Gastos
    const unsubGastos = escucharGastosFirebase((gastosNube) => {
      try {
        const rawLocal = localStorage.getItem("gastos")
        const gastosLocales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapa = new Map(gastosNube.map(g => [g.id, { ...g, sincronizado: true }]))

        gastosLocales.forEach(local => {
          if (!mapa.has(local.id) && local.sincronizado !== true) {
            mapa.set(local.id, local)
          }
        })

        const listaFinal = Array.from(mapa.values())
        localStorage.setItem("gastos", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
        console.log(`[Realtime] Sincronizados ${listaFinal.length} gastos`)
      } catch (error) {
        console.error("Error sincronizando gastos:", error)
      }
    })

    // 7. Precios de Referencia
    const unsubPreciosRef = escucharPreciosReferenciaFirebase((preciosNube) => {
      try {
        const rawLocal = localStorage.getItem("preciosReferencia")
        const locales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapa = new Map(preciosNube.map(p => [p.modeloId, { ...p, sincronizado: true }]))

        locales.forEach(local => {
          if (!mapa.has(local.modeloId) && local.sincronizado !== true) {
            mapa.set(local.modeloId, local)
          }
        })

        const listaFinal = Array.from(mapa.values())
        localStorage.setItem("preciosReferencia", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
      } catch (error) {
        console.error("Error sincronizando precios ref:", error)
      }
    })

    // 8. Registros de Precios
    const unsubRegistros = escucharRegistrosPreciosFirebase((registrosNube) => {
      try {
        const rawLocal = localStorage.getItem("registrosPrecios")
        const locales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapa = new Map(registrosNube.map(r => [r.id, { ...r, sincronizado: true }]))

        locales.forEach(local => {
          if (!mapa.has(local.id) && local.sincronizado !== true) {
            mapa.set(local.id, local)
          }
        })

        const listaFinal = Array.from(mapa.values())
        localStorage.setItem("registrosPrecios", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
      } catch (error) {
        console.error("Error sincronizando registros precios:", error)
      }
    })

    // 9. Usuarios
    const unsubUsuarios = escucharUsuariosFirebase((usuariosNube) => {
      try {
        const rawLocal = localStorage.getItem("caravalia-usuarios")
        const locales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        
        // La nube manda, pero preservamos locales no sincronizados
        const mapa = new Map(usuariosNube.map(u => [u.id || u.nombre, { ...u, sincronizado: true }]))

        locales.forEach(local => {
          const id = local.id || local.nombre
          if (!mapa.has(id) && local.sincronizado !== true) {
            mapa.set(id, local)
          }
        })

        const listaFinal = Array.from(mapa.values())
        if (listaFinal.length > 0) {
          localStorage.setItem("caravalia-usuarios", JSON.stringify(listaFinal))
          window.dispatchEvent(new Event("storage"))
          console.log(`[Realtime] Sincronizados ${listaFinal.length} usuarios`)
        }
      } catch (error) {
        console.error("Error sincronizando usuarios:", error)
      }
    })

    // 10. Vales
    const unsubVales = escucharValesFirebase((valesNube) => {
      try {
        const rawLocal = localStorage.getItem("caravalia-vales")
        const locales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapa = new Map(valesNube.map(v => [v.id, { ...v, sincronizado: true }]))

        locales.forEach(local => {
          if (!mapa.has(local.id) && local.sincronizado !== true) {
            mapa.set(local.id, local)
          }
        })

        const listaFinal = Array.from(mapa.values())
        localStorage.setItem("caravalia-vales", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
      } catch (error) {
        console.error("Error sincronizando vales:", error)
      }
    })

    // 11. Plantillas
    const unsubPlantillas = escucharPlantillasFirebase((plantillasNube) => {
      try {
        const rawLocal = localStorage.getItem("plantillasDocumentos")
        const locales: any[] = rawLocal ? JSON.parse(rawLocal) : []
        const mapa = new Map(plantillasNube.map(p => [p.id, { ...p, sincronizado: true }]))

        locales.forEach(local => {
          if (!mapa.has(local.id) && local.sincronizado !== true) {
            mapa.set(local.id, local)
          }
        })

        const listaFinal = Array.from(mapa.values())
        localStorage.setItem("plantillasDocumentos", JSON.stringify(listaFinal))
        window.dispatchEvent(new Event("storage"))
      } catch (error) {
        console.error("Error sincronizando plantillas:", error)
      }
    })

    // Limpieza al desmontar
    return () => {
      console.log("FirebaseRealtimeSync: Cerrando suscripciones...")
      unsubReservas()
      unsubAutos()
      unsubBloqueos()
      unsubGastos()
      unsubPreciosRef()
      unsubRegistros()
      unsubUsuarios()
      unsubVales()
      unsubPlantillas()
      unsubEventos()
      unsubConfig()
    }
  }, [])

  return null // Componente invisible
}
