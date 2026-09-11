// Interfaz para los datos de la reserva que se enviarán a la API
interface ReservaData {
  id: string
  numeroReserva: string
  modelo: string
  fechaCreacion: string
  cliente: {
    nombre: string
    dni?: string
    telefono?: string
    email?: string
    [key: string]: any
  }
  detalles: {
    fechaEntrega?: string
    fechaDevolucion?: string
    [key: string]: any
  }
  [key: string]: any
}

// Función para verificar si estamos en modo de desarrollo
const isDevelopment = () => {
  try {
    return (
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app")
    )
  } catch (e) {
    console.error("Error al verificar el entorno:", e)
    return true // Por defecto, asumir que estamos en desarrollo
  }
}

// Función para obtener la URL de la API desde localStorage o usar la predeterminada
export const getApiUrl = () => {
  try {
    // Intentar obtener la URL de la API desde localStorage
    const storedUrl = localStorage.getItem("sheets-api-url")
    if (storedUrl && storedUrl.trim() !== "") {
      return storedUrl.trim()
    }

    // Si no hay URL almacenada, usar la predeterminada
    return "https://script.google.com/macros/s/TU_URL_AQUI/exec"
  } catch (e) {
    console.error("Error al obtener la URL de la API:", e)
    return "https://script.google.com/macros/s/TU_URL_AQUI/exec"
  }
}

// Función para establecer la URL de la API
export const setApiUrl = (url: string) => {
  try {
    localStorage.setItem("sheets-api-url", url.trim())
    return true
  } catch (e) {
    console.error("Error al establecer la URL de la API:", e)
    return false
  }
}

// Función para verificar si debemos usar el modo de simulación
export const useMockMode = () => {
  try {
    const storedPreference = localStorage.getItem("useMockApi")
    if (storedPreference !== null) {
      return storedPreference === "true"
    }
    // Por defecto, NO usar modo simulación
    return false
  } catch (e) {
    console.error("Error al verificar el modo de simulación:", e)
    return false // Por defecto, NO usar simulación en caso de error
  }
}

// Función para establecer el modo de simulación
export const setMockMode = (useMock: boolean) => {
  try {
    localStorage.setItem("useMockApi", useMock.toString())
  } catch (e) {
    console.error("Error al establecer el modo de simulación:", e)
  }
}

// Datos de simulación para pruebas
const mockReservas = [
  {
    id: "mock-1",
    numeroReserva: "M01",
    modelo: "PERFILADA",
    fechaCreacion: new Date().toISOString(),
    detalles: {
      fechaEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      fechaDevolucion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      horaEntrega: "10:00",
      horaDevolucion: "18:00",
      precioDiario: "150",
      suplemento: "0",
      descripcionSuplemento: "",
      formaPago: "transferencia",
    },
    cliente: {
      nombre: "CLIENTE SIMULADO 1",
      dni: "12345678A",
      telefono: "600123456",
      notas: "Cliente de prueba para modo simulación",
      direccion: "Calle Ejemplo 1",
      poblacion: "Córdoba",
      provincia: "Córdoba",
    },
    totalDias: 8,
    importeTotal: 1200,
    importeSenal: 360,
    importeRestante: 840,
    formaPago: "transferencia",
    validado: true,
    fechaValidacion: new Date().toISOString(),
    contratoGenerado: false,
  },
  {
    id: "mock-2",
    numeroReserva: "M02",
    modelo: "CAPUCHINA",
    fechaCreacion: new Date().toISOString(),
    detalles: {
      fechaEntrega: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      fechaDevolucion: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      horaEntrega: "12:00",
      horaDevolucion: "16:00",
      precioDiario: "180",
      suplemento: "50",
      descripcionSuplemento: "LIMPIEZA ADICIONAL",
      formaPago: "bizum",
    },
    cliente: {
      nombre: "CLIENTE SIMULADO 2",
      dni: "87654321B",
      telefono: "600654321",
      notas: "Otro cliente de prueba para modo simulación",
      direccion: "Calle Ejemplo 2",
      poblacion: "Sevilla",
      provincia: "Sevilla",
    },
    totalDias: 8,
    importeTotal: 1490,
    importeSenal: 450,
    importeRestante: 1040,
    formaPago: "bizum",
    validado: false,
    contratoGenerado: false,
  },
]

const mockAutocaravanas = [
  {
    id: "mock-auto-1",
    modelo: "PERFILADA",
    descripcion: "Autocaravana perfilada de 6 plazas",
    plazas: 6,
    precioTemporadaBaja: "120",
    precioTemporadaMedia: "150",
    precioTemporadaAlta: "180",
    imagen: "/placeholder.svg?key=xs1bw",
  },
  {
    id: "mock-auto-2",
    modelo: "CAPUCHINA",
    descripcion: "Autocaravana capuchina de 7 plazas",
    plazas: 7,
    precioTemporadaBaja: "140",
    precioTemporadaMedia: "180",
    precioTemporadaAlta: "220",
    imagen: "/placeholder.svg?key=r0fub",
  },
]

