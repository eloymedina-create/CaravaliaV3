import type { Gasto, ResumenRentabilidad, FiltrosRentabilidad, Reserva } from "./types"
import { v4 as uuidv4 } from "uuid"
import { format, parse, isValid, getMonth, getYear, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { guardarGastoFirebase } from "./firebase-adapter"
import { isFirebaseActivo } from "./firebase-client"

// Función para obtener gastos del localStorage
export function obtenerGastosLocal(): Gasto[] {
  try {
    const gastosString = localStorage.getItem("gastos")
    if (!gastosString) return []
    return JSON.parse(gastosString)
  } catch (error) {
    console.error("Error al obtener gastos del localStorage:", error)
    return []
  }
}

// Función para guardar gastos en localStorage
export function guardarGastosLocal(gastos: Gasto[]): void {
  try {
    localStorage.setItem("gastos", JSON.stringify(gastos))
  } catch (error) {
    console.error("Error al guardar gastos en localStorage:", error)
  }
}

// Función para añadir un nuevo gasto
export async function agregarGasto(gasto: Omit<Gasto, "id" | "createdAt" | "updatedAt">): Promise<Gasto> {
  const gastos = obtenerGastosLocal()

  const nuevoGasto: Gasto = {
    id: uuidv4(),
    ...gasto,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sincronizado: false,
  }

  gastos.push(nuevoGasto)
  guardarGastosLocal(gastos)

  console.log("Gasto agregado localmente:", nuevoGasto)

  // Intentar sincronizar con Firebase
  try {
    if (isFirebaseActivo()) {
      const sincronizado = await guardarGastoFirebase(nuevoGasto)

      if (sincronizado) {
        // Actualizar el estado de sincronización en localStorage
        nuevoGasto.sincronizado = true
        const gastosActualizados = gastos.map((g) => (g.id === nuevoGasto.id ? nuevoGasto : g))
        guardarGastosLocal(gastosActualizados)
        console.log("Gasto sincronizado con Firebase:", nuevoGasto.id)
      } else {
        console.warn("No se pudo sincronizar el gasto con Firebase:", nuevoGasto.id)
      }
    }
  } catch (error) {
    console.error("Error al sincronizar gasto con Firebase:", error)
    // No lanzamos el error para que la aplicación siga funcionando
    // El gasto ya está guardado localmente
  }

  return nuevoGasto
}

// Función para actualizar un gasto existente
export async function actualizarGasto(id: string, gastoActualizado: Partial<Gasto>): Promise<Gasto | null> {
  const gastos = obtenerGastosLocal()
  const index = gastos.findIndex((g) => g.id === id)

  if (index === -1) return null

  const gastoActual = gastos[index]
  const gastoNuevo: Gasto = {
    ...gastoActual,
    ...gastoActualizado,
    updatedAt: new Date().toISOString(),
    sincronizado: false,
  }

  gastos[index] = gastoNuevo
  guardarGastosLocal(gastos)

  console.log("Gasto actualizado localmente:", id)

  // Intentar sincronizar con Firebase
  try {
    if (isFirebaseActivo()) {
      const { guardarGastoFirebase } = await import("./firebase-adapter")
      const sincronizado = await guardarGastoFirebase(gastoNuevo)

      if (sincronizado) {
        gastoNuevo.sincronizado = true
        const gastosRefrescados = gastos.map((g) => (g.id === id ? gastoNuevo : g))
        guardarGastosLocal(gastosRefrescados)
        console.log("Gasto actualizado sincronizado con Firebase:", id)
      }
    }
  } catch (error) {
    console.error("Error al sincronizar actualización de gasto con Firebase:", error)
  }

  return gastoNuevo
}

// Función para eliminar un gasto
export async function eliminarGasto(id: string): Promise<boolean> {
  const gastos = obtenerGastosLocal()
  const nuevosGastos = gastos.filter((g) => g.id !== id)

  if (nuevosGastos.length === gastos.length) {
    console.warn("No se encontró el gasto a eliminar con ID:", id)
    return false
  }

  guardarGastosLocal(nuevosGastos)
  console.log("Gasto eliminado localmente:", id)

  // Intentar sincronizar con Firebase
  try {
    if (isFirebaseActivo()) {
      const { eliminarGastoFirebase } = await import("./firebase-adapter")
      const eliminado = await eliminarGastoFirebase(id)
      if (eliminado) {
        console.log("Gasto eliminado en Firebase:", id)
      } else {
        console.warn("No se pudo eliminar el gasto en Firebase (posiblemente no existía):", id)
      }
    }
  } catch (error) {
    console.error("Error al sincronizar eliminación de gasto con Firebase:", error)
  }

  return true
}

// Función para filtrar gastos
export function filtrarGastos(filtros: FiltrosRentabilidad, usarRangoFechas = false): Gasto[] {
  const gastos = obtenerGastosLocal()

  console.log("Filtrando gastos con filtros:", filtros, "usarRangoFechas:", usarRangoFechas)
  console.log("Total de gastos:", gastos.length)

  return gastos.filter((gasto) => {
    const fechaGasto = new Date(gasto.fecha)

    if (usarRangoFechas && filtros.fechaInicio && filtros.fechaFin) {
      // Filtrar por rango de fechas
      if (
        !isWithinInterval(fechaGasto, {
          start: filtros.fechaInicio,
          end: filtros.fechaFin,
        })
      ) {
        return false
      }
    } else {
      // Filtrar por año y mes
      const añoGasto = getYear(fechaGasto)
      const mesGasto = getMonth(fechaGasto) + 1 // getMonth devuelve 0-11

      // Filtrar por año
      if (filtros.año && añoGasto !== filtros.año) return false

      // Filtrar por mes
      if (filtros.mes && mesGasto !== filtros.mes) return false
    }

    // Filtrar por modelo
    if (filtros.modeloId && gasto.modeloId !== filtros.modeloId) return false

    return true
  })
}

// Función para parsear fecha en formato dd/MM/yyyy
function parseFechaSegura(fechaStr: string): Date | null {
  try {
    if (!fechaStr) return null

    // Intentar parsear en formato dd/MM/yyyy
    const partes = fechaStr.split("/")
    if (partes.length === 3) {
      const dia = Number.parseInt(partes[0], 10)
      const mes = Number.parseInt(partes[1], 10) - 1 // Los meses en JS son 0-11
      const año = Number.parseInt(partes[2], 10)

      const fecha = new Date(año, mes, dia)

      // Verificar que la fecha es válida
      if (isValid(fecha)) {
        return fecha
      }
    }

    // Si no funciona, intentar con parse de date-fns
    const fechaParseada = parse(fechaStr, "dd/MM/yyyy", new Date())
    if (isValid(fechaParseada)) {
      return fechaParseada
    }

    // Intentar con formato ISO
    try {
      const fechaISO = parseISO(fechaStr)
      if (isValid(fechaISO)) {
        return fechaISO
      }
    } catch (e) {
      // Ignorar error
    }

    return null
  } catch (error) {
    console.error("Error al parsear fecha:", error, fechaStr)
    return null
  }
}

// Función para obtener reservas del localStorage (versión sincrónica)
export function obtenerReservasLocalSync(): Reserva[] {
  try {
    // Intentar todas las posibles claves de localStorage donde podrían estar las reservas
    const posiblesClaves = ["reservas", "caravalia-reservas", "reservas-caravalia"]
    let reservas: Reserva[] = []

    for (const clave of posiblesClaves) {
      const reservasString = localStorage.getItem(clave)
      if (reservasString) {
        try {
          const parsedReservas = JSON.parse(reservasString)
          if (Array.isArray(parsedReservas) && parsedReservas.length > 0) {
            console.log(`Se encontraron ${parsedReservas.length} reservas en localStorage con clave: ${clave}`)

            // Verificar que las reservas tienen la estructura esperada
            const reservaValida = parsedReservas.some(
              (r) =>
                r &&
                r.detalles &&
                r.detalles.fechaEntrega &&
                r.detalles.fechaDevolucion &&
                r.importeTotal !== undefined,
            )

            if (reservaValida) {
              reservas = parsedReservas
              break
            } else {
              console.log(`Las reservas encontradas en ${clave} no tienen la estructura esperada`)
            }
          }
        } catch (e) {
          console.error(`Error al parsear reservas de ${clave}:`, e)
        }
      }
    }

    // Si no se encontraron reservas, intentar buscar en window.localStorage
    if (reservas.length === 0 && typeof window !== "undefined") {
      console.log("Buscando reservas en todas las claves de localStorage...")

      // Buscar en todas las claves de localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i)
        if (clave && (clave.includes("reserva") || clave.includes("Reserva"))) {
          try {
            const valor = localStorage.getItem(clave)
            if (valor) {
              const parsedValor = JSON.parse(valor)
              if (Array.isArray(parsedValor) && parsedValor.length > 0) {
                console.log(`Se encontraron ${parsedValor.length} posibles reservas en clave: ${clave}`)

                // Verificar que las reservas tienen la estructura esperada
                const reservaValida = parsedValor.some(
                  (r) =>
                    r &&
                    r.detalles &&
                    r.detalles.fechaEntrega &&
                    r.detalles.fechaDevolucion &&
                    r.importeTotal !== undefined,
                )

                if (reservaValida) {
                  reservas = parsedValor
                  break
                }
              }
            }
          } catch (e) {
            console.error(`Error al parsear valor de ${clave}:`, e)
          }
        }
      }
    }

    // Intentar obtener reservas directamente de la clave "reservas"
    if (reservas.length === 0) {
      try {
        const reservasDirectas = localStorage.getItem("reservas")
        if (reservasDirectas) {
          const parsedReservas = JSON.parse(reservasDirectas)
          if (Array.isArray(parsedReservas) && parsedReservas.length > 0) {
            console.log(`Se encontraron ${parsedReservas.length} reservas directamente en "reservas"`)
            reservas = parsedReservas
          }
        }
      } catch (e) {
        console.error("Error al obtener reservas directamente:", e)
      }
    }

    // Imprimir todas las claves de localStorage para depuración
    if (reservas.length === 0 && typeof window !== "undefined") {
      console.log("Listando todas las claves en localStorage:")
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i)
        console.log(`Clave ${i}: ${clave}`)
      }
    }

    if (reservas.length === 0) {
      console.log("No se encontraron reservas en localStorage con ninguna clave conocida")

      // Crear algunas reservas de prueba para depuración
      console.log("Creando reservas de prueba para depuración...")

      const hoy = new Date()
      const mesActual = getMonth(hoy)
      const añoActual = getYear(hoy)

      // Crear una reserva de prueba para este mes
      const reservaPrueba1 = {
        id: "prueba1",
        numeroReserva: "TEST-001",
        modelo: "Modelo A",
        cliente: { nombre: "Cliente Prueba", dni: "12345678A", telefono: "666777888" },
        detalles: {
          fechaEntrega: format(new Date(añoActual, mesActual, 5), "dd/MM/yyyy"),
          fechaDevolucion: format(new Date(añoActual, mesActual, 10), "dd/MM/yyyy"),
          horaEntrega: "10:00",
          horaDevolucion: "18:00",
          precioDiario: 100,
        },
        importeTotal: 600, // 6 días a 100€
        importeSenal: 200,
        importeRestante: 400,
        totalDias: 6,
        fechaCreacion: new Date().toISOString(),
        validado: true,
      }

      // Crear otra reserva de prueba para el mes siguiente
      const mesSiguiente = (mesActual + 1) % 12
      const añoSiguiente = mesSiguiente === 0 ? añoActual + 1 : añoActual

      const reservaPrueba2 = {
        id: "prueba2",
        numeroReserva: "TEST-002",
        modelo: "Modelo B",
        cliente: { nombre: "Cliente Prueba 2", dni: "87654321B", telefono: "666999888" },
        detalles: {
          fechaEntrega: format(new Date(añoSiguiente, mesSiguiente, 15), "dd/MM/yyyy"),
          fechaDevolucion: format(new Date(añoSiguiente, mesSiguiente, 20), "dd/MM/yyyy"),
          horaEntrega: "12:00",
          horaDevolucion: "12:00",
          precioDiario: 120,
        },
        importeTotal: 720, // 6 días a 120€
        importeSenal: 300,
        importeRestante: 420,
        totalDias: 6,
        fechaCreacion: new Date().toISOString(),
        validado: true,
      }

      reservas = [reservaPrueba1, reservaPrueba2]
    }

    // Verificar que todas las reservas tienen los campos necesarios
    const reservasValidas = reservas.filter(
      (r) =>
        r &&
        r.detalles &&
        r.detalles.fechaEntrega &&
        r.detalles.fechaDevolucion &&
        r.importeTotal !== undefined &&
        r.modelo,
    )

    if (reservasValidas.length < reservas.length) {
      console.log(
        `Se filtraron ${reservas.length - reservasValidas.length} reservas inválidas. Quedan ${
          reservasValidas.length
        } reservas válidas.`,
      )
    }

    return reservasValidas
  } catch (error) {
    console.error("Error al obtener reservas del localStorage:", error)
    return []
  }
}

