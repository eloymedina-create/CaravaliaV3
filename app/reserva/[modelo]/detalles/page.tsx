"use client"

import { useState, useEffect, use, useRef } from "react"
import { NumericInput } from "@/components/NumericInput"
import { useRouter, useSearchParams } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { SuperSimpleDatePicker } from "@/components/super-simple-date-picker"
import { NuevoAutocaravanaIcon } from "@/components/icons/nuevo-autocaravana-icon"
import { guardarReserva, obtenerReservaPorNumeroYModelo, generarId, obtenerReservas } from "@/lib/reservas-store"
import { obtenerBloqueos } from "@/lib/bloqueos-store"
import { obtenerConfiguracion } from "@/lib/config-store"
import type { ReservaCompleta, ValeDescuento, Bloqueo } from "@/lib/types"
import { isWithinInterval, isSameDay, startOfDay, endOfDay } from "date-fns"
import { AlertCircle } from "lucide-react"

import ReactDOM from "react-dom/client"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ReservationA4Template } from "@/components/reservation-a4-template"

export default function DetallesReservaPage({ params }: { params: Promise<{ modelo: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const numeroReserva = searchParams.get("numero") || ""
  const modelo = decodeURIComponent(resolvedParams.modelo)
  const esEdicion = searchParams.get("editar") === "true"

  const [fechaEntrega, setFechaEntrega] = useState<Date | undefined>(new Date())
  const [fechaDevolucion, setFechaDevolucion] = useState<Date | undefined>(new Date())
  const [horaEntrega, setHoraEntrega] = useState("09:00")
  const [horaDevolucion, setHoraDevolucion] = useState("19:00")
  const [precioDiario, setPrecioDiario] = useState("150")
  const [suplemento, setSuplemento] = useState("0")
  const [showSupplementoDialog, setShowSupplementoDialog] = useState(false)
  const [descripcionSuplemento, setDescripcionSuplemento] = useState("")
  const [prevSuplemento, setPrevSuplemento] = useState("0")
  const [porcentaje, setPorcentaje] = useState<number>(0)
  const [cantidad, setCantidad] = useState<number>(1)









  // --- NUEVOS ESTADOS PARA EDICIÓN UNIFICADA ---
  const [nombre, setNombre] = useState("")
  const [dni, setDni] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [poblacion, setPoblacion] = useState("")
  const [provincia, setProvincia] = useState("")
  const [email, setEmail] = useState("")
  const [notas, setNotas] = useState("")
  const [showNotas, setShowNotas] = useState(false)
  const [destinos, setDestinos] = useState("")
  
  const [importeSenal, setImporteSenal] = useState(0)
  const [importeTotalManual, setImporteTotalManual] = useState<string>("")
  const [reservaExistente, setReservaExistente] = useState<ReservaCompleta | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [formaPago, setFormaPago] = useState("BIZUM")

  // --- LÓGICA DE VALES ---
  const [valeSeleccionado, setValeSeleccionado] = useState<ValeDescuento | null>(null)
  const [showValeDialog, setShowValeDialog] = useState(false)
  const [valesDisponibles, setValesDisponibles] = useState<ValeDescuento[]>([])

  // Cálculo de días en tiempo real
  const [totalDias, setTotalDias] = useState(1)
  const [importeTotalCalc, setImporteTotalCalc] = useState(0)
  
  // Lógica de Señal (%)
  const [porcentajeSenal, setPorcentajeSenal] = useState(30)
  
  // Estados de control de edición manual en la sesión actual
  const [totalModificadoManualmente, setTotalModificadoManualmente] = useState(false)
  const [porcentajeModificadoManualmente, setPorcentajeModificadoManualmente] = useState(false)
  const [isSenalManual, setIsSenalManual] = useState(false)
  const [isManualOverride, setIsManualOverride] = useState(false) // Mantenido por compatibilidad

  // Cargar configuración global al montar
  useEffect(() => {
    const config = obtenerConfiguracion()
    if (!esEdicion) {
      setPorcentajeSenal(config.porcentajeSenal)
    }
  }, [esEdicion])
  
  // Aviso de solapamiento
  const [avisoSolapamiento, setAvisoSolapamiento] = useState<{ tipo: 'RESERVA' | 'BLOQUEO', info: string, id?: string } | null>(null)
  const [infoReservaConflictiva, setInfoReservaConflictiva] = useState<ReservaCompleta | null>(null)
  const [showConflictDetail, setShowConflictDetail] = useState(false)
  const [touchedDates, setTouchedDates] = useState(false) // Para no avisar nada más entrar

  // Cargar vales disponibles
  useEffect(() => {
    import("@/lib/vales-store").then(({ obtenerVales }) => {
      const todos = obtenerVales()
      setValesDisponibles(todos.filter(v => v.estado === 'disponible'))
    })
  }, [])

  // --- EFECTO DE CÁLCULOS DINÁMICOS ---
  useEffect(() => {
    if (fechaEntrega && fechaDevolucion) {
      // 1. Cálculo de días
      const startDate = new Date(fechaEntrega.getFullYear(), fechaEntrega.getMonth(), fechaEntrega.getDate())
      const endDate = new Date(fechaDevolucion.getFullYear(), fechaDevolucion.getMonth(), fechaDevolucion.getDate())
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const dias = diffDays + 1
      setTotalDias(dias)

      // 2. Cálculo del total con cantidad y porcentaje
      const pDiario = Number.parseFloat(precioDiario) || 0
      const sup = Number.parseFloat(suplemento) || 0
      const base = pDiario * cantidad * dias
      const totalConPorcentaje = base * (1 + porcentaje / 100)
      const totalCalculado = totalConPorcentaje + sup
      setImporteTotalCalc(totalCalculado)
      
      // 3. Lógica del Total Ajustado (Importe Manual)
      // Si el usuario no ha bloqueado el total escribiendo a mano, lo actualizamos con el cálculo
      if (!totalModificadoManualmente) {
        setImporteTotalManual(totalCalculado.toString())
      }

      // 4. Lógica de la Señal
      if (!esEdicion) {
        // MODO CREACIÓN: La señal sigue al total y al porcentaje automáticamente
        if (!isSenalManual) {
          const senalCalculada = Math.round((totalCalculado * (porcentajeSenal / 100)) / 10) * 10
          const senalConVale = valeSeleccionado ? Math.max(0, senalCalculada - valeSeleccionado.importe) : senalCalculada
          setImporteSenal(senalConVale)
        }
      } else {
        // MODO EDICIÓN: La señal se mantiene fija (es lo ya pagado) 
        // SALVO que el usuario cambie el porcentaje explícitamente en esta sesión
        if (porcentajeModificadoManualmente && !isSenalManual) {
          const totalReferencia = Number(importeTotalManual) || totalCalculado
          const senalCalculada = Math.round((totalReferencia * (porcentajeSenal / 100)) / 10) * 10
          setImporteSenal(senalCalculada)
        }
      }
    }
  }, [fechaEntrega, fechaDevolucion, precioDiario, suplemento, totalModificadoManualmente, porcentajeModificadoManualmente, isSenalManual, valeSeleccionado, esEdicion, porcentajeSenal, importeTotalManual])

  // Lógica de detección de solapamientos
  useEffect(() => {
    // Si no hay fechas o es una reserva nueva y aún no las han tocado, no hacemos nada
    if (!fechaEntrega || !fechaDevolucion || (!esEdicion && !touchedDates)) {
      setAvisoSolapamiento(null)
      setInfoReservaConflictiva(null)
      setShowConflictDetail(false)
      return
    }

    // No validar si la fecha de entrega es posterior a la de devolución (estado inconsistente temporal)
    if (startOfDay(fechaEntrega) > startOfDay(fechaDevolucion)) {
      setAvisoSolapamiento(null)
      return
    }

    const checkOverlaps = () => {
      const start = startOfDay(fechaEntrega)
      const end = endOfDay(fechaDevolucion)

      // 1. Check Bloqueos
      const bloqueos = obtenerBloqueos()
      const bloqueoConflictivo = bloqueos.find(b => {
        const fB = new Date(b.fecha)
        return isSameDay(start, fB) || isSameDay(end, fB) || (fB > start && fB < end)
      })

      if (bloqueoConflictivo) {
        setAvisoSolapamiento({ tipo: 'BLOQUEO', info: bloqueoConflictivo.descripcion })
        setInfoReservaConflictiva(null)
        return
      }

      // 2. Check Otras Reservas
      const reservas = obtenerReservas().filter(r => r.modelo === modelo && !r.anulada && r.id !== reservaExistente?.id)
      const reservaConflictiva = reservas.find(r => {
        const ent = startOfDay(new Date(r.detalles.fechaEntrega))
        const dev = endOfDay(new Date(r.detalles.fechaDevolucion))
        
        return (
          (start >= ent && start <= dev) || 
          (end >= ent && end <= dev) ||
          (ent >= start && ent <= end)
        )
      })

      if (reservaConflictiva) {
        const msg = `${reservaConflictiva.numeroReserva} (${reservaConflictiva.validado ? 'Val.' : 'Pend.'})`
        setAvisoSolapamiento({ tipo: 'RESERVA', info: msg, id: reservaConflictiva.id })
        setInfoReservaConflictiva(reservaConflictiva)
      } else {
        setAvisoSolapamiento(null)
        setInfoReservaConflictiva(null)
        setShowConflictDetail(false)
      }
    }

    checkOverlaps()
  }, [fechaEntrega, fechaDevolucion, modelo, reservaExistente, esEdicion, touchedDates])

  // Cargar datos guardados siempre que haya
  useEffect(() => {
    // Si es edición, intentar cargar la reserva original
    if (esEdicion) {
      const reserva = obtenerReservaPorNumeroYModelo(numeroReserva, modelo)
      if (reserva) {
        setReservaExistente(reserva)
        setNombre(reserva.cliente.nombre)
        setDni(reserva.cliente.dni)
        setTelefono(reserva.cliente.telefono)
        setDireccion(reserva.cliente.direccion || "")
        setPoblacion(reserva.cliente.poblacion || "")
        setProvincia(reserva.cliente.provincia || "")
        setEmail(reserva.cliente.email || "")
        setNotas(reserva.cliente.notas || "")
        setDestinos(reserva.destinos || "")
        setImporteSenal(reserva.importeSenal || 0)
        setImporteTotalManual(reserva.importeTotal.toString())
        setIsSenalManual(true) // En edición, cargamos la señal fija

        // Calcular porcentaje cargado para mostrarlo
        if (reserva.importeTotal > 0) {
          const p = Math.round((reserva.importeSenal / reserva.importeTotal) * 100)
          setPorcentajeSenal(p)
        }
        setFormaPago(reserva.formaPago || "BIZUM")
        
        // Al cargar una reserva existente, NO marcamos como modificado manualmente
        // para que si cambia fechas, el total se adapte al principio.
        setTotalModificadoManualmente(false)
        setIsSenalManual(false)
        setPorcentajeModificadoManualmente(false)
        
        // Cargar vale si ya tenía uno
        if (reserva.valeId) {
          import("@/lib/vales-store").then(({ obtenerValePorId }) => {
            const v = obtenerValePorId(reserva.valeId!)
            if (v) setValeSeleccionado(v)
          })
        }

        // También cargar detalles
        if (reserva.detalles.fechaEntrega) setFechaEntrega(new Date(reserva.detalles.fechaEntrega))
        if (reserva.detalles.fechaDevolucion) setFechaDevolucion(new Date(reserva.detalles.fechaDevolucion))
        if (reserva.detalles.horaEntrega) setHoraEntrega(reserva.detalles.horaEntrega)
        if (reserva.detalles.horaDevolucion) setHoraDevolucion(reserva.detalles.horaDevolucion)
        if (reserva.detalles.precioDiario) setPrecioDiario(reserva.detalles.precioDiario)
        if (reserva.detalles.suplemento) {
          setSuplemento(reserva.detalles.suplemento)
          setPrevSuplemento(reserva.detalles.suplemento)
        }
        if (reserva.detalles.descripcionSuplemento) setDescripcionSuplemento(reserva.detalles.descripcionSuplemento)
        
        return // No cargar de localStorage si ya cargamos la reserva real
      }
    }

    const detallesGuardados = localStorage.getItem("reservaDetalles")
    const clienteGuardado = localStorage.getItem("reservaCliente")

    if (detallesGuardados) {
      try {
        const detalles = JSON.parse(detallesGuardados)
        if (detalles.numeroReserva === numeroReserva && detalles.modelo === modelo) {
          if (detalles.fechaEntrega) setFechaEntrega(new Date(detalles.fechaEntrega))
          if (detalles.fechaDevolucion) setFechaDevolucion(new Date(detalles.fechaDevolucion))
          if (detalles.horaEntrega) setHoraEntrega(detalles.horaEntrega)
          if (detalles.horaDevolucion) setHoraDevolucion(detalles.horaDevolucion)
          if (detalles.precioDiario) setPrecioDiario(detalles.precioDiario)
          if (detalles.suplemento) {
            setSuplemento(detalles.suplemento)
            setPrevSuplemento(detalles.suplemento)
          }
          if (detalles.descripcionSuplemento) setDescripcionSuplemento(detalles.descripcionSuplemento)
        }
      } catch (error) {
        console.error("Error parsing details:", error)
      }
    }

    if (clienteGuardado) {
       try {
         const cliente = JSON.parse(clienteGuardado)
         setNombre(cliente.nombre || "")
         setDni(cliente.dni || "")
         setTelefono(cliente.telefono || "")
         setDireccion(cliente.direccion || "")
         setPoblacion(cliente.poblacion || "")
         setProvincia(cliente.provincia || "")
         setEmail(cliente.email || "")
         setNotas(cliente.notas || "")
       } catch (e) {}
    }
  }, [numeroReserva, modelo, esEdicion])

  const handleContinuar = async () => {
    if (!fechaEntrega || !fechaDevolucion) return

    // Si es edición, guardamos TODO aquí mismo
    if (esEdicion) {
      setProcesando(true)
      try {
        const totalFinal = Number.parseFloat(importeTotalManual) || importeTotalCalc
        
        const reservaActualizada: ReservaCompleta = {
          id: reservaExistente ? reservaExistente.id : generarId(),
          numeroReserva,
          modelo,
          fechaCreacion: reservaExistente ? reservaExistente.fechaCreacion : new Date().toISOString(),
          detalles: {
            fechaEntrega: fechaEntrega.toISOString(),
            fechaDevolucion: fechaDevolucion.toISOString(),
            horaEntrega,
            horaDevolucion,
            precioDiario,
            suplemento,
            descripcionSuplemento,
            formaPago,
            porcentaje: totalFinal > 0 ? Math.round((importeSenal / totalFinal) * 100) : 0,
          },
          cliente: {
            nombre: nombre.toUpperCase(),
            dni: dni.toUpperCase(),
            telefono,
            direccion: direccion.toUpperCase(),
            poblacion: poblacion.toUpperCase(),
            provincia: provincia.toUpperCase(),
            email: email.toUpperCase(),
            notas: notas.toUpperCase(),
          },
          totalDias,
          importeTotal: totalFinal,
          importeSenal: importeSenal,
          importeRestante: totalFinal - (importeSenal || 0),
          formaPago,
          validado: reservaExistente ? reservaExistente.validado : false,
          fechaValidacion: (reservaExistente && reservaExistente.fechaValidacion) ? reservaExistente.fechaValidacion : null,
          contratoGenerado: reservaExistente ? reservaExistente.contratoGenerado : false,
          valeId: valeSeleccionado?.id,
          importeVale: valeSeleccionado?.importe,
          destinos: destinos.toUpperCase() || undefined,
        }

        const exito = guardarReserva(reservaActualizada)
        if (!exito) throw new Error("Fallo al guardar")

        // Marcar vale como asignado
        if (valeSeleccionado) {
          const { asignarValeAReserva } = await import("@/lib/vales-store")
          asignarValeAReserva(valeSeleccionado.id, reservaActualizada.id)
        }

        // Sincronizar con Firebase
        if (navigator.onLine) {
          try {
            const { isFirebaseActivo } = await import("@/lib/firebase-client")
            if (isFirebaseActivo()) {
              const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
              await guardarReservaFirebase(reservaActualizada)
            }
          } catch (e) {
            console.error("Error sincronización:", e)
          }
        }

        // --- GENERAR PDF AUTOMÁTICAMENTE TRAS EDITAR ---
        try {
          const tempContainer = document.createElement("div")
          tempContainer.style.position = "absolute"
          tempContainer.style.left = "-9999px"
          tempContainer.style.top = "-9999px"
          document.body.appendChild(tempContainer)

          const root = ReactDOM.createRoot(tempContainer)
          root.render(
            <ReservationA4Template
              numeroReserva={reservaActualizada.numeroReserva}
              modelo={reservaActualizada.modelo}
              reservaDetalles={reservaActualizada.detalles}
              clienteData={reservaActualizada.cliente}
              totalDias={reservaActualizada.totalDias}
              importeTotal={reservaActualizada.importeTotal}
              importeSenal={reservaActualizada.importeSenal}
              importeRestante={reservaActualizada.importeRestante}
              suplemento={Number(reservaActualizada.detalles.suplemento || 0)}
              descripcionSuplemento={reservaActualizada.detalles.descripcionSuplemento}
              reservaValidada={reservaActualizada.validado}
            />
          )

          await new Promise((resolve) => setTimeout(resolve, 500))

          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: 793,
            height: 1122,
            windowWidth: 793,
            windowHeight: 1122,
          })

          document.body.removeChild(tempContainer)

          const imgData = canvas.toDataURL("image/png")
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          })
          pdf.addImage(imgData, "PNG", 0, 0, 210, 297)

          let nombreArchivo = `Reserva_${reservaActualizada.numeroReserva}`
          if (reservaActualizada.cliente && reservaActualizada.cliente.nombre) {
            const nombreCliente = reservaActualizada.cliente.nombre
              .replace(/[^\w\s]/gi, "")
              .replace(/\s+/g, "_")
            nombreArchivo += `_${nombreCliente}`
          }
          if (reservaActualizada.validado) {
            nombreArchivo += `_CONFIRMADA`
          }
          pdf.save(`${nombreArchivo}.pdf`)
        } catch (pdfErr) {
          console.error("Error generando PDF automáticamente:", pdfErr)
        }

        router.push("/reservas")
      } catch (err) {
        console.error("Error al guardar cambios:", err)
        alert("Error al guardar la reserva.")
      } finally {
        setProcesando(false)
      }
      return
    }

    // Si NO es edición, sigue el flujo normal
    const totalFinalNuevo = Number(importeTotalManual) || importeTotalCalc
    const reservaData = {
      numeroReserva,
      modelo,
      fechaEntrega: fechaEntrega ? fechaEntrega.toISOString() : new Date().toISOString(),
      fechaDevolucion: fechaDevolucion ? fechaDevolucion.toISOString() : new Date().toISOString(),
      horaEntrega,
      horaDevolucion,
      precioDiario,
      suplemento,
      descripcionSuplemento,
      valeId: valeSeleccionado?.id,
      importeVale: valeSeleccionado?.importe,
      cantidad,
      porcentaje,
      porcentajeSenal,
      importeTotal: totalFinalNuevo,
      importeSenal
    }

    localStorage.setItem("reservaDetalles", JSON.stringify(reservaData))
    router.push(`/reserva/${encodeURIComponent(modelo)}/cliente?numero=${numeroReserva}`)
  }

  const handleVolver = () => {
    if (esEdicion) {
      router.push("/reservas")
    } else {
      router.push(`/reserva/${encodeURIComponent(modelo)}`)
    }
  }

  const horasOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0")
    return [`${hour}:00`, `${hour}:30`]
  }).flat()

  const handleFechaEntregaChange = (date: Date | undefined) => {
    setTouchedDates(true)
    const newDate = date || new Date()
    setFechaEntrega(newDate)
    
    // Sincronización automática: si la entrega es posterior a la devolución, movemos la devolución
    if (fechaDevolucion && startOfDay(newDate) > startOfDay(fechaDevolucion)) {
      setFechaDevolucion(newDate)
    }
  }
  const handleFechaDevolucionChange = (date: Date | undefined) => {
    setTouchedDates(true)
    setFechaDevolucion(date || new Date())
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#EBEBEB]">
      
      <div className="w-full max-w-md flex flex-col shadow-sm filter drop-shadow-md">
        
        {/* Cuerpo Principal del Ticket */}
        <div className="bg-white rounded-t-[2.5rem] flex flex-col pt-10 pb-8 px-8 relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E5F3EA] flex items-center justify-center text-[#003829]">
                <span className="material-symbols-outlined text-xl">event_available</span>
              </div>
              <div>
                <span className="text-[11px] font-headline tracking-widest text-[#A0A8A3] font-bold uppercase">Reserva nº {numeroReserva}</span>
                <h2 className="text-xl font-extrabold text-[#003829] font-headline tracking-tight">{modelo}</h2>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* --- SECCIÓN CLIENTE (SOLO EN EDICIÓN) --- */}
            {esEdicion && (
              <div className="flex flex-col gap-4 bg-[#F5F5F5]/50 p-4 rounded-[1.5rem] border border-[#EBEBEB]">
                <h3 className="font-headline font-bold text-[#003829] text-[13px] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">person</span> Datos del Cliente
                </h3>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">Nombre Completo</Label>
                    <Input 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value.toUpperCase())}
                      className="bg-white border-transparent rounded-xl h-10 font-bold text-[#003829]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">DNI / NIE</Label>
                      <Input 
                        value={dni} 
                        onChange={(e) => setDni(e.target.value.toUpperCase())}
                        className="bg-white border-transparent rounded-xl h-10 font-bold text-center text-[#003829]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">Teléfono</Label>
                      <Input 
                        value={telefono} 
                        onChange={(e) => setTelefono(e.target.value)}
                        className="bg-white border-transparent rounded-xl h-10 font-bold text-center text-[#003829]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">Email</Label>
                    <Input 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value.toUpperCase())}
                      className="bg-white border-transparent rounded-xl h-10 font-bold text-[#003829]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">Dirección</Label>
                    <Input 
                      value={direccion} 
                      onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                      className="bg-white border-transparent rounded-xl h-10 font-bold text-[#003829]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">Población</Label>
                      <Input 
                        value={poblacion} 
                        onChange={(e) => setPoblacion(e.target.value.toUpperCase())}
                        className="bg-white border-transparent rounded-xl h-10 font-bold text-center text-[#003829]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1">Provincia</Label>
                      <Input 
                        value={provincia} 
                        onChange={(e) => setProvincia(e.target.value.toUpperCase())}
                        className="bg-white border-transparent rounded-xl h-10 font-bold text-center text-[#003829]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] uppercase font-bold text-[#A0A8A3] ml-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">travel_explore</span>
                      Destino(s) del viaje
                    </Label>
                    <Input 
                      value={destinos} 
                      onChange={(e) => setDestinos(e.target.value.toUpperCase())}
                      placeholder="Ej: ALGARVE, SEVILLA, PIRINEOS"
                      className="bg-white border-transparent rounded-xl h-10 font-bold text-[#003829]"
                    />
                  </div>

                  <button 
                    onClick={() => setShowNotas(true)}
                    className="flex items-center justify-center gap-2 py-2 bg-white text-[#003829] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#baeed9] hover:bg-[#E5F3EA] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    {notas ? 'Ver Notas' : 'Añadir Notas'}
                  </button>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="flex flex-col gap-3">
              <h3 className="font-headline font-bold text-[#003829] text-base border-b border-[#EBEBEB] pb-2">Fechas</h3>
              
              {/* Banner de Aviso de Solapamiento */}
              {avisoSolapamiento && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-600 mt-0.5 shrink-0">warning</span>
                      <div className="flex flex-col">
                        <p className="text-[11px] font-black text-amber-900 uppercase tracking-tight">¡Conflicto de Fechas!</p>
                        <p className="text-[11px] font-bold text-amber-700 leading-tight">
                          Ocupado por <span className="underline">{avisoSolapamiento.tipo === 'BLOQUEO' ? 'BLOQUEO' : 'RESERVA'} {avisoSolapamiento.info}</span>.
                        </p>
                      </div>
                    </div>
                    
                    {avisoSolapamiento.tipo === 'RESERVA' && infoReservaConflictiva && (
                      <button 
                        onClick={() => setShowConflictDetail(!showConflictDetail)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showConflictDetail ? 'bg-amber-600 text-white shadow-inner' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-100'}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{showConflictDetail ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    )}
                  </div>

                  {showConflictDetail && infoReservaConflictiva && (
                    <div className="p-4 bg-[#003829] text-white rounded-2xl shadow-lg border border-white/10 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#baeed9]">Detalles del Conflicto</span>
                           <span className="text-[10px] font-bold opacity-60">#{infoReservaConflictiva.numeroReserva}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-black uppercase tracking-tight">{infoReservaConflictiva.cliente.nombre}</p>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-[#baeed9]">calendar_today</span>
                            <span className="text-[11px] font-bold">
                              {new Date(infoReservaConflictiva.detalles.fechaEntrega).toLocaleDateString()} - {new Date(infoReservaConflictiva.detalles.fechaDevolucion).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-[#baeed9]">schedule</span>
                            <span className="text-[11px] font-medium opacity-80">
                              H. Entrega: {infoReservaConflictiva.detalles.horaEntrega} | H. Devolución: {infoReservaConflictiva.detalles.horaDevolucion}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/5">
                           <span className={`w-2 h-2 rounded-full ${infoReservaConflictiva.validado ? 'bg-[#baeed9]' : 'bg-amber-400'}`}></span>
                           <span className="text-[10px] font-black uppercase tracking-widest">
                             {infoReservaConflictiva.validado ? 'Reserva Validada' : 'Pendiente de Señal'}
                           </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaEntrega" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                    Entrega
                  </Label>
                  <SuperSimpleDatePicker
                    id="fechaEntrega"
                    value={fechaEntrega}
                    onChange={handleFechaEntregaChange}
                    placeholder="Fecha"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaDevolucion" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                    Devolución
                  </Label>
                  <SuperSimpleDatePicker
                    id="fechaDevolucion"
                    value={fechaDevolucion}
                    onChange={handleFechaDevolucionChange}
                    placeholder="Fecha"
                    align="right"
                    minDate={fechaEntrega}
                    defaultMonth={fechaEntrega}
                  />
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="flex flex-col gap-3">
              <h3 className="font-headline font-bold text-[#003829] text-base border-b border-[#EBEBEB] pb-2">Horarios</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="horaEntrega" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                    H. Entrega
                  </Label>
                  <Select value={horaEntrega} onValueChange={setHoraEntrega}>
                    <SelectTrigger className="bg-[#F5F5F5] border-transparent rounded-[1rem] h-12 text-[#004D3F] font-bold focus:ring-[#baeed9]">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {horasOptions.map((hora) => (
                        <SelectItem key={hora} value={hora}>{hora}h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="horaDevolucion" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                    H. Devolución
                  </Label>
                  <Select value={horaDevolucion} onValueChange={setHoraDevolucion}>
                    <SelectTrigger className="bg-[#F5F5F5] border-transparent rounded-[1rem] h-12 text-[#004D3F] font-bold focus:ring-[#baeed9]">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {horasOptions.map((hora) => (
                        <SelectItem key={hora} value={hora}>{hora}h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Importe */}
            <div className="flex flex-col gap-3">
              <h3 className="font-headline font-bold text-[#003829] text-base border-b border-[#EBEBEB] pb-2">Importe (€)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <Label htmlFor="precioDiario" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                    Precio diario
                  </Label>
                  <div className="relative">
                    <Input
                      id="precioDiario"
                      type="number"
                      value={precioDiario}
                      onChange={(e) => setPrecioDiario(e.target.value)}
                      className="bg-[#F5F5F5] border-transparent rounded-[1rem] h-12 text-[#004D3F] font-bold text-center pr-8 focus-visible:ring-[#baeed9]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#707974] font-bold">€</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <Label htmlFor="suplemento" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                    Suplemento
                  </Label>
                  <div className="relative">
                    <Input
                      id="suplemento"
                      type="number"
                      value={suplemento}
                      onChange={(e) => setSuplemento(e.target.value)}
                      onBlur={() => {
                        if (Number(suplemento) > 0 && Number(suplemento) !== Number(prevSuplemento)) {
                          setShowSupplementoDialog(true)
                        } else if (Number(suplemento) === 0) {
                          setDescripcionSuplemento("")
                        }
                        setPrevSuplemento(suplemento)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}
                      className="bg-[#F5F5F5] border-transparent rounded-[1rem] h-12 text-[#004D3F] font-bold text-center pr-8 focus-visible:ring-[#baeed9]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#707974] font-bold">€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN VALE REGALO (Reubicado y siempre visible) */}
            {!valeSeleccionado && (
               <button 
                 onClick={() => setShowValeDialog(true)}
                 className="flex items-center justify-center gap-2 py-3 bg-[#FFF4D6] text-[#784112] rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-[#FFECC5] hover:bg-[#FFECC5] transition-all shadow-sm active:scale-95 mb-2"
               >
                 <span className="material-symbols-outlined text-[18px]">card_giftcard</span>
                 {valesDisponibles.length > 0 ? "¿Tienes un Vale Regalo?" : "Canjear Vale Regalo"}
               </button>
            )}

            {/* --- SECCIÓN PAGO (SOLO EN EDICIÓN) --- */}
            {esEdicion && (
              <div className="flex flex-col gap-3">
                <h3 className="font-headline font-bold text-[#003829] text-base border-b border-[#EBEBEB] pb-2">Método de Pago</h3>
                <div className="grid grid-cols-3 gap-2">
                  {["BIZUM", "TRANSFERENCIA", "EFECTIVO"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setFormaPago(m)}
                      className={`py-3 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${formaPago === m ? 'bg-[#E5F3EA] border-[#003829] text-[#003829]' : 'bg-[#F5F5F5] border-transparent text-[#A0A8A3]'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {m === 'BIZUM' ? 'send_money' : m === 'TRANSFERENCIA' ? 'account_balance' : 'payments'}
                      </span>
                      <span className="text-[9px] font-bold uppercase">{m === 'TRANSFERENCIA' ? 'Transf.' : m}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen Total */}
            <div className="mt-4 bg-[#E5F3EA] rounded-[1.5rem] p-5 flex flex-col gap-4 border border-[#baeed9] shadow-sm">
               <div className="flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-headline tracking-widest text-[#1b4d3e] font-bold uppercase">DURACIÓN</span>
                   <span className="text-xl font-black text-[#003829] font-headline leading-tight">
                     {totalDias} {totalDias === 1 ? "día" : "días"}
                   </span>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className="text-[10px] font-headline tracking-widest text-[#1b4d3e] font-bold uppercase">TOTAL AJUSTADO</span>
                   <div className="relative mt-1">
                      <Input 
                        type="number"
                        value={importeTotalManual}
                        onChange={(e) => {
                          setTotalModificadoManualmente(true)
                          setImporteTotalManual(e.target.value)
                        }}
                        className="bg-white border-[#baeed9] rounded-xl h-10 w-32 text-right pr-8 font-black text-[#003829] text-lg focus-visible:ring-[#003829]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[#003829]">€</span>
                   </div>
                 </div>
               </div>

                {/* Desglose de liquidación */}
                <div className="pt-3 border-t border-dashed border-[#1b4d3e]/20 flex flex-col gap-2">
                    {valeSeleccionado && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-[#784112] uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">card_giftcard</span> Vale Aplicado:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#784112] bg-[#FFF4D6] px-2 py-0.5 rounded">-{valeSeleccionado.importe.toFixed(2)}€</span>
                          <button 
                            onClick={() => setValeSeleccionado(null)}
                            className="text-[#784112] opacity-60 hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] font-bold text-[#1b4d3e]/70 uppercase tracking-wider">
                      <span>Importe calculado:</span>
                      <span>{importeTotalCalc.toFixed(2)}€</span>
                    </div>

                    <div className="flex justify-between items-center py-2 px-1">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-extrabold text-[#003829] uppercase tracking-wider">
                           {valeSeleccionado ? 'SEÑAL RESTANTE:' : 'SEÑAL:'}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                            <input 
                              type="number"
                              value={porcentajeSenal}
                              onChange={(e) => {
                                const p = Number(e.target.value)
                                setPorcentajeSenal(p)
                                setPorcentajeModificadoManualmente(true)
                                setIsSenalManual(false)
                              }}
                              className="w-10 h-6 bg-white border border-[#baeed9] rounded-md text-center text-[10px] font-black text-[#003829] focus:outline-none focus:ring-1 focus:ring-[#003829]"
                            />
                           <span className="text-[10px] font-bold text-[#003829]">%</span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="number"
                          value={importeSenal}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setImporteSenal(val)
                            setIsSenalManual(true)
                            
                            // Calcular % correspondiente para información
                            const totalVal = Number(importeTotalManual) || importeTotalCalc
                            if (totalVal > 0) {
                              setPorcentajeSenal(Math.round((val / totalVal) * 100))
                            }
                          }}
                          className="bg-white border-[#baeed9] rounded-xl h-10 w-28 text-right pr-7 font-black text-[#003829] text-base focus:outline-none focus:ring-1 focus:ring-[#003829]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[#003829]">€</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#1b4d3e]/10">
                      <span className="text-[12px] font-black text-[#c62828] uppercase tracking-widest">Pendiente de cobro:</span>
                      <span className="text-2xl font-black text-[#c62828] drop-shadow-sm">
                        {(Number.parseFloat(importeTotalManual || "0") - (valeSeleccionado ? valeSeleccionado.importe : 0) - (valeSeleccionado ? 0 : importeSenal)).toFixed(2)}€
                      </span>
                    </div>
                </div>
             </div>


          </div>
        </div>


        {/* Footer del Ticket (Botones) */}
        <div className="bg-white rounded-b-[2.5rem] pt-6 pb-8 px-8 flex flex-col gap-3 relative overflow-hidden">
            <button 
              onClick={handleContinuar}
              disabled={procesando || (esEdicion && (!nombre || !dni || !telefono))}
              className={`w-full py-[18px] text-white rounded-[2rem] font-bold font-headline text-lg transition-all shadow-sm flex items-center justify-center gap-3 ${procesando ? 'bg-[#707974] cursor-not-allowed' : 'bg-[#003829] hover:opacity-90 active:scale-[0.98]'}`}
            >
              {procesando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando Expediente...
                </>
              ) : esEdicion ? (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Guardar Cambios
                </>
              ) : (
                "Continuar"
              )}
            </button>
            <button 
              onClick={handleVolver}
              disabled={procesando}
              className="w-full py-3 text-[#707974] rounded-full font-bold font-headline hover:text-[#003829] transition-colors disabled:opacity-50"
            >
              {esEdicion ? "Cancelar Edición" : "Volver"}
            </button>
        </div>

      </div>

      {/* DIALOGS DE VALES */}
      <Dialog open={showValeDialog} onOpenChange={setShowValeDialog}>
        <DialogContent className="sm:max-w-md bg-[#EBEBEB] border-transparent rounded-[2.5rem] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[#003829] font-headline font-black text-center text-xl tracking-tight">Seleccionar Vale Regalo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
            {valesDisponibles.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[#A0A8A3] font-bold">No hay vales disponibles</p>
              </div>
            ) : (
              valesDisponibles.map((vale) => (
                <button
                  key={vale.id}
                  onClick={() => {
                    setValeSeleccionado(vale)
                    setShowValeDialog(false)
                  }}
                  className="flex flex-col p-5 bg-white rounded-3xl text-left border-2 border-transparent hover:border-[#baeed9] transition-all group active:scale-95"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-black font-headline text-[#003829]">{vale.numeroVale}</span>
                    <span className="text-xl font-black text-[#003829]">{vale.importe.toFixed(2)}€</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-[#A0A8A3] tracking-widest">Titular</span>
                    <span className="text-sm font-bold text-[#707974] uppercase">{vale.titular.nombre}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <DialogFooter className="mt-6">
             <button 
               onClick={() => setShowValeDialog(false)}
               className="w-full py-4 text-[#707974] font-black uppercase tracking-widest text-[11px]"
             >
               Cerrar
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSupplementoDialog} onOpenChange={setShowSupplementoDialog}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[1.5rem] shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-[#003829] font-headline font-bold">Descripción del Suplemento</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Label htmlFor="descripcionSuplemento" className="text-[#707974] font-body text-sm font-bold">
              Por favor, introduce una descripción para el suplemento de {suplemento}€:
            </Label>
            <Textarea
              id="descripcionSuplemento"
              value={descripcionSuplemento}
              onChange={(e) => setDescripcionSuplemento(e.target.value.toUpperCase())}
              placeholder="Ej: LIMPIEZA ADICIONAL, KILOMETRAJE EXTRA, ETC."
              rows={4}
              className="uppercase bg-[#F5F5F5] border-transparent focus:border-transparent focus-visible:ring-[#baeed9] rounded-[1rem]"
            />
          </div>
          <DialogFooter>
            <button 
              onClick={() => setShowSupplementoDialog(false)} 
              className="px-8 py-3 bg-[#003829] text-white rounded-full font-bold hover:opacity-90 transition-opacity"
            >
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotas} onOpenChange={setShowNotas}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[1.5rem] shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-[#003829] font-headline font-bold">Reserva: Notas del Cliente</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value.toUpperCase())}
              placeholder="Añade aquí cualquier observación o petición especial..."
              rows={8}
              className="uppercase bg-[#F5F5F5] border-transparent focus:border-transparent focus-visible:ring-[#baeed9] rounded-[1rem] p-4 text-[#004D3F] font-medium"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setShowNotas(false)} 
              className="w-full py-4 bg-[#003829] text-white rounded-full font-bold font-headline transition-opacity hover:opacity-90"
            >
              Cerrar y Actualizar Notas
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
