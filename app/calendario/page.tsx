"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  format, 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWithinInterval,
  startOfDay,
  endOfDay,
  getDay
} from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Info, Truck, Zap, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { obtenerReservas } from "@/lib/reservas-store"
import { obtenerAutocaravanas } from "@/lib/autocaravanas-store"
import type { ReservaCompleta, Autocaravana } from "@/lib/types"
import { parseFechaSegura } from "@/lib/utils-date"
import { obtenerBloqueos, guardarBloqueo, eliminarBloqueo, generarIDBloqueo } from "@/lib/bloqueos-store"
import { obtenerEventos, type EventoEspecial } from "@/lib/eventos-store"
import type { Bloqueo } from "@/lib/types"

// Paleta de colores premium para la flota
const PALETA_COLORES = [
  "bg-[#003829]", // Verde Caravalia (Principal)
  "bg-[#784112]", // Marrón Aura
  "bg-[#1b4d3e]", // Verde Bosque
  "bg-[#5D320E]", // Tierra
  "bg-[#2d4a53]", // Azul Petróleo
  "bg-[#4a3a53]", // Púrpura Profundo
  "bg-[#93000a]", // Rojo Vino
]

export default function CalendarioPage() {
  const router = useRouter()
  const [reservas, setReservas] = useState<ReservaCompleta[]>([])
  const [autocaravanas, setAutocaravanas] = useState<Autocaravana[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estado para el modal de detalles
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [reservasDia, setReservasDia] = useState<ReservaCompleta[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [eventos, setEventos] = useState<EventoEspecial[]>([])

  // Estado para el diálogo de nuevo bloqueo
  const [showBloqueoDialog, setShowBloqueoDialog] = useState(false)
  const [nuevoBloqueo, setNuevoBloqueo] = useState<Partial<Bloqueo>>({
    fecha: format(new Date(), "yyyy-MM-dd"),
    hora: "09:00",
    descripcion: ""
  })

  useEffect(() => {
    const cargarDatos = () => {
      try {
        setIsLoading(true)
        const allReservas = obtenerReservas().filter(r => !r.anulada)
        const allAutos = obtenerAutocaravanas().filter(a => a.activa)
        const allBloqueos = obtenerBloqueos()
        const allEventos = obtenerEventos()
        setReservas(allReservas)
        setAutocaravanas(allAutos)
        setBloqueos(allBloqueos)
        setEventos(allEventos)
      } catch (error) {
        console.error("Error cargando datos para el calendario:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    cargarDatos()

    // ESCUCHADOR DE CAMBIOS (Reactividad)
    const handleStorageChange = () => {
      console.log("Detectado cambio en el almacenamiento, refrescando calendario...")
      cargarDatos()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
    }
  }, [])

  // Mapa dinámico de colores por autocaravana activa
  const mapaColoresAutos = useMemo(() => {
    const mapa: Record<string, string> = {}
    autocaravanas.forEach((auto, index) => {
      mapa[auto.modelo.toUpperCase()] = PALETA_COLORES[index % PALETA_COLORES.length]
    })
    return mapa
  }, [autocaravanas])

  // Función para obtener el color de una reserva (con lógica de compatibilidad de nombres antiguos)
  const getColorForReserva = (modeloReserva: string) => {
    const modUpper = (modeloReserva || "").toUpperCase()
    
    // 1. Intento de coincidencia exacta
    if (mapaColoresAutos[modUpper]) return mapaColoresAutos[modUpper]

    // 2. Intento de coincidencia parcial (fuzzy match)
    const modelosActivos = Object.keys(mapaColoresAutos)
    const coincidencia = modelosActivos.find(mActivo => 
      modUpper.includes(mActivo) || mActivo.includes(modUpper) ||
      modUpper.split(/[\s-]/)[0] === mActivo.split(/[\s-]/)[0]
    )
    
    if (coincidencia) return mapaColoresAutos[coincidencia]

    // 3. Fallback: si solo hay una autocaravana, usar su color
    if (modelosActivos.length === 1) return mapaColoresAutos[modelosActivos[0]]
    
    return "bg-[#3a4a43]" // Color neutro
  }

  const meses = useMemo(() => {
    const ahora = new Date()
    return Array.from({ length: 12 }).map((_, i) => addMonths(ahora, i))
  }, [])

  const handleVolver = () => router.push("/")

  const abrirDetalles = (dia: Date, reservasDelDia: ReservaCompleta[]) => {
    setDiaSeleccionado(dia)
    setReservasDia(reservasDelDia)
  }

  const handleGuardarBloqueo = async () => {
    if (!nuevoBloqueo.fecha || !nuevoBloqueo.descripcion) return
    
    await guardarBloqueo({
      id: generarIDBloqueo(),
      fecha: nuevoBloqueo.fecha,
      hora: nuevoBloqueo.hora || "09:00",
      descripcion: nuevoBloqueo.descripcion,
    })
    
    setShowBloqueoDialog(false)
    setNuevoBloqueo({
       fecha: format(new Date(), "yyyy-MM-dd"),
       hora: "09:00",
       descripcion: ""
    })
  }

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-8 bg-[#EBEBEB] font-body selection:bg-[#baeed9] selection:text-[#003829]">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Cabecera Sticky */}
        <div className="sticky top-0 z-50 -mx-4 px-4 py-4 mb-2 bg-[#EBEBEB]/80 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#707974] hover:text-[#003829] shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black text-[#003829] tracking-tighter uppercase">Calendario de Ocupación</h1>
                <p className="text-[10px] sm:text-[11px] text-[#707974] font-bold uppercase tracking-widest opacity-70">Disponibilidad de Flota</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
              <Button 
                onClick={() => setShowBloqueoDialog(true)}
                className="w-full sm:w-auto bg-[#784112] hover:bg-[#5D320E] text-white rounded-2xl h-10 px-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#784112]/20 active:scale-95 transition-all"
              >
                + Bloqueo / taller
              </Button>

              <Button 
                onClick={() => router.push("/calendario/eventos")}
                className="w-full sm:w-auto bg-[#FF8C00] hover:bg-[#E67E00] text-white rounded-2xl h-10 px-4 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#FF8C00]/20 active:scale-95 transition-all"
              >
                <Info className="w-4 h-4 mr-2" />
                Eventos
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#003829]/20 border-t-[#003829] rounded-full animate-spin mb-4"></div>
            <p className="text-[#707974] font-bold">Cargando disponibilidad...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-12">
            {meses.map((mes, index) => (
              <MesCookie 
                key={index} 
                fecha={mes} 
                reservas={reservas} 
                autocaravanas={autocaravanas}
                bloqueos={bloqueos}
                eventos={eventos}
                onSelectDay={abrirDetalles}
                getColorForReserva={getColorForReserva}
              />
            ))}

            {/* Leyenda global */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 flex flex-wrap justify-center gap-6 shadow-sm border border-white">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#baeed9] rounded-full shadow-sm" />
                <span className="text-[10px] font-black uppercase text-[#707974] tracking-wider">Inicio Reserva</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-400 rounded-full shadow-sm" />
                <span className="text-[10px] font-black uppercase text-[#707974] tracking-wider">Fin Reserva</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF8C00] rounded-full shadow-sm" />
                <span className="text-[10px] font-black uppercase text-[#707974] tracking-wider">Alta Ocupación / Evento</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {diaSeleccionado && (
        <DetalleDiaModal 
          dia={diaSeleccionado} 
          reservas={reservasDia} 
          bloqueos={bloqueos}
          eventos={eventos}
          onClose={() => setDiaSeleccionado(null)} 
          getColorForReserva={getColorForReserva}
        />
      )}

      {/* MODAL NUEVO BLOQUEO */}
      {showBloqueoDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-[#003829] uppercase tracking-tighter">Nuevo Bloqueo</h2>
                  <p className="text-[10px] text-[#707974] font-bold uppercase tracking-widest opacity-60">Tarea de Taller / Otros</p>
                </div>
                <button 
                  onClick={() => setShowBloqueoDialog(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#F5F7F6] text-[#707974] hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Fecha</label>
                  <input 
                    type="date"
                    value={nuevoBloqueo.fecha}
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, fecha: e.target.value})}
                    className="w-full bg-[#F5F7F6] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#003829] focus:ring-2 focus:ring-[#003829]/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Hora</label>
                  <input 
                    type="time"
                    value={nuevoBloqueo.hora}
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, hora: e.target.value})}
                    className="w-full bg-[#F5F7F6] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#003829] focus:ring-2 focus:ring-[#003829]/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#707974] uppercase tracking-widest ml-1">Descripción / Motivo</label>
                  <textarea 
                    value={nuevoBloqueo.descripcion}
                    rows={3}
                    placeholder="Ej: Pasar ITV, Limpieza profunda, etc."
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, descripcion: e.target.value})}
                    className="w-full bg-[#F5F7F6] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#003829] focus:ring-2 focus:ring-[#003829]/20 resize-none"
                  />
                </div>
              </div>

              <Button 
                onClick={handleGuardarBloqueo}
                disabled={!nuevoBloqueo.fecha || !nuevoBloqueo.descripcion}
                className="w-full h-14 bg-[#784112] hover:bg-[#5D320E] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#784112]/20 active:scale-95 transition-all disabled:opacity-50"
              >
                Guardar Bloqueo
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function MesCookie({ fecha, reservas, autocaravanas, bloqueos, eventos, onSelectDay, getColorForReserva }: { 
  fecha: Date, 
  reservas: ReservaCompleta[], 
  autocaravanas: Autocaravana[],
  bloqueos: Bloqueo[],
  eventos: EventoEspecial[],
  onSelectDay: (dia: Date, reservas: ReservaCompleta[]) => void,
  getColorForReserva: (modelo: string) => string
}) {
  const nombreMes = format(fecha, "MMMM yyyy", { locale: es })
  const inicioMes = startOfMonth(fecha)
  const finMes = endOfMonth(fecha)
  const dias = eachDayOfInterval({ start: inicioMes, end: finMes })

  return (
    <div className="bg-white rounded-[3rem] p-4 sm:p-8 shadow-sm border-2 border-transparent hover:border-[#baeed9] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
      {/* Título del Mes y Leyenda interna */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="px-10 py-3 bg-[#d4e7dd] text-[#003829] rounded-full shadow-sm">
           <span className="text-xl sm:text-2xl font-headline font-black uppercase tracking-[0.2em]">{nombreMes}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {autocaravanas.map((auto, index) => (
            <div key={auto.id} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F5F5F5] border border-[#EBEBEB]">
               <div className={`w-3 h-3 rounded-full ${PALETA_COLORES[index % PALETA_COLORES.length]}`} />
               <span className="text-[10px] font-black uppercase tracking-tight text-[#707974]">{auto.modelo}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => (
          <div key={i} className={`text-center text-[11px] font-black pb-2 uppercase tracking-tighter ${i >= 4 ? 'text-black' : 'text-[#A0A8A3]'}`}>
            {d}
          </div>
        ))}

        {Array.from({ length: (inicioMes.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square opacity-0" />
        ))}

        {dias.map((dia) => {
          const reservasDelDia = reservas.filter(r => {
            const fEntrega = startOfDay(parseFechaSegura(r.detalles.fechaEntrega))
            const fDevolucion = endOfDay(parseFechaSegura(r.detalles.fechaDevolucion))
            return isWithinInterval(dia, { start: fEntrega, end: fDevolucion })
          })

          const dayOfWeek = dia.getDay()
          const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6
          const esHoy = isSameDay(dia, new Date())
          const diaIso = format(dia, "yyyy-MM-dd")
          const evento = eventos.find(e => e.fecha === diaIso)

          return (
            <div 
              key={dia.toISOString()}
              onClick={() => onSelectDay(dia, reservasDelDia)}
              className={`relative min-h-[80px] sm:min-h-[105px] border rounded-[1.8rem] p-1 flex flex-col gap-1 transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 ${esHoy ? 'border-[#003829] bg-[#baeed9]/10' : 'border-[#F0F0F0]'} ${esFinDeSemana ? 'bg-[#F9F9F9]/50' : 'bg-white'} ${bloqueos.some(b => isSameDay(dia, new Date(b.fecha))) ? 'bg-[#784112]/10 border-[#784112]/30' : ''} ${evento ? 'ring-2 ring-inset ring-[#FF8C00]/30 bg-[#FF8C00]/5' : ''}`}
            >
              {/* Capa de fondo: Número del día (Siempre en el centro exacto) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className={`text-3xl sm:text-4xl font-black ${esFinDeSemana ? 'text-black/20' : 'text-black/10'}`}>
                  {format(dia, "d")}
                </span>
                {evento && (
                  <div className="absolute top-2 right-2 text-[#FF8C00] opacity-80 animate-pulse">
                    <Info size={16} />
                  </div>
                )}
              </div>
              
              {/* Capa de fondo: Horarios (Desplazados hacia abajo sin mover el número) */}
              <div className="absolute inset-x-0 bottom-1 sm:bottom-2 flex flex-col items-center pointer-events-none select-none">
                {/* Bloqueos de taller */}
                {bloqueos.filter(b => isSameDay(dia, new Date(b.fecha))).map(b => (
                  <span key={b.id} className="text-[11px] text-[#784112] font-black uppercase bg-[#784112]/10 px-2 rounded-full mb-1">
                    {b.hora}h - TALLER
                  </span>
                ))}

                {reservasDelDia.map(r => {
                  const fEnt = parseFechaSegura(r.detalles.fechaEntrega)
                  const fDev = parseFechaSegura(r.detalles.fechaDevolucion)
                  const esIni = isSameDay(dia, fEnt)
                  const esFin = isSameDay(dia, fDev)
                  const hEnt = r.detalles.horaEntrega || "09:00"
                  const hDev = r.detalles.horaDevolucion || "19:00"
                  
                  // Obtener el precio diario sugerido o registrado
                  const pDiario = r.detalles.precioDiario || (r.totalDias > 0 ? (r.importeTotal / r.totalDias).toFixed(0) : "0")
                  
                  return (
                    <div key={r.id} className="flex flex-col items-center">
                      {esIni && (
                        <span className={`text-[11px] leading-tight ${hEnt !== "09:00" ? 'text-red-700 font-extrabold' : 'text-[#707974] font-bold'}`}>
                          {hEnt}h
                        </span>
                      )}
                      {esFin && (
                        <span className={`text-[11px] leading-tight ${hDev !== "19:00" ? 'text-red-700 font-extrabold' : 'text-[#707974] font-bold'}`}>
                          {hDev}h
                        </span>
                      )}
                      {esIni && (
                        <span className="text-[12px] font-black text-[#16a34a] leading-none mt-0.5 drop-shadow-sm">
                          {pDiario}€
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="relative z-10 flex flex-col gap-1 h-full">
                {reservasDelDia.map((reserva) => {
                  const colorBase = getColorForReserva(reserva.modelo)
                  const esEntrega = isSameDay(dia, parseFechaSegura(reserva.detalles.fechaEntrega))
                  const esDevolucion = isSameDay(dia, parseFechaSegura(reserva.detalles.fechaDevolucion))
                  const colorFondo = reserva.validado ? `${colorBase} text-white` : 'bg-rose-200 text-rose-900 border border-rose-300'

                  return (
                    <div 
                      key={reserva.id}
                      className={`relative py-1 px-2 rounded-xl shadow-sm flex flex-col items-center justify-center ${colorFondo} min-h-[28px] overflow-hidden`}
                    >
                      <span className="text-[9px] font-black uppercase opacity-90 leading-none">#{reserva.numeroReserva}</span>
                      
                      {/* Marcadores laterales de entrega/devolución más evidentes */}
                      {esEntrega && <div className="absolute top-0 left-0 w-3 h-full bg-[#baeed9] shadow-[1px_0_2px_rgba(0,0,0,0.1)]" title="Recogida" />}
                      {esDevolucion && <div className="absolute top-0 right-0 w-3 h-full bg-rose-400 shadow-[-1px_0_2px_rgba(0,0,0,0.1)]" title="Devolución" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetalleDiaModal({ dia, reservas, bloqueos, eventos, onClose, getColorForReserva }: { 
  dia: Date, 
  reservas: ReservaCompleta[], 
  bloqueos: Bloqueo[], 
  eventos: EventoEspecial[],
  onClose: () => void,
  getColorForReserva: (modelo: string) => string 
}) {
  const diaIso = format(dia, "yyyy-MM-dd")
  const evento = eventos.find(e => e.fecha === diaIso)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm bg-white rounded-[3rem] p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F5F5F5] text-[#707974] hover:bg-rose-50 hover:text-rose-500 transition-colors ml-auto">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 pb-2 border-b border-[#F0F0F0]">
              <div className="w-10 h-10 rounded-2xl bg-[#003829]/5 flex items-center justify-center text-[#003829]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#003829] uppercase tracking-tighter">
                  {format(dia, "EEEE, d 'de' MMMM", { locale: es })}
                </h3>
                <p className="text-[10px] text-[#707974] font-bold uppercase tracking-widest opacity-60">
                  Ocupación del día
                </p>
              </div>
            </div>

            {/* Mostrar Evento Especial si existe */}
            {evento && (
              <div className="bg-[#FF8C00]/10 border border-[#FF8C00]/30 p-4 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Info size={48} className="text-[#FF8C00]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FF8C00] rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-[#FF8C00] uppercase tracking-[0.1em]">Alta Ocupación / Evento</span>
                </div>
                <h4 className="text-sm font-black text-[#003829] uppercase">{evento.titulo}</h4>
                {evento.descripcion && (
                  <p className="text-[11px] font-bold text-[#707974] leading-relaxed">{evento.descripcion}</p>
                )}
              </div>
            )}

            {/* Mostrar Bloqueos de este día */}
            {bloqueos.filter(b => isSameDay(dia, new Date(b.fecha))).map(b => (
              <div key={b.id} className="bg-[#784112]/5 border border-[#784112]/20 p-3 rounded-2xl flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#784112] uppercase tracking-widest">BLOQUEO / TALLER</span>
                    <span className="text-[10px] font-black text-[#784112]">{b.hora}h</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#5D320E]">{b.descripcion}</p>
                  <button 
                  onClick={() => {
                      if(confirm("¿Eliminar este bloqueo?")) {
                        eliminarBloqueo(b.id)
                        onClose()
                      }
                  }}
                  className="text-[9px] text-red-600 font-bold self-end uppercase mt-2 hover:underline"
                  >
                    Eliminar
                  </button>
              </div>
            ))}

            {reservas.length === 0 && bloqueos.filter(b => isSameDay(dia, new Date(b.fecha))).length === 0 ? (
              <div className="py-8 text-center bg-[#F9F9F9] rounded-3xl border-2 border-dashed border-[#EBEBEB]">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-[#A0A8A3]">
                  <CalendarIcon size={24} />
                </div>
                <p className="text-sm font-bold text-[#A0A8A3] uppercase">Sin reservas este día</p>
              </div>
            ) : (
              reservas.map((r) => {
                const colorBase = getColorForReserva(r.modelo)
                const esEntrega = isSameDay(dia, parseFechaSegura(r.detalles.fechaEntrega))
                const esDevolucion = isSameDay(dia, parseFechaSegura(r.detalles.fechaDevolucion))
                const colorFondoIcono = r.validado ? `${colorBase} text-white` : 'bg-rose-200 text-rose-900 border border-rose-300'
                
                let estadoStr = "En ruta"
                let colorEstado = "bg-[#F5F5F5] text-[#707974]"
                if (esEntrega) {
                  estadoStr = "Recogida / Inicio"
                  colorEstado = "bg-[#d4e7dd] text-[#003829]"
                } else if (esDevolucion) {
                  estadoStr = "Devolución / Fin"
                  colorEstado = "bg-rose-50 text-rose-600"
                }

                if (!r.validado) {
                  estadoStr += " (NO VALIDADA)"
                  colorEstado = "bg-rose-100 text-rose-700"
                }

                const pDiario = r.detalles.precioDiario || (r.totalDias > 0 ? (r.importeTotal / r.totalDias).toFixed(0) : "0")

                return (
                  <div key={r.id} className="p-5 rounded-[2rem] bg-white border border-[#F0F0F0] shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${colorFondoIcono}`}>
                        {r.modelo.toLowerCase().includes("auto") ? <Zap size={20} /> : <Truck size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#003829] uppercase leading-none">{r.modelo}</span>
                        <span className="text-[11px] font-bold text-[#A0A8A3]">Reserva #{r.numeroReserva}</span>
                      </div>
                    </div>
                    
                    <div className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase text-center tracking-widest ${colorEstado}`}>
                      {estadoStr}
                    </div>

                    <div className="flex flex-col gap-1.5 pt-1 border-t border-[#F0F0F0]/50 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-[#707974] uppercase tracking-widest">Cliente</span>
                        <span className="text-[11px] font-bold text-[#003829] truncate max-w-[150px] text-right">{r.cliente.nombre}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-[#707974] uppercase tracking-widest">Precio Diario</span>
                        <span className="text-[11px] font-bold text-[#003829]">{pDiario}€/día</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <Button onClick={onClose} className="w-full mt-8 h-14 rounded-2xl bg-[#003829] hover:bg-[#00281d] text-white font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Entendido
        </Button>
      </div>
    </div>
  )
}
