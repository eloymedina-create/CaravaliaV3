"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  // Preparar datos para gráficos
  const datosPorMes = resumen.reduce((acc: any[], item) => {
    const mesExistente = acc.find((m) => m.mes === item.mes)

    if (mesExistente) {
      mesExistente.ingresos += item.ingresosTotales
      mesExistente.gastos += item.gastosTotales
      mesExistente.beneficio += item.beneficioNeto
      mesExistente.dias += item.diasAlquilados
    } else {
      acc.push({
        mes: item.mes,
        nombreMes: formatearMes(item.mes),
        ingresos: item.ingresosTotales,
        gastos: item.gastosTotales,
        beneficio: item.beneficioNeto,
        dias: item.diasAlquilados,
      })
    }

    return acc
  }, [])

  // Ordenar por mes
  datosPorMes.sort((a, b) => a.mes - b.mes)

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
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">{label}</p>
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          <TabsTrigger value="ingresos" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-caravalia-600 data-[state=active]:shadow-sm transition-all">Ingresos</TabsTrigger>
          <TabsTrigger value="gastos" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm transition-all">Gastos</TabsTrigger>
          <TabsTrigger value="beneficio" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Balance</TabsTrigger>
          <TabsTrigger value="ocupacion" className="px-5 py-2 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm transition-all">Ocupación</TabsTrigger>
        </TabsList>

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
                    <XAxis dataKey="nombreMes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
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
                    <XAxis dataKey="nombreMes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
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
                    <XAxis dataKey="nombreMes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
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
                    <XAxis dataKey="nombreMes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
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
                    <XAxis dataKey="nombreMes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
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
      </Tabs>
    </div>
  )
}
