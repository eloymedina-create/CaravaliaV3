"use client"
import { isFirebaseActivo } from "./firebase-client"
import { guardarEventoFirebase, eliminarEventoFirebase } from "./firebase-adapter"

export interface EventoEspecial {
  id: string
  fecha: string // Formato YYYY-MM-DD
  titulo: string
  descripcion?: string
  color: string // Por defecto naranja: #FF8C00
}

const STORAGE_KEY = "caravalia_eventos_especiales"

export const obtenerEventos = (): EventoEspecial[] => {
  if (typeof window === "undefined") return []
  const guardados = localStorage.getItem(STORAGE_KEY)
  if (!guardados) return []
  try {
    return JSON.parse(guardados)
  } catch (e) {
    return []
  }
}

export const guardarEvento = (evento: EventoEspecial): boolean => {
  try {
    const eventos = obtenerEventos()
    const index = eventos.findIndex((e) => e.fecha === evento.fecha)
    
    if (index !== -1) {
      eventos[index] = evento
    } else {
      eventos.push(evento)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos))
    window.dispatchEvent(new Event("storage"))

    if (isFirebaseActivo()) {
      guardarEventoFirebase({ ...evento, sincronizado: true })
      // Marcar también en local como sincronizado
      const syncedEventos = eventos.map(e => e.fecha === evento.fecha ? { ...e, sincronizado: true } : e)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedEventos))
    }
    return true
  } catch (e) {
    return false
  }
}

export const eliminarEvento = (fecha: string): boolean => {
  try {
    const eventos = obtenerEventos()
    const filtrados = eventos.filter((e) => e.fecha !== fecha)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados))
    window.dispatchEvent(new Event("storage"))

    if (isFirebaseActivo()) {
      eliminarEventoFirebase(fecha)
    }
    return true
  } catch (e) {
    return false
  }
}

export const obtenerEventoPorFecha = (fecha: string): EventoEspecial | undefined => {
  const eventos = obtenerEventos()
  return eventos.find((e) => e.fecha === fecha)
}

export const guardarRangoEventos = (fechaInicio: string, fechaFin: string, detalles: Omit<EventoEspecial, 'id' | 'fecha'>): boolean => {
  try {
    const eventos = obtenerEventos()
    const start = new Date(fechaInicio + "T12:00:00")
    const end = new Date(fechaFin + "T12:00:00")
    
    const current = new Date(start)
    while (current <= end) {
      const fechaIso = current.toISOString().split('T')[0]
      const index = eventos.findIndex((e) => e.fecha === fechaIso)
      
      const nuevoEvento: EventoEspecial = {
        id: fechaIso,
        fecha: fechaIso,
        ...detalles
      }
      
      if (index !== -1) {
        eventos[index] = nuevoEvento
      } else {
        eventos.push(nuevoEvento)
      }
      
      current.setDate(current.getDate() + 1)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos))
    window.dispatchEvent(new Event("storage"))

    if (isFirebaseActivo()) {
      // Guardar todos los eventos del rango en Firebase
      const start = new Date(fechaInicio + "T12:00:00")
      const end = new Date(fechaFin + "T12:00:00")
      const current = new Date(start)
      const syncedEventos = [...eventos]
      
      while (current <= end) {
        const fechaIso = current.toISOString().split('T')[0]
        const evData = {
          id: fechaIso,
          fecha: fechaIso,
          ...detalles,
          sincronizado: true
        }
        guardarEventoFirebase(evData)
        
        // Actualizar en la lista local para marcar como sincronizado
        const idx = syncedEventos.findIndex(e => e.fecha === fechaIso)
        if (idx >= 0) syncedEventos[idx].sincronizado = true
        
        current.setDate(current.getDate() + 1)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedEventos))
    }
    return true
  } catch (e) {
    return false
  }
}

export const eliminarRangoEventos = (fechaInicio: string, fechaFin: string): boolean => {
  try {
    const eventos = obtenerEventos()
    const start = new Date(fechaInicio + "T12:00:00")
    const end = new Date(fechaFin + "T12:00:00")
    
    const filtrados = eventos.filter(e => {
      const f = new Date(e.fecha + "T12:00:00")
      return f < start || f > end
    })
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados))
    window.dispatchEvent(new Event("storage"))

    if (isFirebaseActivo()) {
      // Eliminar rango en Firebase
      const start = new Date(fechaInicio + "T12:00:00")
      const end = new Date(fechaFin + "T12:00:00")
      const current = new Date(start)
      while (current <= end) {
        const fechaIso = current.toISOString().split('T')[0]
        eliminarEventoFirebase(fechaIso)
        current.setDate(current.getDate() + 1)
      }
    }
    return true
  } catch (e) {
    return false
  }
}
