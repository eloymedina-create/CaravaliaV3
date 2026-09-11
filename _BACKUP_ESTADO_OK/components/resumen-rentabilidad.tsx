"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingDown, TrendingUp, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { ResumenRentabilidad, FiltrosRentabilidad } from "@/lib/types"
import { calcularResumenRentabilidad, formatearMes } from "@/lib/rentabilidad-store"
import { Button } from "@/components/ui/button"

interface ResumenRentabilidadComponentProps {
  filtros: FiltrosRentabilidad
  usarRangoFechas?: boolean
}

// Tipo para la ordenación
type OrdenColumna = {
  columna: "mes" | "beneficio"
  direccion: "asc" | "desc"
}

export function ResumenRentabilidadComponent({ filtros, usarRangoFechas = false }: ResumenRentabilidadComponentProps) {
  const [resumen, setResumen] = useState<ResumenRentabilidad[]>([])
  const [loading, setLoading] = useState(true)
  // Estado para la ordenación
  const [orden, setOrden] = useState<OrdenColumna>({ columna: "mes", direccion: "asc" })

  // Calcular totales
  const ingresosTotales = resumen.reduce((sum, item) => sum + item.ingresosTotales, 0)
  const gastosTotales = resumen.reduce((sum, item) => sum + item.gastosTotales, 0)
  const beneficioNeto = ingresosTotales - gastosTotales
  const diasAlquilados = resumen.reduce((sum, item) => sum + item.diasAlquilados, 0)

  useEffect(() => {
    async function cargarResumen() {
      setLoading(true)
      try {
        console.log("Cargando resumen de rentabilidad con filtros:", filtros, "usarRangoFechas:", usarRangoFechas)
        const data = await calcularResumenRentabilidad(filtros, usarRangoFechas)
        console.log("Datos de resumen recibidos:", data)
        setResumen(data)
      } catch (error) {
        console.error("Error al cargar resumen de rentabilidad:", error)
        setResumen([])
      } finally {
        setLoading(false)
      }
    }

    cargarResumen()
  }, [filtros, usarRangoFechas])

  // Función para obtener el título del período
  const obtenerTituloPeriodo = () => {
    if (usarRangoFechas && filtros.fechaInicio && filtros.fechaFin) {
      return `${format(filtros.fechaInicio, "dd/MM/yyyy", { locale: es })} - ${format(filtros.fechaFin, "dd/MM/yyyy", { locale: es })}`
    } else {
      return filtros.mes ? `${formatearMes(filtros.mes)} ${filtros.año}` : `Año ${filtros.año}`
    }
  }

  // Función para cambiar la ordenación
  const cambiarOrden = (columna: "mes" | "beneficio") => {
    setOrden((prevOrden) => {
      if (prevOrden.columna === columna) {
        // Si ya estamos ordenando por esta columna, cambiar la dirección
        return { columna, direccion: prevOrden.direccion === "asc" ? "desc" : "asc" }
      } else {
        // Si es una columna diferente, establecer la dirección por defecto
        return { columna, direccion: columna === "mes" ? "asc" : "desc" }
      }
    })
  }

  // Función para ordenar los datos según el estado actual
  const ordenarDatos = (datos: ResumenRentabilidad[]) => {
    return [...datos].sort((a, b) => {
      if (orden.columna === "mes") {
        // Ordenar por mes
        const comparacion = a.mes - b.mes
        return orden.direccion === "asc" ? comparacion : -comparacion
      } else {
        // Ordenar por beneficio
        const comparacion = a.beneficioNeto - b.beneficioNeto
        return orden.direccion === "asc" ? comparacion : -comparacion
      }
    })
  }

  // Obtener los datos ordenados
  const datosOrdenados = ordenarDatos(resumen)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Tarjetas de resumen Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden border-none bg-white shadow-lg shadow-green-900/5 group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-0">
            <div className="h-1.5 w-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600/70 bg-green-50 px-2 py-0.5 rounded-full">Ingresos</span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{ingresosTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</h3>
                <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {obtenerTituloPeriodo()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-white shadow-lg shadow-red-900/5 group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-0">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-orange-500"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600/70 bg-red-50 px-2 py-0.5 rounded-full">Gastos</span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{gastosTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</h3>
                <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {obtenerTituloPeriodo()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-white shadow-lg shadow-blue-900/5 group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-0">
            <div className={`h-1.5 w-full bg-gradient-to-r ${beneficioNeto >= 0 ? "from-blue-400 to-indigo-500" : "from-red-400 to-pink-500"}`}></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 ${beneficioNeto >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
                  <TrendingUp className={`h-6 w-6 ${beneficioNeto >= 0 ? "text-blue-600" : "text-red-600"}`} />
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${beneficioNeto >= 0 ? "text-blue-600/70 bg-blue-50" : "text-red-600/70 bg-red-50"}`}>Beneficio</span>
                </div>
              </div>
              <div>
                <h3 className={`text-3xl font-black tracking-tight ${beneficioNeto >= 0 ? "text-slate-800" : "text-red-700"}`}>
                  {beneficioNeto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </h3>
                <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {obtenerTituloPeriodo()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-white shadow-lg shadow-purple-900/5 group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-0">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-400 to-fuchsia-500"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600/70 bg-purple-50 px-2 py-0.5 rounded-full">Ocupación</span>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{diasAlquilados} <span className="text-lg font-bold text-slate-400">días</span></h3>
                <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {obtenerTituloPeriodo()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de detalle Mejorada */}
      <Card className="border-none shadow-xl shadow-blue-900/5 overflow-hidden rounded-3xl">
        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Desglose de Rentabilidad</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Análisis detallado por mes y modelo de vehículo</p>
          </div>
          <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-400 shadow-sm">
            MOSTRANDO {datosOrdenados.length} REGISTROS
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-caravalia-100 border-t-caravalia-600 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-400 animate-pulse">Sincronizando datos...</p>
            </div>
          ) : datosOrdenados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="px-8 py-4">
                      <Button
                        variant="ghost"
                        onClick={() => cambiarOrden("mes")}
                        className="flex items-center gap-2 font-bold text-slate-700 p-0 h-auto hover:bg-transparent hover:text-caravalia-600 transition-colors"
                      >
                        MES
                        {orden.columna === "mes" ? (
                          orden.direccion === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">VEHÍCULO</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">INGRESOS</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">GASTOS</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => cambiarOrden("beneficio")}
                        className="flex items-center gap-2 font-bold text-slate-700 p-0 h-auto ml-auto hover:bg-transparent hover:text-caravalia-600 transition-colors"
                      >
                        BENEFICIO
                        {orden.columna === "beneficio" ? (
                          orden.direccion === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right font-bold text-slate-700">PRECIO MEDIO</TableHead>
                    <TableHead className="text-right px-8 font-bold text-slate-700">DÍAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosOrdenados.map((item) => (
                    <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-8 py-4 font-bold text-slate-700 capitalize">
                        {formatearMes(item.mes, item.año)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {item.modelo}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-600">{item.ingresosTotales.toFixed(2)} €</TableCell>
                      <TableCell className="text-right font-semibold text-red-500/80">{item.gastosTotales.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-black ${item.beneficioNeto >= 0 ? "text-caravalia-600" : "text-red-600"}`}>
                          {item.beneficioNeto >= 0 ? "+" : ""}{item.beneficioNeto.toFixed(2)} €
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-500 italic">{item.precioMedioAlquiler.toFixed(2)} €/día</TableCell>
                      <TableCell className="text-right px-8">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{item.diasAlquilados}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-50 rounded-full">
                <Calendar className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-400">Sin registros en este periodo</p>
              <p className="text-sm text-slate-400 max-w-xs">Prueba a cambiar los filtros para ver otros periodos de rentabilidad.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
