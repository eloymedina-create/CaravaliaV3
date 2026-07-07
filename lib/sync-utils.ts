import { obtenerReservas as obtenerReservasLocales, guardarReserva } from "./reservas-store"
import { isFirebaseActivo, comprobarConexionFirebase } from "./firebase-client"
import {
  obtenerReservasFirebase,
  guardarReservaFirebase,
  obtenerAutocaravanasFirebase,
  guardarAutocaravanaFirebase,
  obtenerGastosFirebase,
  guardarGastoFirebase,
  obtenerPreciosReferenciaFirebase,
  guardarPrecioReferenciaFirebase,
  obtenerRegistrosPreciosFirebase,
  guardarRegistroPrecioFirebase,
  limpiarColeccionFirebase,
  obtenerEventosFirebase,
  guardarEventoFirebase,
  obtenerConfigFirebase,
  guardarConfigFirebase,
  eliminarEventoFirebase,
} from "./firebase-adapter"
import { obtenerAutocaravanas as obtenerAutosLocales, guardarAutocaravana as guardarAutoLocal } from "./autocaravanas-store"
import { obtenerGastosLocal, guardarGastosLocal } from "./rentabilidad-store"
import { obtenerPreciosReferenciaLocal, guardarPreciosReferenciaLocal, obtenerRegistrosPreciosLocal, guardarRegistrosPreciosLocal } from "./precios-store"
import { obtenerEventos } from "./eventos-store"
import { obtenerConfiguracion, guardarConfiguracion } from "./config-store"

// Función para sincronizar reservas con Firebase (subir datos locales a Firebase)
export async function sincronizarReservasConFirebase(): Promise<{
  exito: boolean
  mensaje: string
  reservasSincronizadas: number
}> {
  try {
    console.log("Iniciando sincronización de reservas con Firebase...")

    // Verificar que Firebase esté activo
    if (!isFirebaseActivo()) {
      return {
        exito: false,
        mensaje: "Firebase no está activado. Actívalo en Configuración.",
        reservasSincronizadas: 0,
      }
    }

    // Verificar conexión con Firebase
    const conectado = await comprobarConexionFirebase()
    if (!conectado) {
      return {
        exito: false,
        mensaje: "No se pudo establecer conexión con Firebase. Verifica tu conexión a internet y las credenciales.",
        reservasSincronizadas: 0,
      }
    }

    // Obtener todas las reservas locales
    const reservasLocales = obtenerReservasLocales()
    console.log(`Se encontraron ${reservasLocales.length} reservas locales para sincronizar`)

    // Contador de éxitos y errores
    let exitosos = 0
    let fallidos = 0

    // Sincronizar cada reserva
    for (const reserva of reservasLocales) {
      try {
        console.log(`Sincronizando reserva ${reserva.id} (${reserva.modelo})...`)
        const resultado = await guardarReservaFirebase(reserva)

        if (resultado) {
          exitosos++
          console.log(`Reserva ${reserva.id} sincronizada exitosamente`)
        } else {
          fallidos++
          console.error(`Error al sincronizar reserva ${reserva.id}`)
        }
      } catch (error) {
        fallidos++
        console.error(`Error al sincronizar reserva ${reserva.id}:`, error)
      }
    }

    // Generar mensaje de resultado
    let mensaje = `Sincronización completada. ${exitosos} reservas sincronizadas exitosamente.`
    if (fallidos > 0) {
      mensaje += ` ${fallidos} reservas fallaron al sincronizar.`
    }

    // Actualizar la hora de última sincronización
    localStorage.setItem("lastSyncTime", new Date().toLocaleString())

    return {
      exito: fallidos === 0,
      mensaje,
      reservasSincronizadas: exitosos,
    }
  } catch (error) {
    console.error("Error al sincronizar reservas con Firebase:", error)
    return {
      exito: false,
      mensaje: `Error al sincronizar reservas: ${error instanceof Error ? error.message : "Error desconocido"}`,
      reservasSincronizadas: 0,
    }
  }
}