// Función para obtener todas las reservas
export async function obtenerReservasDesdeSheets(): Promise<any[]> {
  // Si estamos en modo simulación, devolver datos de prueba
  if (useMockMode()) {
    console.log("Modo simulación: Devolviendo reservas simuladas")
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 500))
    return [...mockReservas]
  }

  try {
    // Si estamos offline, devolver un array vacío
    if (!navigator.onLine) {
      console.log("Modo offline: No se pueden obtener reservas desde Google Sheets")
      return []
    }

    console.log("Obteniendo reservas desde Google Sheets...")

    // Obtener la URL de la API
    const apiUrl = getApiUrl()

    // Añadir un parámetro de timestamp para evitar caché
    const url = `${apiUrl}?operation=getAll&sheet=Reservas&_=${Date.now()}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error al obtener reservas:", result.message)
      return []
    }

    // Procesar los datos para convertir strings JSON a objetos
    return result.data.map((item: any) => {
      // Convertir campos que son objetos almacenados como strings
      try {
        if (typeof item.detalles === "string") {
          item.detalles = JSON.parse(item.detalles)
        }
        if (typeof item.cliente === "string") {
          item.cliente = JSON.parse(item.cliente)
        }
      } catch (e) {
        console.error("Error al parsear JSON:", e)
      }
      return item
    })
  } catch (error) {
    console.error("Error al comunicarse con la API:", error)
    // En desarrollo, mostrar un mensaje más detallado
    if (isDevelopment()) {
      console.log("Detalles del error:", {
        message: error.message,
        stack: error.stack,
        url: getApiUrl(),
      })
    }
    throw error
  }
}

// Función para guardar una reserva
export async function guardarReservaEnSheets(reserva: any): Promise<boolean> {
  // Si estamos en modo simulación, simular éxito
  if (useMockMode()) {
    console.log("Modo simulación: Simulando guardado de reserva", reserva.id)
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 800))
    return true
  }

  try {
    // Si estamos offline, devolver false
    if (!navigator.onLine) {
      console.log("Modo offline: No se puede guardar la reserva en Google Sheets")
      return false
    }

    console.log("Guardando reserva en Google Sheets:", reserva.id)

    // Preparar los datos para enviar
    const reservaParaEnviar = { ...reserva }

    // Convertir objetos a strings JSON para enviar
    if (typeof reservaParaEnviar.detalles === "object") {
      reservaParaEnviar.detalles = JSON.stringify(reservaParaEnviar.detalles)
    }
    if (typeof reservaParaEnviar.cliente === "object") {
      reservaParaEnviar.cliente = JSON.stringify(reservaParaEnviar.cliente)
    }

    // Obtener la URL de la API
    const apiUrl = getApiUrl()

    // Añadir un parámetro de timestamp para evitar caché
    const url = `${apiUrl}?operation=save&sheet=Reservas&_=${Date.now()}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservaParaEnviar),
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error al guardar reserva:", result.message)
      return false
    }

    console.log("Reserva guardada con éxito en Google Sheets")
    return true
  } catch (error) {
    console.error("Error al comunicarse con la API:", error)
    // En desarrollo, mostrar un mensaje más detallado
    if (isDevelopment()) {
      console.log("Detalles del error:", {
        message: error.message,
        stack: error.stack,
        url: getApiUrl(),
        reserva: reserva.id,
      })
    }
    throw error
  }
}

