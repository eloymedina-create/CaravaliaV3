import type { ValeDescuento, ValeHistorico } from "./types"
import { obtenerUsuarioActivo } from "./usuarios-store"

// Claves para almacenar los vales en localStorage
const VALES_STORAGE_KEY = "caravalia-vales"
const VALES_HISTORY_STORAGE_KEY = "caravalia-vales-history"
const VALES_COUNTER_PREFIX = "caravalia-vales-counter-"

// Función para generar un UUID válido
function generarUUID(): string {
  try {
    return crypto.randomUUID()
  } catch (error) {
    console.error("Error al generar UUID:", error)
    return "10000000-1000-4000-a000-000000000000".replace(/[0]/g, () => Math.floor(Math.random() * 16).toString(16))
  }
}

// --- HISTORIAL ---

// Obtener el historial completo
export function obtenerHistoricoVales(): ValeHistorico[] {
  try {
    if (typeof window === "undefined") return []
    const historyJSON = localStorage.getItem(VALES_HISTORY_STORAGE_KEY)
    if (!historyJSON) return []
    const history = JSON.parse(historyJSON)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error("Error al obtener historial de vales:", error)
    return []
  }
}

// Registrar una nueva acción en el historial
export function registrarAccionVale(vale: Partial<ValeDescuento>, accion: ValeHistorico["accion"], descripcion: string): void {
  try {
    const history = obtenerHistoricoVales()
    const nuevoLog: ValeHistorico = {
      id: generarUUID(),
      fecha: new Date().toISOString(),
      valeId: vale.id || "n/a",
      numeroVale: vale.numeroVale || "S/N",
      accion,
      descripcion,
      usuario: obtenerUsuarioActivo()
    }
    
    history.unshift(nuevoLog) // Añadir al principio (más reciente primero)
    // Limitar a los últimos 200 registros para no saturar localStorage
    const historyLimitado = history.slice(0, 200)
    localStorage.setItem(VALES_HISTORY_STORAGE_KEY, JSON.stringify(historyLimitado))
    
    // Sincronización básica con Firebase (opcional, por ahora local es prioridad según plan)
    console.log(`Log registrado: ${descripcion} por ${nuevoLog.usuario}`)
  } catch (error) {
    console.error("Error al registrar acción de vale:", error)
  }
}

// --- VALES ---

// Función para obtener todos los vales
export function obtenerVales(): ValeDescuento[] {
  try {
    if (typeof window === "undefined") return []
    const valesJSON = localStorage.getItem(VALES_STORAGE_KEY)
    if (!valesJSON) return []

    const vales = JSON.parse(valesJSON)
    return Array.isArray(vales) ? vales : []
  } catch (error) {
    console.error("Error al obtener vales:", error)
    return []
  }
}

// Función para guardar un vale (crear o actualizar)
export function guardarVale(vale: ValeDescuento): boolean {
  try {
    const esNuevo = !vale.id
    if (esNuevo) {
      vale.id = generarUUID()
    }

    const vales = obtenerVales()
    const index = vales.findIndex((v) => v.id === vale.id)

    if (index >= 0) {
      vales[index] = { ...vales[index], ...vale }
      registrarAccionVale(vale, "edicion", `Vale ${vale.numeroVale} editado por ${obtenerUsuarioActivo()}`)
    } else {
      vales.push(vale)
      registrarAccionVale(vale, "creacion", `Vale ${vale.numeroVale} creado para ${vale.titular.nombre} por ${obtenerUsuarioActivo()}`)
    }

    localStorage.setItem(VALES_STORAGE_KEY, JSON.stringify(vales))
    
    // Actualizar contador persistente si es un vale nuevo
    if (esNuevo) {
      actualizarContadorVale(vale.numeroVale)
    }
    
    // Sincronización con Firebase
    if (typeof window !== "undefined" && navigator.onLine) {
        import("./firebase-adapter").then(({ guardarValeFirebase }) => {
            guardarValeFirebase(vale)
        }).catch(err => console.error("Error sincronizando vale con Firebase:", err))
    }
    
    return true
  } catch (error) {
    console.error("Error al guardar vale:", error)
    return false
  }
}

// Función para obtener un vale por ID
export function obtenerValePorId(id: string): ValeDescuento | null {
  const vales = obtenerVales()
  return vales.find((v) => v.id === id) || null
}

