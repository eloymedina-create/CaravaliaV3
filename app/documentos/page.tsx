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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, RefreshCw, Plus, AlertCircle, Home, FileEdit, FilePlus2, History, Copy, Calculator, MessageSquare, Check } from "lucide-react"

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

  // Estado para el generador de presupuestos
  const [showPresupuestoDialog, setShowPresupuestoDialog] = useState(false)
  const [pasoPresupuesto, setPasoPresupuesto] = useState(1)
  const [presupuestoData, setPresupuestoData] = useState({
    precioDiario: 100,
    modo: "dias" as "dias" | "fechas",
    numDias: 3,
    mes: "Junio",
    fechaInicio: "",
    fechaFin: "",
    porcentajeSenal: 30,
    importeSenalText: "30", // texto libre del campo euros
  })
  const [textoGenerado, setTextoGenerado] = useState("")

  // Resetear paso al abrir
  useEffect(() => {
    if (showPresupuestoDialog) {
      setPasoPresupuesto(1)
    }
  }, [showPresupuestoDialog])

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

  // Lógica para generar el texto del presupuesto
  const generarTextoPresupuesto = () => {
    const plantilla = plantillas.find(p => p.id === "presupuesto-previo")
    if (!plantilla) return ""

    let fechasODias = ""
    let diasCalculados = presupuestoData.numDias

    if (presupuestoData.modo === "dias") {
      fechasODias = `${presupuestoData.numDias} días de ${presupuestoData.mes}`
    } else {
      let fIniStr = "X"
      let fFinStr = "X"
      
      try {
        if (presupuestoData.fechaInicio) {
          const dIni = new Date(presupuestoData.fechaInicio + "T12:00:00") // Añadir T12 para evitar problemas de zona horaria
          fIniStr = format(dIni, "d 'de' MMMM", { locale: es })
          
          if (presupuestoData.fechaFin) {
            const dFin = new Date(presupuestoData.fechaFin + "T12:00:00")
            fFinStr = format(dFin, "d 'de' MMMM", { locale: es })
            
            // Cálculo de días tal cual se hace en las reservas (Inicio a Fin inclusive)
            const start = new Date(dIni.getFullYear(), dIni.getMonth(), dIni.getDate())
            const end = new Date(dFin.getFullYear(), dFin.getMonth(), dFin.getDate())
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            diasCalculados = diffDays + 1
          }
        }
      } catch (e) {
        console.error("Error calculando fechas:", e)
      }
      
      fechasODias = `del ${fIniStr} al ${fFinStr}`
    }

    const total = presupuestoData.precioDiario * diasCalculados
    const senal = Math.round((total * (presupuestoData.porcentajeSenal / 100)) / 10) * 10
    const porcentaje = presupuestoData.porcentajeSenal

    let texto = plantilla.contenido

    // SOPORTE PARA PLANTILLAS ANTIGUAS: Si no tiene el placeholder de señal, lo inyectamos
    if (!texto.includes("{{importeSenal}}")) {
      texto = texto.replace(
        "ingreso del 30% del total del alquiler por bizum, transferencia o mediante contado.",
        "ingreso del {{porcentajeSenal}}% del total del alquiler por bizum, transferencia o mediante contado, el cual sería de un total de {{importeSenal}}€."
      )
    }

    // SOPORTE PARA PLANTILLAS ANTIGUAS: Si tiene 30% hardcodeado sin placeholder, lo reemplazamos
    if (!texto.includes("{{porcentajeSenal}}")) {
      texto = texto.replace(/ingreso del 30%/g, `ingreso del ${porcentaje}%`)
    }

    texto = texto
      .replace("{{fechas_o_dias}}", fechasODias)
      .replace("{{precioDiario}}", presupuestoData.precioDiario.toString())
      .replace("{{importeTotal}}", total.toString())
      .replace("{{importeSenal}}", senal.toString())
      .replace(/\{\{porcentajeSenal\}\}/g, porcentaje.toString())

    return texto
  }

  // Obtener días actuales (ya sea manual o calculado)
  const getDiasActuales = () => {
    if (presupuestoData.modo === "dias") return presupuestoData.numDias
    
    if (presupuestoData.fechaInicio && presupuestoData.fechaFin) {
      try {
        const dIni = new Date(presupuestoData.fechaInicio + "T12:00:00")
        const dFin = new Date(presupuestoData.fechaFin + "T12:00:00")
        const start = new Date(dIni.getFullYear(), dIni.getMonth(), dIni.getDate())
        const end = new Date(dFin.getFullYear(), dFin.getMonth(), dFin.getDate())
        const diffTime = Math.abs(end.getTime() - start.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      } catch (e) { return 0 }
    }
    return 0
  }

  // Actualizar texto generado cuando cambian los datos
  useEffect(() => {
    if (showPresupuestoDialog) {
      setTextoGenerado(generarTextoPresupuesto())
    }
  }, [presupuestoData, plantillas, showPresupuestoDialog])

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoGenerado)
    setMensaje("Texto de presupuesto copiado al portapapeles")
    setTimeout(() => setMensaje(null), 3000)
    setShowPresupuestoDialog(false)
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
          <div className="md:col-span-1 space-y-6">
            {/* Herramientas Rápidas */}
            <Card className="border-[#baeed9] bg-[#baeed9]/10 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#003829] opacity-60">Herramientas</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Button
                  className="w-full flex items-center gap-3 bg-[#003829] hover:bg-[#00281d] text-white shadow-lg shadow-[#003829]/10 active:scale-95 transition-all h-12 rounded-[1rem] font-bold uppercase tracking-wider text-[10px] px-2 sm:px-4"
                  onClick={() => setShowPresupuestoDialog(true)}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="truncate">Generador Presupuesto</span>
                </Button>
              </CardContent>
            </Card>

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

      {/* Diálogo del Generador de Presupuesto */}
      <Dialog open={showPresupuestoDialog} onOpenChange={setShowPresupuestoDialog}>
        <DialogContent className="!fixed !top-2 !left-2 !right-2 !translate-x-0 !translate-y-0 !w-[calc(100vw-1rem)] !max-w-none sm:!fixed sm:!left-1/2 sm:!top-1/2 sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!w-full sm:!max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-[2rem] gap-4">
          <DialogHeader className="space-y-1 pr-8">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-caravalia-800 text-base sm:text-xl text-left">
              <Calculator className="h-5 w-5 shrink-0" />
              Generador de Presupuesto Rápido
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-sm text-left">
              Configura los datos para generar el texto informativo para el cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="md:hidden">
            {/* Versión Móvil: Flujo por Pasos */}
            <div className="py-2">
              {pasoPresupuesto === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">Precio Diario (€)</Label>
                    <Input 
                      type="number" 
                      value={presupuestoData.precioDiario} 
                      onChange={(e) => setPresupuestoData({...presupuestoData, precioDiario: Number(e.target.value)})}
                      className="font-bold text-caravalia-700 h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">Modo de información</Label>
                    <Select 
                      value={presupuestoData.modo} 
                      onValueChange={(v) => setPresupuestoData({...presupuestoData, modo: v as any})}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dias">Número de Días + Mes</SelectItem>
                        <SelectItem value="fechas">Fechas Específicas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowPresupuestoDialog(false)} className="flex-1 rounded-xl h-12">
                      Cancelar
                    </Button>
                    <Button onClick={() => setPasoPresupuesto(2)} className="flex-1 rounded-xl h-12 bg-caravalia-600">
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}

              {pasoPresupuesto === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {presupuestoData.modo === "dias" ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Número de Días</Label>
                        <Input 
                          type="number" 
                          value={presupuestoData.numDias} 
                          onChange={(e) => setPresupuestoData({...presupuestoData, numDias: Number(e.target.value)})}
                          className="h-12 text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Mes del alquiler</Label>
                        <Input 
                          value={presupuestoData.mes} 
                          onChange={(e) => setPresupuestoData({...presupuestoData, mes: e.target.value})}
                          placeholder="Ej: Junio"
                          className="h-12 text-lg"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Fecha Inicio</Label>
                        <Input 
                          type="date" 
                          value={presupuestoData.fechaInicio} 
                          onChange={(e) => setPresupuestoData({...presupuestoData, fechaInicio: e.target.value, fechaFin: e.target.value})}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-gray-500">Fecha Fin</Label>
                        <Input 
                          type="date" 
                          value={presupuestoData.fechaFin} 
                          min={presupuestoData.fechaInicio || undefined}
                          onChange={(e) => setPresupuestoData({...presupuestoData, fechaFin: e.target.value})}
                          className="h-12"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setPasoPresupuesto(1)} className="flex-1 rounded-xl h-12">
                      Atrás
                    </Button>
                    <Button onClick={() => setPasoPresupuesto(3)} className="flex-1 rounded-xl h-12 bg-caravalia-600">
                      Ver Resultado
                    </Button>
                  </div>
                </div>
              )}

              {pasoPresupuesto === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-4 bg-caravalia-50 rounded-2xl border border-caravalia-100 space-y-2">
                    <div className="flex justify-between items-center text-lg font-black text-caravalia-800">
                      <span>TOTAL:</span>
                      <span>{presupuestoData.precioDiario * getDiasActuales()}€</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-caravalia-600 shrink-0">SEÑAL:</span>
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          type="number"
                          value={presupuestoData.porcentajeSenal}
                          onChange={(e) => {
                            const pct = Number(e.target.value)
                            const total = presupuestoData.precioDiario * getDiasActuales()
                            const importeCalculado = Math.round((total * (pct / 100)) / 10) * 10
                            setPresupuestoData({...presupuestoData, porcentajeSenal: pct, importeSenalText: String(importeCalculado)})
                          }}
                          className="h-8 w-16 text-xs font-bold text-caravalia-700 text-center px-1"
                          min={0} max={100}
                        />
                        <span className="text-xs font-bold text-caravalia-600">%</span>
                        <span className="text-xs text-caravalia-500 mx-1">=</span>
                        <Input
                          type="number"
                          value={presupuestoData.importeSenalText}
                          onChange={(e) => setPresupuestoData({...presupuestoData, importeSenalText: e.target.value})}
                          onBlur={(e) => {
                            const total = presupuestoData.precioDiario * getDiasActuales()
                            const pct = total > 0 ? Math.round((Number(e.target.value) / total) * 100) : 0
                            setPresupuestoData({...presupuestoData, porcentajeSenal: pct, importeSenalText: e.target.value})
                          }}
                          className="h-8 flex-1 text-xs font-bold text-caravalia-700 text-center px-1"
                          min={0}
                        />
                        <span className="text-xs font-bold text-caravalia-600">€</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">Vista previa</Label>
                    <div className="w-full p-4 rounded-xl border bg-gray-50 text-[10px] leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap font-sans text-gray-700 shadow-inner">
                      {textoGenerado}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleCopiarTexto} className="w-full flex items-center gap-2 rounded-xl h-12 bg-caravalia-600 hover:bg-caravalia-700">
                      <Copy className="h-4 w-4" />
                      Copiar al Portapapeles
                    </Button>
                    <Button variant="ghost" onClick={() => setPasoPresupuesto(2)} className="w-full rounded-xl h-10 text-gray-500">
                      Atrás (Corregir datos)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            {/* Versión Escritorio: Diseño Original de 2 Columnas */}
            <div className="grid grid-cols-2 gap-6 py-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Precio Diario (€)</Label>
                  <Input 
                    type="number" 
                    value={presupuestoData.precioDiario} 
                    onChange={(e) => setPresupuestoData({...presupuestoData, precioDiario: Number(e.target.value)})}
                    className="font-bold text-caravalia-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Modo de información</Label>
                  <Select 
                    value={presupuestoData.modo} 
                    onValueChange={(v) => setPresupuestoData({...presupuestoData, modo: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dias">Número de Días + Mes</SelectItem>
                      <SelectItem value="fechas">Fechas Específicas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {presupuestoData.modo === "dias" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Número de Días</Label>
                      <Input 
                        type="number" 
                        value={presupuestoData.numDias} 
                        onChange={(e) => setPresupuestoData({...presupuestoData, numDias: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Mes del alquiler</Label>
                      <Input 
                        value={presupuestoData.mes} 
                        onChange={(e) => setPresupuestoData({...presupuestoData, mes: e.target.value})}
                        placeholder="Ej: Junio"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Fecha Inicio</Label>
                      <Input 
                        type="date" 
                        value={presupuestoData.fechaInicio} 
                        onChange={(e) => setPresupuestoData({...presupuestoData, fechaInicio: e.target.value, fechaFin: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Fecha Fin</Label>
                      <Input 
                        type="date" 
                        value={presupuestoData.fechaFin} 
                        min={presupuestoData.fechaInicio || undefined}
                        onChange={(e) => setPresupuestoData({...presupuestoData, fechaFin: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Días calculados</Label>
                      <Input 
                        type="number" 
                        value={getDiasActuales()} 
                        disabled
                        className="bg-gray-100 font-bold"
                      />
                    </div>
                  </>
                )}
                
                <div className="pt-4 border-t border-caravalia-100 space-y-2">
                  <div className="flex justify-between items-center text-xl font-black text-caravalia-800">
                    <span>TOTAL:</span>
                    <span>{presupuestoData.precioDiario * getDiasActuales()}€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-caravalia-600 shrink-0">SEÑAL:</span>
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        type="number"
                        value={presupuestoData.porcentajeSenal}
                        onChange={(e) => {
                          const pct = Number(e.target.value)
                          const total = presupuestoData.precioDiario * getDiasActuales()
                          const importeCalculado = Math.round((total * (pct / 100)) / 10) * 10
                          setPresupuestoData({...presupuestoData, porcentajeSenal: pct, importeSenalText: String(importeCalculado)})
                        }}
                        className="h-8 w-16 text-xs font-bold text-caravalia-700 text-center px-1"
                        min={0} max={100}
                      />
                      <span className="text-sm font-bold text-caravalia-600">%</span>
                      <span className="text-sm text-caravalia-500 mx-1">=</span>
                      <Input
                        type="number"
                        value={presupuestoData.importeSenalText}
                        onChange={(e) => setPresupuestoData({...presupuestoData, importeSenalText: e.target.value})}
                        onBlur={(e) => {
                          const total = presupuestoData.precioDiario * getDiasActuales()
                          const pct = total > 0 ? Math.round((Number(e.target.value) / total) * 100) : 0
                          setPresupuestoData({...presupuestoData, porcentajeSenal: pct, importeSenalText: e.target.value})
                        }}
                        className="h-8 flex-1 text-xs font-bold text-caravalia-700 text-center px-1"
                        min={0}
                      />
                      <span className="text-sm font-bold text-caravalia-600">€</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex flex-col h-full">
                <Label className="text-xs font-bold uppercase text-gray-500">Vista previa del texto</Label>
                <div className="flex-1 w-full p-4 rounded-xl border bg-gray-50 text-[11px] leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans text-gray-700 shadow-inner">
                  {textoGenerado}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowPresupuestoDialog(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleCopiarTexto} className="flex items-center gap-2 rounded-xl bg-caravalia-600 hover:bg-caravalia-700">
                <Copy className="h-4 w-4" />
                Copiar al Portapapeles
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
