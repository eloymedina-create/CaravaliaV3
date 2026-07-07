"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PrinterIcon } from "lucide-react"
import { ReservationA4Template } from "@/components/reservation-a4-template"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ImprimirReservaPage({ params }: { params: Promise<{ modelo: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const numeroReserva = searchParams.get("numero") || ""
  const modelo = decodeURIComponent(resolvedParams.modelo)

  const [reservaDetalles, setReservaDetalles] = useState<any>(null)
  const [clienteData, setClienteData] = useState<any>(null)
  const [totalDias, setTotalDias] = useState(0)
  const [importeTotal, setImporteTotal] = useState(0)
  const [importeSenal, setImporteSenal] = useState(0)
  const [importeRestante, setImporteRestante] = useState(0)
  const [suplemento, setSuplemento] = useState(0)

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Recuperar datos de la reserva
    const detallesGuardados = localStorage.getItem("reservaDetalles")
    const clienteGuardado = localStorage.getItem("reservaCliente")

    if (detallesGuardados) {
      const detalles = JSON.parse(detallesGuardados)
      setReservaDetalles(detalles)

      // Calcular días (incluyendo el día inicial y final)
      const fechaEntrega = new Date(detalles.fechaEntrega)
      const fechaDevolucion = new Date(detalles.fechaDevolucion)

      // Reset the time part to ensure we're only comparing dates, not times
      const startDate = new Date(fechaEntrega.getFullYear(), fechaEntrega.getMonth(), fechaEntrega.getDate())
      const endDate = new Date(fechaDevolucion.getFullYear(), fechaDevolucion.getMonth(), fechaDevolucion.getDate())

      // Calculate difference in days and add 1 to include both start and end dates
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const dias = diffDays + 1

      setTotalDias(dias)

      // Calcular importes
      const precioDiario = Number.parseFloat(detalles.precioDiario)
      const suplementoValor = Number.parseFloat(detalles.suplemento || "0")
      setSuplemento(suplementoValor)
      const total = precioDiario * dias + suplementoValor
      setImporteTotal(total)

      // Calcular señal (30% redondeado a múltiplos de 10)
      const senal = Math.round((total * 0.3) / 10) * 10
      setImporteSenal(senal)

      // Calcular restante
      setImporteRestante(total - senal)
    }

    if (clienteGuardado) {
      setClienteData(JSON.parse(clienteGuardado))
    }
  }, [])

  const handlePrint = () => {
    // Si queremos generar un PDF con el mismo formato de nombre
    if (reservaDetalles && clienteData) {
      const fechaEntregaObj = new Date(reservaDetalles.fechaEntrega)
      const fechaFormateada = format(fechaEntregaObj, "dd_'de'_MMMM_yyyy", { locale: es })

      // Podemos establecer el nombre del archivo para la impresión
      const nombreArchivo = `Reserva_${numeroReserva}_${clienteData.nombre.replace(/\s+/g, "_")}_${fechaFormateada}`

      // Esto solo afecta a la impresión del navegador, no al nombre del archivo
      document.title = nombreArchivo
    }

    window.print()
  }

  const handleVolver = () => {
    router.push(`/reserva/${encodeURIComponent(modelo)}/confirmacion?numero=${numeroReserva}`)
  }

  if (!reservaDetalles || !clienteData) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Botones de control - solo visibles en pantalla, no en impresión */}
      <div className="flex justify-between mb-6 print:hidden">
        <Button variant="outline" onClick={handleVolver} className="btn-outline-modern">
          Volver
        </Button>
        <Button onClick={handlePrint} className="btn-primary-modern flex items-center gap-2">
          <PrinterIcon className="w-4 h-4" />
          Imprimir
        </Button>
      </div>

      {/* Documento A4 para imprimir */}
      <div ref={printRef}>
        <ReservationA4Template
          numeroReserva={numeroReserva}
          modelo={modelo}
          reservaDetalles={reservaDetalles}
          clienteData={clienteData}
          totalDias={totalDias}
          importeTotal={importeTotal}
          importeSenal={importeSenal}
          importeRestante={importeRestante}
          suplemento={suplemento}
        />
      </div>
    </div>
  )
}
