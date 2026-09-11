"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { DiagnosticoDialog } from "@/components/diagnostico-dialog"

// Función para registrar actividad
const registrarActividad = (accion: string) => {
  try {
    // Obtener registros existentes o inicializar array vacío
    const registrosString = localStorage.getItem("registro-actividad") || "[]"
    const registros = JSON.parse(registrosString)

    // Añadir nuevo registro
    registros.push({
      accion,
      fecha: new Date().toISOString(),
      usuario: "Administrador",
    })

    // Limitar a los últimos 100 registros para no sobrecargar localStorage
    const registrosLimitados = registros.slice(-100)

    // Guardar en localStorage
    localStorage.setItem("registro-actividad", JSON.stringify(registrosLimitados))
  } catch (error) {
    console.error("Error al registrar actividad:", error)
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [showDiagnosticoDialog, setShowDiagnosticoDialog] = useState(false)


  useEffect(() => {
    // Ya no requerimos autenticación separada para entrar aquí (Acceso directo por bypass)
    setIsAuthenticated(true)
    setIsLoading(false)
    
    // Asegurar que subpáginas como rentabilidad tengan acceso
    sessionStorage.setItem("adminAuthenticated", "true")
    
    // Registrar actividad de acceso
    registrarActividad("Acceso a panel de administración (Acceso Directo)")
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-caravalia-200 border-t-caravalia-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // No mostrar nada mientras redirige
  }
  return (
    <main className="min-h-screen bg-[#F9F9F8] selection:bg-[#baeed9] selection:text-[#002117] p-6 lg:p-12 font-body">
      <div className="max-w-4xl mx-auto">
        
        {/* Header con botón de volver y Branding */}
        <div className="flex flex-col items-center mb-16 relative">
          <Link href="/" className="absolute left-0 top-0 w-12 h-12 rounded-full border border-[#D1D5D2] flex items-center justify-center text-[#063b2c] hover:bg-white transition-all shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          <div className="w-24 h-24 relative mb-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
              alt="Caravalia Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          
          <h1 className="text-4xl font-headline font-black text-[#003829] tracking-tight text-center">Administración</h1>
          <p className="text-[#707974] font-medium mt-2 text-center">Panel de control y seguridad del sistema</p>
        </div>

        {/* Sección de Herramientas */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3 mb-2 px-2">
            <span className="material-symbols-outlined text-[#A0A8A3]">construction</span>
            <h2 className="text-[12px] font-headline font-bold text-[#A0A8A3] uppercase tracking-[0.2em]">Herramientas de Gestión</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diagnóstico y Copia */}
            <button 
              onClick={() => setShowDiagnosticoDialog(true)}
              className="group text-left"
            >
              <div className="bg-[#FFECC5] p-8 rounded-[2.5rem] h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
                <div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <span className="material-symbols-outlined text-[#E67E22] text-2xl">storage</span>
                  </div>
                  <h3 className="font-headline font-black text-2xl text-[#784112] leading-tight mb-2">Diagnóstico y Backups</h3>
                  <p className="text-[#784112]/70 text-sm font-medium">Gestiona copias de seguridad locales y diagnóstico de salud de la base de datos.</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[#784112] font-bold text-xs uppercase tracking-wider">
                  Acceder 
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </button>

            <Link href="/configuracion" className="group">
              <div className="bg-[#e7e8e7] p-8 rounded-[2.5rem] h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[#191C1C] text-2xl">group</span>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[#191C1C] text-2xl">settings</span>
                    </div>
                  </div>
                  <h3 className="font-headline font-black text-2xl text-[#191C1C] leading-tight mb-2">Gestión de Usuarios y Ajustes Generales</h3>
                  <p className="text-[#191C1C]/70 text-sm font-medium">Administra los miembros del equipo, sus PINs y la configuración general del sistema.</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[#191C1C] font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </Link>

            {/* Rentabilidad */}
            <Link href="/rentabilidad" className="group md:col-span-2">
              <div className="bg-[#baeed9] p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-sm">
                <div className="flex items-start md:items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[#003829] text-3xl">trending_up</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-black text-2xl text-[#003829] leading-tight mb-1">Rentabilidad y Balance Histórico</h3>
                    <p className="text-[#003829]/70 text-sm font-medium max-w-md">Análisis profundo de ingresos, gastos y márgenes comerciales de toda la flota Caravalia.</p>
                  </div>
                </div>
                <div className="mt-6 md:mt-0 px-6 py-3 bg-[#063b2c] text-white rounded-full font-headline font-bold text-sm flex items-center gap-2">
                  Ver Análisis
                  <span className="material-symbols-outlined text-sm">monitoring</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Atribución */}
        <div className="mt-20 pt-8 border-t border-dashed border-[#D1D5D2] flex flex-col items-center">
          <p className="text-[11px] font-headline tracking-[0.2em] font-medium uppercase text-[#A0A8A3]">
            © V3 E.Medina 2026 • Area Restringida
          </p>
        </div>
      </div>

      <DiagnosticoDialog isOpen={showDiagnosticoDialog} onClose={() => setShowDiagnosticoDialog(false)} />
    </main>
  )
}
