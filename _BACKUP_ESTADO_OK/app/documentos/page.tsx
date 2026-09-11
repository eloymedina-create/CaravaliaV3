"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  obtenerPlantillas,
  guardarPlantilla,
  restaurarPlantillaDefault,
  restaurarTodasPlantillas,
  type PlantillaDocumento,
} from "@/lib/plantillas-store"
import { MarkdownEditor } from "@/components/markdown-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, RefreshCw, Plus, AlertCircle, Home, FileEdit, FilePlus2, History } from "lucide-react"

export default function DocumentosPage() {
  const router = useRouter()
  const [plantillas, setPlantillas] = useState<PlantillaDocumento[]>([])
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaDocumento | null>(null)
  const [nombreNuevaPlantilla, setNombreNuevaPlantilla] = useState("")
  const [tipoNuevaPlantilla, setTipoNuevaPlantilla] = useState<"contrato" | "condiciones" | "otros">("otros")
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  // Cargar plantillas al iniciar
  useEffect(() => {
    try {
      const plantillasGuardadas = obtenerPlantillas()
      setPlantillas(plantillasGuardadas)

      // Seleccionar la primera plantilla por defecto
      if (plantillasGuardadas.length > 0) {
        setPlantillaSeleccionada(plantillasGuardadas[0])
      }

      setCargando(false)
    } catch (err) {
      console.error("Error al cargar plantillas:", err)
      setError("Error al cargar las plantillas. Por favor, recarga la página.")
      setCargando(false)
    }
  }, [])

  // Función para guardar cambios en una plantilla
  const handleGuardarPlantilla = (contenido: string) => {
    if (!plantillaSeleccionada) return

    try {
      const plantillaActualizada: PlantillaDocumento = {
        ...plantillaSeleccionada,
        contenido,
        ultimaModificacion: new Date().toISOString(),
      }

      const guardadoExitoso = guardarPlantilla(plantillaActualizada)

      if (guardadoExitoso) {
        // Actualizar la plantilla seleccionada
        setPlantillaSeleccionada(plantillaActualizada)

        // Actualizar la lista de plantillas
        const nuevasPlantillas = plantillas.map((p) => (p.id === plantillaActualizada.id ? plantillaActualizada : p))
        setPlantillas(nuevasPlantillas)

        // Mostrar mensaje de éxito
        setMensaje("Plantilla guardada correctamente")
        setTimeout(() => setMensaje(null), 3000)
      } else {
        setError("Error al guardar la plantilla")
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      console.error("Error al guardar plantilla:", err)
      setError("Error al guardar la plantilla")
      setTimeout(() => setError(null), 3000)
    }
  }

  // Función para crear una nueva plantilla
  const handleCrearPlantilla = () => {
    if (!nombreNuevaPlantilla.trim()) {
      setError("Debes especificar un nombre para la plantilla")
      return
    }

    try {
      const nuevaPlantilla: PlantillaDocumento = {
        id: `plantilla-${Date.now()}`,
        nombre: nombreNuevaPlantilla,
        tipo: tipoNuevaPlantilla,
        contenido: "# Nueva Plantilla\n\nEscribe aquí el contenido de tu plantilla...",
        ultimaModificacion: new Date().toISOString(),
      }

      const guardadoExitoso = guardarPlantilla(nuevaPlantilla)

      if (guardadoExitoso) {
        // Actualizar la lista de plantillas
        setPlantillas([...plantillas, nuevaPlantilla])

        // Seleccionar la nueva plantilla
        setPlantillaSeleccionada(nuevaPlantilla)

        // Limpiar el formulario
        setNombreNuevaPlantilla("")
        setMostrarFormNueva(false)

        // Mostrar mensaje de éxito
        setMensaje("Plantilla creada correctamente")
        setTimeout(() => setMensaje(null), 3000)
      } else {
        setError("Error al crear la plantilla")
      }
    } catch (err) {
      console.error("Error al crear plantilla:", err)
      setError("Error al crear la plantilla")
    }
  }

  // Función para restaurar una plantilla a su valor predeterminado
  const handleRestaurarPlantilla = () => {
    if (!plantillaSeleccionada) return

    try {
      const restauradoExitoso = restaurarPlantillaDefault(plantillaSeleccionada.id)

      if (restauradoExitoso) {
        // Recargar las plantillas
        const plantillasActualizadas = obtenerPlantillas()
        setPlantillas(plantillasActualizadas)

        // Actualizar la plantilla seleccionada
        const plantillaRestaurada = plantillasActualizadas.find((p) => p.id === plantillaSeleccionada.id)
        if (plantillaRestaurada) {
          setPlantillaSeleccionada(plantillaRestaurada)
        }

        // Mostrar mensaje de éxito
        setMensaje("Plantilla restaurada a su valor predeterminado")
        setTimeout(() => setMensaje(null), 3000)
      } else {
        setError("Error al restaurar la plantilla")
      }
    } catch (err) {
      console.error("Error al restaurar plantilla:", err)
      setError("Error al restaurar la plantilla")
    }
  }

  // Función para restaurar todas las plantillas
  const handleRestaurarTodas = () => {
    try {
      const restauradoExitoso = restaurarTodasPlantillas()

      if (restauradoExitoso) {
        // Recargar las plantillas
        const plantillasActualizadas = obtenerPlantillas()
        setPlantillas(plantillasActualizadas)

        // Actualizar la plantilla seleccionada si existe
        if (plantillaSeleccionada) {
          const plantillaRestaurada = plantillasActualizadas.find((p) => p.id === plantillaSeleccionada.id)
          if (plantillaRestaurada) {
            setPlantillaSeleccionada(plantillaRestaurada)
          } else if (plantillasActualizadas.length > 0) {
            setPlantillaSeleccionada(plantillasActualizadas[0])
          } else {
            setPlantillaSeleccionada(null)
          }
        }

        // Mostrar mensaje de éxito
        setMensaje("Todas las plantillas han sido restauradas a sus valores predeterminados")
        setTimeout(() => setMensaje(null), 3000)
      } else {
        setError("Error al restaurar las plantillas")
      }
    } catch (err) {
      console.error("Error al restaurar todas las plantillas:", err)
      setError("Error al restaurar las plantillas")
    }
  }

  // Función para cambiar la plantilla seleccionada
  const handleCambiarPlantilla = (id: string) => {
    const plantilla = plantillas.find((p) => p.id === id)
    if (plantilla) {
      setPlantillaSeleccionada(plantilla)
    }
  }

  // Función para volver a la página de inicio
  const handleVolverInicio = () => {
    router.push("/")
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-caravalia-600" />
          <p className="text-lg font-medium">Cargando editor de documentos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col p-6 bg-gradient-to-b from-caravalia-50 to-white">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-caravalia-800">Editor de Documentos</h1>
          <Button onClick={handleVolverInicio} variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {mensaje && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Éxito</AlertTitle>
            <AlertDescription className="text-green-700">{mensaje}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Panel lateral con lista de plantillas */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plantillas</CardTitle>
                <CardDescription>Selecciona una plantilla para editar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de plantillas */}
                <div className="space-y-2">
                  {plantillas.map((plantilla) => (
                    <Button
                      key={plantilla.id}
                      variant={plantillaSeleccionada?.id === plantilla.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => handleCambiarPlantilla(plantilla.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <div className="truncate flex-1">
                        {plantilla.nombre}
                        <span className="block text-xs text-gray-500">
                          {format(new Date(plantilla.ultimaModificacion), "dd/MM/yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Botón para crear nueva plantilla */}
                {!mostrarFormNueva ? (
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => setMostrarFormNueva(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Nueva plantilla
                  </Button>
                ) : (
                  <div className="space-y-3 border p-3 rounded-md">
                    <Label htmlFor="nombrePlantilla">Nombre de la plantilla</Label>
                    <Input
                      id="nombrePlantilla"
                      value={nombreNuevaPlantilla}
                      onChange={(e) => setNombreNuevaPlantilla(e.target.value)}
                      placeholder="Nombre de la plantilla"
                    />

                    <Label htmlFor="tipoPlantilla">Tipo de plantilla</Label>
                    <Select value={tipoNuevaPlantilla} onValueChange={(v) => setTipoNuevaPlantilla(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="condiciones">Condiciones</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setMostrarFormNueva(false)}>
                        Cancelar
                      </Button>
                      <Button className="flex-1 flex items-center gap-2" onClick={handleCrearPlantilla}>
                        <FilePlus2 className="h-4 w-4" />
                        Crear
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botón para restaurar todas las plantillas */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <History className="h-4 w-4" />
                      Restaurar todas
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Restaurar todas las plantillas?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción restaurará todas las plantillas a sus valores predeterminados. Se perderán todas las
                        modificaciones realizadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRestaurarTodas}>Restaurar todas</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Editor de plantillas */}
          <div className="md:col-span-3">
            {plantillaSeleccionada ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileEdit className="h-5 w-5" />
                      {plantillaSeleccionada.nombre}
                    </CardTitle>
                    <CardDescription>
                      Última modificación:{" "}
                      {format(new Date(plantillaSeleccionada.ultimaModificacion), "dd/MM/yyyy HH:mm", { locale: es })}
                    </CardDescription>
                  </div>

                  {/* Botón para restaurar plantilla */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        <History className="h-4 w-4" />
                        Restaurar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Restaurar esta plantilla?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción restaurará la plantilla "{plantillaSeleccionada.nombre}" a su valor
                          predeterminado. Se perderán todas las modificaciones realizadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestaurarPlantilla}>Restaurar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent>
                  <MarkdownEditor
                    initialValue={plantillaSeleccionada.contenido}
                    onSave={handleGuardarPlantilla}
                    height="600px"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500 mb-4">Selecciona una plantilla para editar</p>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setMostrarFormNueva(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Crear nueva plantilla
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
