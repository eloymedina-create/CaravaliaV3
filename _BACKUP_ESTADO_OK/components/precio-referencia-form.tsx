"use client"

import { useState, useEffect } from "react"
import type { PrecioReferencia } from "@/lib/precios-types"
import { obtenerPreciosReferenciaLocal, guardarPrecioReferenciaLocal } from "@/lib/precios-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle } from "lucide-react"

interface PrecioReferenciaFormProps {
  modeloId: string
  modelo: string
  onSave?: (precio: PrecioReferencia) => void
}

export function PrecioReferenciaForm({ modeloId, modelo, onSave }: PrecioReferenciaFormProps) {
  const [precioAlta, setPrecioAlta] = useState<number>(0)
  const [precioMedia, setPrecioMedia] = useState<number>(0)
  const [precioBaja, setPrecioBaja] = useState<number>(0)

  const [fechaInicioAlta, setFechaInicioAlta] = useState<string>("01/07")
  const [fechaFinAlta, setFechaFinAlta] = useState<string>("31/08")

  const [fechaInicioMedia, setFechaInicioMedia] = useState<string>("01/05")
  const [fechaFinMedia, setFechaFinMedia] = useState<string>("30/06")

  const [fechaInicioBaja, setFechaInicioBaja] = useState<string>("01/09")
  const [fechaFinBaja, setFechaFinBaja] = useState<string>("30/04")

  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)

  // Cargar datos existentes
  useEffect(() => {
    const precios = obtenerPreciosReferenciaLocal()
    const precioExistente = precios.find((p) => p.modeloId === modeloId)

    if (precioExistente) {
      setPrecioAlta(precioExistente.temporadaAlta.precio)
      setPrecioMedia(precioExistente.temporadaMedia.precio)
      setPrecioBaja(precioExistente.temporadaBaja.precio)

      setFechaInicioAlta(precioExistente.temporadaAlta.fechaInicio)
      setFechaFinAlta(precioExistente.temporadaAlta.fechaFin)

      setFechaInicioMedia(precioExistente.temporadaMedia.fechaInicio)
      setFechaFinMedia(precioExistente.temporadaMedia.fechaFin)

      setFechaInicioBaja(precioExistente.temporadaBaja.fechaInicio)
      setFechaFinBaja(precioExistente.temporadaBaja.fechaFin)
    }
  }, [modeloId])

  // Validar formato de fecha (DD/MM)
  const validarFormatoFecha = (fecha: string): boolean => {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/
    return regex.test(fecha)
  }

  // Guardar cambios
  const handleGuardar = () => {
    // Validar fechas
    if (
      !validarFormatoFecha(fechaInicioAlta) ||
      !validarFormatoFecha(fechaFinAlta) ||
      !validarFormatoFecha(fechaInicioMedia) ||
      !validarFormatoFecha(fechaFinMedia) ||
      !validarFormatoFecha(fechaInicioBaja) ||
      !validarFormatoFecha(fechaFinBaja)
    ) {
      setMensaje({
        tipo: "error",
        texto: "Las fechas deben tener formato DD/MM",
      })
      return
    }

    // Validar precios
    if (precioAlta < 0 || precioMedia < 0 || precioBaja < 0) {
      setMensaje({
        tipo: "error",
        texto: "Los precios no pueden ser negativos",
      })
      return
    }

    const nuevoPrecio: PrecioReferencia = {
      modeloId,
      modelo,
      temporadaAlta: {
        precio: precioAlta,
        fechaInicio: fechaInicioAlta,
        fechaFin: fechaFinAlta,
      },
      temporadaMedia: {
        precio: precioMedia,
        fechaInicio: fechaInicioMedia,
        fechaFin: fechaFinMedia,
      },
      temporadaBaja: {
        precio: precioBaja,
        fechaInicio: fechaInicioBaja,
        fechaFin: fechaFinBaja,
      },
      añoActual: new Date().getFullYear(),
      updatedAt: new Date().toISOString(),
    }

    // Guardar en localStorage y sincronizar
    guardarPrecioReferenciaLocal(nuevoPrecio)

    // Mostrar mensaje de éxito
    setMensaje({
      tipo: "success",
      texto: "Precios guardados correctamente",
    })

    // Notificar al componente padre
    if (onSave) {
      onSave(nuevoPrecio)
    }

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      setMensaje(null)
    }, 3000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Precios de referencia: {modelo}</CardTitle>
        <CardDescription>Establece los precios de referencia por temporada para este modelo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mensaje && (
          <Alert className={mensaje.tipo === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            {mensaje.tipo === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={mensaje.tipo === "success" ? "text-green-700" : "text-red-700"}>
              {mensaje.texto}
            </AlertDescription>
          </Alert>
        )}

        {/* Temporada Alta */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Temporada Alta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="precioAlta">Precio por día (€)</Label>
              <Input
                id="precioAlta"
                type="number"
                min="0"
                step="0.01"
                value={precioAlta}
                onChange={(e) => setPrecioAlta(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaInicioAlta">Fecha inicio (DD/MM)</Label>
              <Input
                id="fechaInicioAlta"
                value={fechaInicioAlta}
                onChange={(e) => setFechaInicioAlta(e.target.value)}
                placeholder="01/07"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaFinAlta">Fecha fin (DD/MM)</Label>
              <Input
                id="fechaFinAlta"
                value={fechaFinAlta}
                onChange={(e) => setFechaFinAlta(e.target.value)}
                placeholder="31/08"
              />
            </div>
          </div>
        </div>

        {/* Temporada Media */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Temporada Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="precioMedia">Precio por día (€)</Label>
              <Input
                id="precioMedia"
                type="number"
                min="0"
                step="0.01"
                value={precioMedia}
                onChange={(e) => setPrecioMedia(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaInicioMedia">Fecha inicio (DD/MM)</Label>
              <Input
                id="fechaInicioMedia"
                value={fechaInicioMedia}
                onChange={(e) => setFechaInicioMedia(e.target.value)}
                placeholder="01/05"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaFinMedia">Fecha fin (DD/MM)</Label>
              <Input
                id="fechaFinMedia"
                value={fechaFinMedia}
                onChange={(e) => setFechaFinMedia(e.target.value)}
                placeholder="30/06"
              />
            </div>
          </div>
        </div>

        {/* Temporada Baja */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Temporada Baja</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="precioBaja">Precio por día (€)</Label>
              <Input
                id="precioBaja"
                type="number"
                min="0"
                step="0.01"
                value={precioBaja}
                onChange={(e) => setPrecioBaja(Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaInicioBaja">Fecha inicio (DD/MM)</Label>
              <Input
                id="fechaInicioBaja"
                value={fechaInicioBaja}
                onChange={(e) => setFechaInicioBaja(e.target.value)}
                placeholder="01/09"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaFinBaja">Fecha fin (DD/MM)</Label>
              <Input
                id="fechaFinBaja"
                value={fechaFinBaja}
                onChange={(e) => setFechaFinBaja(e.target.value)}
                placeholder="30/04"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGuardar} className="bg-caravalia-600 hover:bg-caravalia-700">
          Guardar precios
        </Button>
      </CardFooter>
    </Card>
  )
}
