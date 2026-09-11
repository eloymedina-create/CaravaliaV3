"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  UserPlus, 
  Trash2, 
  Search, 
  UserRound, 
  ShieldCheck, 
  KeyIcon,
  Plus,
  Settings,
  Percent,
  Wallet,
  Cloud,
  CloudUpload,
  RefreshCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  obtenerUsuarios, 
  guardarUsuario, 
  eliminarUsuario, 
  type Usuario 
} from "@/lib/usuarios-store"
import { obtenerConfiguracion, guardarConfiguracion, type AppConfig } from "@/lib/config-store"
import { migrarDatosLocalAFirebase } from "@/lib/firebase-adapter"
import { isFirebaseActivo } from "@/lib/firebase-client"

export default function ConfiguracionSistemaPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"usuarios" | "parametros" | "nube">("usuarios")
  
  // Estados para Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", pin: "" })
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [filtro, setFiltro] = useState("")

  const [config, setConfig] = useState<AppConfig>({ fianza: 900, porcentajeSenal: 30 })
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  
  // Estados para Nube
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  // Cargar usuarios al iniciar
  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true)
    try {
      const data = await obtenerUsuarios()
      setUsuarios(data)
    } finally {
      setCargandoUsuarios(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
    const storedConfig = obtenerConfiguracion()
    if (storedConfig) setConfig(storedConfig)
  }, [cargarUsuarios])

  const handleVolver = () => router.back()

  const registrarActividad = (msg: string) => {
    console.log(`[Configuración] ${msg}`)
  }

  const handleAddUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.pin) {
      alert("Por favor, completa el nombre y el PIN")
      return
    }

    if (!/^\d{4}$/.test(nuevoUsuario.pin)) {
      alert("El PIN debe tener exactamente 4 dígitos numéricos")
      return
    }

    const exito = await guardarUsuario({
      id: Date.now().toString(),
      nombre: nuevoUsuario.nombre,
      pin: nuevoUsuario.pin,
      fechaAlta: new Date().toISOString()
    })

    if (exito) {
      registrarActividad(`Usuario creado: ${nuevoUsuario.nombre}`)
      setNuevoUsuario({ nombre: "", pin: "" })
      cargarUsuarios()
    }
  }

  const handleRemoveUsuario = async (u: Usuario) => {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${u.nombre}?`)) {
      const exito = await eliminarUsuario(u.id)
      if (exito) {
        registrarActividad(`Usuario eliminado: ${u.nombre}`)
        cargarUsuarios()
      }
    }
  }

  const handleSaveConfig = () => {
    setIsSavingConfig(true)
    try {
      const exito = guardarConfiguracion(config)
      if (exito) {
        registrarActividad(`Configuración actualizada: Fianza ${config.fianza}€, Señal ${config.porcentajeSenal}%`)
        alert("Configuración guardada correctamente")
      }
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleMigrate = async () => {
    if (!confirm("Esto subirá todos tus datos locales (reservas, gastos, eventos, etc.) a la nube. ¿Deseas continuar?")) return
    
    setIsMigrating(true)
    try {
      const result = await migrarDatosLocalAFirebase()
      setMigrationResult(result)
      if (result.exito) {
        registrarActividad("Migración manual a la nube completada")
        alert("Migración completada con éxito")
      } else {
        alert("Error en la migración: " + result.mensaje)
      }
    } catch (e) {
      console.error(e)
      alert("Error crítico durante la migración")
    } finally {
      setIsMigrating(false)
    }
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#F9F9F8] selection:bg-[#baeed9] selection:text-[#002117] font-body">
      
      {/* Header Premium (Estilo Caravalia V3) */}
      <div className="bg-[#003829] text-white p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-white opacity-[0.03] rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <button
                onClick={handleVolver}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                  <span className="material-symbols-outlined text-3xl">settings</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-headline font-black tracking-tight">Configuración</h1>
                  <p className="text-white/60 font-medium text-sm mt-1 uppercase tracking-widest">Gestión de usuarios y parámetros globales</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
               <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-tighter text-white/40">Estado de Seguridad</p>
                  <p className="text-sm font-bold text-[#baeed9]">PIN Activado</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-[#baeed9] flex items-center justify-center text-[#003829]">
                  <ShieldCheck className="w-6 h-6" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-white/20 w-fit backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`px-6 py-2.5 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "usuarios" ? 'bg-[#003829] text-white shadow-md' : 'text-[#003829]/60 hover:bg-white/50'}`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab("parametros")}
            className={`px-6 py-2.5 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "parametros" ? 'bg-[#003829] text-white shadow-md' : 'text-[#003829]/60 hover:bg-white/50'}`}
          >
            Parámetros Globales
          </button>
          <button
            onClick={() => setActiveTab("nube")}
            className={`px-6 py-2.5 rounded-xl font-headline font-bold text-xs uppercase tracking-widest transition-all ${activeTab === "nube" ? 'bg-[#003829] text-white shadow-md' : 'text-[#003829]/60 hover:bg-white/50'}`}
          >
            Sincronización Nube
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {activeTab === "usuarios" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-[#EBEBEB] sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-[#E5F3EA] rounded-xl flex items-center justify-center text-[#003829]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-headline font-black text-[#003829] tracking-tight">Nuevo Miembro</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-headline font-black text-[#A0A8A3] uppercase tracking-widest ml-1">Nombre Completo</label>
                    <Input 
                      placeholder="Ej: Eloy Medina" 
                      value={nuevoUsuario.nombre}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                      className="h-14 bg-[#F9F9F8] border-transparent rounded-2xl px-6 font-bold text-[#003829] focus:ring-2 focus:ring-[#baeed9] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-headline font-black text-[#A0A8A3] uppercase tracking-widest ml-1">PIN de Acceso (4 dígitos)</label>
                    <Input 
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****" 
                      value={nuevoUsuario.pin}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, pin: e.target.value.replace(/\D/g, "").slice(0, 4)})}
                      className="h-14 bg-[#F9F9F8] border-transparent rounded-2xl px-6 font-bold text-[#003829] tracking-widest text-xl focus:ring-2 focus:ring-[#baeed9] transition-all text-center"
                    />
                  </div>
                  <Button 
                    onClick={handleAddUsuario}
                    className="w-full h-14 bg-[#003829] hover:bg-[#063b2c] text-white rounded-2xl font-headline font-bold text-sm uppercase tracking-widest transition-all shadow-md active:scale-95"
                  >
                    Registrar Usuario
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#EBEBEB] overflow-hidden">
                <div className="p-8 border-b border-[#F0F0F0] flex items-center justify-between">
                  <h2 className="text-xl font-headline font-black text-[#003829] tracking-tight uppercase text-xs tracking-[0.2em]">Equipo Autorizado</h2>
                  <div className="relative w-64 h-11">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A8A3] w-4 h-4" />
                    <input 
                      placeholder="Buscar usuario..." 
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="w-full h-full pl-11 pr-4 bg-[#F9F9F8] border-transparent rounded-xl text-sm font-bold text-[#003829] focus:outline-none focus:ring-2 focus:ring-[#baeed9] transition-all"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[600px]">
                  <div className="p-8">
                    {usuariosFiltrados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-[#F9F9F8] rounded-full flex items-center justify-center mb-4">
                          <UserRound className="w-10 h-10 text-[#D1D5D2]" />
                        </div>
                        <p className="font-headline font-bold text-[#A0A8A3] uppercase text-xs tracking-widest">No se encontraron usuarios</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {usuariosFiltrados.map((u) => (
                          <div 
                            key={u.id} 
                            className="flex items-center justify-between p-5 rounded-2xl bg-[#F9F9F8] hover:bg-[#baeed9]/10 transition-all group border border-transparent hover:border-[#baeed9]/30"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl font-headline font-black text-[#003829] shadow-sm group-hover:scale-105 transition-transform duration-500 border border-[#EBEBEB]">
                                {u.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-headline font-black text-[#003829] text-lg">{u.nombre}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-[#707974]">Alta: {new Date(u.fechaAlta).toLocaleDateString()}</span>
                                  <div className="h-1 w-1 rounded-full bg-[#D1D5D2]"></div>
                                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-[#EBEBEB]">
                                    <KeyIcon className="w-3 h-3 text-[#A0A8A3]" />
                                    <span className="text-[11px] font-mono font-bold text-[#003829]">****</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {u.id !== "admin-default" && (
                              <button 
                                onClick={() => handleRemoveUsuario(u)}
                                className="p-3 rounded-xl text-[#707974] hover:text-[#c62828] hover:bg-[#ffebee] transition-all opacity-30 group-hover:opacity-100 shadow-sm bg-white border border-[#EBEBEB]"
                                title="Eliminar Usuario"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : activeTab === "parametros" ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-[#EBEBEB]">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-[#baeed9] rounded-[1.5rem] flex items-center justify-center text-[#003829]">
                  <Settings className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black text-[#003829] tracking-tight">Parámetros de Reserva</h2>
                  <p className="text-[#707974] font-medium">Valores predeterminados para nuevas gestiones</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-[#A0A8A3]" />
                      <label className="text-[11px] font-headline font-black text-[#A0A8A3] uppercase tracking-[0.15em]">Fianza Estándar (€)</label>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={config.fianza}
                        onChange={(e) => setConfig({...config, fianza: Number(e.target.value)})}
                        className="h-16 bg-[#F9F9F8] border-transparent rounded-2xl px-8 font-black text-2xl text-[#003829] focus:ring-2 focus:ring-[#baeed9] transition-all"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-[#003829]/30 text-xl">€</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-4 h-4 text-[#A0A8A3]" />
                      <label className="text-[11px] font-headline font-black text-[#A0A8A3] uppercase tracking-[0.15em]">Porcentaje de Señal (%)</label>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={config.porcentajeSenal}
                        onChange={(e) => setConfig({...config, porcentajeSenal: Number(e.target.value)})}
                        className="h-16 bg-[#F9F9F8] border-transparent rounded-2xl px-8 font-black text-2xl text-[#003829] focus:ring-2 focus:ring-[#baeed9] transition-all"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-[#003829]/30 text-xl">%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="w-full h-16 bg-[#003829] hover:bg-[#063b2c] text-white rounded-2xl font-headline font-bold text-base uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {isSavingConfig ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined">save</span>
                    )}
                    Guardar Configuración
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-[#EBEBEB]">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-[#E5F3EA] rounded-[1.5rem] flex items-center justify-center text-[#003829]">
                  <Cloud className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black text-[#003829] tracking-tight">Sincronización Nube</h2>
                  <p className="text-[#707974] font-medium">Gestión de la base de datos centralizada</p>
                </div>
              </div>

              {!isFirebaseActivo() ? (
                <div className="p-8 bg-red-50 rounded-3xl border border-red-100 text-center">
                  <p className="text-red-900 font-bold mb-2">Firebase no está configurado</p>
                  <p className="text-red-700 text-sm">Por favor, contacta con el administrador para activar la sincronización.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-8 bg-[#F9F9F8] rounded-3xl border border-[#EBEBEB]">
                    <h3 className="font-headline font-black text-[#003829] mb-2 uppercase text-xs tracking-widest">Migración de Datos Locales</h3>
                    <p className="text-sm text-[#707974] leading-relaxed mb-6">
                      Si has creado datos en este dispositivo mientras estabas sin conexión o antes de activar la nube, usa este botón para subir todo el histórico a Firebase.
                    </p>
                    
                    <Button 
                      onClick={handleMigrate}
                      disabled={isMigrating}
                      className="w-full h-14 bg-[#003829] hover:bg-[#063b2c] text-white rounded-2xl font-headline font-bold text-sm uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-3"
                    >
                      {isMigrating ? (
                        <RefreshCcw className="w-5 h-5 animate-spin" />
                      ) : (
                        <CloudUpload className="w-5 h-5" />
                      )}
                      {isMigrating ? "Migrando datos..." : "Subir Datos Locales a la Nube"}
                    </Button>
                  </div>

                  {migrationResult && (
                    <div className={`p-6 rounded-2xl border ${migrationResult.exito ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className={`font-bold text-sm mb-2 ${migrationResult.exito ? 'text-green-900' : 'text-red-900'}`}>
                        {migrationResult.mensaje}
                      </p>
                      {migrationResult.detalles && (
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#707974]">
                          <p>Reservas: {migrationResult.detalles.reservas}</p>
                          <p>Eventos: {migrationResult.detalles.eventos}</p>
                          <p>Gastos: {migrationResult.detalles.gastos}</p>
                          <p>Precios: {migrationResult.detalles.precios}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                       <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-900 font-bold mb-1 uppercase tracking-tight">Sincronización en Tiempo Real Activa</p>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Cualquier cambio nuevo que realices se subirá automáticamente. Este panel es solo para recuperar datos antiguos o forzar una actualización masiva.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
