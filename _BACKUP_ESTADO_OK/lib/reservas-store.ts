import type { ReservaCompleta } from "./types"

// Clave para almacenar las reservas en localStorage
const RESERVAS_STORAGE_KEY = "caravalia-reservas"

// Función para generar un UUID válido
function generarUUID(): string {
  try {
    return crypto.randomUUID()
  } catch (error) {
    console.error("Error al generar UUID:", error)
    // Fallback en caso de que randomUUID no esté disponible
    return "10000000-1000-4000-a000-000000000000".replace(/[0]/g, () => Math.floor(Math.random() * 16).toString(16))
  }
}

// Función para verificar si localStorage está disponible
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "testLocalStorage"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

// Función para obtener todas las reservas
export function obtenerReservas(): ReservaCompleta[] {
  try {
    const reservasJSON = localStorage.getItem(RESERVAS_STORAGE_KEY)
    if (!reservasJSON) return []

    const reservas = JSON.parse(reservasJSON)
    return Array.isArray(reservas) ? reservas : []
  } catch (error) {
    console.error("Error al obtener reservas:", error)
    return []
  }
}

// Función para guardar una reserva
export function guardarReserva(reserva: ReservaCompleta): boolean {
  try {
    // Asegurarse de que la reserva tenga un ID válido
    if (!reserva.id) {
      reserva.id = generarUUID()
    }

    // Obtener todas las reservas existentes
    const reservas = obtenerReservas()

    // Verificar si la reserva ya existe
    const index = reservas.findIndex((r) => r.id === reserva.id)

    if (index >= 0) {
      // Actualizar la reserva existente
      reservas[index] = { ...reservas[index], ...reserva }
    } else {
      // Añadir la nueva reserva
      reservas.push(reserva)
    }

    // Guardar las reservas actualizadas
    localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservas))
    return true
  } catch (error) {
    console.error("Error al guardar reserva:", error)
    return false
  }
}

// Función para eliminar una reserva
export function eliminarReserva(id: string): boolean {
  try {
    // Obtener todas las reservas
    const reservas = obtenerReservas()

    // Filtrar la reserva a eliminar
    const reservasActualizadas = reservas.filter((r) => r.id !== id)

    // Guardar las reservas actualizadas
    localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservasActualizadas))
    return true
  } catch (error) {
    console.error("Error al eliminar reserva:", error)
    return false
  }
}

// Función para obtener una reserva por ID
export function obtenerReservaPorId(id: string): ReservaCompleta | null {
  try {
    const reservas = obtenerReservas()
    return reservas.find((r) => r.id === id) || null
  } catch (error) {
    console.error("Error al obtener reserva por ID:", error)
    return null
  }
}

// Función para obtener una reserva por número y modelo
export function obtenerReservaPorNumeroYModelo(numeroReserva: string, modelo: string): ReservaCompleta | null {
  try {
    const reservas = obtenerReservas()
    return reservas.find((r) => r.numeroReserva === numeroReserva && r.modelo === modelo) || null
  } catch (error) {
    console.error("Error al obtener reserva por número y modelo:", error)
    return null
  }
}

// Función para crear una nueva reserva
export function crearNuevaReserva(reserva: Omit<ReservaCompleta, "id">): ReservaCompleta {
  const nuevaReserva: ReservaCompleta = {
    ...reserva,
    id: generarUUID(),
  }

  guardarReserva(nuevaReserva)

  // Sincronizar automáticamente con Firebase después de crear una nueva reserva
  if (navigator.onLine) {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      import("./firebase-client").then(({ isFirebaseActivo }) => {
        if (!isFirebaseActivo()) {
          console.log("Firebase no está activo. La reserva solo se guardó localmente.")
          return
        }
        console.log("Sincronizando nueva reserva con Firebase...")
        import("./firebase-adapter").then(({ guardarReservaFirebase }) => {
          guardarReservaFirebase(nuevaReserva)
            .then(() => {
              console.log("Nueva reserva sincronizada con Firebase:", nuevaReserva.id)
              localStorage.setItem("lastSyncTime", new Date().toLocaleString())
            })
            .catch((error) => {
              console.error("Error al sincronizar nueva reserva con Firebase:", error)
            })
        })
      })
    } catch (error) {
      console.error("Error al intentar sincronizar nueva reserva con Firebase:", error)
    }
  } else {
    console.log("Sin conexión a Internet. La reserva se sincronizará más tarde.")
  }

  return nuevaReserva
}

