import { Bloqueo } from "./types"
import { v4 as uuidv4 } from "uuid"
import { guardarBloqueoFirebase, eliminarBloqueoFirebase } from "./firebase-adapter"
import { isFirebaseActivo } from "./firebase-client"

const STORAGE_KEY = "caravalia-bloqueos"

export function obtenerBloqueos(): Bloqueo[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error al obtener bloqueos:", error)
    return []
  }
}

export function guardarBloqueosLocal(bloqueos: Bloqueo[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bloqueos))
  // Disparar evento para reactividad
  window.dispatchEvent(new Event("storage"))
}

export async function guardarBloqueo(bloqueo: Bloqueo): Promise<void> {
  const bloqueos = obtenerBloqueos()
  const index = bloqueos.findIndex(b => b.id === bloqueo.id)
  
  const nuevoBloqueo = {
    ...bloqueo,
    updatedAt: new Date().toISOString()
  }

  if (index >= 0) {
    bloqueos[index] = nuevoBloqueo
  } else {
    bloqueos.push(nuevoBloqueo)
  }

  guardarBloqueosLocal(bloqueos)

  // Sincronizar con Firebase
  if (isFirebaseActivo()) {
    try {
      const exito = await guardarBloqueoFirebase(nuevoBloqueo)
      if (exito) {
        nuevoBloqueo.sincronizado = true
        guardarBloqueosLocal(bloqueos.map(b => b.id === nuevoBloqueo.id ? nuevoBloqueo : b))
      }
    } catch (e) {
      console.error("Error sincronizando bloqueo:", e)
    }
  }
}

export async function eliminarBloqueo(id: string): Promise<void> {
  const bloqueos = obtenerBloqueos()
  const filtrados = bloqueos.filter(b => b.id !== id)
  guardarBloqueosLocal(filtrados)

  if (isFirebaseActivo()) {
    try {
      await eliminarBloqueoFirebase(id)
    } catch (e) {
      console.error("Error eliminando bloqueo en nube:", e)
    }
  }
}

export function generarIDBloqueo(): string {
  return uuidv4()
}