// Función para obtener reservas del localStorage y/o Nube (versión asíncrona)
export async function obtenerReservasLocal(): Promise<Reserva[]> {
  return obtenerReservasLocalSync()
}

// Función para calcular el resumen de rentabilidad
export async function calcularResumenRentabilidad(
  filtros: FiltrosRentabilidad,
  usarRangoFechas = false,
): Promise<ResumenRentabilidad[]> {
  console.log("Calculando resumen de rentabilidad con filtros:", filtros, "usarRangoFechas:", usarRangoFechas)

  const gastos = filtrarGastos(filtros, usarRangoFechas)
  console.log(`Se encontraron ${gastos.length} gastos que coinciden con los filtros`)

  const reservas = obtenerReservasLocalSync()
  console.log(`Se encontraron ${reservas.length} reservas en total`)

  // Imprimir algunas reservas para depuración
  if (reservas.length > 0) {
    console.log("Ejemplo de reserva:", JSON.stringify(reservas[0], null, 2))
  }

  const resultados: Record<string, ResumenRentabilidad> = {}

  // Procesar reservas para calcular ingresos
  reservas.forEach((reserva, index) => {
    try {
      console.log(
        `Procesando reserva ${index + 1}/${reservas.length}: ${reserva.numeroReserva}, modelo: ${reserva.modelo}`,
      )

      if (!reserva.detalles || !reserva.detalles.fechaEntrega || !reserva.detalles.fechaDevolucion) {
        console.log("Reserva sin fechas válidas:", reserva.numeroReserva)
        return
      }

      // Parsear fechas de forma segura
      const fechaEntrega = parseFechaSegura(reserva.detalles.fechaEntrega)
      const fechaDevolucion = parseFechaSegura(reserva.detalles.fechaDevolucion)

      if (!fechaEntrega || !fechaDevolucion) {
        console.log("No se pudieron parsear las fechas de la reserva:", reserva.numeroReserva)
        console.log("Fecha entrega:", reserva.detalles.fechaEntrega)
        console.log("Fecha devolución:", reserva.detalles.fechaDevolucion)
        return
      }

      console.log(
        `Fechas parseadas - Entrega: ${fechaEntrega.toISOString()}, Devolución: ${fechaDevolucion.toISOString()}`,
      )

      // Obtener todos los días de la reserva
      const diasReserva = eachDayOfInterval({
        start: fechaEntrega,
        end: fechaDevolucion,
      })

      console.log(`La reserva tiene ${diasReserva.length} días`)

      // Calcular el importe diario
      // Si está anulada, el ingreso es el trozo de señal que nos quedamos (Señal - Devolución)
      // Si no está anulada, es el importe total previsto
      const ingresoReal = reserva.anulada 
        ? Math.max(0, (reserva.importeSenal || 0) - (reserva.importeDevuelto || 0))
        : reserva.importeTotal;
      
      const importeDiario = ingresoReal / (diasReserva.length || 1)
      console.log(`${reserva.anulada ? 'ANULADA - ' : ''}Importe diario calculado: ${importeDiario}€`)

      // Procesar cada día de la reserva
      diasReserva.forEach((dia) => {
        const añoDia = getYear(dia)
        const mesDia = getMonth(dia) + 1 // getMonth devuelve 0-11

        // Verificar si el día coincide con los filtros
        let coincideConFiltros = true

        if (usarRangoFechas && filtros.fechaInicio && filtros.fechaFin) {
          // Filtrar por rango de fechas
          if (
            !isWithinInterval(dia, {
              start: filtros.fechaInicio,
              end: filtros.fechaFin,
            })
          ) {
            coincideConFiltros = false
          }
        } else {
          // Filtrar por año y mes
          if (filtros.año && añoDia !== filtros.año) {
            coincideConFiltros = false
          }

          if (filtros.mes && mesDia !== filtros.mes) {
            coincideConFiltros = false
          }
        }

        if (filtros.modeloId && reserva.modelo !== filtros.modeloId) {
          coincideConFiltros = false
        }

        if (!coincideConFiltros) {
          return
        }

        // Crear clave única para el resumen (año-mes-modelo)
        const clave = `${añoDia}-${mesDia}-${reserva.modelo}`

        // Inicializar el resumen si no existe
        if (!resultados[clave]) {
          resultados[clave] = {
            id: uuidv4(),
            año: añoDia,
            mes: mesDia,
            modeloId: reserva.modelo,
            modelo: reserva.modelo, // Campo calculado
            ingresosTotales: 0,
            gastosTotales: 0,
            beneficioNeto: 0,
            precioMedioAlquiler: 0,
            diasAlquilados: 0,
            updatedAt: new Date().toISOString(),
          }
        }

        // Actualizar datos del resumen
        resultados[clave].ingresosTotales += importeDiario
        if (!reserva.anulada) {
          resultados[clave].diasAlquilados += 1
        }
      })

      console.log("Reserva procesada correctamente:", reserva.numeroReserva)
    } catch (error) {
      console.error("Error al procesar reserva para rentabilidad:", error, reserva)
    }
  })

  // Procesar gastos
  gastos.forEach((gasto) => {
    try {
      console.log("Procesando gasto:", gasto.concepto, gasto.importe)

      const fechaGasto = new Date(gasto.fecha)
      const añoGasto = getYear(fechaGasto)
      const mesGasto = getMonth(fechaGasto) + 1 // getMonth devuelve 0-11

      // Crear clave única para el resumen (año-mes-modelo)
      const clave = `${añoGasto}-${mesGasto}-${gasto.modeloId}`
      console.log("Clave de resumen para gasto:", clave)

      // Inicializar el resumen si no existe
      if (!resultados[clave]) {
        resultados[clave] = {
          id: uuidv4(),
          año: añoGasto,
          mes: mesGasto,
          modeloId: gasto.modeloId,
          modelo: gasto.modelo || obtenerNombreModelo(gasto.modeloId), // Campo calculado
          ingresosTotales: 0,
          gastosTotales: 0,
          beneficioNeto: 0,
          precioMedioAlquiler: 0,
          diasAlquilados: 0,
          updatedAt: new Date().toISOString(),
        }
      }

      // Actualizar gastos
      resultados[clave].gastosTotales += gasto.importe
      console.log("Gastos actualizados:", resultados[clave].gastosTotales)
    } catch (error) {
      console.error("Error al procesar gasto para rentabilidad:", error, gasto)
    }
  })

  // Calcular beneficio neto y precio medio para todos los resultados
  Object.values(resultados).forEach((resultado) => {
    resultado.beneficioNeto = resultado.ingresosTotales - resultado.gastosTotales

    if (resultado.diasAlquilados > 0) {
      resultado.precioMedioAlquiler = resultado.ingresosTotales / resultado.diasAlquilados
    }

    // Redondear valores para mejor visualización
    resultado.ingresosTotales = Math.round(resultado.ingresosTotales * 100) / 100
    resultado.gastosTotales = Math.round(resultado.gastosTotales * 100) / 100
    resultado.beneficioNeto = Math.round(resultado.beneficioNeto * 100) / 100
    resultado.precioMedioAlquiler = Math.round(resultado.precioMedioAlquiler * 100) / 100
  })

  // Convertir el objeto de resultados a un array
  const resultadosArray = Object.values(resultados)
  console.log(`Resumen calculado con ${resultadosArray.length} registros`)

  // Imprimir algunos resultados para depuración
  if (resultadosArray.length > 0) {
    console.log("Ejemplo de resultado:", JSON.stringify(resultadosArray[0], null, 2))
  }

  return resultadosArray
}