// Función para actualizar una reserva existente
export function actualizarReserva(id: string, datos: Partial<ReservaCompleta>): boolean {
  try {
    const reserva = obtenerReservaPorId(id)
    if (!reserva) return false

    const reservaActualizada: ReservaCompleta = {
      ...reserva,
      ...datos,
    }

    return guardarReserva(reservaActualizada)
  } catch (error) {
    console.error("Error al actualizar reserva:", error)
    return false
  }
}

// Función para buscar reservas
export function buscarReservas(termino: string): ReservaCompleta[] {
  try {
    const reservas = obtenerReservas()
    if (!termino) return reservas

    const terminoLower = termino.toLowerCase()
    return reservas.filter(
      (r) =>
        r.numeroReserva.toLowerCase().includes(terminoLower) ||
        r.modelo.toLowerCase().includes(terminoLower) ||
        r.cliente.nombre.toLowerCase().includes(terminoLower) ||
        r.cliente.dni.toLowerCase().includes(terminoLower) ||
        r.cliente.telefono.toLowerCase().includes(terminoLower),
    )
  } catch (error) {
    console.error("Error al buscar reservas:", error)
    return []
  }
}

// Función para exportar todas las reservas
export function exportarReservasJSON(): string {
  try {
    const reservas = obtenerReservas()
    return JSON.stringify(reservas)
  } catch (error) {
    console.error("Error al exportar reservas:", error)
    return ""
  }
}

// Función para importar reservas
export function importarReservasJSON(json: string): boolean {
  try {
    const reservas = JSON.parse(json)
    if (!Array.isArray(reservas)) {
      throw new Error("El formato de importación no es válido")
    }

    // Asegurarse de que todas las reservas tengan un ID válido
    const reservasConId = reservas.map((reserva) => {
      if (!reserva.id) {
        reserva.id = generarUUID()
      }
      return reserva
    })

    localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservasConId))
    return true
  } catch (error) {
    console.error("Error al importar reservas:", error)
    return false
  }
}

// Función para limpiar todas las reservas
export function limpiarReservas(): boolean {
  try {
    localStorage.removeItem(RESERVAS_STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error al limpiar reservas:", error)
    return false
  }
}

// Función para limpiar la caché
export function limpiarCache(): void {
  // No hacemos nada aquí para evitar problemas
  // localStorage.removeItem(RESERVAS_STORAGE_KEY)
  console.log("Función limpiarCache() llamada pero no se limpiará la caché para evitar problemas")
}

// Función para generar un ID único
export function generarId(): string {
  return generarUUID()
}

// Función para obtener todas las reservas (alias para compatibilidad)
export function obtenerReservasLocalSync(): ReservaCompleta[] {
  return obtenerReservas()
}

// ── LÓGICA DE NUMERACIÓN ANUAL ──

/**
 * Obtiene el siguiente número de reserva sugerido para un año específico.
 * Busca el número más alto existente en ese año y le suma 1.
 */
export function obtenerSiguienteNumeroReserva(año: number): string {
  try {
    const reservas = obtenerReservas()
    
    // Filtrar reservas que se crearon en el año indicado
    const reservasDelAño = reservas.filter(r => {
      if (!r.fechaCreacion) return false
      try {
        const fecha = new Date(r.fechaCreacion)
        return fecha.getFullYear() === año
      } catch (e) {
        return false
      }
    })

    if (reservasDelAño.length === 0) {
      return "1"
    }

    // Extraer la parte numérica de numeroReserva y encontrar el máximo
    const numeros = reservasDelAño.map(r => {
      const match = r.numeroReserva.match(/\d+/)
      return match ? Number.parseInt(match[0], 10) : 0
    })

    const max = Math.max(...numeros, 0)
    return (max + 1).toString()
  } catch (error) {
    console.error("Error al calcular siguiente número de reserva:", error)
    return "1"
  }
}

/**
 * Verifica si ya existe una reserva con un número específico en un año determinado.
 */
export function verificarDuplicadoEnAño(numero: string, año: number): boolean {
  try {
    const reservas = obtenerReservas()
    return reservas.some(r => {
      if (!r.fechaCreacion || r.numeroReserva !== numero) return false
      try {
        const fecha = new Date(r.fechaCreacion)
        return fecha.getFullYear() === año
      } catch (e) {
        return false
      }
    })
  } catch (error) {
    console.error("Error al verificar duplicado:", error)
    return false
  }
}
