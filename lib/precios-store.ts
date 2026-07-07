import type { PrecioReferencia, RegistroPrecio, Temporada, FiltrosPrecio } from "./precios-types"
import { obtenerAutocaravanas } from "./autocaravanas-store"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { isFirebaseActivo } from "./firebase-client"
import {
  guardarPrecioReferenciaFirebase,
  guardarRegistroPrecioFirebase,
  obtenerPreciosReferenciaFirebase,
  obtenerRegistrosPreciosFirebase,
} from "./firebase-adapter"

// Claves para localStorage
const PRECIOS_REFERENCIA_KEY = "preciosReferencia"
const REGISTROS_PRECIOS_KEY = "registrosPrecios"
const ULTIMA_SINCRONIZACION_PRECIOS_KEY = "ultimaSincronizacionPrecios"

// Función para inicializar precios de referencia por defecto
export function inicializarPreciosReferencia() {
  const preciosGuardados = localStorage.getItem(PRECIOS_REFERENCIA_KEY)

  if (!preciosGuardados) {
    const autocaravanas = obtenerAutocaravanas()
    const añoActual = new Date().getFullYear()

    const preciosIniciales: PrecioReferencia[] = autocaravanas.map((auto) => ({
      modeloId: auto.id,
      modelo: auto.modelo,
      temporadaAlta: {
        precio: 0,
        fechaInicio: "01/07", // Julio
        fechaFin: "31/08", // Agosto
      },
      temporadaMedia: {
        precio: 0,
        fechaInicio: "01/05", // Mayo
        fechaFin: "30/06", // Junio
      },
      temporadaBaja: {
        precio: 0,
        fechaInicio: "01/09", // Septiembre
        fechaFin: "30/04", // Abril
      },
      añoActual,
      updatedAt: new Date().toISOString(),
    }))

    localStorage.setItem(PRECIOS_REFERENCIA_KEY, JSON.stringify(preciosIniciales))
    return preciosIniciales
  }

  return JSON.parse(preciosGuardados)
}

// Función para obtener precios de referencia
export function obtenerPreciosReferenciaLocal(): PrecioReferencia[] {
  const preciosGuardados = localStorage.getItem(PRECIOS_REFERENCIA_KEY)

  if (!preciosGuardados) {
    return inicializarPreciosReferencia()
  }

  return JSON.parse(preciosGuardados)
}

// Función para guardar un precio de referencia
export function guardarPrecioReferenciaLocal(precioReferencia: PrecioReferencia): void {
  const precios = obtenerPreciosReferenciaLocal()
  const index = precios.findIndex((p) => p.modeloId === precioReferencia.modeloId)

  if (index >= 0) {
    precios[index] = {
      ...precioReferencia,
      updatedAt: new Date().toISOString(),
    }
  } else {
    precios.push({
      ...precioReferencia,
      updatedAt: new Date().toISOString(),
    })
  }

  localStorage.setItem(PRECIOS_REFERENCIA_KEY, JSON.stringify(precios))
  window.dispatchEvent(new Event("storage"))


  // Intentar sincronizar con Firebase
  if (isFirebaseActivo()) {
    try {
      guardarPrecioReferenciaFirebase(precioReferencia).catch((err) =>
        console.error("Error al sincronizar precio de referencia con Firebase:", err),
      )
    } catch (error) {
      console.error("Error al intentar sincronizar precio de referencia:", error)
    }
  }
}



// Función para guardar múltiples precios de referencia
export function guardarPreciosReferenciaLocal(precios: PrecioReferencia[]): void {
  localStorage.setItem(PRECIOS_REFERENCIA_KEY, JSON.stringify(precios))
}


// Función para obtener registros de precios históricos
export function obtenerRegistrosPreciosLocal(): RegistroPrecio[] {
  const registrosGuardados = localStorage.getItem(REGISTROS_PRECIOS_KEY)

  if (!registrosGuardados) {
    return []
  }

  return JSON.parse(registrosGuardados)
}