// Función para eliminar una reserva
export async function eliminarReservaEnSheets(id: string): Promise<boolean> {
  // Si estamos en modo simulación, simular éxito
  if (useMockMode()) {
    console.log("Modo simulación: Simulando eliminación de reserva", id)
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 600))
    return true
  }

  try {
    // Si estamos offline, devolver false
    if (!navigator.onLine) {
      console.log("Modo offline: No se puede eliminar la reserva en Google Sheets")
      return false
    }

    console.log("Eliminando reserva en Google Sheets:", id)

    // Obtener la URL de la API
    const apiUrl = getApiUrl()

    // Añadir un parámetro de timestamp para evitar caché
    const url = `${apiUrl}?operation=delete&sheet=Reservas&id=${id}&_=${Date.now()}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error al eliminar reserva:", result.message)
      return false
    }

    console.log("Reserva eliminada con éxito en Google Sheets")
    return true
  } catch (error) {
    console.error("Error al comunicarse con la API:", error)
    // En desarrollo, mostrar un mensaje más detallado
    if (isDevelopment()) {
      console.log("Detalles del error:", {
        message: error.message,
        stack: error.stack,
        url: getApiUrl(),
        id: id,
      })
    }
    throw error
  }
}

// Funciones similares para autocaravanas
export async function obtenerAutocaravanasDesdeSheets(): Promise<any[]> {
  // Si estamos en modo simulación, devolver datos de prueba
  if (useMockMode()) {
    console.log("Modo simulación: Devolviendo autocaravanas simuladas")
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 500))
    return [...mockAutocaravanas]
  }

  try {
    // Si estamos offline, devolver un array vacío
    if (!navigator.onLine) {
      console.log("Modo offline: No se pueden obtener autocaravanas desde Google Sheets")
      return []
    }

    console.log("Obteniendo autocaravanas desde Google Sheets...")

    // Obtener la URL de la API
    const apiUrl = getApiUrl()

    // Añadir un parámetro de timestamp para evitar caché
    const url = `${apiUrl}?operation=getAll&sheet=Autocaravanas&_=${Date.now()}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error al obtener autocaravanas:", result.message)
      return []
    }

    return result.data
  } catch (error) {
    console.error("Error al comunicarse con la API:", error)
    // En desarrollo, mostrar un mensaje más detallado
    if (isDevelopment()) {
      console.log("Detalles del error:", {
        message: error.message,
        stack: error.stack,
        url: getApiUrl(),
      })
    }
    throw error
  }
}

export async function guardarAutocaravanaEnSheets(autocaravana: any): Promise<boolean> {
  // Si estamos en modo simulación, simular éxito
  if (useMockMode()) {
    console.log("Modo simulación: Simulando guardado de autocaravana", autocaravana.id)
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 800))
    return true
  }

  try {
    // Si estamos offline, devolver false
    if (!navigator.onLine) {
      console.log("Modo offline: No se puede guardar la autocaravana en Google Sheets")
      return false
    }

    console.log("Guardando autocaravana en Google Sheets:", autocaravana.id)

    // Obtener la URL de la API
    const apiUrl = getApiUrl()

    // Añadir un parámetro de timestamp para evitar caché
    const url = `${apiUrl}?operation=save&sheet=Autocaravanas&_=${Date.now()}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(autocaravana),
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.error("Error al guardar autocaravana:", result.message)
      return false
    }

    console.log("Autocaravana guardada con éxito en Google Sheets")
    return true
  } catch (error) {
    console.error("Error al comunicarse con la API:", error)
    // En desarrollo, mostrar un mensaje más detallado
    if (isDevelopment()) {
      console.log("Detalles del error:", {
        message: error.message,
        stack: error.stack,
        url: getApiUrl(),
        autocaravana: autocaravana.id,
      })
    }
    throw error
  }
}

// Función para comprobar si la API está disponible
export async function comprobarConexionAPI(): Promise<boolean> {
  // Si estamos en modo simulación, simular éxito
  if (useMockMode()) {
    console.log("Modo simulación: Simulando conexión exitosa con la API")
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 500))
    return true
  }

  try {
    // Si estamos offline, devolver false
    if (!navigator.onLine) {
      console.log("Modo offline: No se puede comprobar la conexión con la API")
      return false
    }

    console.log("Comprobando conexión con la API...")

    // Obtener la URL de la API
    const apiUrl = getApiUrl()

    // Verificar si la URL es válida
    if (apiUrl === "https://script.google.com/macros/s/TU_URL_AQUI/exec") {
      console.log("URL de API no configurada. Usando modo simulación.")
      return false
    }

    // Añadir un parámetro de timestamp para evitar caché
    const url = `${apiUrl}?operation=ping&_=${Date.now()}`

    // Usar un timeout para evitar que la solicitud se quede colgada
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        signal: controller.signal,
      })

      clearTimeout(timeoutId) // Limpiar el timeout si la solicitud se completa

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        console.error("Error al comprobar la conexión:", result.message)
        return false
      }

      console.log("Conexión exitosa con la API")
      return true
    } catch (fetchError) {
      clearTimeout(timeoutId) // Limpiar el timeout en caso de error
      if (fetchError.name === "AbortError") {
        console.error("La solicitud a la API se ha cancelado por timeout")
        return false
      }
      console.error("Error en la solicitud fetch:", fetchError)
      return false
    }
  } catch (error) {
    console.error("Error al comunicarse con la API:", error)
    // En desarrollo, mostrar un mensaje más detallado
    if (isDevelopment()) {
      console.log("Detalles del error:", {
        message: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
        url: getApiUrl(),
      })
    }
    return false
  }
}
