"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { obtenerRegistrosPreciosLocal, obtenerPreciosReferenciaLocal } from "@/lib/precios-store"
import { obtenerAutocaravanas } from "@/lib/autocaravanas-store"
import type { RegistroPrecio, PrecioReferencia, Temporada } from "@/lib/precios-types"
import { format, parseISO, subMonths, isValid } from "date-fns"
import { es } from "date-fns/locale"

// Función para formatear fechas de manera segura
const formatearFechaSegura = (fechaStr: string, formatStr = "dd/MM/yyyy") => {
  try {
    const fecha = parseISO(fechaStr)
    if (!isValid(fecha)) return "Fecha inválida"
    return format(fecha, formatStr, { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return "Fecha inválida"
  }
}

// Función para formatear precios
const formatearPrecio = (precio: number) => {
  return `${precio.toFixed(2).replace(".", ",")} €`
}

// Colores para los gráficos
const coloresTemporada = {
  alta: "#ef4444", // Rojo
  media: "#f59e0b", // Ámbar
  baja: "#10b981", // Verde
}

const coloresModelo: Record<string, string> = {
  // Se asignarán dinámicamente
}

// Asignar colores a modelos
const asignarColoresModelos = (modelos: string[]) => {
  const coloresBase = [
    "#3b82f6", // Azul
    "#8b5cf6", // Violeta
    "#ec4899", // Rosa
    "#14b8a6", // Verde azulado
    "#f97316", // Naranja
    "#6366f1", // Índigo
    "#a855f7", // Púrpura
    "#06b6d4", // Cian
  ]

  modelos.forEach((modelo, index) => {
    coloresModelo[modelo] = coloresBase[index % coloresBase.length]
  })
}

export function GraficosPrecios() {
  // Estados para filtros y datos
  const [registrosPrecios, setRegistrosPrecios] = useState<RegistroPrecio[]>([])
  const [preciosReferencia, setPreciosReferencia] = useState<PrecioReferencia[]>([])
  const [autocaravanas, setAutocaravanas] = useState<Array<{ id: string; modelo: string }>>([])
  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>("todos")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>("6meses")
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState<string>("todas")
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [fechaFin, setFechaFin] = useState<string>("")
  const [tipoGrafico, setTipoGrafico] = useState<string>("evolucion")

  // Cargar datos iniciales
  useEffect(() => {
    const registros = obtenerRegistrosPreciosLocal()
    const precios = obtenerPreciosReferenciaLocal()
    const autos = obtenerAutocaravanas()

    setRegistrosPrecios(registros)
    setPreciosReferencia(precios)
    setAutocaravanas(autos)

    // Asignar colores a los modelos
    asignarColoresModelos(autos.map((a) => a.modelo))

    // Establecer fechas por defecto (últimos 6 meses)
    const hoy = new Date()
    const hace6Meses = subMonths(hoy, 6)
    setFechaInicio(format(hace6Meses, "yyyy-MM-dd"))
    setFechaFin(format(hoy, "yyyy-MM-dd"))
  }, [])

  // Filtrar datos según selecciones
  const datosFiltrados = useMemo(() => {
    if (!registrosPrecios.length) return []

    let filtrados = [...registrosPrecios]

    // Filtrar por modelo
    if (modeloSeleccionado !== "todos") {
      filtrados = filtrados.filter((r) => r.modelo === modeloSeleccionado)
    }

    // Filtrar por temporada
    if (temporadaSeleccionada !== "todas") {
      filtrados = filtrados.filter((r) => r.temporada === temporadaSeleccionada)
    }

    // Filtrar por período predefinido o fechas personalizadas
    if (periodoSeleccionado !== "personalizado") {
      const hoy = new Date()
      let fechaLimite = hoy

      switch (periodoSeleccionado) {
        case "3meses":
          fechaLimite = subMonths(hoy, 3)
          break
        case "6meses":
          fechaLimite = subMonths(hoy, 6)
          break
        case "12meses":
          fechaLimite = subMonths(hoy, 12)
          break
      }

      filtrados = filtrados.filter((r) => new Date(r.fecha) >= fechaLimite)
    } else {
      // Usar fechas personalizadas
      if (fechaInicio) {
        filtrados = filtrados.filter((r) => new Date(r.fecha) >= new Date(fechaInicio))
      }
      if (fechaFin) {
        filtrados = filtrados.filter((r) => new Date(r.fecha) <= new Date(fechaFin))
      }
    }

    // Ordenar por fecha
    return filtrados.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [registrosPrecios, modeloSeleccionado, temporadaSeleccionada, periodoSeleccionado, fechaInicio, fechaFin])

  // Preparar datos para gráfico de evolución de precios
  const datosEvolucion = useMemo(() => {
    if (!datosFiltrados.length) return []

    // Agrupar por fecha (mes)
    const porFecha = datosFiltrados.reduce(
      (acc, registro) => {
        const fecha = formatearFechaSegura(registro.fecha, "MMM yyyy")

        if (!acc[fecha]) {
          acc[fecha] = {
            fecha,
            precioPromedio: 0,
            cantidadRegistros: 0,
            registros: [],
          }
        }

        acc[fecha].registros.push(registro)
        acc[fecha].cantidadRegistros += 1

        return acc
      },
      {} as Record<
        string,
        { fecha: string; precioPromedio: number; cantidadRegistros: number; registros: RegistroPrecio[] }
      >,
    )

    // Calcular promedios
    return Object.values(porFecha).map((grupo) => {
      const sumaPrecios = grupo.registros.reduce((sum, r) => sum + r.precioPorDia, 0)
      return {
        ...grupo,
        precioPromedio: sumaPrecios / grupo.cantidadRegistros,
      }
    })
  }, [datosFiltrados])

  // Preparar datos para gráfico de comparativa por modelo
  const datosComparativaModelos = useMemo(() => {
    if (!registrosPrecios.length) return []

    // Filtrar por fechas
    let filtrados = [...registrosPrecios]

    if (periodoSeleccionado !== "personalizado") {
      const hoy = new Date()
      let fechaLimite = hoy

      switch (periodoSeleccionado) {
        case "3meses":
          fechaLimite = subMonths(hoy, 3)
          break
        case "6meses":
          fechaLimite = subMonths(hoy, 6)
          break
        case "12meses":
          fechaLimite = subMonths(hoy, 12)
          break
      }

      filtrados = filtrados.filter((r) => new Date(r.fecha) >= fechaLimite)
    } else {
      if (fechaInicio) {
        filtrados = filtrados.filter((r) => new Date(r.fecha) >= new Date(fechaInicio))
      }
      if (fechaFin) {
        filtrados = filtrados.filter((r) => new Date(r.fecha) <= new Date(fechaFin))
      }
    }

    // Filtrar por temporada
    if (temporadaSeleccionada !== "todas") {
      filtrados = filtrados.filter((r) => r.temporada === temporadaSeleccionada)
    }

    // Agrupar por modelo
    const porModelo = filtrados.reduce(
      (acc, registro) => {
        if (!acc[registro.modelo]) {
          acc[registro.modelo] = {
            modelo: registro.modelo,
            precioPromedio: 0,
            cantidadRegistros: 0,
            registros: [],
          }
        }

        acc[registro.modelo].registros.push(registro)
        acc[registro.modelo].cantidadRegistros += 1

        return acc
      },
      {} as Record<
        string,
        { modelo: string; precioPromedio: number; cantidadRegistros: number; registros: RegistroPrecio[] }
      >,
    )

    // Calcular promedios
    return Object.values(porModelo)
      .map((grupo) => {
        const sumaPrecios = grupo.registros.reduce((sum, r) => sum + r.precioPorDia, 0)
        return {
          ...grupo,
          precioPromedio: sumaPrecios / grupo.cantidadRegistros,
        }
      })
      .sort((a, b) => b.precioPromedio - a.precioPromedio) // Ordenar de mayor a menor precio
  }, [registrosPrecios, temporadaSeleccionada, periodoSeleccionado, fechaInicio, fechaFin])

  // Preparar datos para gráfico de distribución por temporada
  const datosDistribucionTemporada = useMemo(() => {
    if (!registrosPrecios.length) return []

    // Filtrar por fechas y modelo
    let filtrados = [...registrosPrecios]

    if (periodoSeleccionado !== "personalizado") {
      const hoy = new Date()
      let fechaLimite = hoy

      switch (periodoSeleccionado) {
        case "3meses":
          fechaLimite = subMonths(hoy, 3)
          break
        case "6meses":
          fechaLimite = subMonths(hoy, 6)
          break
        case "12meses":
          fechaLimite = subMonths(hoy, 12)
          break
      }

      filtrados = filtrados.filter((r) => new Date(r.fecha) >= fechaLimite)
    } else {
      if (fechaInicio) {
        filtrados = filtrados.filter((r) => new Date(r.fecha) >= new Date(fechaInicio))
      }
      if (fechaFin) {
        filtrados = filtrados.filter((r) => new Date(r.fecha) <= new Date(fechaFin))
      }
    }

    if (modeloSeleccionado !== "todos") {
      filtrados = filtrados.filter((r) => r.modelo === modeloSeleccionado)
    }

    // Agrupar por temporada
    const porTemporada = filtrados.reduce(
      (acc, registro) => {
        if (!acc[registro.temporada]) {
          acc[registro.temporada] = {
            temporada: registro.temporada,
            precioPromedio: 0,
            cantidadRegistros: 0,
            registros: [],
          }
        }

        acc[registro.temporada].registros.push(registro)
        acc[registro.temporada].cantidadRegistros += 1

        return acc
      },
      {} as Record<
        string,
        { temporada: string; precioPromedio: number; cantidadRegistros: number; registros: RegistroPrecio[] }
      >,
    )

    // Calcular promedios
    return Object.values(porTemporada).map((grupo) => {
      const sumaPrecios = grupo.registros.reduce((sum, r) => sum + r.precioPorDia, 0)
      return {
        ...grupo,
        precioPromedio: sumaPrecios / grupo.cantidadRegistros,
        nombre:
          grupo.temporada === "alta"
            ? "Temporada Alta"
            : grupo.temporada === "media"
              ? "Temporada Media"
              : "Temporada Baja",
        color: coloresTemporada[grupo.temporada as Temporada],
      }
    })
  }, [registrosPrecios, modeloSeleccionado, periodoSeleccionado, fechaInicio, fechaFin])

  // Formatear tooltip para los gráficos
  const formatearTooltip = (value: number) => {
    return formatearPrecio(value)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análisis Gráfico de Precios</CardTitle>
        <CardDescription>Visualiza la evolución y tendencias de precios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="tipoGrafico">Tipo de Gráfico</Label>
              <Select value={tipoGrafico} onValueChange={setTipoGrafico}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo de gráfico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="evolucion">Evolución de Precios</SelectItem>
                  <SelectItem value="comparativa">Comparativa por Modelo</SelectItem>
                  <SelectItem value="temporada">Distribución por Temporada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="modeloSeleccionado">Modelo</Label>
              <Select
                value={modeloSeleccionado}
                onValueChange={setModeloSeleccionado}
                disabled={tipoGrafico === "comparativa"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los modelos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los modelos</SelectItem>
                  {autocaravanas.map((auto) => (
                    <SelectItem key={auto.id} value={auto.modelo}>
                      {auto.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="temporadaSeleccionada">Temporada</Label>
              <Select
                value={temporadaSeleccionada}
                onValueChange={setTemporadaSeleccionada}
                disabled={tipoGrafico === "temporada"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las temporadas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las temporadas</SelectItem>
                  <SelectItem value="alta">Temporada Alta</SelectItem>
                  <SelectItem value="media">Temporada Media</SelectItem>
                  <SelectItem value="baja">Temporada Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="periodoSeleccionado">Período</Label>
              <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                  <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                  <SelectItem value="12meses">Último año</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodoSeleccionado === "personalizado" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="fechaInicio">Desde</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fechaFin">Hasta</Label>
                  <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mensaje si no hay datos */}
        {datosFiltrados.length === 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <InfoIcon className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              No hay datos disponibles para los filtros seleccionados. Prueba a cambiar los criterios de filtrado.
            </AlertDescription>
          </Alert>
        )}

        {/* Gráficos */}
        <div className="h-[400px] mt-6">
          {tipoGrafico === "evolucion" && datosFiltrados.length > 0 && (
            <>
              <h3 className="text-lg font-medium mb-4">Evolución de Precios por Día</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosEvolucion} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis tickFormatter={formatearTooltip} />
                  <Tooltip formatter={formatearTooltip} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precioPromedio"
                    name="Precio Promedio por Día"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {tipoGrafico === "comparativa" && datosComparativaModelos.length > 0 && (
            <>
              <h3 className="text-lg font-medium mb-4">Comparativa de Precios por Modelo</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosComparativaModelos} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modelo" />
                  <YAxis tickFormatter={formatearTooltip} />
                  <Tooltip formatter={formatearTooltip} />
                  <Legend />
                  <Bar dataKey="precioPromedio" name="Precio Promedio por Día" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {datosComparativaModelos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={coloresModelo[entry.modelo] || "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {tipoGrafico === "temporada" && datosDistribucionTemporada.length > 0 && (
            <>
              <h3 className="text-lg font-medium mb-4">Distribución de Precios por Temporada</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosDistribucionTemporada} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis tickFormatter={formatearTooltip} />
                  <Tooltip formatter={formatearTooltip} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="precioPromedio"
                    name="Precio Promedio por Día"
                    stroke="#8884d8"
                    fill="#8884d8"
                  >
                    {datosDistribucionTemporada.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Estadísticas adicionales */}
        {datosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Precio Promedio</h4>
                  <p className="text-2xl font-bold mt-1">
                    {formatearPrecio(
                      datosFiltrados.reduce((sum, r) => sum + r.precioPorDia, 0) / datosFiltrados.length,
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Precio Máximo</h4>
                  <p className="text-2xl font-bold mt-1">
                    {formatearPrecio(Math.max(...datosFiltrados.map((r) => r.precioPorDia)))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-500">Precio Mínimo</h4>
                  <p className="text-2xl font-bold mt-1">
                    {formatearPrecio(Math.min(...datosFiltrados.map((r) => r.precioPorDia)))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