// Función para descargar reservas desde Firebase y guardarlas localmente
export async function descargarReservasDesdeFirebase(): Promise<{
  exito: boolean
  mensaje: string
  reservasDescargadas: number
}> {
  try {
    console.log("Descargando reservas desde Firebase...")

    // Verificar que Firebase esté activo
    if (!isFirebaseActivo()) {
      return {
        exito: false,
        mensaje: "Firebase no está activado. Actívalo en Configuración.",
        reservasDescargadas: 0,
      }
    }

    // Verificar conexión con Firebase
    const conectado = await comprobarConexionFirebase()
    if (!conectado) {
      return {
        exito: false,
        mensaje: "No se pudo establecer conexión con Firebase. Verifica tu conexión a internet y las credenciales.",
        reservasDescargadas: 0,
      }
    }

    // Obtener todas las reservas de Firebase
    const reservasFirebase = await obtenerReservasFirebase()
    console.log(`Se encontraron ${reservasFirebase.length} reservas en Firebase`)

    // Contador de reservas guardadas localmente
    let reservasGuardadas = 0

    // Guardar cada reserva en localStorage
    for (const reserva of reservasFirebase) {
      try {
        const resultado = guardarReserva(reserva)
        if (resultado) {
          reservasGuardadas++
        }
      } catch (error) {
        console.error(`Error al guardar reserva ${reserva.id} localmente:`, error)
      }
    }

    // Actualizar la hora de última sincronización
    localStorage.setItem("lastSyncTime", new Date().toLocaleString())

    return {
      exito: true,
      mensaje: `Descarga completada. ${reservasGuardadas} de ${reservasFirebase.length} reservas descargadas.`,
      reservasDescargadas: reservasGuardadas,
    }
  } catch (error) {
    console.error("Error durante la descarga desde Firebase:", error)
    return {
      exito: false,
      mensaje: `Error durante la descarga: ${error instanceof Error ? error.message : "Error desconocido"}`,
      reservasDescargadas: 0,
    }
  }
}

