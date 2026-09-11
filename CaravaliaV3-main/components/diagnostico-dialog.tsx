"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  isLocalStorageAvailable,
  obtenerReservas,
} from "@/lib/reservas-store"
import { comprobarConexionFirebase } from "@/lib/firebase-adapter"
import { exportarBackup, restaurarBackup } from "@/lib/backup-utils"
import { obtenerRegistroActividad, limpiarRegistroActividad } from "@/lib/activity-utils"

interface DiagnosticoDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function DiagnosticoDialog({ isOpen, onClose }: DiagnosticoDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados de salud básica
  const [localStorageStatus, setLocalStorageStatus] = useState<"checking" | "available" | "unavailable">("checking")
  const [cloudStatus, setCloudStatus] = useState<"checking" | "connected" | "error">("checking")
  const [apiError, setApiError] = useState<string | null>(null)
  
  // Estados de carga
  const [comprobandoConexion, setComprobandoConexion] = useState(false)
  const [importando, setImportando] = useState(false)
  const [totalReservas, setTotalReservas] = useState(0)
  const [activeTab, setActiveTab] = useState("diagnostico")
  const [registros, setRegistros] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setRegistros(obtenerRegistroActividad().reverse())
      
      // Comprobar disponibilidad de LocalStorage
      const lsAvailable = isLocalStorageAvailable()
      setLocalStorageStatus(lsAvailable ? "available" : "unavailable")

      // Contar reservas para habilitar/deshabilitar backup
      const reservas = obtenerReservas()
      setTotalReservas(reservas.length)

      // Comprobar conexión con la Nube al iniciar
      checkCloudApi()
    }
  }, [isOpen])

  const checkCloudApi = async () => {
    setCloudStatus("checking")
    setApiError(null)
    setComprobandoConexion(true)

    try {
      if (!navigator.onLine) {
        setCloudStatus("error")
        setApiError("No hay conexión a internet.")
        return
      }

      const connected = await comprobarConexionFirebase()
      if (connected) {
        setCloudStatus("connected")
      } else {
        setCloudStatus("error")
        setApiError("Fallo de conexión con Firebase.")
      }
    } catch (error) {
      setCloudStatus("error")
      setApiError("Error crítico de red.")
    } finally {
      setComprobandoConexion(false)
    }
  }

  const handleExportarReservas = () => {
    try {
      const hoy = new Date()
      const dia = hoy.getDate().toString().padStart(2, "0")
      const mes = (hoy.getMonth() + 1).toString().padStart(2, "0")
      const año = hoy.getFullYear().toString().slice(-2)
      const fechaFormateada = `${dia}-${mes}-${año}`

      const jsonData = exportarBackup()
      
      if (!jsonData || jsonData === "{}") {
        alert("Error: No hay datos suficientes para generar un backup válido.")
        return
      }
      
      const blob = new Blob([jsonData], { type: "application/json;charset=utf-8" })
      const nombreArchivo = `BACKUP_TOTAL_CARAVALIA_${fechaFormateada}.json`

      if (typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", nombreArchivo)
        document.body.appendChild(link)
        
        // Usamos setTimeout para asegurar que el navegador procese el click
        // antes de revocar la URL y eliminar el elemento
        setTimeout(() => {
          link.click()
          
          setTimeout(() => {
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          }, 1000)

          alert(`Copia de seguridad MAESTRA generada con éxito.\nArchivo: ${nombreArchivo}\n\nGuarde este archivo en un lugar seguro.`)
        }, 50)
      }
    } catch (error) {
      alert("Error crítico al generar la copia de seguridad.")
    }
  }

  const handleImportButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportando(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string

        if (confirm("⚠️ ATENCIÓN: Este proceso borrará los datos actuales. ¿Desea continuar?")) {
          const resultado = await restaurarBackup(jsonContent)
          if (resultado) {
            alert("Sistema re-sincronizado. Reiniciando...")
            window.location.reload()
          } else {
            alert("Error: El archivo no es un backup válido.")
          }
        }
      } catch (error) {
        alert("Error crítico al procesar el archivo.")
      } finally {
        setImportando(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    reader.readAsText(file)
  }

  const handleLimpiarHistorial = () => {
    if (confirm("¿Limpiar historial de actividad?")) {
      limpiarRegistroActividad()
      setRegistros([])
    }
  }

  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr)
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(fecha)
    } catch (e) {
      return fechaStr
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#F9F9F8] border-transparent rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        {/* Header Premium */}
        <div className="bg-[#003829] p-8 text-white relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-3xl">medical_services</span>
          </div>
          <DialogTitle className="text-3xl font-headline font-black tracking-tight">Centro de Diagnóstico</DialogTitle>
          <DialogDescription className="text-white/70 font-medium mt-1">Monitorización y gestión de copias de seguridad de la infraestructura</DialogDescription>
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>

        <div className="p-8">
          <Tabs defaultValue="diagnostico" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/50 p-1 rounded-2xl mb-8 border border-[#EBEBEB]">
              <TabsTrigger value="diagnostico" className="flex-1 rounded-xl data-[state=active]:bg-[#003829] data-[state=active]:text-white py-3 font-headline font-bold text-xs uppercase tracking-widest transition-all">Estado y ADN</TabsTrigger>
              <TabsTrigger value="historial" className="flex-1 rounded-xl data-[state=active]:bg-[#003829] data-[state=active]:text-white py-3 font-headline font-bold text-xs uppercase tracking-widest transition-all">Historial</TabsTrigger>
            </TabsList>

            {/* TAB: DIAGNÓSTICO Y BACKUPS */}
            <TabsContent value="diagnostico" className="space-y-6 mt-0">
               {/* Estados de Salud Grid */}
               <div className="grid grid-cols-2 gap-4">
                  <div className={`p-6 rounded-[2rem] border-2 transition-all ${
                    localStorageStatus === "available" ? "bg-white border-[#baeed9]" : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${localStorageStatus === "available" ? "bg-[#baeed9] text-[#003829]" : "bg-red-200 text-red-700"}`}>
                        <span className="material-symbols-outlined text-sm">{localStorageStatus === "available" ? "database" : "error"}</span>
                      </div>
                      <span className="text-[11px] font-headline font-black uppercase tracking-widest text-[#707974]">Memoria Local</span>
                    </div>
                    <p className={`text-xl font-headline font-black ${localStorageStatus === "available" ? "text-[#003829]" : "text-red-700"}`}>
                      {localStorageStatus === "available" ? "OPERATIVA" : "FALLO"}
                    </p>
                  </div>

                  <div className={`p-6 rounded-[2rem] border-2 transition-all ${
                    cloudStatus === "connected" ? "bg-white border-[#baeed9]" : cloudStatus === "checking" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cloudStatus === "connected" ? "bg-[#baeed9] text-[#003829]" : "bg-yellow-200 text-yellow-700"}`}>
                          <span className="material-symbols-outlined text-sm">{cloudStatus === "connected" ? "cloud_done" : "sync"}</span>
                        </div>
                        <span className="text-[11px] font-headline font-black uppercase tracking-widest text-[#707974]">Cloud Sync</span>
                      </div>
                      <button onClick={checkCloudApi} disabled={comprobandoConexion} className="hover:rotate-180 transition-transform duration-500">
                        <span className={`material-symbols-outlined text-sm text-[#003829] ${comprobandoConexion ? "animate-spin" : ""}`}>refresh</span>
                      </button>
                    </div>
                    <p className={`text-xl font-headline font-black ${cloudStatus === "connected" ? "text-[#003829]" : cloudStatus === "checking" ? "text-yellow-700" : "text-red-700"}`}>
                      {cloudStatus === "connected" ? "CONECTADO" : cloudStatus === "checking" ? "VERIFICANDO" : "ERROR"}
                    </p>
                  </div>
               </div>

               {/* Sección ADN */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-[#EBEBEB] shadow-sm">
                  <h3 className="text-sm font-headline font-black text-[#003829] mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">dna</span>
                    Copias de Seguridad (ADN)
                  </h3>
                  <p className="text-[#707974] text-xs font-medium mb-8 leading-relaxed">
                    Descargue el estado completo de su negocio (reservas, gastos, flota) en un solo archivo maestro para backups extremos o migración de dispositivos.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleExportarReservas}
                      disabled={totalReservas === 0}
                      className="group flex flex-col items-center justify-center p-6 bg-[#003829] text-white rounded-[2rem] hover:opacity-90 transition-all disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-3xl mb-2 group-hover:translate-y-[-2px] transition-transform">upload</span>
                      <span className="font-headline font-bold text-[10px] uppercase tracking-widest">Exportar ADN</span>
                    </button>

                    <label className="cursor-pointer">
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <div className="group flex flex-col items-center justify-center p-6 bg-[#baeed9] text-[#003829] rounded-[2rem] hover:opacity-90 transition-all h-full border-2 border-transparent">
                        <span className="material-symbols-outlined text-3xl mb-2 group-hover:translate-y-[2px] transition-transform">download</span>
                        <span className="font-headline font-bold text-[10px] uppercase tracking-widest">{importando ? "Restaurando..." : "Restaurar ADN"}</span>
                      </div>
                    </label>
                  </div>
               </div>
            </TabsContent>

            {/* TAB: HISTORIAL */}
            <TabsContent value="historial" className="mt-0">
               <div className="bg-white rounded-[2rem] border border-[#EBEBEB] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#EBEBEB] flex items-center justify-between bg-white/50">
                    <h3 className="text-[11px] font-headline font-black text-[#003829] uppercase tracking-widest flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">history</span>
                       Registro de Auditoría
                    </h3>
                    <button 
                      onClick={handleLimpiarHistorial}
                      className="text-[10px] font-headline font-bold text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Limpiar todo
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-[#F5F5F5]">
                        {registros.length > 0 ? (
                          registros.map((reg, i) => (
                            <tr key={i} className="hover:bg-[#F9F9F8] transition-colors">
                              <td className="px-6 py-4 text-[10px] font-medium text-[#A0A8A3] whitespace-nowrap">{formatearFecha(reg.fecha)}</td>
                              <td className="px-6 py-4 text-[11px] font-headline font-bold text-[#003829]">{reg.accion}</td>
                              <td className="px-6 py-4 text-[10px] text-right">
                                <span className="bg-[#E5F3EA] text-[#003829] px-2 py-1 rounded-md font-bold uppercase tracking-tighter">Admin</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-[#707974] text-xs font-medium italic">Historial vacío</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
