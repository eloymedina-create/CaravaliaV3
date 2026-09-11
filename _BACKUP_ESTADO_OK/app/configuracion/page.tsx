"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  UserPlus, 
  Trash2, 
  Key as KeyIcon, 
  UserRound, 
  ShieldCheck,
  Search,
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import { registrarActividad } from "@/lib/activity-utils"
import { 
  obtenerUsuarios, 
  guardarUsuario, 
  eliminarUsuario, 
  type Usuario 
} from "@/lib/usuarios-store"

export default function GestionUsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", pin: "" })
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [filtro, setFiltro] = useState("")

  // Cargar usuarios al iniciar
  const cargarUsuarios = useCallback(async () => {
    setCargandoUsuarios(true)
    try {
      const lista = await obtenerUsuarios()
      setUsuarios(lista)
    } finally {
      setCargandoUsuarios(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  const handleVolver = () => {
    router.push("/admin")
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

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#F9F9F8] selection:bg-[#baeed9] selection:text-[#002117] font-body">
      
      {/* Header Premium (Estilo Caravalia V3) */}
      <div className="bg-[#003829] text-white p-8 lg:p-12 relative overflow-hidden">
        {/* Decoración de fondo */}
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
                  <span className="material-symbols-outlined text-3xl">group</span>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-headline font-black tracking-tight">Gestión de Usuarios</h1>
                  <p className="text-white/60 font-medium text-sm mt-1 uppercase tracking-widest">Control de accesos y PINs de seguridad</p>
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

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto p-6 md:p-12 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario de Alta */}
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
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </div>

              <div className="mt-8 p-4 bg-[#F9F9F8] rounded-2xl border border-dashed border-[#D1D5D2]">
                <p className="text-[10px] text-[#A0A8A3] font-medium leading-relaxed italic">
                  * El usuario podrá acceder al sistema de inmediato tras el alta utilizando su PIN personal.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Listado de Usuarios */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#EBEBEB] overflow-hidden">
              <div className="p-8 border-b border-[#F5F5F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-headline font-black text-[#003829] tracking-tight">Equipo Caravalia</h3>
                  <p className="text-[#707974] text-sm font-medium">Gestionar usuarios activos y sus credenciales</p>
                </div>
                
                <div className="relative w-full md:w-64 h-12">
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
      </div>
    </main>
  )
}
