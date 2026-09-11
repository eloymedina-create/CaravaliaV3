"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckCircle, Cloud, CloudOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { agregarGasto, actualizarGasto } from "@/lib/rentabilidad-store"
import { SuperSimpleDatePicker } from "@/components/super-simple-date-picker"
import type { Gasto } from "@/lib/types"

// Lista de conceptos predefinidos
const CONCEPTOS_PREDEFINIDOS = [
  "Mantenimiento",
  "Reparación",
  "Seguro",
  "Impuestos",
  "Combustible",
  "Limpieza",
  "Repuestos",
  "Revisión",
  "ITV",
  "Otros",
]

// Modelos de autocaravanas hardcodeados para garantizar que siempre haya opciones
const MODELOS_AUTOCARAVANAS_DEFAULT = [
  { id: "1", modelo: "294TL" },
  { id: "2", modelo: "294TL-Automatica" },
]

// Esquema de validación
const gastoSchema = z.object({
  fecha: z.date({
    required_error: "La fecha es obligatoria",
  }),
  modeloId: z.string({
    required_error: "El modelo es obligatorio",
  }),
  concepto: z.string().min(3, {
    message: "El concepto debe tener al menos 3 caracteres",
  }),
  importe: z.coerce.number().positive({
    message: "El importe debe ser un número positivo",
  }),
  notas: z.string().optional(),
})

type GastoFormValues = z.infer<typeof gastoSchema>

interface GastosFormProps {
  autocaravanas?: { id: string; modelo: string }[]
  gastoEditar?: Gasto | null
  onSuccess?: () => void
}

