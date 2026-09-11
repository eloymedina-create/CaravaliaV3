"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, Plus, Trash2, Pencil, ArrowLeft, Ticket, User, CreditCard, AlertTriangle, Download, Loader2 } from "lucide-react"

import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import FileSaver from "file-saver"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  obtenerVales,
  guardarVale,
  eliminarVale,
  obtenerSiguienteNumeroVale,
  obtenerValePorId,
  obtenerHistoricoVales
} from "@/lib/vales-store"
import type { ValeDescuento, ValeHistorico } from "@/lib/types"
import { VoucherA4Template } from "@/components/voucher-a4-template"
import { guardarValeFirebase, eliminarValeFirebase } from "@/lib/firebase-adapter"
import { isFirebaseActivo } from "@/lib/firebase-client"
import { Clock, History, ChevronRight } from "lucide-react"

export default function ValesPage() {
  const router = useRouter()
  const [vales, setVales] = useState<ValeDescuento[]>([])
  const [historico, setHistorico] = useState<ValeHistorico[]>([])
  const [filtro, setFiltro] = useState("")
  const [valesFiltrados, setValesFiltrados] = useState<ValeDescuento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"listado" | "historial">("listado")

  // Estados para el modal de creación
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [nombre, setNombre] = useState("")
  const [dni, setDni] = useState("")
  const [telefono, setTelefono] = useState("")
  const [importe, setImporte] = useState("")
  const [numeroSugerido, setNumeroSugerido] = useState("")
  // Modo de cálculo del vale
  const [modoVale, setModoVale] = useState<"importe" | "dias">("importe")
  const [numeroDias, setNumeroDias] = useState("")
  const [precioPorDia, setPrecioPorDia] = useState("")
  const [anotaciones, setAnotaciones] = useState("")
  const [ocultarImporte, setOcultarImporte] = useState(false)
  const [pagado, setPagado] = useState(false)

  // Estados para edición y borrado
  const [valeEnEdicion, setValeEnEdicion] = useState<ValeDescuento | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [valeParaEliminar, setValeParaEliminar] = useState<ValeDescuento | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [valeParaExportar, setValeParaExportar] = useState<ValeDescuento | null>(null)

  const cargarVales = useCallback(() => {
    try {
      setIsLoading(true)
      const todosLosVales = obtenerVales()
      const todoElHistorico = obtenerHistoricoVales()

      // Ordenar vales por fecha de creación
      todosLosVales.sort((a, b) => {
        const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0
        const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0
        return dateB - dateA
      })

      setVales(todosLosVales)
      setValesFiltrados(todosLosVales)
      setHistorico(todoElHistorico)
    } catch (err) {
      console.error("Error al cargar datos:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarVales()
  }, [cargarVales])

  useEffect(() => {
    if (filtro.trim() === "") {
      setValesFiltrados(vales)
    } else {
      const f = filtro.toLowerCase()
      setValesFiltrados(
        vales.filter(v =>
          v.numeroVale.toLowerCase().includes(f) ||
          v.titular.nombre.toLowerCase().includes(f) ||
          v.titular.dni.toLowerCase().includes(f) ||
          v.titular.telefono.includes(f)
        )
      )
    }
  }, [filtro, vales])

  const handleOpenAddDialog = () => {
    const añoActual = new Date().getFullYear()
    setNumeroSugerido(obtenerSiguienteNumeroVale(añoActual))
    setNombre("")
    setDni("")
    setTelefono("")
    setImporte("")
    setModoVale("importe")
    setNumeroDias("")
    setPrecioPorDia("")
    setAnotaciones("")
    setOcultarImporte(false)
    setPagado(false)
    setValeEnEdicion(null)
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (vale: ValeDescuento) => {
    setValeEnEdicion(vale)
    setNombre(vale.titular.nombre)
    setDni(vale.titular.dni)
    setTelefono(vale.titular.telefono || "")
    setImporte(vale.importe.toString())
    setModoVale("importe")
    setNumeroDias("")
    setPrecioPorDia("")
    setAnotaciones(vale.anotaciones || "")
    setOcultarImporte(vale.ocultarImporte || false)
    setPagado(vale.pagado || false)
    setNumeroSugerido(vale.numeroVale)
    setShowAddDialog(true)
  }

  const handleOpenDeleteDialog = (vale: ValeDescuento) => {
    setValeParaEliminar(vale)
    setShowDeleteDialog(true)
  }

  const handleEliminarVale = async () => {
    if (!valeParaEliminar) return

    setIsProcessing(true)
    try {
      const exito = eliminarVale(valeParaEliminar.id)
      if (exito) {
        // Sincronizar con Firebase si está activo
        if (isFirebaseActivo()) {
          await eliminarValeFirebase(valeParaEliminar.id)
        }
        cargarVales()
        setShowDeleteDialog(false)
      } else {
        alert("Error al eliminar el vale")
      }
    } catch (err) {
      console.error("Error al eliminar vale:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportarPDF = async (vale: ValeDescuento) => {
    if (isExporting) return
    setIsExporting(true)
    setValeParaExportar(vale)

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const pdfContainer = document.getElementById("voucher-pdf-container")
      if (!pdfContainer) {
        setIsExporting(false)
        return
      }

      pdfContainer.style.display = "block"
      pdfContainer.style.position = "absolute"
      pdfContainer.style.top = "0"
      pdfContainer.style.left = "0"
      pdfContainer.style.width = "210mm"
      pdfContainer.style.height = "auto"
      pdfContainer.style.zIndex = "-1000"

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
      })

      pdfContainer.style.display = "none"

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297)
      const pdfBlob = pdf.output("blob")

      const nombreLimpio = vale.titular.nombre.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_")
      const nombreArchivo = `Vale_Regalo_${vale.numeroVale}_${nombreLimpio}.pdf`

      FileSaver.saveAs(pdfBlob, nombreArchivo)
    } catch (error) {
      console.error("Error al generar el PDF del vale:", error)
      alert("No se pudo generar el PDF del vale regalo.")
    } finally {
      setIsExporting(false)
      setValeParaExportar(null)
    }
  }

  const importeFinal = modoVale === "dias"
    ? (parseFloat(numeroDias || "0") * parseFloat(precioPorDia || "0"))
    : parseFloat(importe || "0")

  const formularioValido = nombre && dni && (
    modoVale === "dias"
      ? (parseFloat(numeroDias) > 0 && parseFloat(precioPorDia) > 0)
      : parseFloat(importe) > 0
  )

  const handleGuardarVale = () => {
    if (!nombre || !dni || !formularioValido) return

    const datosVale: ValeDescuento = {
      id: valeEnEdicion?.id || "",
      numeroVale: numeroSugerido,
      titular: {
        nombre: nombre.trim().toUpperCase(),
        dni: dni.trim().toUpperCase(),
        telefono: telefono.trim()
      },
      importe: importeFinal,
      diasAlquiler: modoVale === "dias" ? parseInt(numeroDias) : undefined,
      anotaciones: anotaciones.trim() || undefined,
      ocultarImporte,
      pagado,
      estado: valeEnEdicion?.estado || "disponible",
      reservaId: valeEnEdicion?.reservaId,
      fechaCreacion: valeEnEdicion?.fechaCreacion || new Date().toISOString(),
      fechaAsignacion: valeEnEdicion?.fechaAsignacion
    }

    const exito = guardarVale(datosVale)
    if (exito) {
      if (isFirebaseActivo()) {
        guardarValeFirebase(datosVale)
      }

      cargarVales()
      setShowAddDialog(false)

      if (!valeEnEdicion) {
        setTimeout(() => {
          handleExportarPDF(datosVale)
        }, 500)
      }

      setValeEnEdicion(null)
    } else {
      alert("Error al guardar el vale")
    }
  }

  const handleTogglePagado = (vale: ValeDescuento) => {
    const valeActualizado: ValeDescuento = { ...vale, pagado: !vale.pagado }
    const exito = guardarVale(valeActualizado)
    if (exito) {
      if (isFirebaseActivo()) {
        guardarValeFirebase(valeActualizado)
      }
      cargarVales()
    }
  }

  const handleVolver = () => router.push("/")

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-8 bg-[#EBEBEB] font-body selection:bg-[#baeed9] selection:text-[#003829]">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">

        {/* Superior */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={handleVolver}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-[#707974] hover:text-[#003829] shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-headline font-black text-[#003829] tracking-tight">Gestión de Vales Regalo</h1>
              <p className="text-[11px] font-bold text-[#A0A8A3] uppercase tracking-widest mt-0.5">Control de pagos anticipados y descuentos</p>
            </div>
          </div>

          <Button
            onClick={handleOpenAddDialog}
            className="bg-[#003829] hover:bg-[#004D3F] text-white rounded-full px-6 py-6 h-auto font-headline font-bold flex gap-2 shadow-md transition-all active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Vale Regalo</span>
          </Button>
        </div>

        {/* Tabs de navegación */}
        <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm mt-2 rounded-2xl w-fit self-center sm:self-start">
          <button
            onClick={() => setActiveTab("listado")}
            className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${activeTab === "listado" ? "bg-[#003829] text-white shadow-md" : "text-[#707974] hover:bg-white/80"}`}
          >
            <Ticket size={18} />
            <span>Vales Activos</span>
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${activeTab === "historial" ? "bg-[#003829] text-white shadow-md" : "text-[#707974] hover:bg-white/80"}`}
          >
            <History size={18} />
            <span>Historial de Actividad</span>
          </button>
        </div>

        {activeTab === "listado" ? (
          <>
            {/* Buscador */}
            <div className="bg-white rounded-[2rem] p-4 flex items-center gap-4 shadow-sm w-full animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A8A3]" size={20} />
                <Input
                  type="text"
                  placeholder="Buscar por número de vale, nombre o DNI..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-12 bg-[#F5F5F5] border-transparent rounded-full h-12 focus-visible:ring-[#baeed9] font-medium"
                />
              </div>
            </div>

            {/* Listado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isLoading ? (
                <div className="col-span-full py-20 text-center">
                  <div className="w-12 h-12 border-4 border-[#003829]/20 border-t-[#003829] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#707974] font-bold">Cargando vales...</p>
                </div>
              ) : valesFiltrados.length === 0 ? (
                <div className="col-span-full py-20 bg-white rounded-[3rem] text-center border-2 border-dashed border-[#D1D5D2]">
                  <Ticket size={48} className="mx-auto text-[#D1D5D2] mb-4 opacity-50" />
                  <p className="text-[#707974] font-bold text-lg">No se han encontrado vales descuento</p>
                  <p className="text-[#A0A8A3] text-sm mt-1">Pulsa en "Nuevo Vale" para empezar</p>
                </div>
              ) : (
                valesFiltrados.map((vale) => (
                  <div
                    key={vale.id}
                    className={`group relative flex flex-col p-6 rounded-[2.5rem] shadow-sm border-2 transition-all hover:scale-[1.02] ${vale.estado === 'asignado' ? 'bg-[#E5F3EA] border-[#baeed9] text-[#003829]' : 'bg-white border-transparent text-[#707974]'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${vale.estado === 'asignado' ? 'bg-[#baeed9]' : 'bg-[#EBEBEB]'}`}>
                        <Ticket size={24} className={vale.estado === 'asignado' ? 'text-[#003829]' : 'text-[#A0A8A3]'} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Importe</span>
                        <span className={`text-2xl font-black font-headline ${vale.estado === 'asignado' ? 'text-[#003829]' : 'text-[#003829]'}`}>
                          {vale.importe.toFixed(2)}€
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción (Hover) */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportarPDF(vale); }}
                        disabled={isExporting}
                        className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#003829] hover:bg-[#E5F3EA] shadow-sm transition-all disabled:opacity-50"
                        title="Exportar a PDF"
                      >
                        {isExporting && valeParaExportar?.id === vale.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(vale); }}
                        className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#707974] hover:text-[#003829] shadow-sm transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(vale); }}
                        className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#707974] hover:text-red-600 shadow-sm transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 mb-6">
                      <span className="text-[11px] uppercase font-black tracking-widest opacity-60">Referencia</span>
                      <span className="text-lg font-black font-headline tracking-tight">{vale.numeroVale}</span>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-current/20">
                      <div className="flex items-center gap-3">
                        <User size={16} className="opacity-60" />
                        <span className="text-sm font-bold uppercase tracking-tight truncate">{vale.titular.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CreditCard size={16} className="opacity-60" />
                        <span className="text-xs font-bold font-headline">{vale.titular.dni}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-black opacity-60 italic">Creado el</span>
                        <span className="text-[10px] font-bold">
                          {(() => {
                            try {
                              if (!vale.fechaCreacion) return "Fecha no disp."
                              return format(new Date(vale.fechaCreacion), "dd MMMM yyyy", { locale: es })
                            } catch (e) {
                              return "Fecha no disp."
                            }
                          })()}
                        </span>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${vale.estado === 'asignado' ? 'bg-[#003829] text-white' : 'bg-[#707974]/10 text-[#707974]'}`}>
                        {vale.estado === 'asignado' ? 'Asignado' : 'Disponible'}
                      </div>
                    </div>

                    {/* Toggle Pagado */}
                    <div className="mt-4 pt-3 border-t border-dashed border-current/10">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePagado(vale); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all active:scale-95 ${vale.pagado
                            ? 'bg-emerald-50 hover:bg-emerald-100'
                            : 'bg-amber-50 hover:bg-amber-100'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${vale.pagado
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-amber-400'
                          }`}>
                          {vale.pagado && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-wider ${vale.pagado ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                          {vale.pagado ? '✓ Pagado' : 'Pendiente de pago'}
                        </span>
                      </button>
                    </div>

                    {vale.estado === 'asignado' && vale.reservaId && (
                      <div className="mt-4 pt-3 border-t border-dashed border-[#003829]/20 flex items-center justify-center">
                        <span className="text-[9px] font-black uppercase tracking-tighter">Vinculado a Reserva ID: {vale.reservaId.substring(0, 8)}...</span>
                      </div>
                    )}

                    {vale.anotaciones && (
                      <div className="mt-4 pt-3 border-t border-dashed border-red-500/30 flex items-start">
                        <span className="text-xs font-bold text-red-600 leading-tight">
                          <span className="uppercase text-[10px] font-black tracking-widest mr-1 opacity-70">Nota:</span>
                          {vale.anotaciones}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-[#003829]/10 text-[#003829]">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-headline font-black text-[#003829]">Historial de Actividad</h2>
                <p className="text-xs font-bold text-[#A0A8A3] uppercase tracking-wider">Registro de todas las acciones realizadas</p>
              </div>
            </div>

            {historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[#A0A8A3]">
                <History size={48} className="opacity-20 mb-4" />
                <p className="font-bold">No hay actividad registrada todavía</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {historico.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-[#F5F5F5] hover:bg-[#F0F0F0] transition-colors border-l-4 border-[#003829]">
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <span className="text-[10px] font-black text-[#003829]">
                        {(() => {
                          try {
                            return format(new Date(log.fecha), "dd MMM", { locale: es })
                          } catch (e) { return "" }
                        })()}
                      </span>
                      <span className="text-[10px] font-bold text-[#A0A8A3]">
                        {(() => {
                          try {
                            return format(new Date(log.fecha), "HH:mm")
                          } catch (e) { return "" }
                        })()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#707974]">{log.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${log.accion === 'creacion' ? 'bg-blue-100 text-blue-700' :
                            log.accion === 'eliminacion' ? 'bg-red-100 text-red-700' :
                              log.accion === 'asignacion' ? 'bg-green-100 text-green-700' :
                                'bg-amber-100 text-amber-700'
                          }`}>
                          {log.accion}
                        </span>
                        <span className="text-[9px] font-bold text-[#A0A8A3] uppercase tracking-widest">REALIZADO POR {log.usuario}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-[#A0A8A3]">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal Añadir */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[2.5rem] shadow-lg p-0 overflow-hidden">
          <div className="bg-[#FFF4D6] p-8 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#784112] shadow-sm">
              <Ticket size={28} />
            </div>
            <div>
              <DialogTitle className="text-xl font-headline font-black text-[#784112]">
                {valeEnEdicion ? 'Editar Vale Regalo' : 'Nuevo Vale Regalo'}
              </DialogTitle>
              <p className="text-[#784112]/70 text-xs font-bold uppercase tracking-widest">{numeroSugerido}</p>
            </div>
          </div>

          <div className="p-8 flex flex-col gap-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Nombre Completo del Titular</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value.toUpperCase())}
                  placeholder="EJ: MARIA GARCÍA LÓPEZ"
                  className="bg-[#F5F5F5] border-transparent rounded-2xl h-12 font-bold focus-visible:ring-[#FFECC5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">DNI / NIE</Label>
                  <Input
                    value={dni}
                    onChange={(e) => setDni(e.target.value.toUpperCase())}
                    placeholder="00000000X"
                    className="bg-[#F5F5F5] border-transparent rounded-2xl h-12 font-bold text-center focus-visible:ring-[#FFECC5]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Teléfono</Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="600 000 000"
                    className="bg-[#F5F5F5] border-transparent rounded-2xl h-12 font-bold text-center focus-visible:ring-[#FFECC5]"
                  />
                </div>
              </div>

              {/* Selector de modo */}
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Tipo de Vale</Label>
                <div className="flex gap-1 p-1 bg-[#F5F5F5] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModoVale("importe")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${modoVale === "importe"
                        ? "bg-[#003829] text-white shadow-sm"
                        : "text-[#A0A8A3] hover:text-[#707974]"
                      }`}
                  >
                    💰 Por Importe
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVale("dias")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${modoVale === "dias"
                        ? "bg-[#003829] text-white shadow-sm"
                        : "text-[#A0A8A3] hover:text-[#707974]"
                      }`}
                  >
                    📅 Por Días
                  </button>
                </div>
              </div>

              {modoVale === "importe" ? (
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Importe del Beneficio (€)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={importe}
                      onChange={(e) => setImporte(e.target.value)}
                      placeholder="0.00"
                      className="bg-[#F5F5F5] border-transparent rounded-2xl h-14 font-black text-2xl text-center pr-10 text-[#003829] focus-visible:ring-[#FFECC5]"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-[#003829] text-xl">€</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Nº de Días</Label>
                      <Input
                        type="number"
                        min="1"
                        value={numeroDias}
                        onChange={(e) => setNumeroDias(e.target.value)}
                        placeholder="0"
                        className="bg-[#F5F5F5] border-transparent rounded-2xl h-12 font-black text-xl text-center text-[#003829] focus-visible:ring-[#FFECC5]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Precio / Día (€)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          value={precioPorDia}
                          onChange={(e) => setPrecioPorDia(e.target.value)}
                          placeholder="0.00"
                          className="bg-[#F5F5F5] border-transparent rounded-2xl h-12 font-black text-xl text-center pr-8 text-[#003829] focus-visible:ring-[#FFECC5]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-[#003829] text-sm">€</span>
                      </div>
                    </div>
                  </div>

                  {/* Resultado calculado */}
                  <div className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${importeFinal > 0 ? "bg-[#E5F3EA] border-2 border-[#baeed9]" : "bg-[#F5F5F5] border-2 border-transparent"
                    }`}>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-[#A0A8A3] tracking-widest">Total del Vale</span>
                      {numeroDias && precioPorDia && (
                        <span className="text-[10px] font-bold text-[#707974] mt-0.5">
                          {numeroDias} día{parseFloat(numeroDias) !== 1 ? "s" : ""} × {parseFloat(precioPorDia).toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <span className={`text-3xl font-black font-headline ${importeFinal > 0 ? "text-[#003829]" : "text-[#D1D5D2]"
                      }`}>
                      {importeFinal > 0 ? `${importeFinal.toFixed(2)}€` : "—"}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-2 border-t border-dashed border-[#D1D5D2] pt-4 mt-2">
                <Label className="text-[10px] uppercase font-black text-[#A0A8A3] ml-1">Anotaciones Internas (Opcional)</Label>
                <textarea
                  value={anotaciones}
                  onChange={(e) => setAnotaciones(e.target.value)}
                  placeholder="Notas, condiciones especiales, fechas concretas..."
                  className="bg-[#F5F5F5] border-transparent rounded-2xl p-4 min-h-[80px] text-sm font-medium focus-visible:ring-[#FFECC5] resize-none outline-none"
                />
                <p className="text-[10px] text-[#A0A8A3] ml-1 font-medium italic">Esta nota no aparecerá en el PDF del cliente, solo es visible para ti en rojo.</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#F5F5F5] rounded-2xl cursor-pointer" onClick={() => setOcultarImporte(!ocultarImporte)}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${ocultarImporte ? 'bg-[#003829] text-white' : 'bg-white border-2 border-[#D1D5D2]'}`}>
                  {ocultarImporte && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <div className="flex flex-col select-none">
                  <span className="text-sm font-black text-[#003829]">Ocultar importes en PDF</span>
                  <span className="text-[10px] text-[#707974] font-medium">Ideal para vales regalo donde no se quiere mostrar el precio</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowAddDialog(false)}
              variant="ghost"
              className="rounded-full h-12 font-bold text-[#707974]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarVale}
              disabled={!formularioValido}
              className="flex-1 bg-[#003829] hover:bg-[#004D3F] text-white rounded-full h-14 font-headline font-black text-lg active:scale-95 transition-all shadow-md"
            >
              {valeEnEdicion ? 'Guardar Cambios' : 'Confirmar y Crear Vale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Borrado */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] bg-white border-transparent rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
          <div className="bg-red-50 p-8 flex items-center gap-4 border-b border-red-100">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm">
              <AlertTriangle size={28} />
            </div>
            <div>
              <DialogTitle className="text-xl font-headline font-black text-red-900">¿Eliminar Vale?</DialogTitle>
              <p className="text-red-700/70 text-xs font-bold uppercase tracking-widest">{valeParaEliminar?.numeroVale}</p>
            </div>
          </div>

          <div className="p-8">
            <p className="text-[#707974] font-medium leading-relaxed">
              Estás a punto de eliminar permanentemente este vale regalo. Esta acción no se puede deshacer y el código dejará de ser válido.
            </p>
            {valeParaEliminar?.estado === 'asignado' && (
              <div className="mt-4 p-4 bg-red-100/50 rounded-2xl border border-red-200 flex gap-3 text-red-800">
                <AlertTriangle size={20} className="shrink-0" />
                <p className="text-xs font-bold leading-tight uppercase">
                  ATENCIÓN: Este vale ya está asignado a una reserva. Eliminarlo podría causar descuadres financieros en el expediente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button
              onClick={() => setShowDeleteDialog(false)}
              variant="ghost"
              className="flex-1 rounded-full h-12 font-bold text-[#707974]"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEliminarVale}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full h-12 font-headline font-black transition-all active:scale-95"
              disabled={isProcessing}
            >
              {isProcessing ? 'Eliminando...' : 'Sí, Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contenedor invisible para generación de PDF */}
      <div
        id="voucher-pdf-container"
        style={{
          display: "none",
          position: "fixed",
          left: "-9999px",
          top: "-9999px"
        }}
      >
        {valeParaExportar && <VoucherA4Template vale={valeParaExportar} />}
      </div>
    </main>
  )
}
