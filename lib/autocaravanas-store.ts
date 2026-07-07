import type { Autocaravana } from "./types"
import { isFirebaseActivo } from "./firebase-client"
import { guardarAutocaravanaFirebase, eliminarAutocaravanaFirebase } from "./firebase-adapter"

// Clave para almacenar las autocaravanas en localStorage
const AUTOCARAVANAS_STORAGE_KEY = "caravalia-autocaravanas"

// Verificar si estamos en el navegador
const isBrowser = typeof window !== "undefined"

// Cache en memoria para evitar lecturas repetidas de localStorage
let autocaravanasCache: Autocaravana[] | null = null

// Función para inicializar las autocaravanas por defecto si no existen
export function inicializarAutocaravanas(): void {
  if (!isBrowser) return

  try {
    // Reparar posibles modelos duplicados por cambios de nombre (Migración automática)
    repararModelosDuplicados()

    // Si ya tenemos la caché, no necesitamos verificar localStorage
    if (autocaravanasCache !== null && autocaravanasCache.length > 0) {
      return
    }

    // 1. Obtener datos actuales del localStorage
    const autocaravanasGuardadas = localStorage.getItem(AUTOCARAVANAS_STORAGE_KEY)
    let listaActual: Autocaravana[] = []

    if (autocaravanasGuardadas) {
      try {
        listaActual = JSON.parse(autocaravanasGuardadas)
      } catch (e) {
        console.error("Error parseando autocaravanas:", e)
      }
    }

    // 2. Lógica de RESTAURACIÓN REGLA DE ORO (ID 1 - 294TL)
    // Si no está en la lista, la añadimos como desactivada
    if (!listaActual.find((a) => a.id === "1")) {
      console.log("Restaurando autocaravana 294TL (ID 1) por petición del usuario...")
      const restoredVans = [
        ...listaActual,
        {
          id: "1",
          modelo: "294TL",
          matricula: "9243MBV",
          activa: false,
        },
      ]
      localStorage.setItem(AUTOCARAVANAS_STORAGE_KEY, JSON.stringify(restoredVans))
      listaActual = restoredVans
      
      // Si Firebase está activo, forzar sincronización de la restaurada
      if (isFirebaseActivo()) {
        import("./firebase-adapter").then(({ guardarAutocaravanaFirebase }) => {
          guardarAutocaravanaFirebase(listaActual.find(a => a.id === "1")!)
        })
      }
    }

    // 3. Establecer caché y manejar según estado Firebase
    autocaravanasCache = listaActual

    if (isFirebaseActivo() && !autocaravanasGuardadas) {
      // Si Firebase está activo pero no hay nada local, inicializar vacío (Firebase cargará después)
      // Pero ya hemos restaurado la 294TL arriba si faltaba, así que seguimos adelante.
    }
  } catch (error) {
    console.error("Error al inicializar las autocaravanas:", error)
    autocaravanasCache = []
  }
}

// Función para obtener todas las autocaravanas
export function obtenerAutocaravanas(): Autocaravana[] {
  if (!isBrowser) return []

  try {
    // Si tenemos la caché, la devolvemos directamente
    if (autocaravanasCache !== null) {
      return [...autocaravanasCache]
    }

    // Obtener las autocaravanas del localStorage
    const autocaravanasJson = localStorage.getItem(AUTOCARAVANAS_STORAGE_KEY)

    // Si no hay autocaravanas, inicializar y devolver las por defecto
    if (!autocaravanasJson) {
      inicializarAutocaravanas()
      return obtenerAutocaravanas()
    }

    // Parsear las autocaravanas y devolverlas
    try {
      const autocaravanas = JSON.parse(autocaravanasJson)
      autocaravanasCache = autocaravanas
      return [...autocaravanas]
    } catch (parseError) {
      console.error("Error al parsear autocaravanas:", parseError)
      inicializarAutocaravanas()
      return obtenerAutocaravanas()
    }
  } catch (error) {
    console.error("Error al obtener las autocaravanas:", error)
    return []
  }
}

// Función para guardar una autocaravana
export function guardarAutocaravana(autocaravana: Autocaravana): void {
  if (!isBrowser) return

  try {
    // Obtener las autocaravanas existentes
    const autocaravanasExistentes = obtenerAutocaravanas()

    // Verificar si ya existe una autocaravana con el mismo ID
    const index = autocaravanasExistentes.findIndex((a) => a.id === autocaravana.id)
    
    // --- LÓGICA DE PROPAGACIÓN DE NOMBRE ---
    if (index >= 0) {
      const modeloAnterior = autocaravanasExistentes[index].modelo
      if (modeloAnterior !== autocaravana.modelo) {
        console.log(`Propagando cambio de nombre: ${modeloAnterior} -> ${autocaravana.modelo}`)
        propagarCambioNombreModelo(modeloAnterior, autocaravana.modelo)
      }
      
      // Actualizar la autocaravana existente
      autocaravanasExistentes[index] = autocaravana
    } else {
      // Añadir la nueva autocaravana
      autocaravanasExistentes.push(autocaravana)
    }

    // Guardar en localStorage
    localStorage.setItem(AUTOCARAVANAS_STORAGE_KEY, JSON.stringify(autocaravanasExistentes))

    // Actualizar la caché
    autocaravanasCache = autocaravanasExistentes

    // Intentar sincronizar con Firebase
    if (isFirebaseActivo()) {
      try {
        guardarAutocaravanaFirebase(autocaravana).catch((err) =>
          console.error("Error al sincronizar autocaravana con Firebase:", err),
        )
      } catch (error) {
        console.error("Error al intentar sincronizar autocaravana:", error)
      }
    }
    
    // Disparar evento para actualizar otras pantallas
    window.dispatchEvent(new Event("storage"))
  } catch (error) {
    console.error("Error al guardar la autocaravana:", error)
  }
}