// Función para forzar la sincronización (puede ser llamada desde un botón)
export async function forzarSincronizacion(): Promise<{
  exito: boolean
  mensaje: string
}> {
  try {
    // Si estamos en modo simulación, simular éxito
    const useMockMode = localStorage.getItem("useMockApi") === "true"
    if (useMockMode) {
      console.log("Modo simulación: Simulando sincronización exitosa")
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return {
        exito: true,
        mensaje: "Sincronización simulada completada con éxito.",
      }
    }

    // Si no hay conexión, no intentar sincronizar
    if (!navigator.onLine) {
      console.log("Sin conexión: No se puede sincronizar")
      return {
        exito: false,
        mensaje: "No hay conexión a Internet. No se puede sincronizar.",
      }
    }

    // Sincronizar con Firebase
    const resultado = await sincronizarReservasConFirebase()
    return {
      exito: resultado.exito,
      mensaje: resultado.mensaje,
    }
  } catch (error) {
    console.error("Error durante la sincronización:", error)
    return {
      exito: false,
      mensaje: `Error durante la sincronización: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}

// ── Sincronización de Autocaravanas ──
export async function sincronizarAutocaravanasTotal(): Promise<void> {
  if (!isFirebaseActivo()) return
  
  // 1. Descargar desde Firebase
  const autosFirebase = await obtenerAutocaravanasFirebase()
  if (autosFirebase.length >= 0) {
    // Sobrescribir local con lo que hay en la nube (Autoridad Cloud)
    localStorage.setItem("caravalia-autocaravanas", JSON.stringify(autosFirebase))
  }

  // 2. Subir locales que no estén en Firebase (Opcional, usualmente los locales ya se subieron al guardar)
  const autosLocales = obtenerAutosLocales()
  for (const auto of autosLocales) {
    await guardarAutocaravanaFirebase(auto)
  }
}

// ── Sincronización de Gastos ──
export async function sincronizarGastosTotal(): Promise<void> {
  if (!isFirebaseActivo()) return
  const gastosFirebase = await obtenerGastosFirebase()
  if (gastosFirebase.length >= 0) {
    guardarGastosLocal(gastosFirebase)
  }
}

// ── Sincronización de Precios ──
export async function sincronizarPreciosTotal(): Promise<void> {
  if (!isFirebaseActivo()) return
  
  const preciosRefFirebase = await obtenerPreciosReferenciaFirebase()
  if (preciosRefFirebase.length >= 0) {
    guardarPreciosReferenciaLocal(preciosRefFirebase)
  }

  const registrosFirebase = await obtenerRegistrosPreciosFirebase()
  if (registrosFirebase.length >= 0) {
    guardarRegistrosPreciosLocal(registrosFirebase)
  }
}

// Función completa para sincronizar en ambas direcciones
export async function sincronizacionBidireccional(): Promise<{
  exito: boolean
  mensaje: string
}> {
  try {
    const useMockMode = localStorage.getItem("useMockApi") === "true"
    if (useMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { exito: true, mensaje: "Sincronización simulada completada." }
    }

    if (!navigator.onLine) {
      return { exito: false, mensaje: "Sin conexión a internet." }
    }

    // ── VALIDADOR DE CONFIGURACIÓN ──
    const { isFirebaseActivo } = await import("./firebase-adapter")
    if (!isFirebaseActivo()) {
      return { exito: false, mensaje: "Cloud no configurado. Ve a Ajustes > Sincronización Nube." }
    }

    console.log("Iniciando Reconciliación Global (Firebase)...")

    // Ejecutar pasos de forma secuencial con manejo de errores granular
    const pasos = [
      { nombre: "Reservas", fn: async () => {
        await descargarReservasDesdeFirebase()
        await sincronizarReservasConFirebase()
      }},
      { nombre: "Autocaravanas", fn: sincronizarAutocaravanasTotal },
      { nombre: "Gastos", fn: sincronizarGastosTotal },
      { nombre: "Precios", fn: sincronizarPreciosTotal },
      { nombre: "Eventos", fn: async () => {
        const evs = await obtenerEventosFirebase()
        if (evs.length >= 0) localStorage.setItem("caravalia_eventos_especiales", JSON.stringify(evs))
      }},
      { nombre: "Config", fn: async () => {
        const conf = await obtenerConfigFirebase()
        if (conf) guardarConfiguracion(conf)
      }}
    ]

    const errores: string[] = []
    for (const paso of pasos) {
      try {
        console.log(`Sincronizando ${paso.nombre}...`)
        await paso.fn()
      } catch (e) {
        console.error(`Fallo en paso ${paso.nombre}:`, e)
        errores.push(paso.nombre)
      }
    }

    // Notificar a la UI
    window.dispatchEvent(new Event("storage"))

    if (errores.length > 0) {
      return {
        exito: false,
        mensaje: `Sincronización parcial. Errores en: ${errores.join(", ")}. Por favor, verifica la configuración de estas secciones.`
      }
    }

    return {
      exito: true,
      mensaje: "Sincronización Total exitosa. V2.1 operativa y en paridad con la Nube.",
    }
  } catch (error) {
    console.error("Error crítico en sincronización:", error)
    return { exito: false, mensaje: "Error crítico de infraestructura. Revisa la configuración de Firebase." }
  }
}

// ── Alias de compatibilidad para evitar romper imports existentes ──
export const sincronizarReservasNube = sincronizarReservasConFirebase
export const descargarReservasDesdeNube = descargarReservasDesdeFirebase


// ── Sobreescritura Total (Para Restauración) ──
export async function sobreescribirNubeConLocal(): Promise<{
  exito: boolean
  mensaje: string
}> {
  try {
    if (!isFirebaseActivo()) return { exito: true, mensaje: "Firebase no activo." }

    console.log("🔥 INICIANDO SOBREESCRITURA TOTAL DE LA NUBE...")

    // 1. Limpiar colecciones en Firebase
    await limpiarColeccionFirebase("reservas")
    await limpiarColeccionFirebase("autocaravanas")
    await limpiarColeccionFirebase("gastos")
    await limpiarColeccionFirebase("precios_referencia")
    await limpiarColeccionFirebase("registros_precios")

    // 2. Subir datos locales actuales
    
    // Reservas
    const reservas = obtenerReservasLocales()
    for (const r of reservas) await guardarReservaFirebase(r)
    
    // Autos
    const autos = obtenerAutosLocales()
    for (const a of autos) await guardarAutocaravanaFirebase(a)
    
    // Gastos
    const gastos = obtenerGastosLocal()
    for (const g of gastos) await guardarGastoFirebase(g)
    
    // Precios
    const preciosRef = obtenerPreciosReferenciaLocal()
    for (const p of preciosRef) await guardarPrecioReferenciaFirebase(p)
    
    const registros = obtenerRegistrosPreciosLocal()
    for (const reg of registros) await guardarRegistroPrecioFirebase(reg)

    // Eventos
    const eventos = obtenerEventos()
    for (const e of eventos) await guardarEventoFirebase(e)

    // Config
    const config = obtenerConfiguracion()
    await guardarConfigFirebase(config)

    // Notificar cambio
    window.dispatchEvent(new Event("storage"))

    return {
      exito: true,
      mensaje: "Nube sobreescrita con éxito con los datos locales.",
    }
  } catch (error) {
    console.error("Error al sobreescribir la nube:", error)
    return { exito: false, mensaje: "Error al limpiar/subir datos a la nube." }
  }
}
