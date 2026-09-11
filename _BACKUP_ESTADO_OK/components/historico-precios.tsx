"use client"

import { useState, useEffect } from "react"
import type { RegistroPrecio, FiltrosPrecio, Temporada } from "@/lib/precios-types"
import {
  obtenerRegistrosPreciosLocal,
  filtrarRegistrosPrecios,
  formatearFecha,
  eliminarRegistroPrecio,
} from "@/lib/precios-store"
import { obtenerAutocaravanas } from "@/lib/autocaravanas-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, FileDown, Search, RefreshCw, Info, AlertCircle, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function HistoricoPrecios() {
  const [registros, setRegistros] = useState<RegistroPrecio[]>([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroPrecio[]>([])
  const [autocaravanas, setAutocaravanas] = useState<Array<{ id: string; modelo: string }>>([])
  const [mostrarDebug, setMostrarDebug] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosPrecio>({})
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [fechaFin, setFechaFin] = useState<string>("")
  const [modeloFiltro, setModeloFiltro] = useState<string>("all")
  const [clienteFiltro, setClienteFiltro] = useState<string>("")
  const [temporadaFiltro, setTemporadaFiltro] = useState<string>("all")
  const [aceptadoFiltro, setAceptadoFiltro] = useState<boolean | undefined>(undefined)
  const [errorFiltro, setErrorFiltro] = useState<string | null>(null)
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("")

  // Cargar datos
  const cargarDatos = () => {
    try {
      const registrosGuardados = obtenerRegistrosPreciosLocal()
      console.log("Registros cargados:", registrosGuardados.length)

      // Verificar formato de fechas
      registrosGuardados.forEach((reg, index) => {
        if (!reg.fecha) {
          console.warn(`Registro ${index} sin fecha:`, reg)
        } else {
          try {
            const fechaObj = new Date(reg.fecha)
            if (isNaN(fechaObj.getTime())) {
              console.warn(`Registro ${index} con fecha inválida:`, reg.fecha)
            } else {
              console.log(`Registro ${index} fecha:`, {
                original: reg.fecha,
                parseada: fechaObj.toISOString(),
                formateada: formatearFecha(reg.fecha),
              })
            }
          } catch (e) {
            console.error(`Error al parsear fecha del registro ${index}:`, e)
          }
        }
      })

      setRegistros(registrosGuardados)
      setRegistrosFiltrados(registrosGuardados)

      const autos = obtenerAutocaravanas()
      setAutocaravanas(autos.map((a) => ({ id: a.id, modelo: a.modelo })))
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setErrorFiltro(`Error al cargar datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  // Aplicar filtros
  const aplicarFiltros = () => {
    setErrorFiltro(null)

    try {
      console.log("Aplicando filtros con fechas:", { fechaInicio, fechaFin, mesSeleccionado })

      const nuevosFiltros: FiltrosPrecio = {}

      // Si se seleccionó un mes específico, crear filtros para ese mes
      if (mesSeleccionado) {
        const [year, month] = mesSeleccionado.split("-")
        const primerDia = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
        const ultimoDia = new Date(Number.parseInt(year), Number.parseInt(month), 0)

        primerDia.setHours(0, 0, 0, 0)
        ultimoDia.setHours(23, 59, 59, 999)

        nuevosFiltros.fechaInicio = primerDia.toISOString()
        nuevosFiltros.fechaFin = ultimoDia.toISOString()

        console.log("Filtro por mes:", {
          mes: mesSeleccionado,
          primerDia: primerDia.toISOString(),
          ultimoDia: ultimoDia.toISOString(),
        })
      } else {
        // Convertir fechas a formato ISO para comparación consistente
        if (fechaInicio) {
          try {
            // Crear fecha con hora 00:00:00
            const fechaInicioObj = new Date(fechaInicio)
            fechaInicioObj.setHours(0, 0, 0, 0)
            nuevosFiltros.fechaInicio = fechaInicioObj.toISOString()
            console.log("Fecha inicio convertida:", nuevosFiltros.fechaInicio)
          } catch (e) {
            console.error("Error al convertir fecha inicio:", e)
            setErrorFiltro(`Error en fecha inicio: ${e instanceof Error ? e.message : "Formato inválido"}`)
            return
          }
        }

        if (fechaFin) {
          try {
            // Crear fecha con hora 23:59:59
            const fechaFinObj = new Date(fechaFin)
            fechaFinObj.setHours(23, 59, 59, 999)
            nuevosFiltros.fechaFin = fechaFinObj.toISOString()
            console.log("Fecha fin convertida:", nuevosFiltros.fechaFin)
          } catch (e) {
            console.error("Error al convertir fecha fin:", e)
            setErrorFiltro(`Error en fecha fin: ${e instanceof Error ? e.message : "Formato inválido"}`)
            return
          }
        }
      }

      if (modeloFiltro && modeloFiltro !== "all") nuevosFiltros.modelo = modeloFiltro
      if (clienteFiltro) nuevosFiltros.cliente = clienteFiltro
      if (temporadaFiltro && temporadaFiltro !== "all") nuevosFiltros.temporada = temporadaFiltro as Temporada
      if (aceptadoFiltro !== undefined) nuevosFiltros.aceptado = aceptadoFiltro

      setFiltros(nuevosFiltros)

      console.log("Filtros a aplicar:", nuevosFiltros)
      console.log("Total registros antes de filtrar:", registros.length)

      // Mostrar todas las fechas de los registros para depuración
      if (mostrarDebug) {
        registros.forEach((reg, i) => {
          console.log(`Registro ${i} fecha:`, {
            id: reg.id,
            fecha: reg.fecha,
            modelo: reg.modelo,
            cliente: reg.cliente,
          })
        })
      }

      const resultadosFiltrados = filtrarRegistrosPrecios(registros, nuevosFiltros)
      console.log("Registros filtrados:", resultadosFiltrados.length)

      setRegistrosFiltrados(resultadosFiltrados)

      // Si no hay resultados con filtros de fecha, mostrar mensaje
      if (resultadosFiltrados.length === 0 && (fechaInicio || fechaFin || mesSeleccionado)) {
        setErrorFiltro(
          "No se encontraron registros para el período seleccionado. Verifica que existan registros en ese rango de fechas.",
        )
      }
    } catch (error) {
      console.error("Error al aplicar filtros:", error)
      setErrorFiltro(`Error al aplicar filtros: ${error instanceof Error ? error.message : "Error desconocido"}`)
      setRegistrosFiltrados(registros)
    }
  }

  // Filtrar por mes actual
  const filtrarPorMesActual = () => {
    const hoy = new Date()
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
    setMesSeleccionado(mesActual)
    setFechaInicio("")
    setFechaFin("")

    // Aplicar filtros automáticamente
    setTimeout(() => aplicarFiltros(), 0)
  }

  // Manejar eliminación de registro
  const handleEliminar = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      eliminarRegistroPrecio(id)
      cargarDatos()
    }
  }

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ["Fecha", "Modelo", "Precio/Día", "Días", "Total", "Cliente", "Temporada", "Aceptado", "Notas"]

    const rows = registrosFiltrados.map((r) => [
      formatearFecha(r.fecha),
      r.modelo,
      r.precioPorDia.toString(),
      r.numeroDias.toString(),
      r.precioTotal.toString(),
      r.cliente || "",
      r.temporada,
      r.aceptado ? "Sí" : "No",
      r.notas || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `precios_historico_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Formatear precio
  const formatearPrecio = (precio: number): string => {
    return precio.toFixed(2).replace(".", ",") + " €"
  }

  // Generar opciones de meses para el selector
  const generarOpcionesMeses = () => {
    const opciones = []
    const hoy = new Date()
    const añoActual = hoy.getFullYear()

    // Añadir meses del año actual y el siguiente
    for (let año = añoActual - 1; año <= añoActual + 1; año++) {
      for (let mes = 1; mes <= 12; mes++) {
        const nombreMes = format(new Date(año, mes - 1, 1), "MMMM", { locale: es })
        const valorMes = `${año}-${String(mes).padStart(2, "0")}`
        opciones.push({ valor: valorMes, nombre: `${nombreMes} ${año}` })
      }
    }

    return opciones
  }

  // Función para mostrar fechas de ejemplo
  const mostrarFechasEjemplo = () => {
    if (registros.length === 0) return "No hay registros"

    return registros.slice(0, 5).map((r, i) => (
      <div key={i} className="mb-1">
        <span className="font-mono">Original: {r.fecha}</span>
        <br />
        <span className="font-mono">Formateada: {formatearFecha(r.fecha)}</span>
        <br />
        <span className="font-mono">
          Objeto Date: {(() => {
            try {
              const d = new Date(r.fecha)
              return isNaN(d.getTime()) ? "Inválida" : d.toISOString()
            } catch (e) {
              return "Error: " + (e instanceof Error ? e.message : "desconocido")
            }
          })()}
        </span>
      </div>
    ))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de precios</CardTitle>
        <CardDescription>Consulta y filtra el histórico de precios registrados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Filtros</h3>

          {/* Filtro por mes */}
          <div className="mb-6 p-3 bg-white rounded-md border border-gray-100">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Filtrar por mes
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={mesSeleccionado}
                  onValueChange={(v) => {
                    setMesSeleccionado(v)
                    setFechaInicio("")
                    setFechaFin("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los meses</SelectItem>
                    {generarOpcionesMeses().map((opcion) => (
                      <SelectItem key={opcion.valor} value={opcion.valor}>
                        {opcion.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={filtrarPorMesActual} className="whitespace-nowrap">
                Mes actual
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fechaInicio">Desde</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value)
                  setMesSeleccionado("")
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="fechaFin">Hasta</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value)
                  setMesSeleccionado("")
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="modeloFiltro">Modelo</Label>
              <Select value={modeloFiltro} onValueChange={setModeloFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los modelos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los modelos</SelectItem>
                  {autocaravanas.map((auto) => (
                    <SelectItem key={auto.id} value={auto.modelo}>
                      {auto.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="clienteFiltro">Cliente</Label>
              <Input
                id="clienteFiltro"
                value={clienteFiltro}
                onChange={(e) => setClienteFiltro(e.target.value)}
                placeholder="Buscar por cliente"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="temporadaFiltro">Temporada</Label>
              <Select value={temporadaFiltro} onValueChange={setTemporadaFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las temporadas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las temporadas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="aceptadoFiltro">Estado</Label>
              <Select
                value={aceptadoFiltro === undefined ? "all" : aceptadoFiltro ? "true" : "false"}
                onValueChange={(v) => setAceptadoFiltro(v === "all" ? undefined : v === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="true">Aceptados</SelectItem>
                  <SelectItem value="false">No aceptados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setFechaInicio("")
                setFechaFin("")
                setMesSeleccionado("")
                setModeloFiltro("all")
                setClienteFiltro("")
                setTemporadaFiltro("all")
                setAceptadoFiltro(undefined)
                setFiltros({})
                setRegistrosFiltrados(registros)
                setErrorFiltro(null)
              }}
            >
              Limpiar filtros
            </Button>
            <Button onClick={aplicarFiltros} className="bg-caravalia-600 hover:bg-caravalia-700">
              <Search className="h-4 w-4 mr-2" />
              Aplicar filtros
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setMostrarDebug(!mostrarDebug)}>
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mostrar/ocultar información de depuración</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Mensajes de error o depuración */}
        {errorFiltro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorFiltro}</AlertDescription>
          </Alert>
        )}

        {mostrarDebug && (
          <div className="bg-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-80">
            <h4 className="font-bold mb-2">Información de depuración:</h4>
            <p>Registros totales: {registros.length}</p>
            <p>Registros filtrados: {registrosFiltrados.length}</p>
            <p>Filtros aplicados: {JSON.stringify(filtros, null, 2)}</p>
            {fechaInicio && (
              <p>
                Fecha inicio: {fechaInicio} → {filtros.fechaInicio}
              </p>
            )}
            {fechaFin && (
              <p>
                Fecha fin: {fechaFin} → {filtros.fechaFin}
              </p>
            )}
            {mesSeleccionado && <p>Mes seleccionado: {mesSeleccionado}</p>}

            <h4 className="font-bold mt-4 mb-2">Ejemplos de fechas en registros:</h4>
            {mostrarFechasEjemplo()}
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">
              Mostrando {registrosFiltrados.length} de {registros.length} registros
            </span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={cargarDatos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={exportarCSV} disabled={registrosFiltrados.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Tabla de registros */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Precio/Día</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Temporada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                    No se encontraron registros
                    {Object.keys(filtros).length > 0 && " con los filtros aplicados"}
                  </TableCell>
                </TableRow>
              ) : (
                registrosFiltrados
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>{formatearFecha(registro.fecha)}</TableCell>
                      <TableCell>{registro.modelo}</TableCell>
                      <TableCell>{formatearPrecio(registro.precioPorDia)}</TableCell>
                      <TableCell>{registro.numeroDias}</TableCell>
                      <TableCell className="font-medium">{formatearPrecio(registro.precioTotal)}</TableCell>
                      <TableCell>{registro.cliente || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            registro.temporada === "alta"
                              ? "bg-red-100 text-red-800"
                              : registro.temporada === "media"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {registro.temporada === "alta" ? "Alta" : registro.temporada === "media" ? "Media" : "Baja"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            registro.aceptado ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {registro.aceptado ? "Aceptado" : "Pendiente"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(registro.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