// Función para obtener los años disponibles (versión sincrónica)
export function obtenerAñosDisponibles(): number[] {
  const reservas = obtenerReservasLocalSync() // Usamos la versión sincrónica
  const gastos = obtenerGastosLocal()
  const años = new Set<number>()

  console.log(`Calculando años disponibles. Reservas: ${reservas.length}, Gastos: ${gastos.length}`)

  // Añadir años de las reservas
  reservas.forEach((reserva) => {
    try {
      if (reserva.detalles && reserva.detalles.fechaEntrega) {
        const fechaEntrega = parseFechaSegura(reserva.detalles.fechaEntrega)
        if (fechaEntrega) {
          const año = getYear(fechaEntrega)
          años.add(año)
          console.log(`Añadido año ${año} de la reserva ${reserva.numeroReserva}`)
        }
      }
    } catch (error) {
      console.error("Error al procesar año de reserva:", error, reserva)
    }
  })

  // Añadir años de los gastos
  gastos.forEach((gasto) => {
    try {
      const fechaGasto = new Date(gasto.fecha)
      const año = getYear(fechaGasto)
      años.add(año)
      console.log(`Añadido año ${año} del gasto ${gasto.concepto}`)
    } catch (error) {
      console.error("Error al procesar año de gasto:", error, gasto)
    }
  })

  // Añadir año actual si no hay datos
  if (años.size === 0) {
    const añoActual = new Date().getFullYear()
    años.add(añoActual)
    console.log(`No se encontraron años, añadiendo año actual: ${añoActual}`)
  }

  // Convertir Set a Array y ordenar
  const añosArray = Array.from(años).sort((a, b) => b - a) // Ordenar descendente
  console.log("Años disponibles:", añosArray)
  return añosArray
}

