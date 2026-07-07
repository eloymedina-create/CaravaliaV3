"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface KilometrosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (kilometros: string, horaRealEntrega: string) => void
  onCancel: () => void
  procesando: boolean
}

export function KilometrosDialog({ open, onOpenChange, onConfirm, onCancel, procesando }: KilometrosDialogProps) {
  const [kilometros, setKilometros] = useState("")
  const [horaRealEntrega, setHoraRealEntrega] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = () => {
    // Validar que se haya ingresado un número válido de kilómetros
    if (!kilometros.trim()) {
      setError("Por favor, ingrese el número de kilómetros")
      return
    }

    const km = Number(kilometros)
    if (isNaN(km) || km < 0) {
      setError("Por favor, ingrese un número válido de kilómetros")
      return
    }

    // Validar que se haya ingresado una hora válida
    if (!horaRealEntrega.trim()) {
      setError("Por favor, ingrese la hora real de entrega")
      return
    }

    // Validación básica de formato de hora (HH:MM)
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!horaRegex.test(horaRealEntrega)) {
      setError("Por favor, ingrese una hora válida en formato HH:MM")
      return
    }

    setError("")
    onConfirm(kilometros, horaRealEntrega)
  }

  const handleCancel = () => {
    setKilometros("")
    setHoraRealEntrega("")
    setError("")
    onCancel()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) handleCancel()
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-caravalia-800">Datos para el contrato</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="kilometros" className="text-caravalia-700 mb-2 block">
              Ingrese el número de kilómetros actuales de la autocaravana:
            </Label>
            <Input
              id="kilometros"
              type="number"
              value={kilometros}
              onChange={(e) => {
                setKilometros(e.target.value)
                setError("")
              }}
              placeholder="Ej: 12500"
              className="border-caravalia-200 focus:border-caravalia-400"
              disabled={procesando}
            />
          </div>
          <div>
            <Label htmlFor="horaEntrega" className="text-caravalia-700 mb-2 block">
              Ingrese la hora real de entrega del vehículo:
            </Label>
            <Input
              id="horaEntrega"
              type="text"
              value={horaRealEntrega}
              onChange={(e) => {
                setHoraRealEntrega(e.target.value)
                setError("")
              }}
              placeholder="Ej: 10:30"
              className="border-caravalia-200 focus:border-caravalia-400"
              disabled={procesando}
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel} className="btn-outline-modern" disabled={procesando}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="btn-primary-modern" disabled={procesando}>
            {procesando ? "Generando..." : "Generar contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
