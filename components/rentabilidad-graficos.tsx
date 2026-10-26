"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, BarChart3 } from "lucide-react"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { ResumenRentabilidad, FiltrosRentabilidad } from "@/lib/types"
import { calcularResumenRentabilidad, formatearMes } from "@/lib/rentabilidad-store"

interface RentabilidadGraficosProps {
  filtros: FiltrosRentabilidad
  usarRangoFechas?: boolean
}

export function RentabilidadGraficos({ filtros, usarRangoFechas = false }: RentabilidadGraficosProps) {
  const [resumen, setResumen] = useState<ResumenRentabilidad[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ingresos")

  useEffect(() => {
    async function cargarResumen() {
      setLoading(true)
      try {
        const data = await calcularResumenRentabilidad(filtros, usarRangoFechas)
        setResumen(data)
      } catch (error) {
        console.error("Error al cargar resumen para gráficos:", error)
        setResumen([])
      } finally {
        setLoading(false)
      }
    }

    cargarResumen()
  }, [filtros, usarRangoFechas])

  // Preparar datos para gráficos y evolución mensual
  const anosPresentes = Array.from(new Set(resumen.map((r) => r.año)))
  const esMultianual = anosPresentes.length > 1

  const datosPorMes = resumen.reduce((acc: any[], item) => {
    // Agrupar por mes y año para no mezclar datos del mismo mes de años distintos
    const itemExistente = acc.find((m) => m.mes === item.mes && m.año === item.año)

    if (itemExistente) {
      itemExistente.ingresos += item.ingresosTotales
      itemExistente.gastos += item.gastosTotales
      itemExistente.beneficio += item.beneficioNeto
      itemExistente.dias += item.diasAlquilados
    } else {
      const nombreMes = formatearMes(item.mes)
      acc.push({
        año: item.año,
        mes: item.mes,
        nombreMes,
        etiqueta: esMultianual ? `${nombreMes.slice(0, 3)} '${String(item.año).slice(-2)}` : nombreMes,
        etiquetaCompleta: esMultianual ? `${nombreMes} ${item.año}` : nombreMes,
        ingresos: item.ingresosTotales,
        gastos: item.gastosTotales,
        beneficio: item.beneficioNeto,
        dias: item.diasAlquilados,
      })
    }

    return acc
  }, [])

  // Ordenar cronológicamente (año ascendente, mes ascendente)
  datosPorMes.sort((a, b) => {
    if (a.año !== b.año) return a.año - b.año
    return a.mes - b.mes
  })

  // Datos para gráfico de distribución por modelo
  const datosPorModelo = resumen.reduce((acc: any[], item) => {
    const modeloExistente = acc.find((m) => m.modelo === item.modelo)

    if (modeloExistente) {
      modeloExistente.ingresos += item.ingresosTotales
      modeloExistente.gastos += item.gastosTotales
      modeloExistente.beneficio += item.beneficioNeto
      modeloExistente.dias += item.diasAlquilados
    } else {
      acc.push({
        modelo: item.modelo,
        ingresos: item.ingresosTotales,
        gastos: item.gastosTotales,
        beneficio: item.beneficioNeto,
        dias: item.diasAlquilados,
      })
    }

    return acc
  }, [])

  // Colores Premium para gráficos
  const COLORS = ["#2563eb", "#0ea5e9", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f59e0b", "#10b981"]

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4 transition-all">
        <div className="w-12 h-12 border-4 border-caravalia-100 border-t-caravalia-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-400 animate-pulse">Generando visualizaciones...</p>
      </div>
    )
  }

  if (resumen.length === 0) {
    return (
      <Card className="border-none shadow-lg shadow-blue-900/5 rounded-3xl">
        <CardContent className="p-16 text-center">
          <div className="p-4 bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Sin datos para graficar</h3>
          <p className="text-slate-400 font-medium">No se encontraron registros suficientes para generar las tendencias visuales.</p>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload, label, unit = "€" }: any) => {
    if (active && payload && payload.length) {
      const titulo = payload[0]?.payload?.etiquetaCompleta || label
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">{titulo}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 py-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
              <p className="text-sm font-bold text-slate-700">
                {entry.name}: <span className="text-slate-900">{entry.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {unit}</span>
              </p>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Exportar Excel con datos multidimensionales
  const exportarExcelGraficos = () => {
    if (resumen.length === 0) return

    const periodoStr = usarRangoFechas && filtros.fechaInicio && filtros.fechaFin
      ? `${format(filtros.fechaInicio, "dd/MM/yyyy", { locale: es })} - ${format(filtros.fechaFin, "dd/MM/yyyy", { locale: es })}`
      : filtros.mes ? `${formatearMes(filtros.mes)} ${filtros.año}` : `Año ${filtros.año}`
    
    const fechaGeneracion = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })

    const totalIngresos = datosPorMes.reduce((s, m) => s + m.ingresos, 0)
    const totalGastos = datosPorMes.reduce((s, m) => s + m.gastos, 0)
    const totalBeneficio = totalIngresos - totalGastos
    const totalDias = datosPorMes.reduce((s, m) => s + m.dias, 0)

    // Hoja 1: Evolución Mensual
    const hoja1Data = [
      ["CARAVALIA — EVOLUCIÓN MENSUAL"],
      [`Período: ${periodoStr}`],
      [`Generado: ${fechaGeneracion}`],
      [],
      ["Año", "Mes", "Ingresos Totales (€)", "Gastos Totales (€)", "Beneficio Neto (€)", "Días Alquilados", "Precio Medio Diario (€/día)"],
      ...datosPorMes.map((m) => [
        m.año,
        m.nombreMes,
        Number(m.ingresos.toFixed(2)),
        Number(m.gastos.toFixed(2)),
        Number(m.beneficio.toFixed(2)),
        m.dias,
        m.dias > 0 ? Number((m.ingresos / m.dias).toFixed(2)) : 0,
      ]),
      [],
      [
        "TOTALES",
        "",
        Number(totalIngresos.toFixed(2)),
        Number(totalGastos.toFixed(2)),
        Number(totalBeneficio.toFixed(2)),
        totalDias,
        totalDias > 0 ? Number((totalIngresos / totalDias).toFixed(2)) : 0,
      ],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(hoja1Data)
    ws1["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 24 }]

    // Hoja 2: Distribución por Modelo
    const hoja2Data = [
      ["CARAVALIA — MIX Y RENDIMIENTO POR MODELO"],
      [`Período: ${periodoStr}`],
      [],
      ["Vehículo / Modelo", "Ingresos (€)", "% Cuota Ingresos", "Gastos (€)", "% Cuota Gastos", "Beneficio Neto (€)", "Días Alquilados", "% Días Alquilados"],
      ...datosPorModelo.map((mod) => [
        mod.modelo,
        Number(mod.ingresos.toFixed(2)),
        totalIngresos > 0 ? `${((mod.ingresos / totalIngresos) * 100).toFixed(1)}%` : "0%",
        Number(mod.gastos.toFixed(2)),
        totalGastos > 0 ? `${((mod.gastos / totalGastos) * 100).toFixed(1)}%` : "0%",
        Number(mod.beneficio.toFixed(2)),
        mod.dias,
        totalDias > 0 ? `${((mod.dias / totalDias) * 100).toFixed(1)}%` : "0%",
      ]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(hoja2Data)
    ws2["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 18 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws1, "Evolucion_Mensual")
    XLSX.utils.book_append_sheet(wb, ws2, "Mix_Por_Vehiculo")

    const nombreDescarga = usarRangoFechas && filtros.fechaInicio && filtros.fechaFin
      ? `Tendencias_Caravalia_${format(filtros.fechaInicio, "yyyyMMdd")}_${format(filtros.fechaFin, "yyyyMMdd")}.xlsx`
      : `Tendencias_Caravalia_${filtros.año}_${filtros.mes || "todos"}.xlsx`

    XLSX.writeFile(wb, nombreDescarga)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="inline-flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
            <TabsTrigger value="ingresos" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-caravalia-600 data-[state=active]:shadow-sm transition-all">Ingresos</TabsTrigger>
            <TabsTrigger value="gastos" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm transition-all">Gastos</TabsTrigger>
            <TabsTrigger value="beneficio" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Balance</TabsTrigger>
            <TabsTrigger value="ocupacion" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all">Ocupación</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={exportarExcelGraficos}
              className="rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all flex items-center gap-2 shadow-sm"
              title="Descargar libro Excel con evolución mensual y mix de vehículos"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6 pt-2">

        <TabsContent value="ingresos" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Evolución de Ingresos</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Mix de Ingresos por Modelo</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosPorModelo}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="ingresos"
                      nameKey="modelo"
                      stroke="none"
                    >
                      {datosPorModelo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} content={(props) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {props.payload?.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gastos" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Evolución de Gastos</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Distribución de Gastos</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosPorModelo}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="gastos"
                      nameKey="modelo"
                      stroke="none"
                    >
                      {datosPorModelo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} content={(props) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {props.payload?.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficio" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Flujo de Beneficio Neto</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="beneficio" name="Beneficio" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Comparativa Ingresos vs Gastos</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocupacion" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Días de Alquiler</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip unit="días" />} />
                    <Bar dataKey="dias" name="Días Alquilados" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Mix de Ocupación por Modelo</h3>
            </div>
            <CardContent className="p-8">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosPorModelo}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="dias"
                      nameKey="modelo"
                      stroke="none"
                    >
                      {datosPorModelo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip unit="días" />} />
                    <Legend verticalAlign="bottom" height={36} content={(props) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-6">
                        {props.payload?.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