// Función para formatear mes como texto (con año opcional)
export function formatearMes(mes: number, año?: number): string {
  try {
    // Crear una fecha con el mes (mes - 1 porque los meses en JS son 0-11)
    const fecha = new Date(2000, mes - 1, 1)
    // Formatear el mes en español
    const nombreMes = format(fecha, "MMMM", { locale: es })
    
    // Si se proporciona el año, retornarlo junto al mes
    if (año) {
      return `${nombreMes} ${año}`
    }
    
    return nombreMes
  } catch (error) {
    console.error("Error al formatear mes:", error)
    return año ? `Mes ${mes} ${año}` : `Mes ${mes}`
  }
}

// Función para obtener el nombre del modelo a partir del ID
export function obtenerNombreModelo(modeloId: string): string {
  try {
    // Intentar obtener las autocaravanas del localStorage
    const autocaravanasString = localStorage.getItem("autocaravanas")
    if (!autocaravanasString) return modeloId

    const autocaravanas = JSON.parse(autocaravanasString)
    const autocaravana = autocaravanas.find((a: any) => a.id === modeloId || a.modelo === modeloId)

    return autocaravana ? autocaravana.modelo : modeloId
  } catch (error) {
    console.error("Error al obtener nombre de modelo:", error)
    return modeloId
  }
}
