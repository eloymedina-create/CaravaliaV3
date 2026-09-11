"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { obtenerAutocaravanas } from "@/lib/autocaravanas-store"
import {
  obtenerPrecioSugerido,
  guardarRegistroPrecioLocal,
  generarIdPrecio,
  determinarTemporada,
  obtenerPreciosReferenciaLocal,
} from "@/lib/precios-store"
import type { RegistroPrecio, Temporada } from "@/lib/precios-types"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RegistroPrecioFormProps {
  onSave?: (registro: RegistroPrecio) => void
}

export function RegistroPrecioForm({ onSave }: RegistroPrecioFormProps) {
  // Estado del formulario
  const [fecha, setFecha] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [modeloId, setModeloId] = useState<string>("")
  const [modelo, setModelo] = useState<string>("")
  const [precioPorDia, setPrecioPorDia] = useState<number>(0)
  const [numeroDias, setNumeroDias] = useState<number>(7)
  const [precioTotal, setPrecioTotal] = useState<number>(0)
  const [cliente, setCliente] = useState<string>("")
  const [notas, setNotas] = useState<string>("")
  const [aceptado, setAceptado] = useState<boolean>(false)
  const [temporada, setTemporada] = useState<Temporada>("media")

  // Estado de la UI
  const [autocaravanas, setAutocaravanas] = useState<Array<{ id: string; modelo: string }>>([])
  const [guardado, setGuardado] = useState<boolean>(false)
  const [precioSugerido, setPrecioSugerido] = useState<number | null>(null)

  // Cargar autocaravanas
  useEffect(() => {
    const autos = obtenerAutocaravanas()
    setAutocaravanas(autos.map((a) => ({ id: a.id, modelo: a.modelo })))

    if (autos.length > 0) {
      setModeloId(autos[0].id)
      setModelo(autos[0].modelo)
    }
  }, [])

  // Actualizar precio sugerido cuando cambia el modelo o la fecha
  useEffect(() => {
    if (modeloId && fecha) {
      try {
        const fechaObj = new Date(fecha)
        const precioRef = obtenerPrecioSugerido(modeloId, fechaObj)
        setPrecioSugerido(precioRef)

        // Actualizar temporada
        const preciosReferencia = obtenerPreciosReferenciaLocal()
        const tempActual = determinarTemporada(fechaObj, preciosReferencia)
        setTemporada(tempActual)
      } catch (error) {
        console.error("Error al obtener precio sugerido:", error)
      }
    }
  }, [modeloId, fecha])

  // Actualizar precio total cuando cambia el precio por día o el número de días
  useEffect(() => {
    setPrecioTotal(precioPorDia * numeroDias)
  }, [precioPorDia, numeroDias])

  // Manejar cambio de modelo
  const handleModeloChange = (value: string) => {
    const autoSeleccionada = autocaravanas.find((a) => a.id === value)
    if (autoSeleccionada) {
      setModeloId(value)
      setModelo(autoSeleccionada.modelo)
    }
  }

  // Manejar uso de precio sugerido
  const handleUsarPrecioSugerido = () => {
    if (precioSugerido !== null) {
      setPrecioPorDia(precioSugerido)
    }
  }

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Asegurarse de que la fecha sea una cadena ISO
      const fechaObj = new Date(fecha)
      const fechaISO = fechaObj.toISOString()

      console.log("Guardando registro con fecha:", {
        fechaOriginal: fecha,
        fechaObjeto: fechaObj.toString(),
        fechaISO: fechaISO,
      })

      // Crear registro
      const nuevoRegistro: RegistroPrecio = {
        id: generarIdPrecio(),
        fecha: fechaISO, // Guardar como ISO para consistencia
        modeloId,
        modelo,
        precioPorDia,
        numeroDias,
        precioTotal,
        cliente: cliente || undefined,
        notas: notas || undefined,
        aceptado,
        temporada,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Guardar registro
      guardarRegistroPrecioLocal(nuevoRegistro)

      // Notificar al componente padre si existe
      if (onSave) {
        onSave(nuevoRegistro)
      }

      // Mostrar confirmación
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)

      // Resetear formulario
      setCliente("")
      setNotas("")
      setAceptado(false)
    } catch (error) {
      console.error("Error al guardar registro de precio:", error)
      alert("Error al guardar el registro. Por favor, verifica los datos e intenta nuevamente.")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nuevo registro de precio</CardTitle>
        <CardDescription>Registra un nuevo precio ofrecido o acordado</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <div className="relative">
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="pl-10"
                />
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={modeloId} onValueChange={handleModeloChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un modelo" />
                </SelectTrigger>
                <SelectContent>
                  {autocaravanas.map((auto) => (
                    <SelectItem key={auto.id} value={auto.id}>
                      {auto.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Precio por día */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="precioPorDia">Precio por día</Label>
                {precioSugerido !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUsarPrecioSugerido}
                    className="h-6 text-xs"
                  >
                    Usar sugerido ({precioSugerido.toFixed(2)} €)
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="precioPorDia"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioPorDia}
                  onChange={(e) => setPrecioPorDia(Number.parseFloat(e.target.value) || 0)}
                  required
                  className="pl-6"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">€</span>
              </div>
            </div>

            {/* Número de días */}
            <div className="space-y-2">
              <Label htmlFor="numeroDias">Número de días</Label>
              <Input
                id="numeroDias"
                type="number"
                min="1"
                value={numeroDias}
                onChange={(e) => setNumeroDias(Number.parseInt(e.target.value) || 1)}
                required
              />
            </div>

            {/* Precio total */}
            <div className="space-y-2">
              <Label htmlFor="precioTotal">Precio total</Label>
              <div className="relative">
                <Input
                  id="precioTotal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioTotal}
                  onChange={(e) => setPrecioTotal(Number.parseFloat(e.target.value) || 0)}
                  required
                  className="pl-6"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">€</span>
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente (opcional)</Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            {/* Temporada */}
            <div className="space-y-2">
              <Label htmlFor="temporada">Temporada</Label>
              <Select value={temporada} onValueChange={(v) => setTemporada(v as Temporada)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la temporada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aceptado */}
            <div className="flex items-center space-x-2">
              <Switch id="aceptado" checked={aceptado} onCheckedChange={setAceptado} />
              <Label htmlFor="aceptado">Precio aceptado por el cliente</Label>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones o detalles adicionales"
              className="min-h-[100px]"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full bg-caravalia-600 hover:bg-caravalia-700">
          Guardar registro
        </Button>
      </CardFooter>

      {/* Mensaje de confirmación */}
      {guardado && (
        <Alert className="mx-6 mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">Registro guardado correctamente</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