// Función para eliminar un vale
export function eliminarVale(id: string): boolean {
  try {
    const vales = obtenerVales()
    const valeAEliminar = vales.find(v => v.id === id)
    if (!valeAEliminar) return false

    const nuevosVales = vales.filter((v) => v.id !== id)
    localStorage.setItem(VALES_STORAGE_KEY, JSON.stringify(nuevosVales))
    
    // Registrar eliminación
    registrarAccionVale(valeAEliminar, "eliminacion", `Vale ${valeAEliminar.numeroVale} borrado por ${obtenerUsuarioActivo()}`)
    
    // Sincronización con Firebase
    if (typeof window !== "undefined" && navigator.onLine) {
        import("./firebase-adapter").then(({ eliminarValeFirebase }) => {
            eliminarValeFirebase(id)
        }).catch(err => console.error("Error eliminando vale de Firebase:", err))
    }
    
    return true
  } catch (error) {
    console.error("Error al eliminar vale:", error)
    return false
  }
}

// Función para obtener el siguiente número de vale sugerido (PERSISTENTE)
export function obtenerSiguienteNumeroVale(añoActual: number): string {
  try {
    const claveContador = `${VALES_COUNTER_PREFIX}${añoActual}`
    let ultimoNum = 0
    
    // 1. Intentar obtener el contador persistente de localStorage
    const guardado = localStorage.getItem(claveContador)
    if (guardado) {
      ultimoNum = parseInt(guardado, 10)
    } else {
      // 2. Si no hay contador, inicializarlo mirando los vales existentes
      const vales = obtenerVales()
      const valesDelAño = vales.filter(v => {
        try {
          return new Date(v.fechaCreacion).getFullYear() === añoActual
        } catch (e) { return false }
      })
      
      if (valesDelAño.length > 0) {
        const numeros = valesDelAño.map(v => {
          const partes = v.numeroVale.split('-')
          return parseInt(partes[partes.length - 1], 10) || 0
        })
        ultimoNum = Math.max(...numeros, 0)
      }
    }

    // REGLA DE NEGOCIO: Empezar en 200 para el año 2026 si el contador es menor
    if (añoActual === 2026 && ultimoNum < 200) {
      ultimoNum = 200
      localStorage.setItem(claveContador, "200")
    }

    const siguiente = ultimoNum + 1
    
    return `VALE-${añoActual}-${siguiente.toString().padStart(3, '0')}`
  } catch (error) {
    console.error("Error al calcular siguiente número de vale:", error)
    // Fallback con base 200 para 2026
    const base = añoActual === 2026 ? 200 : 0
    return `VALE-${añoActual}-${(base + 1).toString().padStart(3, '0')}`
  }
}

// Función para confirmar y actualizar el contador persistente
export function actualizarContadorVale(numeroVale: string): void {
  try {
    const partes = numeroVale.split('-') // VALE-2026-001
    if (partes.length < 3) return
    
    const año = partes[1]
    const num = parseInt(partes[2], 10)
    const claveContador = `${VALES_COUNTER_PREFIX}${año}`
    
    const actual = parseInt(localStorage.getItem(claveContador) || "0", 10)
    if (num > actual) {
      localStorage.setItem(claveContador, num.toString())
    }
  } catch (e) {
    console.error("Error actualizando contador de vales:", e)
  }
}

// Función para marcar un vale como asignado a una reserva
export function asignarValeAReserva(valeId: string, reservaId: string, numeroReserva?: string): boolean {
  const vale = obtenerValePorId(valeId)
  if (!vale || vale.estado === 'asignado') return false

  const exito = guardarVale({
    ...vale,
    estado: 'asignado',
    reservaId: reservaId,
    fechaAsignacion: new Date().toISOString()
  })

  if (exito) {
    registrarAccionVale(vale, "asignacion", `Vale ${vale.numeroVale} asignado a la reserva ${numeroReserva || reservaId.substring(0,8)} por ${obtenerUsuarioActivo()}`)
  }
  
  return exito
}

// Función para liberar un vale
export function liberarVale(valeId: string, motivo?: string): boolean {
  const vale = obtenerValePorId(valeId)
  if (!vale) return false

  const exito = guardarVale({
    ...vale,
    estado: 'disponible',
    reservaId: undefined,
    fechaAsignacion: undefined
  })

  if (exito) {
    registrarAccionVale(vale, "liberacion", `Vale ${vale.numeroVale} liberado${motivo ? ' ('+motivo+')' : ''} por ${obtenerUsuarioActivo()}`)
  }

  return exito
}
