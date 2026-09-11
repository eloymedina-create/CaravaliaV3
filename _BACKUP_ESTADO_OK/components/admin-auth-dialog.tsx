"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, KeyRound, HelpCircle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { registrarActividad } from "@/lib/activity-utils"

interface AdminAuthDialogProps {
  isOpen: boolean
  onClose: () => void
  destination?: string
}

export function AdminAuthDialog({ isOpen, onClose, destination = "/admin" }: AdminAuthDialogProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [adminPassword, setAdminPassword] = useState<string>("8521") // Valor por defecto actualizado

  // Cargar la contraseña de administrador desde localStorage
  useEffect(() => {
    // Si ya estamos autenticados (por login inicial), pasar directo
    const isAlreadyAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true"
    if (isAlreadyAuthenticated && isOpen) {
      onClose()
      router.push(destination)
      return
    }

    const storedPassword = localStorage.getItem("admin-password")
    if (storedPassword) {
      setAdminPassword(storedPassword)
    }
  }, [isOpen, onClose, router, destination])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === adminPassword) {
      // Guardar en sessionStorage que el usuario está autenticado
      sessionStorage.setItem("adminAuthenticated", "true")

      // Registrar la actividad
      registrarActividad("Acceso a panel de administración")

      onClose()
      router.push(destination)
    } else {
      setError("Contraseña incorrecta. Inténtalo de nuevo.")

      // Registrar intento fallido
      registrarActividad("Intento fallido de acceso a administración")

      setPassword("")
    }
  }

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (securityAnswer.toLowerCase() === "leoncio") {
      // Mostrar la contraseña correcta
      setSecurityError(null)
      setShowRecovery(false)
      setError(`La contraseña correcta es: ${adminPassword}`)

      // Registrar recuperación de contraseña
      registrarActividad("Recuperación de contraseña de administrador")
    } else {
      setSecurityError("Respuesta incorrecta. Inténtalo de nuevo.")

      // Registrar intento fallido de recuperación
      registrarActividad("Intento fallido de recuperación de contraseña")

      setSecurityAnswer("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-caravalia-600" />
            {showRecovery ? "Recuperar contraseña" : "Acceso a administración"}
          </DialogTitle>
          <DialogDescription>
            {showRecovery
              ? "Responde a la pregunta de seguridad para recuperar la contraseña."
              : "Introduce la contraseña de administrador para continuar."}
          </DialogDescription>
        </DialogHeader>

        {!showRecovery ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Introduce la contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  autoComplete="off"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter className="flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRecovery(true)}
                className="flex items-center gap-1"
              >
                <HelpCircle className="h-4 w-4" />
                ¿Olvidaste la contraseña?
              </Button>
              <Button type="submit">
                Acceder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleRecoverySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="security-question">¿Mascota gris favorita?</Label>
                <Input
                  id="security-question"
                  type="text"
                  placeholder="Introduce tu respuesta"
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value)
                    setSecurityError(null)
                  }}
                  autoComplete="off"
                />
              </div>

              {securityError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{securityError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter className="flex justify-between items-center">
              <Button type="button" variant="ghost" onClick={() => setShowRecovery(false)}>
                Volver
              </Button>
              <Button type="submit">Verificar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