/**
 * Busca todas las reservas y gastos que tengan el nombre de modelo antiguo y lo cambia al nuevo.
 */
function propagarCambioNombreModelo(nombreViejo: string, nombreNuevo: string): void {
  if (!isBrowser || !nombreViejo || !nombreNuevo || nombreViejo === nombreNuevo) return

  try {
    // 1. Sincronizar RESERVAS en todas las claves posibles
    const clavesReservas = ["reservas", "caravalia-reservas", "reservas-caravalia"]
    
    clavesReservas.forEach(clave => {
      const data = localStorage.getItem(clave)
      if (!data) return

      try {
        let reservas = JSON.parse(data)
        if (!Array.isArray(reservas)) return

        let huboCambios = false
        reservas = reservas.map((r: any) => {
          let modif = false
          if (r.modelo === nombreViejo) {
            r.modelo = nombreNuevo
            modif = true
          }
          if (r.detalles && r.detalles.modelo === nombreViejo) {
            r.detalles.modelo = nombreNuevo
            modif = true
          }
          if (modif) huboCambios = true
          return r
        })

        if (huboCambios) {
          localStorage.setItem(clave, JSON.stringify(reservas))
          console.log(`Propagación: ${nombreViejo} -> ${nombreNuevo} en clave "${clave}"`)
        }
      } catch (e) {
        console.error(`Error procesando clave ${clave}:`, e)
      }
    })

    // 2. Sincronizar GASTOS
    const GASTOS_KEY = "gastos"
    const gastosData = localStorage.getItem(GASTOS_KEY)
    if (gastosData) {
      try {
        let gastos = JSON.parse(gastosData)
        if (Array.isArray(gastos)) {
          let huboCambiosGastos = false
          gastos = gastos.map((g: any) => {
            if (g.modeloId === nombreViejo || g.modelo === nombreViejo) {
              g.modeloId = nombreNuevo
              g.modelo = nombreNuevo
              huboCambiosGastos = true
            }
            return g
          })
          
          if (huboCambiosGastos) {
            localStorage.setItem(GASTOS_KEY, JSON.stringify(gastos))
            console.log(`Propagación: ${nombreViejo} -> ${nombreNuevo} en Gastos`)
          }
        }
      } catch (e) {
        console.error("Error procesando gastos:", e)
      }
    }
  } catch (error) {
    console.error("Error crítico al propagar cambio de nombre:", error)
  }
}

/**
 * Función de utilidad para corregir el problema específico de duplicación de la 294TL.
 */
export function repararModelosDuplicados(): void {
  if (!isBrowser) return
  
  // Lista de equivalencias para unificar
  const equivalencias = [
    { viejo: "294TL-Automatica", nuevo: "294TL-Auto" },
    { viejo: "294TL-Automática", nuevo: "294TL-Auto" },
    { viejo: "294TL- AUTOMÁTICA", nuevo: "294TL-Auto" }
  ]

  equivalencias.forEach(eq => {
    propagarCambioNombreModelo(eq.viejo, eq.nuevo)
  })
  
  // Borrar marcas antiguas de filtros si fuera necesario (opcional)
}

// Función para eliminar una autocaravana
export function eliminarAutocaravana(id: string): void {
  if (!isBrowser) return

  try {
    // Obtener las autocaravanas existentes
    const autocaravanas = obtenerAutocaravanas()

    // Filtrar la autocaravana a eliminar
    const nuevasAutocaravanas = autocaravanas.filter((a) => a.id !== id)

    // Guardar las autocaravanas actualizadas
    localStorage.setItem(AUTOCARAVANAS_STORAGE_KEY, JSON.stringify(nuevasAutocaravanas))

    // Actualizar la caché
    autocaravanasCache = nuevasAutocaravanas

    // Intentar sincronizar con Firebase
    if (isFirebaseActivo()) {
      try {
        eliminarAutocaravanaFirebase(id).catch((err) =>
          console.error("Error al eliminar autocaravana de Firebase:", err),
        )
      } catch (error) {
        console.error("Error al intentar eliminar autocaravana:", error)
      }
    }
  } catch (error) {
    console.error("Error al eliminar la autocaravana:", error)
  }
}

// Función para obtener una autocaravana por su modelo
export function obtenerAutocaravanaPorModelo(modelo: string): Autocaravana | null {
  if (!isBrowser) return null

  try {
    const autocaravanas = obtenerAutocaravanas()
    const autocaravana = autocaravanas.find(
      (a) => a.modelo.trim().toLowerCase() === modelo.trim().toLowerCase()
    )
    return autocaravana || null
  } catch (error) {
    console.error("Error al obtener la autocaravana por modelo:", error)
    return null
  }
}

// Función para generar un ID único
export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Función para limpiar la caché (útil cuando se necesita forzar una recarga desde localStorage)
export function limpiarCache(): void {
  autocaravanasCache = null
}