// Función para guardar un registro de precio histórico
export function guardarRegistroPrecioLocal(registro: RegistroPrecio): void {
  const registros = obtenerRegistrosPreciosLocal()
  const index = registros.findIndex((r) => r.id === registro.id)

  if (index >= 0) {
    registros[index] = {
      ...registro,
      updatedAt: new Date().toISOString(),
    }
  } else {
    registros.push({
      ...registro,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  localStorage.setItem(REGISTROS_PRECIOS_KEY, JSON.stringify(registros))
  window.dispatchEvent(new Event("storage"))


  // Intentar sincronizar con Firebase
  if (isFirebaseActivo()) {
    try {
      guardarRegistroPrecioFirebase(registro).catch((err) =>
        console.error("Error al sincronizar registro de precio con Firebase:", err),
      )
    } catch (error) {
      console.error("Error al intentar sincronizar registro de precio:", error)
    }
  }
}

// Función para guardar múltiples registros de precios
export function guardarRegistrosPreciosLocal(registros: RegistroPrecio[]): void {
  localStorage.setItem(REGISTROS_PRECIOS_KEY, JSON.stringify(registros))
}


// Función para eliminar un registro de precio
export function eliminarRegistroPrecio(id: string): void {
  const registros = obtenerRegistrosPreciosLocal()
  const nuevosRegistros = registros.filter((r) => r.id !== id)

  localStorage.setItem(REGISTROS_PRECIOS_KEY, JSON.stringify(nuevosRegistros))
  window.dispatchEvent(new Event("storage"))
}

// Función para determinar la temporada actual basada en la fecha
export function determinarTemporada(fecha: Date, preciosReferencia: PrecioReferencia[]): Temporada {
  if (preciosReferencia.length === 0) return "media"

  // Usamos el primer modelo como referencia para las fechas de temporada
  const referencia = preciosReferencia[0]

  const mes = fecha.getMonth() + 1 // 1-12
  const dia = fecha.getDate() // 1-31

  const fechaActual = `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}`

  // Función para comparar fechas en formato DD/MM
  const compararFechas = (fecha1: string, fecha2: string): number => {
    const [dia1, mes1] = fecha1.split("/").map(Number)
    const [dia2, mes2] = fecha2.split("/").map(Number)

    if (mes1 !== mes2) return mes1 - mes2
    return dia1 - dia2
  }

  // Verificar temporada alta
  const inicioAlta = referencia.temporadaAlta.fechaInicio
  const finAlta = referencia.temporadaAlta.fechaFin

  // Manejar caso especial cuando la temporada cruza el año
  if (compararFechas(inicioAlta, finAlta) > 0) {
    if (compararFechas(fechaActual, inicioAlta) >= 0 || compararFechas(fechaActual, finAlta) <= 0) {
      return "alta"
    }
  } else if (compararFechas(fechaActual, inicioAlta) >= 0 && compararFechas(fechaActual, finAlta) <= 0) {
    return "alta"
  }

  // Verificar temporada media
  const inicioMedia = referencia.temporadaMedia.fechaInicio
  const finMedia = referencia.temporadaMedia.fechaFin

  if (compararFechas(inicioMedia, finMedia) > 0) {
    if (compararFechas(fechaActual, inicioMedia) >= 0 || compararFechas(fechaActual, finMedia) <= 0) {
      return "media"
    }
  } else if (compararFechas(fechaActual, inicioMedia) >= 0 && compararFechas(fechaActual, finMedia) <= 0) {
    return "media"
  }

  // Por defecto, temporada baja
  return "baja"
}

// Función para filtrar registros de precios según criterios
export function filtrarRegistrosPrecios(registros: RegistroPrecio[], filtros: FiltrosPrecio): RegistroPrecio[] {
  console.log("Filtrando registros con filtros:", filtros)
  console.log("Total registros antes de filtrar:", registros.length)

  // Si no hay filtros, devolver todos los registros
  if (Object.keys(filtros).length === 0) {
    return registros
  }

  return registros.filter((registro) => {
    try {
      // Filtro por fecha inicio
      if (filtros.fechaInicio) {
        const fechaRegistro = new Date(registro.fecha)
        const fechaInicio = new Date(filtros.fechaInicio)

        if (isNaN(fechaRegistro.getTime())) {
          console.warn(`Fecha inválida en registro: ${registro.id}, fecha: ${registro.fecha}`)
          return false
        }

        // Comparar solo las fechas (ignorar la hora)
        const fechaRegistroSinHora = new Date(
          fechaRegistro.getFullYear(),
          fechaRegistro.getMonth(),
          fechaRegistro.getDate(),
        )

        const fechaInicioSinHora = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate())

        console.log(
          `Comparando fecha registro: ${fechaRegistroSinHora.toISOString()} con fecha inicio: ${fechaInicioSinHora.toISOString()}`,
        )

        if (fechaRegistroSinHora < fechaInicioSinHora) {
          return false
        }
      }

      // Filtro por fecha fin
      if (filtros.fechaFin) {
        const fechaRegistro = new Date(registro.fecha)
        const fechaFin = new Date(filtros.fechaFin)

        if (isNaN(fechaRegistro.getTime())) {
          console.warn(`Fecha inválida en registro: ${registro.id}, fecha: ${registro.fecha}`)
          return false
        }

        // Comparar solo las fechas (ignorar la hora)
        const fechaRegistroSinHora = new Date(
          fechaRegistro.getFullYear(),
          fechaRegistro.getMonth(),
          fechaRegistro.getDate(),
        )

        const fechaFinSinHora = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate())

        console.log(
          `Comparando fecha registro: ${fechaRegistroSinHora.toISOString()} con fecha fin: ${fechaFinSinHora.toISOString()}`,
        )

        if (fechaRegistroSinHora > fechaFinSinHora) {
          return false
        }
      }

      // Filtro por modelo
      if (filtros.modelo && registro.modelo !== filtros.modelo) {
        return false
      }

      // Filtro por cliente (búsqueda parcial, no sensible a mayúsculas/minúsculas)
      if (
        filtros.cliente &&
        (!registro.cliente || !registro.cliente.toLowerCase().includes(filtros.cliente.toLowerCase()))
      ) {
        return false
      }

      // Filtro por temporada
      if (filtros.temporada && registro.temporada !== filtros.temporada) {
        return false
      }

      // Filtro por estado de aceptación
      if (filtros.aceptado !== undefined && registro.aceptado !== filtros.aceptado) {
        return false
      }

      return true
    } catch (error) {
      console.error(`Error al filtrar registro ${registro.id}:`, error)
      return false
    }
  })
}

// Función para obtener el precio sugerido según modelo y fecha
export function obtenerPrecioSugerido(modeloId: string, fecha: Date): number {
  const precios = obtenerPreciosReferenciaLocal()
  const precioModelo = precios.find((p) => p.modeloId === modeloId)

  if (!precioModelo) return 0

  const temporada = determinarTemporada(fecha, [precioModelo])

  switch (temporada) {
    case "alta":
      return precioModelo.temporadaAlta.precio
    case "media":
      return precioModelo.temporadaMedia.precio
    case "baja":
      return precioModelo.temporadaBaja.precio
    default:
      return 0
  }
}

// Función para generar un ID único
export function generarIdPrecio(): string {
  return crypto.randomUUID()
}

// Función para formatear fecha en formato legible de manera segura
export function formatearFecha(fechaStr: string, formatStr = "dd/MM/yyyy"): string {
  try {
    // Verificar si la fecha existe
    if (!fechaStr) return "Fecha no disponible"

    // Convertir a objeto Date si es string
    let fecha: Date
    if (typeof fechaStr === "string") {
      fecha = parseISO(fechaStr)
    } else {
      fecha = new Date(fechaStr)
    }

    // Verificar si la fecha es válida
    if (!isValid(fecha)) return "Fecha inválida"

    // Formatear la fecha
    return format(fecha, formatStr, { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return "Error en fecha"
  }
}

// Función para sincronizar precios con Firebase
export async function sincronizarPrecios(): Promise<{ exito: boolean; mensaje: string }> {
  try {
    if (!isFirebaseActivo()) {
      return { exito: false, mensaje: "Firebase no está activado." }
    }

    // Obtener datos de Firebase
    const preciosReferenciaFB = await obtenerPreciosReferenciaFirebase()
    const registrosPreciosFB = await obtenerRegistrosPreciosFirebase()

    // Obtener datos locales
    const preciosReferenciaLocal = obtenerPreciosReferenciaLocal()
    const registrosPreciosLocal = obtenerRegistrosPreciosLocal()

    // Combinar precios de referencia
    const preciosReferenciaCombinados = [...preciosReferenciaLocal]

    for (const precioFB of preciosReferenciaFB) {
      const index = preciosReferenciaCombinados.findIndex((p) => p.modeloId === precioFB.modeloId)

      if (index >= 0) {
        // Actualizar si la versión de Firebase es más reciente
        if (new Date(precioFB.updatedAt) > new Date(preciosReferenciaCombinados[index].updatedAt)) {
          preciosReferenciaCombinados[index] = precioFB
        }
      } else {
        // Añadir si no existe localmente
        preciosReferenciaCombinados.push(precioFB)
      }
    }

    // Combinar registros de precios
    const registrosPreciosCombinados = [...registrosPreciosLocal]

    for (const registroFB of registrosPreciosFB) {
      const index = registrosPreciosCombinados.findIndex((r) => r.id === registroFB.id)

      if (index >= 0) {
        // Actualizar si la versión de Firebase es más reciente
        if (new Date(registroFB.updatedAt) > new Date(registrosPreciosCombinados[index].updatedAt)) {
          registrosPreciosCombinados[index] = registroFB
        }
      } else {
        // Añadir si no existe localmente
        registrosPreciosCombinados.push(registroFB)
      }
    }

    // Guardar datos combinados en localStorage
    localStorage.setItem(PRECIOS_REFERENCIA_KEY, JSON.stringify(preciosReferenciaCombinados))
    localStorage.setItem(REGISTROS_PRECIOS_KEY, JSON.stringify(registrosPreciosCombinados))

    // Actualizar fecha de última sincronización
    localStorage.setItem(ULTIMA_SINCRONIZACION_PRECIOS_KEY, new Date().toISOString())

    return {
      exito: true,
      mensaje: `Sincronización completada: ${preciosReferenciaFB.length} precios de referencia y ${registrosPreciosFB.length} registros históricos sincronizados.`,
    }
  } catch (error) {
    console.error("Error al sincronizar precios:", error)
    return {
      exito: false,
      mensaje: `Error al sincronizar precios: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}

// Función para obtener la fecha de última sincronización
export function obtenerUltimaSincronizacionPrecios(): string | null {
  return localStorage.getItem(ULTIMA_SINCRONIZACION_PRECIOS_KEY)
}
