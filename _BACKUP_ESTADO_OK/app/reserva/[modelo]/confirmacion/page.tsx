"use client"

import type React from "react"
import { useState, useEffect, useRef, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import FileSaver from "file-saver"

import { ReservationA4Template } from "@/components/reservation-a4-template"
import { NuevoAutocaravanaIcon } from "@/components/icons/nuevo-autocaravana-icon"
import { useCounterStorage } from "@/lib/hooks/use-counter-storage"
import { guardarReserva, generarId, obtenerReservaPorNumeroYModelo } from "@/lib/reservas-store"
import type { ReservaCompleta } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ConfirmacionReservaPage({ params }: { params: Promise<{ modelo: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const numeroReserva = searchParams.get("numero") || ""
  const modelo = decodeURIComponent(resolvedParams.modelo)
  const esEdicion = searchParams.get("editar") === "true"

  const [reservaDetalles, setReservaDetalles] = useState<any>(null)
  const [clienteData, setClienteData] = useState<any>(null)
  const [pdfData, setPdfData] = useState<any>(null)
  const [reservaExistente, setReservaExistente] = useState<ReservaCompleta | null>(null)

  const [formaPago, setFormaPago] = useState<string>("bizum")
  const [procesando, setProcesando] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { setCounterValue } = useCounterStorage(modelo, "0")

  useEffect(() => {
    if (esEdicion) {
      const reservaActual = obtenerReservaPorNumeroYModelo(numeroReserva, modelo)
      if (reservaActual) {
        setReservaExistente(reservaActual)
        if (reservaActual.formaPago) setFormaPago(reservaActual.formaPago)
      }
    }

    const detallesGuardados = localStorage.getItem("reservaDetalles")
    const clienteGuardado = localStorage.getItem("reservaCliente")

    let parsedDetalles = null
    let parsedCliente = null

    if (detallesGuardados) {
      parsedDetalles = JSON.parse(detallesGuardados)
      setReservaDetalles(parsedDetalles)
      if (parsedDetalles.formaPago) setFormaPago(parsedDetalles.formaPago)
    }

    if (clienteGuardado) {
      parsedCliente = JSON.parse(clienteGuardado)
      // Check that it's correctly mapped
      setClienteData(parsedCliente)
    }

    // Preparar pdfData de inmediato si tenemos ambos datos
    if (parsedDetalles && parsedCliente) {
      // Calculate derived metrics reliably here instead of expecting them in state perfectly
      const fechaEntrega = new Date(parsedDetalles.fechaEntrega)
      const fechaDevolucion = new Date(parsedDetalles.fechaDevolucion)
      const startDate = new Date(fechaEntrega.getFullYear(), fechaEntrega.getMonth(), fechaEntrega.getDate())
      const endDate = new Date(fechaDevolucion.getFullYear(), fechaDevolucion.getMonth(), fechaDevolucion.getDate())
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      
      const precioDiario = Number.parseFloat(parsedDetalles.precioDiario) || 0
      const suplemento = Number.parseFloat(parsedDetalles.suplemento) || 0
      const importeTotal = (precioDiario * dias) + suplemento
      
      const importeVale = Number.parseFloat(parsedDetalles.importeVale) || 0
      const senalTeorica = Math.round(((precioDiario * dias) * 0.3) / 10) * 10
      const importeSenal = Math.max(0, senalTeorica - importeVale)
      const importeRestante = importeTotal - importeVale - (importeSenal === 0 ? 0 : 0) // No, logic is simpler:
      // Total = Vale + Senal + Resto
      // Resto = Total - Vale - Senal
      const importeRestanteFinal = importeTotal - importeVale - importeSenal

      setPdfData({
        numeroReserva,
        modelo,
        reservaDetalles: {
          ...parsedDetalles,
          formaPago
        },
        clienteData: parsedCliente,
        totalDias: dias,
        importeTotal,
        importeSenal,
        importeRestante: importeRestanteFinal,
        suplemento,
        descripcionSuplemento: parsedDetalles.descripcionSuplemento || "",
        matriculaPersonalizada: "",
        importeVale: importeVale > 0 ? importeVale : undefined
      })
    }

  }, [formaPago, numeroReserva, modelo, esEdicion])

  const handleVolver = () => {
    const queryParams = esEdicion ? `numero=${numeroReserva}&editar=true` : `numero=${numeroReserva}`
    router.push(`/reserva/${encodeURIComponent(modelo)}/cliente?${queryParams}`)
  }

  const handleEnviarResumen = async () => {
    if (procesando || !pdfData) return
    setProcesando(true)

    try {
      const pdfContainer = document.getElementById("pdf-template-container")
      if (!pdfContainer) {
        setProcesando(false)
        return
      }

      pdfContainer.style.display = "block"
      pdfContainer.style.position = "absolute"
      pdfContainer.style.top = "0"
      pdfContainer.style.left = "0"
      pdfContainer.style.width = "210mm"
      pdfContainer.style.height = "auto"
      pdfContainer.style.zIndex = "-1000"

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 793,
        height: 1122,
        windowWidth: 793,
        windowHeight: 1122,
      })

      pdfContainer.style.display = "none"

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297)
      const pdfBlob = pdf.output("blob")

      let nombreArchivo = "Reserva_" + numeroReserva
      const clienteNombre = clienteData?.nombre || ""
      if (clienteNombre) {
        const nombreClienteFormateado = clienteNombre.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_")
        nombreArchivo += "_" + nombreClienteFormateado
      }
      try {
        const fechaEntrega = new Date(reservaDetalles.fechaEntrega)
        const dia = fechaEntrega.getDate()
        const mes = fechaEntrega.toLocaleString("es", { month: "long" })
        const anio = fechaEntrega.getFullYear()
        nombreArchivo += "_" + dia + "_de_" + mes + "_" + anio
      } catch (e) {
        nombreArchivo += "_" + new Date().getTime()
      }
      nombreArchivo = nombreArchivo.replace(/[/\\?%*:|"<>]/g, "_") + ".pdf"

      FileSaver.saveAs(pdfBlob, nombreArchivo)

      if (numeroReserva && !isNaN(Number.parseInt(numeroReserva, 10))) {
        setCounterValue(numeroReserva)
      }

      localStorage.removeItem(`reserva-${modelo}`)

      const reservaCompleta: ReservaCompleta = {
        id: reservaExistente ? reservaExistente.id : generarId(),
        numeroReserva,
        modelo,
        fechaCreacion: reservaExistente ? reservaExistente.fechaCreacion : new Date().toISOString(),
        detalles: {
          ...reservaDetalles,
          formaPago,
        },
        cliente: clienteData,
        totalDias: pdfData.totalDias,
        importeTotal: pdfData.importeTotal,
        importeSenal: pdfData.importeSenal,
        importeRestante: pdfData.importeRestante,
        formaPago,
        validado: reservaExistente ? reservaExistente.validado : false,
        fechaValidacion: (reservaExistente && reservaExistente.fechaValidacion) ? reservaExistente.fechaValidacion : null,
        contratoGenerado: reservaExistente ? reservaExistente.contratoGenerado : false,
        kilometrosContrato: (reservaExistente && reservaExistente.kilometrosContrato) ? reservaExistente.kilometrosContrato : null,
        valeId: reservaDetalles.valeId,
        importeVale: pdfData.importeVale
      }

      const guardadoExitoso = guardarReserva(reservaCompleta)

      if (!guardadoExitoso) {
        setErrorMessage("El PDF se generó, pero no se pudo guardar localmente por falta de espacio.")
        setShowErrorDialog(true)
        setProcesando(false)
        return
      }

      // Marcar vale como asignado si existe
      if (reservaCompleta.valeId) {
        const { asignarValeAReserva } = await import("@/lib/vales-store")
        asignarValeAReserva(reservaCompleta.valeId, reservaCompleta.id)
      }

      // Sincronizar explícitamente con Firebase
      if (navigator.onLine) {
        try {
          const { isFirebaseActivo } = await import("@/lib/firebase-client")
          if (isFirebaseActivo()) {
            const { guardarReservaFirebase } = await import("@/lib/firebase-adapter")
            await guardarReservaFirebase(reservaCompleta)
            localStorage.setItem("lastSyncTime", new Date().toLocaleString())
          }
        } catch (e) {
          console.error("Error sincronizando a firebase:", e)
        }
      }

      router.push("/reservas")
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      setErrorMessage("Ha ocurrido un error al generar el PDF.")
      setShowErrorDialog(true)
      setProcesando(false)
    }
  }

  if (!reservaDetalles || !clienteData || !pdfData) {
    return <main className="flex min-h-screen items-center justify-center bg-[#EBEBEB]"><div className="w-12 h-12 border-4 border-[#e1e3e2] border-t-[#063b2c] rounded-full animate-spin"></div></main>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 pt-10 bg-[#EBEBEB]">
      
      <div className="w-full max-w-md flex flex-col shadow-sm filter drop-shadow-md pb-10">
        
        {/* Cuerpo Principal del Ticket */}
        <div className="bg-white rounded-t-[2.5rem] flex flex-col pt-10 pb-6 px-8 relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E5F3EA] flex items-center justify-center text-[#003829]">
                <span className="material-symbols-outlined text-xl">fact_check</span>
              </div>
              <div>
                <span className="text-[11px] font-headline tracking-widest text-[#A0A8A3] font-bold uppercase">Reserva nº {numeroReserva}</span>
                <h2 className="text-xl font-extrabold text-[#003829] font-headline tracking-tight">Resumen Final</h2>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Detalles del Cliente Log */}
            <div className="flex flex-col gap-2 border-b border-[#EBEBEB] pb-4">
              <h3 className="font-headline font-bold text-[#003829] text-[13px] tracking-wider uppercase mb-1 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">person</span> Datos Registrados</h3>
              <div className="flex justify-between items-center px-1">
                <span className="text-[12px] font-body text-[#707974]">{clienteData?.nombre || "No especificado"}</span>
                <span className="text-[11px] font-headline text-[#A0A8A3] font-bold">{clienteData?.dni || ""}</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[12px] font-body text-[#707974]">{clienteData?.telefono || ""}</span>
                <span className="text-[11px] font-headline text-[#A0A8A3] font-bold">{clienteData?.poblacion || ""}</span>
              </div>
            </div>

            {/* Vehículo e Itinerario Log */}
            <div className="flex flex-col gap-2 border-b border-[#EBEBEB] pb-4">
              <h3 className="font-headline font-bold text-[#003829] text-[13px] tracking-wider uppercase mb-1 flex items-center gap-1.5"><NuevoAutocaravanaIcon size={18} className="text-[#003829]" /> Vehículo e Itinerario</h3>
              <div className="flex justify-between items-start px-1 mt-1">
                <div className="flex flex-col gap-4">
                  <span className="text-[12px] font-body text-[#707974]">Modelo Asignado</span>
                  <span className="text-[12px] font-body text-[#707974]">Fechas Alquiler</span>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <span className="text-[13px] font-headline text-[#003829] font-extrabold">{modelo}</span>
                  <div className="flex flex-col items-end leading-tight">
                    <span className="text-[13px] font-headline text-[#003829] font-extrabold">{format(new Date(reservaDetalles.fechaEntrega), "dd/MM/yyyy")} - {format(new Date(reservaDetalles.fechaDevolucion), "dd/MM/yyyy")}</span>
                    <span className="text-[10px] font-headline text-[#A0A8A3] font-bold mt-1">Entrega: {reservaDetalles.horaEntrega} / Devolución: {reservaDetalles.horaDevolucion}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Selector Forma Pago */}
            <div className="flex flex-col gap-1.5 pt-2">
              <Label className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1">
                Método de pago principal
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {["bizum", "transferencia", "efectivo"].map((metodo) => (
                  <button
                    key={metodo}
                    onClick={() => setFormaPago(metodo)}
                    className={`py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1 transition-all border-2 ${formaPago === metodo ? 'bg-[#E5F3EA] border-[#003829] text-[#003829]' : 'bg-[#F5F5F5] border-transparent text-[#A0A8A3] hover:bg-[#EBEBEB]'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {metodo === 'bizum' ? 'send_money' : metodo === 'transferencia' ? 'account_balance' : 'payments'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{metodo === 'transferencia' ? 'Transfer.' : metodo}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desglose Económico */}
            <div className="mt-2 bg-[#F5F5F5] rounded-[1.5rem] p-5 flex flex-col gap-3 relative">
              <div className="flex justify-between items-center">
                 <span className="text-[11px] font-headline tracking-widest text-[#707974] font-bold uppercase">PRECIO CALCUALDO</span>
                 <span className="text-lg font-black text-[#707974] font-headline">{pdfData.importeTotal.toFixed(2)}€</span>
              </div>
              
              {pdfData.importeVale && (
                <>
                  <div className="w-full border-t border-dashed border-[#D1D5D2]"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-headline tracking-widest text-[#784112] font-bold uppercase">VALE DESCUENTO</span>
                    <span className="text-lg font-black text-[#784112] font-headline bg-[#FFF4D6] px-3 py-1 rounded-full">-{pdfData.importeVale.toFixed(2)}€</span>
                  </div>
                </>
              )}

              <div className="w-full border-t border-dashed border-[#D1D5D2]"></div>
              <div className="flex justify-between items-center">
                 <span className="text-[11px] font-headline tracking-widest text-[#003829] font-bold uppercase">
                   {pdfData.importeSenal === 0 ? 'SEÑAL CUBIERTA' : 'SEÑAL A PAGAR NOW'}
                 </span>
                 <span className={`text-lg font-black font-headline px-3 py-1 rounded-full ${pdfData.importeSenal === 0 ? 'bg-[#E5F3EA] text-[#003829]' : 'bg-[#E5F3EA] text-[#003829]'}`}>
                   {pdfData.importeSenal.toFixed(2)}€
                 </span>
              </div>
              <div className="w-full border-t border-dashed border-[#D1D5D2]"></div>
               <div className="flex justify-between items-center">
                 <span className="text-[11px] font-headline tracking-widest text-[#707974] font-bold uppercase">PENDIENTE AL RECOGER</span>
                 <span className="text-lg font-black text-[#93000a] font-headline">{pdfData.importeRestante.toFixed(2)}€</span>
               </div>
            </div>

          </div>
        </div>


        {/* Footer del Ticket (Botones) */}
        <div className="bg-white rounded-b-[2.5rem] pt-6 pb-8 px-8 flex flex-col gap-3 relative overflow-hidden">
            <button 
              onClick={handleEnviarResumen}
              disabled={procesando}
              className="w-full py-[18px] bg-[#003829] text-white rounded-[2rem] font-bold font-headline text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
            >
              {procesando ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generando...
                </span>
              ) : (
                "Finalizar Reserva"
              )}
            </button>
            <button 
              onClick={handleVolver}
              disabled={procesando}
              className="w-full py-3 text-[#707974] rounded-full font-bold font-headline hover:text-[#003829] transition-colors disabled:opacity-50"
            >
              Volver Atrás
            </button>
        </div>

      </div>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[1.5rem] shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-[#93000a] font-headline font-bold">Error Operativo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#707974] font-body text-sm font-semibold">{errorMessage}</p>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => setShowErrorDialog(false)} 
              className="px-6 py-2 bg-[#93000a] text-white rounded-full font-bold hover:opacity-90"
            >
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Contenedor invisible para generar PDF (MANTENIDO) */}
      <div id="pdf-template-container" style={{ display: "none" }}>
        {pdfData && <ReservationA4Template {...pdfData} />}
      </div>

    </main>
  )
}