export function GastosForm({ autocaravanas = [], gastoEditar, onSuccess }: GastosFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sincronizado, setSincronizado] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autocaravanasLocales, setAutocaravanasLocales] = useState<{ id: string; modelo: string }[]>(
    autocaravanas.length > 0 ? autocaravanas : MODELOS_AUTOCARAVANAS_DEFAULT,
  )
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date())

  // Inicializar el formulario con valores por defecto
  const form = useForm<GastoFormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      fecha: new Date(),
      modeloId: "",
      concepto: CONCEPTOS_PREDEFINIDOS[0],
      importe: 0,
      notas: "",
    },
  })

  // Cargar autocaravanas si no se proporcionan como prop
  useEffect(() => {
    if (autocaravanas.length > 0) {
      setAutocaravanasLocales(autocaravanas)
    } else {
      try {
        const autocaravanasString = localStorage.getItem("autocaravanas")
        if (autocaravanasString) {
          const autocaravanasData = JSON.parse(autocaravanasString)
          const autocaravanasActivas = autocaravanasData
            .filter((auto: any) => auto.activa === true || auto.activa === "true")
            .map((auto: any) => ({
              id: auto.id || auto._id || auto.modelo,
              modelo: auto.modelo,
            }))

          if (autocaravanasActivas.length > 0) {
            setAutocaravanasLocales(autocaravanasActivas)
          }
        }
      } catch (error) {
        console.error("Error al cargar autocaravanas en GastosForm:", error)
      }
    }
  }, [autocaravanas])

  // Cargar datos del gasto si estamos en modo edición
  useEffect(() => {
    if (gastoEditar) {
      const fecha = new Date(gastoEditar.fecha)
      setFechaSeleccionada(fecha)
      form.reset({
        fecha: fecha,
        modeloId: gastoEditar.modeloId,
        concepto: gastoEditar.concepto,
        importe: gastoEditar.importe,
        notas: gastoEditar.notas || "",
      })
    } else {
      // Si no hay nada que editar, resetear a valores por defecto
      form.reset({
        fecha: new Date(),
        modeloId: autocaravanasLocales.length > 0 ? autocaravanasLocales[0].modelo : "",
        concepto: CONCEPTOS_PREDEFINIDOS[0],
        importe: 0,
        notas: "",
      })
      setFechaSeleccionada(new Date())
    }
  }, [gastoEditar, form, autocaravanasLocales])

  // Función para manejar el envío del formulario
  async function onSubmit(values: GastoFormValues) {
    setIsSubmitting(true)
    setSuccess(false)
    setSincronizado(null)
    setError(null)

    try {
      let resultadoGasto

      if (gastoEditar) {
        // ACTUALIZAR GASTO EXISTENTE
        resultadoGasto = await actualizarGasto(gastoEditar.id, {
          fecha: values.fecha.toISOString(),
          modeloId: values.modeloId,
          modelo: autocaravanasLocales.find((a) => a.id === values.modeloId || a.modelo === values.modeloId)?.modelo,
          concepto: values.concepto,
          importe: values.importe,
          notas: values.notas,
        })
      } else {
        // AÑADIR NUEVO GASTO
        resultadoGasto = await agregarGasto({
          fecha: values.fecha.toISOString(),
          modeloId: values.modeloId,
          modelo: autocaravanasLocales.find((a) => a.id === values.modeloId || a.modelo === values.modeloId)?.modelo,
          concepto: values.concepto,
          importe: values.importe,
          notas: values.notas,
        })
      }

      if (!resultadoGasto) {
        throw new Error("No se pudo guardar el gasto")
      }

      // Mostrar mensaje de éxito
      setSuccess(true)
      setSincronizado(resultadoGasto.sincronizado)

      // Si no es edición, resetear el formulario
      if (!gastoEditar) {
        form.reset({
          fecha: new Date(),
          modeloId: autocaravanasLocales.length > 0 ? autocaravanasLocales[0].modelo : "",
          concepto: CONCEPTOS_PREDEFINIDOS[0],
          importe: 0,
          notas: "",
        })
        setFechaSeleccionada(new Date())
      }

      // Llamar al callback de éxito si existe
      if (onSuccess) {
        // Añadir un pequeño retraso para que se vea el mensaje de éxito
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (error) {
      console.error("Error al guardar el gasto:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al guardar el gasto")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para actualizar la fecha en el formulario
  const actualizarFecha = (fecha: Date | null) => {
    if (fecha) {
      setFechaSeleccionada(fecha)
      form.setValue("fecha", fecha)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{gastoEditar ? "Editar Gasto" : "Registrar Nuevo Gasto"}</CardTitle>
        <CardDescription>
          {gastoEditar ? "Modifica los detalles de este gasto" : "Añade un nuevo gasto asociado a una autocaravana"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">Error al guardar el gasto</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
              <div className="mt-2">
                <p className="text-sm">
                  El gasto se ha guardado localmente, pero no se ha podido sincronizar con la Nube.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Gasto registrado correctamente</AlertTitle>
            <AlertDescription className="text-green-700 flex items-center gap-2">
              El gasto ha sido guardado y se reflejará en el análisis de rentabilidad.
              {sincronizado !== null && (
                <span className="flex items-center gap-1 ml-2">
                  {sincronizado ? (
                    <>
                      <Cloud className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-sm">Sincronizado con Nube (Firebase)</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-600 text-sm">Guardado localmente</span>
                    </>
                  )}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha */}
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <SuperSimpleDatePicker
                        value={fechaSeleccionada}
                        onChange={(date) => {
                          actualizarFecha(date || new Date())
                        }}
                        placeholder="dd/mm/aaaa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modelo */}
              <FormField
                control={form.control}
                name="modeloId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <select
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="" disabled>
                          Selecciona un modelo
                        </option>
                        {autocaravanasLocales.map((autocaravana) => (
                          <option key={autocaravana.id} value={autocaravana.modelo}>
                            {autocaravana.modelo}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Concepto */}
            <FormField
              control={form.control}
              name="concepto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto</FormLabel>
                  <FormControl>
                    <select
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="" disabled>
                        Selecciona un concepto
                      </option>
                      {CONCEPTOS_PREDEFINIDOS.map((concepto) => (
                        <option key={concepto} value={concepto}>
                          {concepto}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>Selecciona un concepto predefinido</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Importe */}
            <FormField
              control={form.control}
              name="importe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importe (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade detalles adicionales sobre este gasto"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : gastoEditar ? "Actualizar Gasto" : "Guardar Gasto"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
