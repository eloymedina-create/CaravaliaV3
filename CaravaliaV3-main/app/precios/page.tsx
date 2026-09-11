"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PrecioReferenciaForm } from "@/components/precio-referencia-form"
import { RegistroPrecioForm } from "@/components/registro-precio-form"
import { HistoricoPrecios } from "@/components/historico-precios"
import { GraficosPrecios } from "@/components/graficos-precios"
import { obtenerAutocaravanas } from "@/lib/autocaravanas-store"
import { sincronizarPrecios, obtenerUltimaSincronizacionPrecios, formatearFecha } from "@/lib/precios-store"
import { ArrowLeft, RefreshCw, AlertTriangle, Database, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function PreciosPage() {
  const [autocaravanas, setAutocaravanas] = useState<Array<{ id: string; modelo: string }>>([])
  const [modeloSeleccionado, setModeloSeleccionado] = useState<string>("")
  const [sincronizando, setSincronizando] = useState(false)
  const [resultadoSync, setResultadoSync] = useState<"success" | "error" | "info" | null>(null)
  const [mensajeSync, setMensajeSync] = useState("")
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<string | null>(null)

  // Cargar autocaravanas iniciales
  useEffect(() => {
    const autos = obtenerAutocaravanas()
    setAutocaravanas(autos.map((a) => ({ id: a.id, modelo: a.modelo })))

    if (autos.length > 0) {
      setModeloSeleccionado(autos[0].id)
    }

    // Obtener última sincronización
    const ultimaSync = obtenerUltimaSincronizacionPrecios()
    setUltimaSincronizacion(ultimaSync)
  }, [])

  // Manejar sincronización manual
  const handleSincronizar = async () => {
    setSincronizando(true)
    setResultadoSync(null)
    setMensajeSync("")

    try {
      const resultado = await sincronizarPrecios()

      if (resultado.exito) {
        setResultadoSync("success")
        setMensajeSync(resultado.mensaje)
        setUltimaSincronizacion(new Date().toISOString())
      } else {
        setResultadoSync("error")
        setMensajeSync(resultado.mensaje)
      }
    } catch (error) {
      console.error("Error al sincronizar precios:", error)
      setResultadoSync("error")
      setMensajeSync(
        `Error inesperado durante la sincronización: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-5 w-5 mr-1" />
                Volver
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Precios V2.1</h1>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSincronizar}
              disabled={sincronizando}
              className="bg-caravalia-600 hover:bg-caravalia-700"
            >
              {sincronizando ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Sincronizar ahora
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Información de sincronización */}
        <div className="mb-6">
          {ultimaSincronizacion && (
            <p className="text-sm text-gray-500">Última sincronización con Nube: {formatearFecha(ultimaSincronizacion)}</p>
          )}

          {resultadoSync === "success" && (
            <Alert className="mt-2 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{mensajeSync}</AlertDescription>
            </Alert>
          )}

          {resultadoSync === "error" && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de Sincronización</AlertTitle>
              <AlertDescription>{mensajeSync}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Contenido principal */}
        <Tabs defaultValue="referencia" className="space-y-6">
          <TabsList className="w-full max-w-3xl mx-auto">
            <TabsTrigger value="referencia" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Precios de Referencia
            </TabsTrigger>
            <TabsTrigger value="registro" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Nuevo Registro
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="graficos" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
              Gráficos
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Precios de Referencia */}
          <TabsContent value="referencia" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Selector de modelo */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Selecciona un modelo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {autocaravanas.map((auto) => (
                    <Button
                      key={auto.id}
                      variant={modeloSeleccionado === auto.id ? "default" : "outline"}
                      onClick={() => setModeloSeleccionado(auto.id)}
                      className={modeloSeleccionado === auto.id ? "bg-caravalia-600 hover:bg-caravalia-700" : ""}
                    >
                      {auto.modelo}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Formulario de precios de referencia */}
              {modeloSeleccionado && (
                <PrecioReferenciaForm
                  modeloId={modeloSeleccionado}
                  modelo={autocaravanas.find((a) => a.id === modeloSeleccionado)?.modelo || ""}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="registro">
            <RegistroPrecioForm />
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoPrecios />
          </TabsContent>

          <TabsContent value="graficos">
            <GraficosPrecios />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
