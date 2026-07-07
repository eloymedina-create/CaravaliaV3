"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { NuevoAutocaravanaIcon } from "@/components/icons/nuevo-autocaravana-icon"

import {
  obtenerAutocaravanas,
  guardarAutocaravana,
  eliminarAutocaravana,
  generarId,
  inicializarAutocaravanas,
} from "@/lib/autocaravanas-store"
import type { Autocaravana } from "@/lib/types"

export default function AutocaravanasPage() {
  const router = useRouter()
  const [autocaravanas, setAutocaravanas] = useState<Autocaravana[]>([])
  const [autocaravanaAEditar, setAutocaravanaAEditar] = useState<Autocaravana | null>(null)
  const [autocaravanaAEliminar, setAutocaravanaAEliminar] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [modelo, setModelo] = useState("")
  const [matricula, setMatricula] = useState("")
  const [numeroBastidor, setNumeroBastidor] = useState("")
  const [activa, setActiva] = useState(true)
  const [error, setError] = useState("")
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  useEffect(() => {
    const cargarDatos = () => {
      inicializarAutocaravanas()
      const todasLasAutocaravanas = obtenerAutocaravanas()
      setAutocaravanas(todasLasAutocaravanas)
    }

    cargarDatos()
    window.addEventListener("storage", cargarDatos)
    return () => window.removeEventListener("storage", cargarDatos)
  }, [])

  const handleVolver = () => {
    router.push("/")
  }

  const handleAbrirDialogoNueva = () => {
    setAutocaravanaAEditar(null)
    setModelo("")
    setMatricula("")
    setNumeroBastidor("")
    setActiva(true)
    setError("")
    setShowDialog(true)
  }

  const handleAbrirDialogoEditar = (autocaravana: Autocaravana) => {
    setAutocaravanaAEditar(autocaravana)
    setModelo(autocaravana.modelo)
    setMatricula(autocaravana.matricula)
    setNumeroBastidor(autocaravana.numeroBastidor || "")
    setActiva(autocaravana.activa)
    setError("")
    setShowDialog(true)
  }

  const handleGuardarAutocaravana = () => {
    // Validar campos
    if (!modelo.trim()) {
      setError("El modelo es obligatorio")
      return
    }
    if (!matricula.trim()) {
      setError("La matrícula es obligatoria")
      return
    }

    // Verificar si ya existe una autocaravana con el mismo modelo (excepto la que estamos editando)
    const modeloExistente = autocaravanas.find(
      (a) =>
        a.modelo.toLowerCase() === modelo.toLowerCase() && (!autocaravanaAEditar || a.id !== autocaravanaAEditar.id),
    )

    if (modeloExistente) {
      setError("Ya existe una autocaravana con este modelo")
      return
    }

    // Crear o actualizar la autocaravana
    const autocaravanaActualizada: Autocaravana = {
      id: autocaravanaAEditar ? autocaravanaAEditar.id : generarId(),
      modelo,
      matricula,
      numeroBastidor,
      activa,
    }

    // Guardar la autocaravana
    guardarAutocaravana(autocaravanaActualizada)

    // Actualizar la lista de autocaravanas
    if (autocaravanaAEditar) {
      setAutocaravanas(autocaravanas.map((a) => (a.id === autocaravanaActualizada.id ? autocaravanaActualizada : a)))
    } else {
      setAutocaravanas([...autocaravanas, autocaravanaActualizada])
      // Mostrar mensaje de éxito para nuevas autocaravanas
      setGuardadoExitoso(true)
      setTimeout(() => setGuardadoExitoso(false), 3000)
    }

    // Cerrar el diálogo
    setShowDialog(false)
  }

  const confirmarEliminarAutocaravana = (id: string) => {
    setAutocaravanaAEliminar(id)
  }

  const handleEliminarAutocaravana = () => {
    if (!autocaravanaAEliminar) return

    // Eliminar la autocaravana
    eliminarAutocaravana(autocaravanaAEliminar)

    // Actualizar la lista de autocaravanas
    setAutocaravanas(autocaravanas.filter((a) => a.id !== autocaravanaAEliminar))

    // Cerrar el diálogo
    setAutocaravanaAEliminar(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-caravalia-50 to-white">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-soft">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleVolver}
              className="border-caravalia-200 hover:bg-caravalia-50"
            >
              <ArrowLeft className="h-5 w-5 text-caravalia-700" />
            </Button>
            <h1 className="text-2xl font-bold text-caravalia-800">Gestión de Autocaravanas</h1>
          </div>
          <div className="w-16 h-16 relative">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
              alt="Caravalia Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {guardadoExitoso && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">¡Éxito! </strong>
            <span className="block sm:inline">
              La autocaravana ha sido añadida correctamente. Ya puedes acceder a sus reservas desde la página principal.
            </span>
          </div>
        )}

        <Card className="w-full card-modern">
          <CardContent className="p-6">
            <div className="flex justify-end mb-6">
              <Button
                onClick={handleAbrirDialogoNueva}
                className="bg-caravalia-600 hover:bg-caravalia-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Añadir Autocaravana
              </Button>
            </div>

            {autocaravanas.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-caravalia-700">Modelo</TableHead>
                      <TableHead className="text-caravalia-700">Matrícula</TableHead>
                      <TableHead className="text-caravalia-700">Bastidor</TableHead>
                      <TableHead className="text-caravalia-700">Estado</TableHead>
                      <TableHead className="text-caravalia-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autocaravanas.map((autocaravana) => (
                      <TableRow key={autocaravana.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <NuevoAutocaravanaIcon className="h-4 w-4 text-caravalia-600" />
                            {autocaravana.modelo}
                          </div>
                        </TableCell>
                        <TableCell>{autocaravana.matricula}</TableCell>
                        <TableCell>{autocaravana.numeroBastidor || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              autocaravana.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {autocaravana.activa ? "Activa" : "Inactiva"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleAbrirDialogoEditar(autocaravana)}
                              className="h-8 w-8 border-caravalia-200 hover:bg-caravalia-50"
                              title="Editar autocaravana"
                            >
                              <Edit className="h-4 w-4 text-caravalia-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => confirmarEliminarAutocaravana(autocaravana.id)}
                              className="h-8 w-8 border-red-200 hover:bg-red-50"
                              title="Eliminar autocaravana"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-caravalia-600">No hay autocaravanas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para añadir/editar autocaravana */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-caravalia-800">
              {autocaravanaAEditar ? "Editar Autocaravana" : "Añadir Autocaravana"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modelo" className="text-right">
                Modelo
              </Label>
              <Input id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="matricula" className="text-right">
                Matrícula
              </Label>
              <Input
                id="matricula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numeroBastidor" className="text-right">
                Nº Bastidor
              </Label>
              <Input
                id="numeroBastidor"
                value={numeroBastidor}
                onChange={(e) => setNumeroBastidor(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activa" className="text-right">
                Activa
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch id="activa" checked={activa} onCheckedChange={setActiva} />
                <span className="ml-2 text-sm text-gray-500">
                  {activa ? "La autocaravana está activa" : "La autocaravana está inactiva"}
                </span>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-caravalia-200 hover:bg-caravalia-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGuardarAutocaravana}
              className="bg-caravalia-600 hover:bg-caravalia-700 text-white"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar autocaravana */}
      <Dialog open={!!autocaravanaAEliminar} onOpenChange={(open) => !open && setAutocaravanaAEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-caravalia-800">Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta autocaravana? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setAutocaravanaAEliminar(null)} className="btn-outline-modern">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminarAutocaravana}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
