"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Download, PlusCircle, TrendingDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Gasto, FiltrosRentabilidad } from "@/lib/types"
import { filtrarGastos, eliminarGasto, obtenerNombreModelo } from "@/lib/rentabilidad-store"
import { GastosForm } from "./gastos-form"

interface ListadoGastosProps {
  filtros: FiltrosRentabilidad
  onGastoActualizado?: () => void
  autocaravanas?: { id: string; modelo: string }[]
}

export function ListadoGastos({ filtros, onGastoActualizado, autocaravanas }: ListadoGastosProps) {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [gastoEditar, setGastoEditar] = useState<Gasto | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)

  useEffect(() => {
    cargarGastos()
  }, [filtros])

  const cargarGastos = () => {
    setLoading(true)
    try {
      const gastosData = filtrarGastos(filtros)

      // Añadir el nombre del modelo a cada gasto
      const gastosConModelo = gastosData.map((gasto) => ({
        ...gasto,
        modelo: obtenerNombreModelo(gasto.modeloId),
      }))

      setGastos(gastosConModelo)
    } catch (error) {
      console.error("Error al cargar gastos:", error)
    } finally {
      setLoading(false)
    }
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

  const exportarCSV = () => {
    if (gastos.length === 0) return

    // Crear cabeceras
    const cabeceras = ["Fecha", "Modelo", "Concepto", "Importe", "Notas"]

    // Crear filas de datos
    const filas = gastos.map((gasto) => [
      gasto.fecha,
      gasto.modelo || gasto.modeloId,
      gasto.concepto,
      gasto.importe.toString(),
      gasto.notas || "",
    ])

    // Combinar cabeceras y filas
    const contenidoCSV = [cabeceras.join(","), ...filas.map((fila) => fila.join(","))].join("\n")

    // Crear blob y descargar
    const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `gastos_${filtros.año}__${filtros.mes || "todos"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      const fecha = new Date(fechaStr)
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
              <Button variant="outline" size="sm" onClick={exportarCSV} className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                <Download className="h-4 w-4 mr-2" />
                Exportar
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
                  <TableHead className="px-8 py-4 font-bold text-slate-700">FECHA</TableHead>
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
