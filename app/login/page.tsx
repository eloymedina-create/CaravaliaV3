"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { obtenerUsuarios, verificarPin, establecerUsuarioActivo, type Usuario } from "@/lib/usuarios-store"
import { registrarActividad } from "@/lib/activity-utils"

export default function LoginPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [step, setStep] = useState<"user" | "pin">("user")
  const [pin, setPin] = useState(["", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Cargar usuarios al inicio
  useEffect(() => {
    const cargar = async () => {
      const lista = await obtenerUsuarios()
      setUsuarios(lista)
      
      const isAuthenticated = localStorage.getItem("auth-token")
      if (isAuthenticated) {
        router.push("/")
      }
    }
    cargar()
  }, [router])

  const handleSelectUser = (user: Usuario) => {
    setSelectedUser(user)
    setStep("pin")
    setError("")
    setTimeout(() => {
      const firstInput = document.getElementById("pin-0")
      if (firstInput) firstInput.focus()
    }, 100)
  }

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    if (value && !/^\d+$/.test(value)) {
      return
    }

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    }

    if (error) setError("")
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const newPin = [...pin]
      newPin[index - 1] = ""
      setPin(newPin)
      const prevInput = document.getElementById(`pin-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleSubmitPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    
    setIsLoading(true)

    if (pin.some((digit) => !digit)) {
      setError("Introduce los 4 dígitos")
      setIsLoading(false)
      return
    }

    const enteredPin = pin.join("")
    const usuarioValido = await verificarPin(selectedUser.nombre, enteredPin)

    if (usuarioValido) {
      localStorage.setItem("auth-token", Date.now().toString())
      sessionStorage.setItem("adminAuthenticated", "true")
      establecerUsuarioActivo(selectedUser.nombre)
      
      registrarActividad(`Inicio de sesión: ${selectedUser.nombre}`)
      
      router.push("/")
    } else {
      setError("PIN incorrecto")
      setPin(["", "", "", ""])
      setTimeout(() => {
        const firstInput = document.getElementById("pin-0")
        if (firstInput) firstInput.focus()
      }, 100)
    }

    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-transparent pointer-events-none transform rounded-[100px] scale-150 -z-10 blur-3xl opacity-60"></div>

      <div className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-[0_20px_40px_rgba(25,28,28,0.04)] overflow-hidden border border-outline-variant/20 p-8 relative z-10">
        <div className="text-center pb-6 border-b border-outline-variant/20 mb-8">
          <div className="w-24 h-24 mx-auto relative mb-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
              alt="Caravalia Logo"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-primary font-headline tracking-tighter">Caravalia</h1>
          <p className="text-surface-tint font-bold tracking-widest text-xs uppercase opacity-90 mt-2 font-label">
            {step === "user" ? "SELECCIONA TU IDENTIDAD" : "INTRODUCE TU PIN"}
          </p>
        </div>
        
        <div>
          {step === "user" ? (
            <div className="grid gap-4">
              {usuarios.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="w-full flex items-center justify-between bg-surface-container-high text-on-surface px-6 py-5 rounded-[1.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-headline font-bold text-lg leading-tight text-surface-tint">{u.nombre}</span>
                      <span className="text-xs text-primary uppercase tracking-tighter italic font-label opacity-80 font-bold">Acceso Identificado</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmitPin} className="space-y-8">
              <div className="text-center">
                <div 
                  className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-surface-container-high rounded-full cursor-pointer hover:bg-surface-container-highest transition-colors active:scale-95 border border-outline-variant/30"
                  onClick={() => setStep("user")}
                >
                  <span className="material-symbols-outlined text-[1rem] text-secondary">person</span>
                  <span className="text-sm font-bold text-on-surface font-body">{selectedUser?.nombre}</span>
                  <span className="text-xs text-primary font-bold ml-1 uppercase tracking-wider">Cambiar</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    id={`pin-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-14 h-16 text-center text-3xl font-bold bg-surface-container rounded-xl focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all border-none font-headline"
                    autoComplete="off"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-[1rem] flex items-center gap-3 animate-shake">
                  <span className="material-symbols-outlined">error</span>
                  <p className="text-sm font-bold font-body">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary flex items-center justify-center gap-2 h-14 rounded-[2rem] text-lg font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-3 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">key</span>
                      Acceder al Sistema
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setStep("user")}
                  className="text-secondary font-body font-medium hover:text-on-surface transition-colors py-2 uppercase text-sm tracking-wider"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-dashed border-outline-variant/30 mt-8 pt-4">
            <p className="text-[10px] text-outline text-center uppercase tracking-[0.2em] font-bold font-label">
              Caravalia M3 • V3.0
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

