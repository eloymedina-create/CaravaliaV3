"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfYear, 
  endOfYear,
  addMonths,
  setYear,
  getYear
} from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, ChevronRight, ChevronLeft, Info, Save, Trash2, X, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { obtenerEventos, guardarEvento, eliminarEvento, type EventoEspecial } from "@/lib/eventos-store"

export default function GestionEventosPage() {
  const router = useRouter()
  const [año, setAño] = useState(new Date().getFullYear())
  const [eventos, setEventos] = useState<EventoEspecial[]>([])
  const [showModal, setShowModal] = useState(false)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [fechaFin, setFechaFin] = useState<string>("")
  const [nuevoEvento, setNuevoEvento] = useState<{titulo: string, descripcion: string}>({
    titulo: "",
    descripcion: ""
  })

  useEffect(() => {
    setEventos(obtenerEventos())
  }, [])

  const meses = useMemo(() => {
    const inicio = startOfYear(setYear(new Date(), año))
    return Array.from({ length: 12 }).map((_, i) => addMonths(inicio, i))
  }, [año])

  const handleDiaClick = (fechaIso: string) => {
    setDiaSeleccionado(fechaIso)
    setFechaFin(fechaIso)
    const existente = eventos.find(e => e.fecha === fechaIso)
    if (existente) {
      setNuevoEvento({
        titulo: existente.titulo,
        descripcion: existente.descripcion || ""
      })
    } else {
      setNuevoEvento({ titulo: "", descripcion: "" })
    }
    setShowModal(true)
  }

  const handleGuardar = () => {
    if (!diaSeleccionado || !nuevoEvento.titulo) return
    
    const fFin = fechaFin || diaSeleccionado
    
    import("@/lib/eventos-store").then(m => {
      m.guardarRangoEventos(diaSeleccionado, fFin, {
        titulo: nuevoEvento.titulo.toUpperCase(),
        descripcion: nuevoEvento.descripcion.toUpperCase(),
        color: "#FF8C00"
      })
      setEventos(m.obtenerEventos())
      setShowModal(false)
    })
  }

  const handleEliminar = () => {
    if (!diaSeleccionado) return
    const fFin = fechaFin || diaSeleccionado
    
    import("@/lib/eventos-store").then(m => {
      m.eliminarRangoEventos(diaSeleccionado, fFin)
      setEventos(m.obtenerEventos())
      setShowModal(false)
    })
  }

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-8 bg-[#EBEBEB] font-body">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/calendario")}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#707974] hover:text-[#003829] shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black text-[#003829] tracking-tighter uppercase">Gestor de Eventos Especiales</h1>
              <p className="text-[10px] text-[#707974] font-bold uppercase tracking-widest opacity-70">Temporada Alta y Ocupación</p>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-white">
            <button 
              onClick={() => setAño(año - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-[#003829]"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-black text-[#003829] w-16 text-center">{año}</span>
            <button 
              onClick={() => setAño(año + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-[#003829]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {meses.map((mes) => (
            <MiniMes 
              key={mes.toISOString()} 
              fecha={mes} 
              eventos={eventos} 
              onDiaClick={handleDiaClick} 
            />
          ))}
        </div>
      </div>

      {/* Modal de Gestión de Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-black text-[#003829] uppercase tracking-tighter">
                  Gestionar Evento
                </CardTitle>
                <p className="text-[10px] text-[#707974] font-bold uppercase tracking-widest opacity-60">Marcar Alta Ocupación</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#F5F7F6] text-[#707974] hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Desde</Label>
                  <Input 
                    type="date"
                    value={diaSeleccionado || ""}
                    onChange={(e) => setDiaSeleccionado(e.target.value)}
                    className="rounded-2xl bg-[#F5F7F6] border-none font-bold text-[#003829] text-xs h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Hasta</Label>
                  <Input 
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="rounded-2xl bg-[#F5F7F6] border-none font-bold text-[#003829] text-xs h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Evento / Puentes</Label>
                <Input 
                  value={nuevoEvento.titulo}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value.toUpperCase()})}
                  placeholder="Ej: SEMANA SANTA, JEREZ..."
                  className="rounded-2xl bg-[#F5F7F6] border-none font-bold text-[#003829]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Notas / Info adicional</Label>
                <Textarea 
                  value={nuevoEvento.descripcion}
                  onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value.toUpperCase()})}
                  placeholder="Ej: Mínimo 7 días, Precio temporada alta..."
                  rows={3}
                  className="rounded-2xl bg-[#F5F7F6] border-none font-bold text-[#003829] resize-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                {eventos.some(e => e.fecha === diaSeleccionado) && (
                  <Button 
                    variant="outline"
                    onClick={handleEliminar}
                    className="flex-1 h-12 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold uppercase text-[10px] tracking-widest"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Quitar
                  </Button>
                )}
                <Button 
                  onClick={handleGuardar}
                  disabled={!nuevoEvento.titulo}
                  className="flex-[2] h-12 rounded-2xl bg-[#003829] hover:bg-[#00281d] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#003829]/20"
                >
                  <Save size={16} className="mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

function MiniMes({ fecha, eventos, onDiaClick }: { fecha: Date, eventos: EventoEspecial[], onDiaClick: (f: string) => void }) {
  const nombreMes = format(fecha, "MMMM", { locale: es })
  const inicioMes = startOfMonth(fecha)
  const finMes = endOfMonth(fecha)
  const dias = eachDayOfInterval({ start: inicioMes, end: finMes })
  
  const diasSemana = ["L", "M", "M", "J", "V", "S", "D"]

  return (
    <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow bg-white">
      <CardHeader className="bg-[#003829]/5 py-3 text-center">
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-[#003829]">{nombreMes}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-[#A0A8A3] text-center mb-2">
          {diasSemana.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (inicioMes.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {dias.map((dia) => {
            const iso = format(dia, "yyyy-MM-dd")
            const esEvento = eventos.some(e => e.fecha === iso)
            const esHoy = isSameDay(dia, new Date())
            const esFinDeSemana = dia.getDay() === 0 || dia.getDay() === 6
            
            return (
              <button
                key={iso}
                onClick={() => onDiaClick(iso)}
                className={`
                  aspect-square rounded-full flex items-center justify-center text-[11px] font-bold transition-all
                  ${esEvento ? 'bg-[#FF8C00] text-white shadow-md shadow-[#FF8C00]/30 scale-110 z-10' : 'hover:bg-gray-100'}
                  ${esHoy && !esEvento ? 'border border-[#003829] text-[#003829]' : ''}
                  ${!esEvento && esFinDeSemana ? 'text-[#003829]/60' : !esEvento ? 'text-[#707974]' : ''}
                `}
              >
                {format(dia, "d")}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
