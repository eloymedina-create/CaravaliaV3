"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Download, PlusCircle, TrendingDown, ArrowDown, ArrowUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Gasto, FiltrosRentabilidad } from "@/lib/types"
import { filtrarGastos, eliminarGasto, obtenerNombreModelo, parseFechaSegura } from "@/lib/rentabilidad-store"
import { GastosForm } from "./gastos-form"
import * as XLSX from "xlsx"
import { format } from "date-fns"

interface ListadoGastosProps {
  filtros: FiltrosRentabilidad
  usarRangoFechas?: boolean
  onGastoActualizado?: () => void
  autocaravanas?: { id: string; modelo: string }[]
}

export function ListadoGastos({ filtros, usarRangoFechas = false, onGastoActualizado, autocaravanas }: ListadoGastosProps) {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [gastoEditar, setGastoEditar] = useState<Gasto | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)
  
  // Estado para la ordenación de fecha: por defecto 'desc' (más reciente arriba)
  const [ordenFecha, setOrdenFecha] = useState<"desc" | "asc">("desc")

  // Función para ordenar gastos por fecha
  const ordenarGastos = (lista: Gasto[], direccion: "desc" | "asc") => {
    return [...lista].sort((a, b) => {
      const fechaA = parseFechaSegura(a.fecha) || new Date(a.fecha)
      const fechaB = parseFechaSegura(b.fecha) || new Date(b.fecha)
      const timeA = fechaA ? fechaA.getTime() : 0
      const timeB = fechaB ? fechaB.getTime() : 0
      return direccion === "desc" ? timeB - timeA : timeA - timeB
    })
  }

  const cargarGastos = () => {
    setLoading(true)
    try {
      const gastosData = filtrarGastos(filtros, usarRangoFechas)

      // Añadir el nombre del modelo a cada gasto
      const gastosConModelo = gastosData.map((gasto) => ({
        ...gasto,
        modelo: gasto.modelo || obtenerNombreModelo(gasto.modeloId),
      }))

      // Ordenar por fecha por defecto más reciente primero
      const gastosOrdenados = ordenarGastos(gastosConModelo, ordenFecha)

      setGastos(gastosOrdenados)
    } catch (error) {
      console.error("Error al cargar gastos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarGastos()
  }, [filtros, usarRangoFechas])

  const toggleOrdenFecha = () => {
    const nuevaDireccion = ordenFecha === "desc" ? "asc" : "desc"
    setOrdenFecha(nuevaDireccion)
    setGastos((prev) => ordenarGastos(prev, nuevaDireccion))
  }

  const handleEliminarGasto = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      try {
        const eliminado = await eliminarGasto(id)
        if (eliminado) {
          console.log("Gasto eliminado correctamente:", id)
          cargarGastos()
          if (onGastoActualizado) {
            onGastoActualizado()
          }
        } else {
          alert("No se pudo eliminar el gasto. Es posible que ya no exista.")
        }
      } catch (error) {
        console.error("Error al eliminar el gasto:", error)
        alert("Ocurrió un error al intentar eliminar el gasto.")
      }
    }
  }

  const handleEditarGasto = (gasto: Gasto) => {
    console.log("Editando gasto:", gasto)
    setGastoEditar(gasto)
    setDialogoAbierto(true)
  }

  const handleNuevoGasto = () => {
    setGastoEditar(null)
    setMostrarFormNuevo(true)
  }

  const handleGastoGuardado = () => {
    console.log("Gasto guardado, cerrando diálogos y refrescando...")
    setDialogoAbierto(false)
    setMostrarFormNuevo(false)
    setGastoEditar(null)
    cargarGastos()
    if (onGastoActualizado) {
      onGastoActualizado()
    }
  }

  const exportarExcel = () => {
    if (gastos.length === 0) return

    const filas = gastos.map((gasto) => ({
      Fecha: formatearFecha(gasto.fecha),
      "Vehículo / Modelo": gasto.modelo || gasto.modeloId,
      Concepto: gasto.concepto,
      "Importe (€)": gasto.importe,
      Notas: gasto.notas || "",
    }))

    const ws = XLSX.utils.json_to_sheet(filas)
    ws["!cols"] = [
      { wch: 14 },
      { wch: 24 },
      { wch: 28 },
      { wch: 14 },
      { wch: 35 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Historial_Gastos")

    const nombreDescarga = usarRangoFechas && filtros.fechaInicio && filtros.fechaFin
      ? `Gastos_Personalizado_${format(filtros.fechaInicio, "yyyyMMdd")}_${format(filtros.fechaFin, "yyyyMMdd")}.xlsx`
      : `Gastos_${filtros.año}_${filtros.mes || "todos"}.xlsx`

    XLSX.writeFile(wb, nombreDescarga)
  }

  // Formatear valores monetarios
  const formatearDinero = (valor: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(valor)
  }

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = parseFechaSegura(fechaStr) || new Date(fechaStr)
      return new Intl.DateTimeFormat("es-ES").format(fecha)
    } catch (error) {
      return fechaStr
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl shadow-blue-900/5 overflow-hidden rounded-3xl">
        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Historial de Gastos</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Control detallado de salidas y mantenimiento</p>
          </div>
          <div className="flex items-center gap-3">
            {gastos.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportarExcel} 
                className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar (.xlsx)
              </Button>
            )}
            <Button 
              onClick={handleNuevoGasto}
              className="bg-caravalia-600 hover:bg-caravalia-700 text-white rounded-xl font-bold shadow-lg shadow-caravalia-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo Gasto
            </Button>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-8 py-4">
                    <Button
                      variant="ghost"
                      onClick={toggleOrdenFecha}
                      className="flex items-center gap-2 font-bold text-slate-700 p-0 h-auto hover:bg-transparent hover:text-caravalia-600 transition-colors"
                      title={ordenFecha === "desc" ? "Orden: Más reciente primero. Clic para más antiguo primero" : "Orden: Más antiguo primero. Clic para más reciente primero"}
                    >
                      <span>FECHA</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-bold shadow-sm">
                        {ordenFecha === "desc" ? (
                          <>
                            <span className="text-caravalia-600 font-extrabold">▼</span>
                            <span className="text-[10px] uppercase tracking-wider text-caravalia-700 font-black">Más reciente</span>
                          </>
                        ) : (
                          <>
                            <span className="text-caravalia-600 font-extrabold">▲</span>
                            <span className="text-[10px] uppercase tracking-wider text-caravalia-700 font-black">Más antiguo</span>
                          </>
                        )}
                      </span>
                    </Button>
                  </TableHead>
                  <TableHead className="font-bold text-slate-700">VEHÍCULO</TableHead>
                  <TableHead className="font-bold text-slate-700">CONCEPTO</TableHead>
                  <TableHead className="font-bold text-slate-700">IMPORTE</TableHead>
                  <TableHead className="font-bold text-slate-700">NOTAS</TableHead>
                  <TableHead className="text-right px-8 font-bold text-slate-700">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-caravalia-100 border-t-caravalia-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-slate-400">Recuperando historial...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : gastos.length > 0 ? (
                  gastos.map((gasto) => (
                    <TableRow key={gasto.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-8 py-5 font-bold text-slate-700">{formatearFecha(gasto.fecha)}</TableCell>
                      <TableCell>
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {gasto.modelo || gasto.modeloId}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">{gasto.concepto}</TableCell>
                      <TableCell>
                        <span className="font-black text-red-600">
                          {formatearDinero(gasto.importe)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-slate-400 truncate font-medium">{gasto.notas || "-"}</p>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditarGasto(gasto)}
                            className="h-8 w-8 rounded-lg hover:bg-caravalia-50 hover:text-caravalia-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEliminarGasto(gasto.id)}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <TrendingDown className="h-10 w-10 text-slate-300" />
                        </div>
                        <p className="text-lg font-bold text-slate-400">No hay gastos en este periodo</p>
                        <Button 
                          variant="outline" 
                          onClick={handleNuevoGasto}
                          className="mt-2 rounded-xl border-slate-200 font-bold text-slate-600"
                        >
                          Registrar el primer gasto
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para editar gasto */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Edit className="h-6 w-6 text-caravalia-600" />
              Editar Registro
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <GastosForm gastoEditar={gastoEditar} autocaravanas={autocaravanas} onSuccess={handleGastoGuardado} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para nuevo gasto */}
      <Dialog open={mostrarFormNuevo} onOpenChange={setMostrarFormNuevo}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-caravalia-600" />
              Nuevo Gasto
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <GastosForm autocaravanas={autocaravanas} onSuccess={handleGastoGuardado} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
