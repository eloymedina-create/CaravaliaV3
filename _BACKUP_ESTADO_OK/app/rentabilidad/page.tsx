"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, TrendingUp, BarChart3, FileText, PlusCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { FiltrosRentabilidad } from "@/lib/types"
import { obtenerAñosDisponibles, formatearMes, obtenerGastosLocal, obtenerReservasLocalSync } from "@/lib/rentabilidad-store"
import { obtenerAutocaravanas } from "@/lib/autocaravanas-store"
import { GastosForm } from "@/components/gastos-form"
import { ListadoGastos } from "@/components/listado-gastos"
import { ResumenRentabilidadComponent } from "@/components/resumen-rentabilidad"
import { RentabilidadGraficos } from "@/components/rentabilidad-graficos"

import { SuperSimpleDatePicker } from "@/components/super-simple-date-picker"

export default function RentabilidadPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("resumen")
  const [autocaravanas, setAutocaravanas] = useState<{ id: string; modelo: string }[] > ([])
  const [añosDisponibles, setAñosDisponibles] = useState<number[]>([new Date().getFullYear()]) // Valor por defecto
  const [usarRangoFechas, setUsarRangoFechas] = useState(false)

  // Inicializar fechas por defecto para evitar valores undefined
  const hoy = new Date()
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const primerDiaAño = new Date(hoy.getFullYear(), 0, 1) // 1 de enero del año actual

  // Estado para los filtros - inicializar con valores por defecto para evitar undefined
  const [filtros, setFiltros] = useState<FiltrosRentabilidad>({
    año: new Date().getFullYear(),
    mes: null,
    modeloId: null,
    fechaInicio: primerDiaMes, // Inicializar con el primer día del mes actual
    fechaFin: hoy, // Inicializar con la fecha actual
  })

  // Función para cargar datos iniciales
  const loadData = useCallback(async () => {
    // Verificar si el usuario está autenticado
    const adminAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true"
    setIsAuthenticated(adminAuthenticated)

    if (!adminAuthenticated) {
      router.push("/")
      return
    }

    // Cargar modelos de todas las fuentes disponibles para garantizar historial completo
    try {
      // 1. Obtener modelos de la flota actual (activos e inactivos)
      const flotaActual = obtenerAutocaravanas()
      
      // 2. Obtener modelos únicos del historial de gastos
      const historialGastos = obtenerGastosLocal()
      const modelosGastos = historialGastos.map(g => g.modeloId || g.modelo)
      
      // 3. Obtener modelos únicos del historial de reservas
      const historialReservas = obtenerReservasLocalSync()
      const modelosReservas = historialReservas.map(r => r.modelo)
      
      // Combinar todos los modelos únicos
      const todosLosModelosSet = new Set<string>()
      
      // Añadir modelos de la flota
      flotaActual.forEach(auto => todosLosModelosSet.add(auto.modelo))
      
      // Añadir modelos de gastos
      modelosGastos.forEach(mod => { if(mod) todosLosModelosSet.add(mod) })
      
      // Añadir modelos de reservas
      modelosReservas.forEach(mod => { if(mod) todosLosModelosSet.add(mod) })
      
      // Crear la lista final de objetos para el estado
      const listaFinalModelos = Array.from(todosLosModelosSet)
        .sort()
        .map(modelo => ({
          id: modelo, // Usamos el nombre del modelo como ID para consistencia en filtros
          modelo: modelo
        }))
        
      console.log("Modelos consolidados para filtros:", listaFinalModelos)
      setAutocaravanas(listaFinalModelos)
      
    } catch (error) {
      console.error("Error al consolidar modelos de autocaravanas:", error)
    }

    // Cargar años disponibles
    try {
      const años = obtenerAñosDisponibles()
      console.log("Años disponibles:", años)

      // Si hay años disponibles, actualizar el estado
      if (años.length > 0) {
        setAñosDisponibles(años)
        setFiltros((prev) => ({ ...prev, año: años[0] }))
      }
    } catch (error) {
      console.error("Error al cargar años disponibles:", error)
      // Ya tenemos el año actual como valor por defecto
    }

    setIsLoading(false)
  }, [router])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData()
  }, [loadData])

  // Función para actualizar filtros
  const actualizarFiltro = (campo: keyof FiltrosRentabilidad, valor: any) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  // Función para refrescar datos después de añadir/editar/eliminar gastos
  const refrescarDatos = () => {
    loadData()
  }

  // Función para cambiar entre filtrado por año/mes y por rango de fechas
  const toggleRangoFechas = (checked: boolean) => {
    setUsarRangoFechas(checked)

    // Si se activa el rango de fechas, establecer la fecha de inicio al 1 de enero del año actual
    if (checked) {
      setFiltros((prev) => ({
        ...prev,
        fechaInicio: primerDiaAño,
        fechaFin: hoy,
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-caravalia-200 border-t-caravalia-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // No mostrar nada mientras redirige
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Premium Header area */}
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-900/5 mb-8 border border-white">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-caravalia-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-100/30 rounded-full blur-2xl"></div>
          
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-caravalia-50 text-caravalia-600 transition-all active:scale-95">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-caravalia-600 rounded-xl shadow-lg shadow-caravalia-200">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                    Rentabilidad <span className="text-caravalia-600 font-medium text-lg ml-1">v3.0</span>
                  </h1>
                </div>
                <p className="text-slate-500 font-medium">Análisis exhaustivo de ingresos y balance de la flota</p>
              </div>
            </div>
            
            <div className="w-28 h-28 relative group transition-transform duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-caravalia-200 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
                alt="Caravalia Logo"
                fill
                priority
                className="object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Filters Section */}
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 mb-8 transition-all hover:shadow-xl hover:shadow-blue-900/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-caravalia-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-slate-800">Panel de Control de Filtros</h2>
            </div>
            <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-2xl border border-slate-200/50">
              <Label htmlFor="rango-fechas-switch" className="text-sm font-semibold text-slate-600 cursor-pointer">
                Rango personalizado
              </Label>
              <Switch 
                id="rango-fechas-switch" 
                checked={usarRangoFechas} 
                onCheckedChange={toggleRangoFechas}
                className="data-[state=checked]:bg-caravalia-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {usarRangoFechas ? (
              <>
                <div className="space-y-2 group">
                  <Label htmlFor="fecha-inicio" className="text-sm font-bold text-slate-700 ml-1">Fecha de inicio</Label>
                  <div className="relative transition-all group-focus-within:ring-2 ring-caravalia-100 rounded-xl">
                    <SuperSimpleDatePicker
                      id="fecha-inicio"
                      value={filtros.fechaInicio}
                      onChange={(date) => actualizarFiltro("fechaInicio", date || primerDiaAño)}
                      placeholder="Selecciona fecha"
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="fecha-fin" className="text-sm font-bold text-slate-700 ml-1">Fecha de fin</Label>
                  <div className="relative transition-all group-focus-within:ring-2 ring-caravalia-100 rounded-xl">
                    <SuperSimpleDatePicker
                      id="fecha-fin"
                      value={filtros.fechaFin}
                      onChange={(date) => actualizarFiltro("fechaFin", date || hoy)}
                      placeholder="Selecciona fecha"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="año-select" className="text-sm font-bold text-slate-700 ml-1">Año Fiscal</Label>
                  <select
                    id="año-select"
                    value={filtros.año.toString()}
                    onChange={(e) => actualizarFiltro("año", Number.parseInt(e.target.value))}
                    className="w-full h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-caravalia-500 focus:border-transparent transition-all outline-none font-medium text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                  >
                    {añosDisponibles.map((año) => (
                      <option key={año} value={año.toString()}>{año}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes-select" className="text-sm font-bold text-slate-700 ml-1">Mes de Análisis</Label>
                  <select
                    id="mes-select"
                    value={filtros.mes?.toString() || "todos"}
                    onChange={(e) => actualizarFiltro("mes", e.target.value === "todos" ? null : Number.parseInt(e.target.value))}
                    className="w-full h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-caravalia-500 focus:border-transparent transition-all outline-none font-medium text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                  >
                    <option value="todos">Todos los meses</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes.toString()}>{formatearMes(mes)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="modelo-select" className="text-sm font-bold text-slate-700 ml-1">Vehículo / Flota</Label>
              <select
                id="modelo-select"
                value={filtros.modeloId || "todos"}
                onChange={(e) => actualizarFiltro("modeloId", e.target.value === "todos" ? null : e.target.value)}
                className="w-full h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-caravalia-500 focus:border-transparent transition-all outline-none font-medium text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="todos">Flota completa</option>
                {autocaravanas.map((autocaravana) => (
                  <option key={autocaravana.id} value={autocaravana.modelo}>{autocaravana.modelo}</option>
                ))}
              </select>
            </div>
          </div>

          {usarRangoFechas && filtros.fechaInicio && filtros.fechaFin && (
            <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-700">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Análisis desde {format(filtros.fechaInicio, "d MMMM yyyy", { locale: es })} hasta {format(filtros.fechaFin, "d MMMM yyyy", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Tabbed Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="flex items-center justify-start p-1 bg-white shadow-md rounded-2xl border border-slate-200/60 overflow-x-auto h-auto w-full no-scrollbar">
            <TabsTrigger 
              value="resumen" 
              className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-6 py-2.5 rounded-xl data-[state=active]:bg-caravalia-600 data-[state=active]:text-white transition-all duration-300 h-full"
            >
              <FileText className="h-4 w-4" />
              <span className="font-bold text-xs md:text-sm">Resumen General</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gastos" 
              className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-6 py-2.5 rounded-xl data-[state=active]:bg-caravalia-600 data-[state=active]:text-white transition-all duration-300 h-full"
            >
              <TrendingUp className="h-4 w-4 rotate-180" />
              <span className="font-bold text-xs md:text-sm">Detalle de Gastos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="graficos" 
              className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-6 py-2.5 rounded-xl data-[state=active]:bg-caravalia-600 data-[state=active]:text-white transition-all duration-300 h-full"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-bold text-xs md:text-sm">Gráficos y Tendencias</span>
            </TabsTrigger>
          </TabsList>

          <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
            <TabsContent value="resumen" className="mt-0 outline-none">
              <ResumenRentabilidadComponent filtros={filtros} usarRangoFechas={usarRangoFechas} />
            </TabsContent>

            <TabsContent value="gastos" className="mt-0 outline-none">
              <ListadoGastos filtros={filtros} onGastoActualizado={refrescarDatos} autocaravanas={autocaravanas} />
            </TabsContent>

            <TabsContent value="graficos" className="mt-0 outline-none">
              <RentabilidadGraficos filtros={filtros} usarRangoFechas={usarRangoFechas} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Dynamic Footer Atribución */}
        <div className="mt-16 py-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
            <p className="font-medium tracking-tight">© 2026 Caravalia Rentabilidad — Todos los derechos reservados</p>
            <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="hidden sm:inline">Arquitectura de Sistema por</span>
              <span className="font-bold text-slate-500">Antigravity AI</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Powered</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
