"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, Edit, Trash2, ArrowLeft, CheckSquare, Square, FileText, Eye, Circle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { obtenerReservas, eliminarReserva, guardarReserva } from "@/lib/reservas-store"
import type { ReservaCompleta } from "@/lib/types"
import { KilometrosDialog } from "@/components/kilometros-dialog"
import { generarContratoWord } from "@/lib/contrato-generator"

// Añadir las importaciones necesarias al principio del archivo
import ReactDOM from "react-dom/client"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ReservationA4Template } from "@/components/reservation-a4-template"
import * as XLSX from "xlsx"
import { parseFechaSegura } from "@/lib/utils-date"

// Función auxiliar para formatear fechas de manera segura
const formatearFechaSegura = (fecha: any, formatoFecha = "dd/MM/yyyy") => {
  if (!fecha) return "N/A"
  const fechaObj = parseFechaSegura(fecha)
  return format(fechaObj, formatoFecha, { locale: es })
}

export default function ReservasPage() {
  const router = useRouter()
  const [reservas, setReservas] = useState<ReservaCompleta[]>([])
  const [filtro, setFiltro] = useState("")
  const [reservasFiltradas, setReservasFiltradas] = useState<ReservaCompleta[]>([])
  const [reservaAEliminar, setReservaAEliminar] = useState<string | null>(null)
  const [reservaParaContrato, setReservaParaContrato] = useState<ReservaCompleta | null>(null)
  const [reservaParaPrevisualizar, setReservaParaPrevisualizar] = useState<ReservaCompleta | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showKilometrosDialog, setShowKilometrosDialog] = useState(false)
  const [procesandoContrato, setProcesandoContrato] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ordenacion, setOrdenacion] = useState<string>("fechaEntrega")
  const [importeDevueltoInput, setImporteDevueltoInput] = useState("0")
  const [motivoAnulacionInput, setMotivoAnulacionInput] = useState("")
  const [showMotivoDialog, setShowMotivoDialog] = useState(false)
  const [motivoVerActual, setMotivoVerActual] = useState("")
  const [isAnulando, setIsAnulando] = useState(false) // Para manejar carga durante anulación
  const [reservaExpandidaId, setReservaExpandidaId] = useState<string | null>(null) // Para el acordeón en móvil

  // --- ESTADOS PARA EXPORTACIÓN EXCEL ---
  const [showExcelDialog, setShowExcelDialog] = useState(false)
  const [excelFechaDesde, setExcelFechaDesde] = useState("")
  const [excelFechaHasta, setExcelFechaHasta] = useState("")



  const CURRENT_YEAR = new Date().getFullYear();
  const [filtroAnioActivo, setFiltroAnioActivo] = useState(true)
  const [aniosSeleccionados, setAniosSeleccionados] = useState<number[]>([CURRENT_YEAR])
  const [anioDropdownOpen, setAnioDropdownOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("filtroAnio")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.activo === 'boolean') setFiltroAnioActivo(parsed.activo)
        if (Array.isArray(parsed.anios)) setAniosSeleccionados(parsed.anios)
      }
    } catch(e) {}
  }, [])

  const handleToggleFiltroAnio = (checked: boolean) => {
    setFiltroAnioActivo(checked)
    localStorage.setItem("filtroAnio", JSON.stringify({ activo: checked, anios: aniosSeleccionados }))
  }

  const handleToggleAnio = (anio: number) => {
    let nuevosAnios;
    if (aniosSeleccionados.includes(anio)) {
      nuevosAnios = aniosSeleccionados.filter(a => a !== anio);
    } else {
      nuevosAnios = [...aniosSeleccionados, anio].sort();
    }
    setAniosSeleccionados(nuevosAnios);
    localStorage.setItem("filtroAnio", JSON.stringify({ activo: filtroAnioActivo, anios: nuevosAnios }))
  }

  // Cargar las reservas de forma optimizada
  useEffect(() => {
    const cargarReservas = async () => {
      try {
        setIsLoading(true)

        // NO limpiar la caché para asegurar que se muestren todas las reservas
        // limpiarCache()

        // Obtener todas las reservas
        const todasLasReservas = obtenerReservas()

        console.log("Reservas cargadas en listado:", todasLasReservas.length)

        // Ordenar por fecha de entrega (más próxima primero) por defecto
        ordenarReservas(todasLasReservas, "fechaEntrega")

        setReservas(todasLasReservas)
        setReservasFiltradas(todasLasReservas)
        setError(null)
      } catch (err) {
        console.error("Error al cargar reservas:", err)
        setError("Error al cargar las reservas. Por favor, recarga la página.")
      } finally {
        setIsLoading(false)
      }
    }

    cargarReservas()
  }, [])

  // Función para ordenar reservas según diferentes criterios
  const ordenarReservas = (reservasAOrdenar: ReservaCompleta[], criterio: string) => {
    const reservasOrdenadas = [...reservasAOrdenar]
    const fechaActual = new Date()

    switch (criterio) {
      case "numeroAsc":
        reservasOrdenadas.sort((a, b) => {
          // Extraer números de las cadenas y comparar
          const numA = Number.parseInt(a.numeroReserva.replace(/\D/g, ""))
          const numB = Number.parseInt(b.numeroReserva.replace(/\D/g, ""))
          return numA - numB
        })
        break
      case "numeroDesc":
        reservasOrdenadas.sort((a, b) => {
          // Extraer números de las cadenas y comparar
          const numA = Number.parseInt(a.numeroReserva.replace(/\D/g, ""))
          const numB = Number.parseInt(b.numeroReserva.replace(/\D/g, ""))
          return numB - numA
        })
        break
      case "validadas":
        reservasOrdenadas.sort((a, b) => {
          // Ordenar por validación (validadas primero)
          if (a.validado && !b.validado) return -1
          if (!a.validado && b.validado) return 1
          // Si ambas tienen el mismo estado de validación, ordenar por número (descendente)
          const numA = Number.parseInt(a.numeroReserva.replace(/\D/g, ""))
          const numB = Number.parseInt(b.numeroReserva.replace(/\D/g, ""))
          return numB - numA
        })
        break
      case "contratos":
        reservasOrdenadas.sort((a, b) => {
          // Ordenar por contrato generado (con contrato primero)
          if (a.contratoGenerado && !b.contratoGenerado) return -1
          if (!a.contratoGenerado && b.contratoGenerado) return 1
          // Si ambas tienen el mismo estado de contrato, ordenar por número (descendente)
          const numA = Number.parseInt(a.numeroReserva.replace(/\D/g, ""))
          const numB = Number.parseInt(b.numeroReserva.replace(/\D/g, ""))
          return numB - numA
        })
        break
      case "fechaEntrega":
        reservasOrdenadas.sort((a, b) => {
          // Parsear fechas de entrega
          const fechaA = parseFechaSegura(a.detalles.fechaEntrega)
          const fechaB = parseFechaSegura(b.detalles.fechaEntrega)

          // Si alguna fecha no se puede parsear, ponerla al final
          if (!fechaA && !fechaB) return 0
          if (!fechaA) return 1
          if (!fechaB) return -1

          // Calcular diferencia con la fecha actual
          const diffA = fechaA.getTime() - fechaActual.getTime()
          const diffB = fechaB.getTime() - fechaActual.getTime()

          // Poner primero las fechas futuras más cercanas
          // Las fechas pasadas irán al final, ordenadas de más reciente a más antigua
          if (diffA >= 0 && diffB >= 0) {
            // Ambas son fechas futuras, ordenar por proximidad
            return diffA - diffB
          } else if (diffA >= 0) {
            // Solo A es fecha futura, va primero
            return -1
          } else if (diffB >= 0) {
            // Solo B es fecha futura, va primero
            return 1
          } else {
            // Ambas son fechas pasadas, ordenar de más reciente a más antigua
            return diffB - diffA
          }
        })
        break
      default:
        // Por defecto, ordenar por fecha de creación (más recientes primero)
        reservasOrdenadas.sort((a, b) => {
          try {
            return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
          } catch (err) {
            return 0
          }
        })
    }

    return reservasOrdenadas
  }

  // Filtrar reservas cuando cambia el filtro o el año
  useEffect(() => {
    let resultado = reservas;

    if (filtro.trim()) {
      const filtroLower = filtro.toLowerCase()
      resultado = resultado.filter(
        (reserva) =>
          reserva.numeroReserva.toLowerCase().includes(filtroLower) ||
          reserva.modelo.toLowerCase().includes(filtroLower) ||
          reserva.cliente.nombre.toLowerCase().includes(filtroLower) ||
          reserva.cliente.dni.toLowerCase().includes(filtroLower) ||
          reserva.cliente.telefono.toLowerCase().includes(filtroLower),
      )
    }

    if (filtroAnioActivo && aniosSeleccionados.length > 0) {
       resultado = resultado.filter(reserva => {
         const d = parseFechaSegura(reserva.detalles.fechaEntrega);
         if (d) return aniosSeleccionados.includes(d.getFullYear());
         return false;
       })
    }

    setReservasFiltradas(ordenarReservas(resultado, ordenacion))
  }, [filtro, reservas, ordenacion, filtroAnioActivo, aniosSeleccionados])

  // Memoizar funciones de manejo para evitar recreaciones innecesarias
  const handleEditarReserva = useCallback(
    (reserva: ReservaCompleta) => {
      try {
        // Guardar los datos de la reserva en localStorage para editarla
        localStorage.setItem("reservaDetalles", JSON.stringify(reserva.detalles))
        localStorage.setItem("reservaCliente", JSON.stringify(reserva.cliente))

        // Navegar a la página de detalles con el modelo y número de reserva, añadiendo el parámetro editar=true
        router.push(
          `/reserva/${encodeURIComponent(reserva.modelo)}/detalles?numero=${reserva.numeroReserva}&editar=true`,
        )
      } catch (err) {
        console.error("Error al editar reserva:", err)
        alert("Error al editar la reserva. Por favor, inténtelo de nuevo.")
      }
    },
    [router],
  )

  const toggleExpandirReserva = (id: string, e: React.MouseEvent) => {
    // Si el clic viene de un botón o elemento interactivo, no expandir/contraer
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return
    }
    
    setReservaExpandidaId(prevId => prevId === id ? null : id)
  }

  const confirmarEliminarReserva = useCallback((id: string) => {
    setReservaAEliminar(id)
  }, [])

  const handleEliminarReserva = useCallback(async () => {
    if (!reservaAEliminar) return

    try {
      // Obtener la reserva que se va a eliminar
      const reservaAEliminarObj = reservas.find((r) => r.id === reservaAEliminar)

      // Eliminar la reserva localmente
      eliminarReserva(reservaAEliminar)

      // Actualizar la lista de reservas en la UI
      setReservas((prev) => prev.filter((r) => r.id !== reservaAEliminar))
      setReservasFiltradas((prev) => prev.filter((r) => r.id !== reservaAEliminar))

      // Cerrar el diálogo
      setReservaAEliminar(null)

      // Eliminar la reserva del servidor nube si hay conexión a internet
      if (navigator.onLine && reservaAEliminarObj) {
        try {
          console.log("Eliminando reserva del servidor nube (Firebase):", reservaAEliminarObj.id)
          const { eliminarReservaFirebase } = await import("@/lib/firebase-adapter")
          const resultado = await eliminarReservaFirebase(reservaAEliminarObj.id)

          if (resultado) {
            console.log("Reserva eliminada de Firebase correctamente")
            localStorage.setItem("lastSyncTime", new Date().toLocaleString())
          }
        } catch (error) {
          console.error("Error al eliminar reserva de Firebase:", error)
        }
      }
    } catch (err) {
      console.error("Error al eliminar reserva:", err)
      alert("Error al eliminar la reserva. Por favor, inténtelo de nuevo.")
    }
  }, [reservaAEliminar, reservas])

  const handleAnularReserva = useCallback(async () => {
    if (!reservaAEliminar) return

    try {
      const reservaOriginal = reservas.find((r) => r.id === reservaAEliminar)
      if (!reservaOriginal) return

      const importeDevuelto = Number.parseFloat(importeDevueltoInput) || 0

      const reservaActualizada: ReservaCompleta = {
        ...reservaOriginal,
        anulada: true,
        importeDevuelto: importeDevuelto,
        motivoAnulacion: motivoAnulacionInput,
        fechaAnulacion: new Date().toISOString()
      }

      // Guardar localmente
      guardarReserva(reservaActualizada)

      // Actualizar estado UI
      setReservas((prev) => prev.map((r) => (r.id === reservaAEliminar ? reservaActualizada : r)))
      setReservasFiltradas((prev) => prev.map((r) => (r.id === reservaAEliminar ? reservaActualizada : r)))

      setReservaAEliminar(null)
      setImporteDevueltoInput("0")
      setMotivoAnulacionInput("")


      // Sincronizar con Firebase
      if (navigator.onLine) {
        try {
          const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
          await guardarReservaFirebase(reservaActualizada)
          localStorage.setItem("lastSyncTime", new Date().toLocaleString())
        } catch (e) {
          console.error("Error sincronizando anulación:", e)
        }
      }
    } catch (err) {
      console.error("Error al anular reserva:", err)
      alert("Error al anular la reserva.")
    }
  }, [reservaAEliminar, reservas, importeDevueltoInput])

  const handleRestaurarReserva = useCallback(async (reserva: ReservaCompleta) => {
    try {
      const reservaActualizada: ReservaCompleta = {
        ...reserva,
        anulada: false,
        importeDevuelto: 0,
        motivoAnulacion: undefined,
        fechaAnulacion: undefined
      }


      // Guardar localmente
      guardarReserva(reservaActualizada)

      // Actualizar estado UI
      setReservas((prev) => prev.map((r) => (r.id === reserva.id ? reservaActualizada : r)))
      setReservasFiltradas((prev) => prev.map((r) => (r.id === reserva.id ? reservaActualizada : r)))

      // Sincronizar con Firebase
      if (navigator.onLine) {
        try {
          const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
          await guardarReservaFirebase(reservaActualizada)
          localStorage.setItem("lastSyncTime", new Date().toLocaleString())
        } catch (e) {
          console.error("Error sincronizando restauración:", e)
        }
      }
    } catch (err) {
      console.error("Error al restaurar reserva:", err)
      alert("Error al restaurar la reserva.")
    }
  }, [])


  const handleVolver = useCallback(() => {
    router.push("/")
  }, [router])

  // Modificar la función handleValidarReserva para generar y descargar el PDF cuando se valida una reserva
  const handleValidarReserva = useCallback(
    async (reserva: ReservaCompleta) => {
      try {
        // Actualizar el estado de validación
        const reservaActualizada = {
          ...reserva,
          validado: !reserva.validado,
          fechaValidacion: !reserva.validado ? new Date().toISOString() : null,
        }

        // Guardar la reserva actualizada
        const guardadoExitoso = guardarReserva(reservaActualizada)

        if (!guardadoExitoso) {
          throw new Error("No se pudo guardar la reserva actualizada")
        }

        // Actualizar la lista de reservas
        setReservas((prev) => prev.map((r) => (r.id === reserva.id ? reservaActualizada : r)))

        // Actualizar las reservas filtradas
        setReservasFiltradas((prev) => {
          if (!filtro.trim()) {
            return ordenarReservas(
              prev.map((r) => (r.id === reserva.id ? reservaActualizada : r)),
              ordenacion,
            )
          }

          const filtroLower = filtro.toLowerCase()
          return ordenarReservas(
            prev
              .map((r) => (r.id === reserva.id ? reservaActualizada : r))
              .filter(
                (r) =>
                  r.numeroReserva.toLowerCase().includes(filtroLower) ||
                  r.modelo.toLowerCase().includes(filtroLower) ||
                  r.cliente.nombre.toLowerCase().includes(filtroLower) ||
                  r.cliente.dni.toLowerCase().includes(filtroLower) ||
                  r.cliente.telefono.toLowerCase().includes(filtroLower),
              ),
            ordenacion,
          )
        })

        // Si se ha validado, crear evento en Google Calendar y generar PDF confirmado
        if (!reserva.validado) {
          crearEventoCalendario(reservaActualizada)
          await generarPDFConfirmado(reservaActualizada)
        }

        // Sincronizar con el servidor nube si hay conexión a internet
        if (navigator.onLine) {
          try {
            console.log("Sincronizando reserva validada con Firebase...")
            // Importar dinámicamente para evitar dependencias circulares
            const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
            const resultado = await guardarReservaFirebase(reservaActualizada)

            if (resultado) {
              console.log("Reserva validada sincronizada correctamente en Firebase")
              // Actualizar el timestamp de la última sincronización
              localStorage.setItem("lastSyncTime", new Date().toLocaleString())
            } else {
              console.error("Error al sincronizar reserva validada con Firebase")
            }
          } catch (error) {
            console.error("Error al sincronizar reserva validada con Firebase:", error)
          }
        }
      } catch (err) {
        console.error("Error al validar reserva:", err)
        alert("Error al validar la reserva. Por favor, inténtelo de nuevo.")
      }
    },
    [filtro, ordenacion],
  )

  // Función para alternar el estado del contrato (Generar o Desmarcar)
  const handleAlternarContrato = useCallback(async (reserva: ReservaCompleta) => {
    // SI YA TIENE CONTRATO: Lo desmarcamos
    if (reserva.contratoGenerado) {
      if (!window.confirm("¿Desea desmarcar esta reserva como 'Contrato Generado'? Se perderán los KM y la hora de entrega registrados.")) {
        return
      }

      try {
        const reservaActualizada = {
          ...reserva,
          contratoGenerado: false,
          kilometrosContrato: null,
          horaRealEntrega: null,
        }

        // Guardar localmente
        guardarReserva(reservaActualizada)

        // Actualizar UI
        setReservas((prev) => prev.map((r) => (r.id === reserva.id ? reservaActualizada : r)))
        setReservasFiltradas((prev) => prev.map((r) => (r.id === reserva.id ? reservaActualizada : r)))

        // Sincronizar con Firebase
        if (navigator.onLine) {
          const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
          await guardarReservaFirebase(reservaActualizada)
        }
        
        alert("Reserva desmarcada correctamente.")
      } catch (error) {
        console.error("Error al desmarcar contrato:", error)
        alert("Error al actualizar el estado del contrato.")
      }
    } 
    // SI NO TIENE CONTRATO: Abrimos el flujo de generación habitual
    else {
      setReservaParaContrato(reserva)
      setShowKilometrosDialog(true)
    }
  }, [filtro, ordenacion])

  // Función para previsualizar una reserva
  const handlePrevisualizar = useCallback((reserva: ReservaCompleta) => {
    setReservaParaPrevisualizar(reserva)
    setShowPreviewDialog(true)
  }, [])

  // Función para generar el contrato con los kilómetros proporcionados
  const generarContrato = useCallback(
    async (kilometros: string, horaRealEntrega: string) => {
      if (!reservaParaContrato) return

      setProcesandoContrato(true)

      try {
        // Generar el contrato Word con los kilómetros y la hora real de entrega
        await generarContratoWord(reservaParaContrato, kilometros, horaRealEntrega)

        // Actualizar el estado de la reserva para marcar que el contrato ha sido generado
        const reservaActualizada = {
          ...reservaParaContrato,
          contratoGenerado: true,
          kilometrosContrato: kilometros,
          horaRealEntrega: horaRealEntrega,
        }

        // Guardar la reserva actualizada
        const guardadoExitoso = guardarReserva(reservaActualizada)

        if (!guardadoExitoso) {
          throw new Error("No se pudo guardar la reserva actualizada")
        }

        // Actualizar la lista de reservas
        setReservas((prev) => prev.map((r) => (r.id === reservaActualizada.id ? reservaActualizada : r)))

        // Actualizar las reservas filtradas
        setReservasFiltradas((prev) => {
          if (!filtro.trim()) {
            return ordenarReservas(
              prev.map((r) => (r.id === reservaActualizada.id ? reservaActualizada : r)),
              ordenacion,
            )
          }

          const filtroLower = filtro.toLowerCase()
          return ordenarReservas(
            prev
              .map((r) => (r.id === reservaActualizada.id ? reservaActualizada : r))
              .filter(
                (r) =>
                  r.numeroReserva.toLowerCase().includes(filtroLower) ||
                  r.modelo.toLowerCase().includes(filtroLower) ||
                  r.cliente.nombre.toLowerCase().includes(filtroLower) ||
                  r.cliente.dni.toLowerCase().includes(filtroLower) ||
                  r.cliente.telefono.toLowerCase().includes(filtroLower),
              ),
            ordenacion,
          )
        })

        // Mostrar mensaje de éxito
        alert("Contrato generado correctamente")

        // Sincronizar con el servidor nube si hay conexión a internet
        if (navigator.onLine) {
          try {
            console.log("Sincronizando reserva con contrato con Firebase...")
            // Importar dinámicamente para evitar dependencias circulares
            const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
            const resultado = await guardarReservaFirebase(reservaActualizada)

            if (resultado) {
              console.log("Reserva con contrato sincronizada correctamente en Firebase")
              // Actualizar el timestamp de la última sincronización
              localStorage.setItem("lastSyncTime", new Date().toLocaleString())
            } else {
              console.error("Error al sincronizar reserva con contrato con Firebase")
            }
          } catch (error) {
            console.error("Error al sincronizar reserva con contrato con Firebase:", error)
          }
        }
      } catch (error) {
        console.error("Error al generar el contrato:", error)
        alert("Ha ocurrido un error al generar el contrato. Por favor, inténtelo de nuevo.")
      } finally {
        setProcesandoContrato(false)
        setShowKilometrosDialog(false)
        setReservaParaContrato(null)
      }
    },
    [reservaParaContrato, filtro, ordenacion],
  )

  // Función para crear un evento en Google Calendar
  const crearEventoCalendario = useCallback((reserva: ReservaCompleta) => {
    try {
      const fechaEntrega = parseFechaSegura(reserva.detalles.fechaEntrega)
      const fechaDevolucion = parseFechaSegura(reserva.detalles.fechaDevolucion)

      // Ajustar las horas según los datos de la reserva
      const [horaEntrega, minutosEntrega] = reserva.detalles.horaEntrega.split(":").map(Number)
      const [horaDevolucion, minutosDevolucion] = reserva.detalles.horaDevolucion.split(":").map(Number)

      fechaEntrega.setHours(horaEntrega || 0, minutosEntrega || 0, 0)
      fechaDevolucion.setHours(horaDevolucion || 0, minutosDevolucion || 0, 0)

      // Formatear fechas para la URL de Google Calendar
      const fechaEntregaISO = fechaEntrega.toISOString().replace(/-|:|\.\d+/g, "")
      const fechaDevolucionISO = fechaDevolucion.toISOString().replace(/-|:|\.\d+/g, "")

      // Crear descripción del evento
      const descripcion = `
        Reserva: ${reserva.numeroReserva}
        Cliente: ${reserva.cliente.nombre}
        DNI: ${reserva.cliente.dni}
        Teléfono: ${reserva.cliente.telefono}
        Importe total: ${reserva.importeTotal}€
        Señal: ${reserva.importeSenal}€
        Forma de pago: ${reserva.formaPago || "No especificada"}
        ${reserva.cliente.notas ? `Notas: ${reserva.cliente.notas}` : ""}
      `.trim()

      // Crear título del evento incluyendo el nombre del cliente
      const titulo = `Reserva ${reserva.numeroReserva} - ${reserva.modelo} - ${reserva.cliente.nombre}`

      // Crear URL para Google Calendar
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${fechaEntregaISO}/${fechaDevolucionISO}&details=${encodeURIComponent(descripcion)}&location=Caravalia&sf=true&output=xml`

      // Abrir la URL en una nueva ventana
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error al crear evento en Google Calendar:", error)
      alert("Ha ocurrido un error al crear el evento en Google Calendar. Por favor, inténtelo manualmente.")
    }
  }, [])

  // Añadir la nueva función para generar el PDF confirmado
  const generarPDFConfirmado = useCallback(async (reserva: ReservaCompleta) => {
    try {
      // Crear un contenedor temporal para el PDF
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "-9999px"
      document.body.appendChild(tempContainer)

      // Renderizar el componente ReservationA4Template con el parámetro reservaValidada=true
      const root = ReactDOM.createRoot(tempContainer)
      root.render(
        <ReservationA4Template
          numeroReserva={reserva.numeroReserva}
          modelo={reserva.modelo}
          reservaDetalles={reserva.detalles}
          clienteData={reserva.cliente}
          totalDias={reserva.totalDias}
          importeTotal={reserva.importeTotal}
          importeSenal={reserva.importeSenal}
          importeRestante={reserva.importeRestante}
          suplemento={Number(reserva.detalles.suplemento || 0)}
          descripcionSuplemento={reserva.detalles.descripcionSuplemento}
          reservaValidada={true}
        />,
      )

      // Esperar a que el componente se renderice
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generar el PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 793, // ~210mm en px a 96dpi
        height: 1122, // ~297mm en px a 96dpi
        windowWidth: 793,
        windowHeight: 1122,
      })

      // Limpiar el contenedor temporal
      document.body.removeChild(tempContainer)

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297)

      // Crear un nombre de archivo con "CONFIRMADA" al final
      let nombreArchivo = `Reserva_${reserva.numeroReserva}`

      try {
        // Añadir el nombre del cliente
        if (reserva.cliente && reserva.cliente.nombre) {
          const nombreCliente = reserva.cliente.nombre
            .replace(/[^\w\s]/gi, "") // Eliminar caracteres especiales
            .replace(/\s+/g, "_") // Reemplazar espacios con guiones bajos
          nombreArchivo += `_${nombreCliente}`
        }

        // Añadir la fecha formateada
        if (reserva.detalles && reserva.detalles.fechaEntrega) {
          const fechaEntrega = parseFechaSegura(reserva.detalles.fechaEntrega)
          const dia = fechaEntrega.getDate()
          const mes = fechaEntrega.toLocaleString("es", { month: "long" })
          const anio = fechaEntrega.getFullYear()
          nombreArchivo += `_${dia}_de_${mes}_${anio}`
        }
      } catch (error) {
        console.error("Error al formatear el nombre del archivo:", error)
        nombreArchivo = `Reserva_${reserva.numeroReserva}_${new Date().getTime()}`
      }

      // Añadir "CONFIRMADA" al final del nombre
      nombreArchivo = `${nombreArchivo}_CONFIRMADA.pdf`

      // Asegurar que el nombre del archivo sea válido
      nombreArchivo = nombreArchivo.replace(/[/\\?%*:|"<>]/g, "_")

      // Descargar el PDF
      pdf.save(nombreArchivo)
    } catch (error) {
      console.error("Error al generar el PDF confirmado:", error)
      alert("Ha ocurrido un error al generar el PDF confirmado. Por favor, inténtelo de nuevo.")
    }
  }, [])

  // --- FUNCIÓN DE EXPORTACIÓN A EXCEL ---
  const handleExportarExcel = useCallback(() => {
    if (!excelFechaDesde || !excelFechaHasta) {
      alert("Debe seleccionar ambas fechas (desde y hasta).")
      return
    }

    const desde = new Date(excelFechaDesde)
    const hasta = new Date(excelFechaHasta)
    hasta.setHours(23, 59, 59, 999) // Incluir todo el día final

    // Filtrar reservas por rango de fecha de entrega
    const reservasEnRango = reservas.filter(r => {
      if (r.anulada) return false // Excluir anuladas
      const fechaEntrega = parseFechaSegura(r.detalles.fechaEntrega)
      return fechaEntrega >= desde && fechaEntrega <= hasta
    })

    if (reservasEnRango.length === 0) {
      alert("No se encontraron reservas en el rango de fechas seleccionado.")
      return
    }

    // Construir datos para el Excel
    const datosExcel = reservasEnRango.map(r => ({
      "Nombre y Apellidos": r.cliente.nombre || "",
      "DNI": r.cliente.dni || "",
      "Localidad": r.cliente.poblacion || "",
      "Provincia": r.cliente.provincia || "",
      "Email": r.cliente.email || "",
      "Teléfono": r.cliente.telefono || "",
      "Destinos": r.destinos || "",
      "Precio Diario (€)": r.detalles.precioDiario || "",
      "Fecha Recogida": formatearFechaSegura(r.detalles.fechaEntrega),
      "Fecha Devolución": formatearFechaSegura(r.detalles.fechaDevolucion),
      "Precio Total (€)": r.importeTotal || 0,
      "Días Alquilados": r.totalDias || 0,
    }))

    // Crear libro y hoja de Excel
    const ws = XLSX.utils.json_to_sheet(datosExcel)

    // Ajustar anchos de columna
    ws["!cols"] = [
      { wch: 30 }, // Nombre
      { wch: 12 }, // DNI
      { wch: 18 }, // Localidad
      { wch: 15 }, // Provincia
      { wch: 28 }, // Email
      { wch: 14 }, // Teléfono
      { wch: 30 }, // Destinos
      { wch: 14 }, // Precio diario
      { wch: 14 }, // Fecha recogida
      { wch: 14 }, // Fecha devol.
      { wch: 14 }, // Precio total
      { wch: 14 }, // Días
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reservas Caravalia")

    // Generar nombre del archivo
    const nombreArchivo = `Caravalia_Reservas_${excelFechaDesde}_a_${excelFechaHasta}.xlsx`

    // Descargar
    XLSX.writeFile(wb, nombreArchivo)

    // Cerrar diálogo
    setShowExcelDialog(false)
    alert(`Exportación completada: ${reservasEnRango.length} reservas exportadas.`)
  }, [reservas, excelFechaDesde, excelFechaHasta])

  // Mostrar pantalla de carga mientras se cargan los datos
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-caravalia-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-caravalia-200 border-t-caravalia-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-caravalia-600">Cargando reservas...</p>
        </div>
      </main>
    )
  }

  // Mostrar pantalla de error si hay algún problema
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-caravalia-50 to-white">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Recargar página
            </button>
            <button onClick={handleVolver} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-8 bg-[#EBEBEB] font-body selection:bg-[#baeed9] selection:text-[#003829]">
      <div className="w-full max-w-[95%] lg:max-w-7xl mx-auto flex flex-col gap-6">
        {/* Superior */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleVolver}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white text-[#707974] hover:text-[#003829] shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">arrow_back</span>
            </button>
            <h1 className="text-lg sm:text-2xl font-headline font-black text-[#003829] tracking-tight">Registro de Reservas</h1>
          </div>

          {/* Botón Excel minimalista para móvil */}
          <button 
            onClick={() => setShowExcelDialog(true)}
            className="flex flex-col items-center gap-0.5 md:hidden transition-all active:scale-90"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-green-100">
              <span className="material-symbols-outlined text-green-600 text-[20px]">ios_share</span>
            </div>
            <span className="text-[10px] font-bold text-[#707974] uppercase tracking-tighter">Excel</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 shadow-sm w-full">
          <div className="flex flex-row items-center gap-2 sm:gap-4 w-full">
            {/* Buscador más compacto en móvil */}
            <div className="relative flex-1 h-12 sm:h-14">
              <span className="material-symbols-outlined absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-[#A0A8A3] text-[20px]">search</span>
              <input
                placeholder={filtro.length > 0 ? "" : "Buscar..."}
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-2 bg-[#F5F5F5] border-transparent rounded-xl sm:rounded-[1.5rem] h-full text-[#004D3F] font-bold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#baeed9] transition-all"
              />
            </div>
            
            {/* NUEVO FILTRO ANUAL MÚLTIPLE (Compacto en móvil) */}
            <div className="w-[120px] sm:w-[280px] h-12 sm:h-14 shrink-0 relative flex items-center px-1 sm:px-4 gap-1 sm:gap-3 focus-within:ring-2 focus-within:ring-[#baeed9] transition-all rounded-xl sm:rounded-[1.5rem] bg-[#EBEBEB]/50 hover:bg-[#EBEBEB]">
               <label className="hidden sm:flex items-center gap-2 cursor-pointer text-[#003829] shrink-0 font-bold ml-1">
                 <input 
                   type="checkbox" 
                   checked={filtroAnioActivo}
                   onChange={(e) => handleToggleFiltroAnio(e.target.checked)}
                   className="w-5 h-5 rounded border-gray-300 text-[#003829] focus:ring-[#003829]" 
                 />
                 Salidas:
               </label>
               
               {/* Checkbox simplificado para móvil */}
               <input 
                 type="checkbox" 
                 checked={filtroAnioActivo}
                 onChange={(e) => handleToggleFiltroAnio(e.target.checked)}
                 className="flex sm:hidden w-4 h-4 rounded border-gray-300 text-[#003829] focus:ring-[#003829] ml-1" 
               />

               <button
                 onClick={() => setAnioDropdownOpen(!anioDropdownOpen)}
                 disabled={!filtroAnioActivo}
                 className={`flex-1 flex justify-between items-center bg-transparent font-headline font-black text-[12px] sm:text-[15px] outline-none ${filtroAnioActivo ? 'text-[#003829]' : 'text-[#A0A8A3]'}`}
               >
                 <span className="truncate pr-1">
                    {aniosSeleccionados.length === 0 ? "Off" : aniosSeleccionados.join(",")}
                 </span>
                 <span className="material-symbols-outlined text-[16px] sm:text-[24px]">expand_more</span>
               </button>

               {anioDropdownOpen && filtroAnioActivo && (
                 <div className="absolute top-[120%] right-0 w-full min-w-[200px] bg-white shadow-xl rounded-[1.5rem] p-3 z-50 border border-gray-100 flex flex-col max-h-[300px] overflow-y-auto">
                   <div className="flex justify-between items-center mb-2 px-2">
                     <span className="text-[11px] font-headline font-bold text-[#A0A8A3] uppercase">Años Visibles</span>
                     <button onClick={() => setAnioDropdownOpen(false)} className="text-[#707974] hover:text-[#c62828]"><span className="material-symbols-outlined text-[16px]">close</span></button>
                   </div>
                   {(() => {
                      const startYear = Math.min(2024, CURRENT_YEAR - 1);
                      const years = Array.from({length: 10}, (_, i) => startYear + i);
                      return years.map(y => (
                        <label key={y} className="flex items-center gap-3 p-2.5 hover:bg-[#F5F5F5] rounded-xl cursor-pointer">
                          <input 
                             type="checkbox" 
                             className="w-5 h-4 sm:h-5 rounded border-gray-300 text-[#003829] focus:ring-[#003829]"
                             checked={aniosSeleccionados.includes(y)}
                             onChange={() => handleToggleAnio(y)}
                          />
                          <span className="font-bold text-[#191c1c]">{y}</span>
                        </label>
                      ))
                   })()}
                 </div>
               )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full items-center">
            <div className="w-full md:flex-1 h-12 sm:h-14">
              <select
                value={ordenacion}
                onChange={(e) => setOrdenacion(e.target.value)}
                className="w-full h-full px-4 bg-[#F5F5F5] border-transparent rounded-xl sm:rounded-[1.5rem] text-[#004D3F] font-bold uppercase tracking-wider text-[11px] outline-none focus:ring-2 focus:ring-[#baeed9] transition-all font-headline cursor-pointer appearance-none"
              >
                <option value="fechaEntrega">Próximas entregas</option>
                <option value="numeroDesc">Nº reserva (Mayor)</option>
                <option value="numeroAsc">Nº reserva (Menor)</option>
                <option value="validadas">Reservas validadas</option>
                <option value="contratos">Con contrato</option>
              </select>
            </div>

            {/* Botón Exportar Excel (Desktop) */}
            <button
              onClick={() => setShowExcelDialog(true)}
              className="hidden md:flex h-14 px-8 bg-[#003829] text-white rounded-[1.5rem] items-center gap-3 font-headline font-black text-sm uppercase tracking-widest hover:bg-[#004D3F] transition-all shadow-sm hover:translate-y-[-2px] active:translate-y-[0px] shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Listado */}
        {reservasFiltradas.length > 0 ? (
          <div className="flex flex-col gap-2 sm:gap-3">
            {reservasFiltradas.map((reserva) => {
              const estaExpandida = reservaExpandidaId === reserva.id

              return (
                <div 
                  key={reserva.id} 
                  onClick={(e) => toggleExpandirReserva(reserva.id, e)}
                  className={`rounded-[1.5rem] p-3 sm:p-4 lg:p-5 shadow-sm transition-all flex flex-col xl:flex-row gap-2.5 xl:gap-6 items-start xl:items-center w-full min-w-full cursor-pointer xl:cursor-default ring-offset-2 ${
                    estaExpandida ? 'ring-2 ring-[#baeed9] scale-[1.01]' : ''
                  } ${
                    reserva.anulada
                      ? "bg-[#FFF5F5] border border-[#FECACA] opacity-95" 
                      : reserva.contratoGenerado 
                        ? "bg-[#BBF7D0] border border-[#86efac]" 
                        : reserva.validado 
                          ? "bg-white border border-transparent"
                          : "bg-white border-[2px] border-[#ffcdd2] shadow-[0_4px_12px_rgba(220,38,38,0.05)]"
                  }`}
                >
                  {/* ID, Estado e Importe (Móvil) */}
                  <div className="flex items-start justify-between w-full xl:w-[80px] shrink-0">
                    <div className="flex xl:flex-col items-center xl:items-start gap-4 xl:gap-1">
                      <span className={`text-[20px] font-headline font-black ${reserva.anulada ? 'text-[#991B1B] line-through opacity-50' : 'text-[#003829]'}`}>#{reserva.numeroReserva}</span>
                      <div className="flex gap-2">
                        {reserva.anulada ? (
                          <span className="text-[10px] bg-[#FECACA] text-[#991B1B] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Anulada</span>
                        ) : (
                          <>
                            {reserva.validado && <span className="material-symbols-outlined text-[16px] text-[#16a34a]" title="Validada">check_circle</span>}
                            {reserva.contratoGenerado && <span className="material-symbols-outlined text-[16px] text-blue-600" title="Contrato Generado">description</span>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Importe solo para móvil (se oculta en XL) */}
                      <div className="xl:hidden flex flex-col items-end text-right">
                        <span className={`font-black text-[16px] ${reserva.anulada ? 'text-[#991B1B] opacity-50' : 'text-[#003829]'}`}>
                           {reserva.importeTotal}€
                        </span>
                        <span className="text-[10px] font-bold text-[#707974] uppercase">
                           ({reserva.importeSenal}€ señal)
                        </span>
                      </div>
                      
                      {/* Indicador de expansión solo móvil */}
                      <span className={`material-symbols-outlined xl:hidden transition-transform duration-300 ${estaExpandida ? 'rotate-180' : ''} text-[#A0A8A3]`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="flex flex-col w-full xl:w-[260px] shrink-0 overflow-hidden pr-2">
                    <span className="text-[11px] font-headline uppercase tracking-widest text-[#A0A8A3] font-bold mb-0.5 xl:mb-1">Cliente</span>
                    <span className="font-bold text-[#191c1c] text-sm uppercase truncate w-full" title={reserva.cliente.nombre}>{reserva.cliente.nombre}</span>
                    <span className="text-[13px] text-[#707974]">{reserva.cliente.telefono}</span>
                  </div>

                  {/* Vehículo y Fechas */}
                  <div className="flex flex-col w-full xl:w-[280px] shrink-0">
                     <span className="text-[11px] font-headline uppercase tracking-widest text-[#A0A8A3] font-bold mb-0.5 xl:mb-1">Fecha y hora <strong>({reserva.modelo})</strong></span>
                     <div className="flex items-center gap-2 text-[#191c1c] font-medium text-[13px]">
                       <span className="material-symbols-outlined text-[16px] text-green-600">arrow_right_alt</span>
                       {formatearFechaSegura(reserva.detalles.fechaEntrega)} - 
                       <span className={reserva.detalles.horaEntrega && reserva.detalles.horaEntrega !== "09:00" ? "text-[#c62828] font-bold" : "text-[#707974]"}>
                         {reserva.detalles.horaEntrega || "09:00"}h
                       </span>
                     </div>
                     <div className="flex items-center gap-2 text-[#191c1c] font-medium text-[13px] mt-0.5">
                       <span className="material-symbols-outlined text-[16px] text-blue-600">arrow_left_alt</span>
                       {formatearFechaSegura(reserva.detalles.fechaDevolucion)} - 
                       <span className="text-[#707974]">
                         {reserva.detalles.horaDevolucion || "09:00"}h
                       </span>
                     </div>
                  </div>

                  {/* Importes (Desktop) */}
                  <div className="hidden xl:flex flex-col w-full xl:w-[130px] shrink-0 items-end text-right">
                     <span className="text-[11px] font-headline uppercase tracking-widest text-[#A0A8A3] font-bold mb-0.5 xl:mb-1 w-full text-right opacity-90 pr-1">Importe</span>
                     <span className={`font-black text-[16px] w-full text-right ${reserva.anulada ? 'text-[#991B1B] opacity-50' : 'text-[#003829]'}`}>
                        {reserva.anulada && reserva.importeDevuelto && reserva.importeDevuelto > 0 ? (
                          <span className="text-[11px] block text-[#c62828] font-bold line-through">-{reserva.importeDevuelto}€ devueltos</span>
                        ) : null}
                        {reserva.importeTotal}€
                     </span>
                      <span className="text-[11px] font-bold text-[#707974] uppercase rounded-md bg-[#F5F5F5] inline-block px-1.5 py-0.5 mt-1 border border-[#EBEBEB] w-fit">
                        {reserva.formaPago || "N/A"} 
                        <span className="ml-1 opacity-70 font-medium">({reserva.importeSenal}€ señal)</span>
                      </span>
                   </div>

                  {/* Acciones (Con efecto acordeón en móvil) */}
                  <div className={`grid transition-all duration-300 ease-in-out w-full xl:flex-1 ${estaExpandida ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 xl:grid-rows-[1fr] xl:opacity-100'}`}>
                    <div className="overflow-hidden xl:overflow-visible">
                      <div className="w-full h-full flex items-center justify-end flex-wrap gap-2 pt-3 pb-1 xl:pt-0 xl:pb-0 border-t xl:border-t-0 border-[#D1D5D2]/30 mt-1 xl:mt-0">
                        {!reserva.anulada ? (
                          <>
                            <button 
                              onClick={() => handleEditarReserva(reserva)} 
                              className={`p-2.5 rounded-xl text-[#003829] transition-opacity border ${reserva.validado && reserva.contratoGenerado ? 'bg-white border-[#86efac] shadow-sm' : 'bg-[#E5F3EA] border-[#baeed9]'} hover:opacity-80`} 
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[20px] block">edit</span>
                            </button>
                            <button 
                              onClick={() => handlePrevisualizar(reserva)} 
                              className={`p-2.5 rounded-xl text-[#003829] transition-opacity border ${reserva.validado && reserva.contratoGenerado ? 'bg-white border-[#86efac] shadow-sm' : 'bg-[#E5F3EA] border-[#baeed9]'} hover:opacity-80`} 
                              title="Ojo Analítico"
                            >
                              <span className="material-symbols-outlined text-[20px] block">visibility</span>
                            </button>
                            <button onClick={() => handleValidarReserva(reserva)} className={`p-2.5 rounded-xl transition-all border ${reserva.validado ? 'bg-[#16a34a] text-white border-[#16a34a] shadow-sm' : 'bg-white text-[#707974] border-[#D1D5D2] hover:bg-[#F5F5F5]'}`} title="Validar Reserva">
                              <span className="material-symbols-outlined text-[20px] block">fact_check</span>
                            </button>
                            <button onClick={() => handleAlternarContrato(reserva)} className={`p-2.5 rounded-xl transition-all border ${reserva.contratoGenerado ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-[#707974] border-[#D1D5D2] hover:bg-[#F5F5F5]'}`} title={reserva.contratoGenerado ? "Anular marca de contrato" : "Generar Contrato"}>
                              <span className="material-symbols-outlined text-[20px] block">description</span>
                            </button>
                            
                            <button 
                              onClick={() => confirmarEliminarReserva(reserva.id)} 
                              className="ml-auto xl:ml-2 flex items-center gap-1.5 px-5 py-2.5 rounded-full uppercase tracking-wider text-[12px] font-bold bg-[#ffebee] text-[#c62828] hover:bg-[#ffcdd2] hover:text-[#b71c1c] transition-all shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              Anular
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setMotivoVerActual(reserva.motivoAnulacion || "No se especificó motivo.");
                                setShowMotivoDialog(true);
                              }}
                              className="p-2.5 rounded-xl text-[#707974] bg-white border border-[#D1D5D2] hover:bg-[#F5F5F5]"
                              title="Ver Motivo"
                            >
                              <span className="material-symbols-outlined text-[20px] block">info</span>
                            </button>
                            <button 
                              onClick={() => handleRestaurarReserva(reserva)}
                              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full uppercase tracking-wider text-[12px] font-bold bg-[#E5F3EA] text-[#003829] hover:bg-[#baeed9] transition-all shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                              Restaurar Reserva
                            </button>
                            <button 
                              onClick={() => confirmarEliminarReserva(reserva.id)} 
                              className="p-2.5 rounded-xl text-[#c62828] bg-white border border-[#FECACA] hover:bg-[#FFF5F5]"
                              title="Eliminar Definitivamente"
                            >
                              <span className="material-symbols-outlined text-[20px] block">delete_forever</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-sm">
             <span className="material-symbols-outlined text-[64px] text-[#D1D5D2] mb-4">inbox</span>
             <h3 className="text-xl font-headline font-bold text-[#003829]">Sin reservas a la vista</h3>
             <p className="text-[#707974] mt-2 font-medium">No se han encontrado registros acordes a los filtros.</p>
          </div>
        )}
      </div>

      {/* DIÁLOGO DE ANULACIÓN AVANZADO */}
      <Dialog open={reservaAEliminar !== null} onOpenChange={(open) => !open && setReservaAEliminar(null)}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[2rem] shadow-xl p-0 overflow-hidden">
          <div className="bg-[#FFF5F5] p-6 border-b border-[#FECACA]">
            <DialogTitle className="text-[#c62828] font-headline font-black text-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px]">warning</span> 
              Gestión de Reserva
            </DialogTitle>
            <DialogDescription className="text-[#991B1B] text-[13px] font-medium mt-1">
              ¿Qué deseas hacer con el expediente #{reservas.find(r => r.id === reservaAEliminar)?.numeroReserva}?
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            {/* OPCIÓN 1: ANULAR (MANTENER RASTRO) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#E11D48] font-bold text-sm">1</div>
                <h3 className="font-headline font-bold text-[#191C1C]">Anular Reserva (Recomendado)</h3>
              </div>
              
              <p className="text-[13px] text-[#707974] leading-relaxed ml-11">
                La reserva aparecerá en <span className="text-[#c62828] font-bold">rojo</span> pero se mantendrá en el listado. Podrás restaurarla en el futuro si el cliente cambia de opinión.
              </p>

              {/* Lógica de devolución si hay señal */}
              {reservas.find(r => r.id === reservaAEliminar)?.validado && (
                <div className="ml-11 bg-[#F5F5F5] p-4 rounded-xl border border-[#EBEBEB] space-y-3">
                  <label className="text-[11px] font-headline uppercase tracking-widest text-[#707974] font-bold block">
                    Dinero a devolver al cliente (€)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A8A3] font-bold">€</span>
                    <input 
                      type="number"
                      value={importeDevueltoInput}
                      onChange={(e) => setImporteDevueltoInput(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-white border border-[#D1D5D2] rounded-lg text-[#003829] font-bold focus:ring-2 focus:ring-[#baeed9] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[10px] text-[#A0A8A3] italic">
                    * Este importe se restará del beneficio histórico en Rentabilidad.
                  </p>
                </div>
              )}

              {/* CAMPO MOTIVO */}
              <div className="ml-11 flex flex-col gap-2">
                <label className="text-[11px] font-headline uppercase tracking-widest text-[#707974] font-bold block">
                  Motivo de la anulación
                </label>
                <textarea 
                  value={motivoAnulacionInput}
                  onChange={(e) => setMotivoAnulacionInput(e.target.value)}
                  className="w-full p-4 bg-[#F5F5F5] border border-[#EBEBEB] rounded-xl text-[#003829] text-[13px] font-medium focus:ring-2 focus:ring-[#baeed9] outline-none min-h-[100px] resize-none"
                  placeholder="Ej: El cliente no puede venir por motivos personales..."
                />
              </div>

              <button
                onClick={handleAnularReserva}
                className="w-full ml-0 sm:ml-11 sm:w-[calc(100%-44px)] py-3.5 rounded-full font-headline font-bold bg-[#c62828] text-white hover:bg-[#b71c1c] transition-all shadow-md uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">block</span>
                Confirmar Anulación
              </button>
            </div>

            <div className="border-t border-dashed border-[#D1D5D2] my-2"></div>

            {/* OPCIÓN 2: BORRADO DEFINITIVO */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">2</div>
                <h3 className="font-headline font-bold text-gray-400">Borrado Definitivo</h3>
              </div>
              <button
                onClick={handleEliminarReserva}
                className="w-full ml-0 sm:ml-11 sm:w-[calc(100%-44px)] py-2.5 rounded-full font-headline font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all uppercase text-[10px] tracking-widest border border-transparent hover:border-red-200"
              >
                Eliminar rastros (Permanente)
              </button>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 p-4 border-t border-[#EBEBEB]">
            <button
              onClick={() => setReservaAEliminar(null)}
              className="w-full py-3 rounded-full font-headline font-bold text-[#707974] hover:bg-[#EBEBEB] transition-all text-xs uppercase tracking-widest"
            >
              Volver Atrás
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KilometrosDialog
        open={showKilometrosDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowKilometrosDialog(false)
            setReservaParaContrato(null)
          }
        }}
        onConfirm={generarContrato}
        onCancel={() => {
          setShowKilometrosDialog(false)
          setReservaParaContrato(null)
        }}
        procesando={procesandoContrato}
      />

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F5F5F5] border-transparent rounded-[2rem] p-0 shadow-xl">
          <div className="bg-white p-6 sticky top-0 z-10 border-b border-[#EBEBEB] shadow-sm">
            <DialogTitle className="text-[#003829] font-headline font-black text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E5F3EA] rounded-full flex items-center justify-center">
                 <span className="material-symbols-outlined text-[20px] text-[#003829]">inventory_2</span>
              </div>
              Expediente #{reservaParaPrevisualizar?.numeroReserva} - <span className="font-medium">{reservaParaPrevisualizar?.modelo}</span>
            </DialogTitle>
          </div>

          {reservaParaPrevisualizar && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#EBEBEB]">
                  <h3 className="font-headline font-bold text-[#A0A8A3] uppercase tracking-widest text-[11px] mb-4">Datos Registrados</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-2"><span className="text-[#707974] text-[13px]">Titular</span><span className="font-bold text-[#003829] text-[13px] uppercase">{reservaParaPrevisualizar.cliente.nombre}</span></div>
                    <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-2"><span className="text-[#707974] text-[13px]">Documento</span><span className="font-bold text-[#003829] text-[13px] uppercase">{reservaParaPrevisualizar.cliente.dni}</span></div>
                    <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-2"><span className="text-[#707974] text-[13px]">Email</span><span className="font-bold text-[#003829] text-[13px] lowercase">{reservaParaPrevisualizar.cliente.email || "No especificado"}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[#707974] text-[13px]">Contacto</span><span className="font-bold text-[#003829] text-[13px]">{reservaParaPrevisualizar.cliente.telefono}</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#EBEBEB]">
                  <h3 className="font-headline font-bold text-[#A0A8A3] uppercase tracking-widest text-[11px] mb-4">Fechas Acordadas</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-2"><span className="text-[#707974] text-[13px]">Inicio</span><span className="font-bold text-[#003829] text-[13px]">{formatearFechaSegura(reservaParaPrevisualizar.detalles.fechaEntrega)} a las {reservaParaPrevisualizar.detalles.horaEntrega}</span></div>
                    <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-2"><span className="text-[#707974] text-[13px]">Terminación</span><span className="font-bold text-[#003829] text-[13px]">{formatearFechaSegura(reservaParaPrevisualizar.detalles.fechaDevolucion)} a las {reservaParaPrevisualizar.detalles.horaDevolucion}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[#707974] text-[13px] font-bold">Resumen de tiempo</span><span className="font-black text-[#003829] text-[13px] bg-[#E5F3EA] px-2 py-0.5 rounded">{reservaParaPrevisualizar.totalDias} días</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[#EBEBEB]">
                <h3 className="font-headline font-bold text-[#A0A8A3] uppercase tracking-widest text-[11px] mb-4">Desglose Económico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3 pr-0 md:pr-4 md:border-r border-[#EBEBEB]">
                    <div className="flex justify-between items-center border-b border-[#F5F5F5] pb-2"><span className="text-[#707974] text-[13px]">Cuota Diaria</span><span className="font-bold text-[#003829] text-[13px]">{reservaParaPrevisualizar.detalles.precioDiario}€</span></div>
                    <div className="flex justify-between items-center"><span className="text-[#707974] text-[13px]">Suplementos extra</span><span className="font-bold text-[#003829] text-[13px]">{reservaParaPrevisualizar.detalles.suplemento || "0"}€</span></div>
                    {Number(reservaParaPrevisualizar.detalles.suplemento) > 0 && reservaParaPrevisualizar.detalles.descripcionSuplemento && (
                        <div className="flex justify-between items-start text-xs text-[#A0A8A3] pt-1">
                          <span className="w-1/3">Concepto:</span>
                          <span className="text-right w-2/3 italic leading-tight">{reservaParaPrevisualizar.detalles.descripcionSuplemento}</span>
                        </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center"><span className="text-[#707974] text-[13px] font-bold uppercase tracking-wide">Base TOTAL</span><span className="font-black text-[#003829] text-[20px]">{reservaParaPrevisualizar.importeTotal}€</span></div>
                    <div className="flex justify-between items-center"><span className="text-[#707974] text-[13px]">Forma de pago</span><span className="font-bold uppercase text-[11px] bg-[#F5F5F5] border border-[#EBEBEB] rounded px-2 py-0.5 text-[#003829]">{reservaParaPrevisualizar.formaPago}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[#707974] text-[13px]">Depósito (30%)</span><span className="font-bold text-[#003829] text-[14px]">{reservaParaPrevisualizar.importeSenal}€</span></div>
                    <div className="flex justify-between items-center mt-3 border-t border-dashed border-[#D1D5D2] pt-3"><span className="text-[#c62828] text-[13px] font-bold uppercase tracking-wide">Restante a Pagar</span><span className="font-black text-[#c62828] text-[18px] bg-[#ffebee] px-3 py-1 rounded-full">{reservaParaPrevisualizar.importeRestante}€</span></div>
                  </div>
                </div>
              </div>

              {reservaParaPrevisualizar.cliente.notas && (
                <div className="bg-[#FFF8E1] rounded-[1.5rem] p-6 shadow-sm border border-[#FFECB3]">
                  <h3 className="font-headline font-bold text-[#F57F17] uppercase tracking-widest text-[11px] mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">edit_note</span> Anexo Adicional</h3>
                  <p className="text-[14px] font-medium leading-relaxed font-body text-[#5D4037]">{reservaParaPrevisualizar.cliente.notas}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-6 md:p-8 rounded-b-[2rem] border-t border-[#EBEBEB] flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => setShowPreviewDialog(false)}
              className="px-8 py-3.5 rounded-full font-headline font-bold text-[#A0A8A3] bg-[#F5F5F5] hover:bg-[#EBEBEB] hover:text-[#707974] transition-all w-full sm:w-auto text-sm uppercase tracking-wider"
            >
              Descartar
            </button>
            <button
              onClick={() => {
                setShowPreviewDialog(false)
                if (reservaParaPrevisualizar) {
                  handleEditarReserva(reservaParaPrevisualizar)
                }
              }}
              className="px-8 py-3.5 rounded-full font-headline font-bold bg-[#003829] text-white hover:opacity-90 transition-opacity w-full sm:w-auto flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Reserva
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO PARA VER MOTIVO */}
      <Dialog open={showMotivoDialog} onOpenChange={setShowMotivoDialog}>
        <DialogContent className="sm:max-w-[400px] bg-white border-transparent rounded-[2rem] shadow-xl p-0 overflow-hidden">
          <div className="bg-[#E5F3EA] p-6 border-b border-[#baeed9]">
            <DialogTitle className="text-[#003829] font-headline font-black text-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px]">info</span> 
              Motivo de Anulación
            </DialogTitle>
          </div>
          <div className="p-8">
            <p className="text-[#191C1C] text-[15px] font-medium leading-relaxed italic">
              " {motivoVerActual} "
            </p>
          </div>
          <DialogFooter className="bg-gray-50 p-4 border-t border-[#EBEBEB]">
            <button
              onClick={() => setShowMotivoDialog(false)}
              className="w-full py-3 rounded-full font-headline font-bold text-[#003829] hover:bg-[#EBEBEB] transition-all text-xs uppercase tracking-widest"
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO EXPORTAR EXCEL */}
      <Dialog open={showExcelDialog} onOpenChange={setShowExcelDialog}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[2.5rem] p-0 overflow-hidden">
          <div className="bg-[#003829] p-6 text-white">
            <DialogTitle className="font-headline font-black text-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[28px]">download</span>
              Exportar Reservas a Excel
            </DialogTitle>
            <p className="text-white/70 text-[12px] mt-2 font-medium">
              Seleccione el rango de fechas de recogida para generar el informe.
            </p>
          </div>
          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A0A8A3] tracking-widest ml-1">Desde</label>
                <input 
                  type="date" 
                  value={excelFechaDesde}
                  onChange={(e) => setExcelFechaDesde(e.target.value)}
                  className="w-full h-12 px-4 bg-[#F5F5F5] border-transparent rounded-xl text-[#003829] font-bold focus:outline-none focus:ring-2 focus:ring-[#baeed9]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[#A0A8A3] tracking-widest ml-1">Hasta</label>
                <input 
                  type="date" 
                  value={excelFechaHasta}
                  onChange={(e) => setExcelFechaHasta(e.target.value)}
                  className="w-full h-12 px-4 bg-[#F5F5F5] border-transparent rounded-xl text-[#003829] font-bold focus:outline-none focus:ring-2 focus:ring-[#baeed9]"
                />
              </div>
            </div>

            {excelFechaDesde && excelFechaHasta && (
              <div className="bg-[#E5F3EA] rounded-xl p-3 text-center">
                <span className="text-[11px] font-headline font-bold text-[#003829] uppercase tracking-widest">
                  {reservas.filter(r => {
                    if (r.anulada) return false
                    const f = parseFechaSegura(r.detalles.fechaEntrega)
                    const d = new Date(excelFechaDesde)
                    const h = new Date(excelFechaHasta)
                    h.setHours(23,59,59,999)
                    return f >= d && f <= h
                  }).length} reservas encontradas
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowExcelDialog(false)} 
                className="flex-1 py-3.5 rounded-full font-headline font-bold text-[#707974] hover:bg-[#F5F5F5] transition-all text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportarExcel}
                disabled={!excelFechaDesde || !excelFechaHasta}
                className="flex-1 py-3.5 rounded-full font-headline font-bold bg-[#003829] text-white hover:opacity-90 transition-all text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Descargar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
