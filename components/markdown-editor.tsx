"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save, RefreshCw, Eye, Code, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface MarkdownEditorProps {
  initialValue: string
  onSave: (content: string) => void
  onCancel?: () => void
  height?: string
  placeholder?: string
}

export function MarkdownEditor({
  initialValue,
  onSave,
  onCancel,
  height = "500px",
  placeholder = "Escribe aquí el contenido en formato Markdown...",
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialValue)
  const [activeTab, setActiveTab] = useState("edit")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(initialValue)
  }, [initialValue])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Guardar el contenido
      onSave(content)

      // Cambiar a la pestaña de vista previa
      setActiveTab("preview")
    } catch (err) {
      setError("Error al guardar el documento. Por favor, inténtalo de nuevo.")
      console.error("Error al guardar:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      setContent(initialValue)
      setActiveTab("preview")
    }
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vista previa
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ayuda
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || content === initialValue}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm"
            style={{ height, minHeight: "300px" }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-md p-4 overflow-auto bg-white" style={{ height, minHeight: "300px" }}>
            <div className="prose max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-0">
          <div className="border rounded-md p-4 overflow-auto bg-white" style={{ height, minHeight: "300px" }}>
            <div className="prose max-w-none">
              <h2>Guía de Markdown</h2>

              <h3>Encabezados</h3>
              <pre className="bg-gray-100 p-2 rounded">
                # Título 1<br />
                ## Título 2<br />
                ### Título 3
              </pre>

              <h3>Formato de texto</h3>
              <pre className="bg-gray-100 p-2 rounded">
                **Texto en negrita**
                <br />
                *Texto en cursiva*
                <br />
                ~~Texto tachado~~
              </pre>

              <h3>Listas</h3>
              <pre className="bg-gray-100 p-2 rounded">
                - Elemento 1<br />- Elemento 2<br />
                <br />
                1. Elemento numerado 1<br />
                2. Elemento numerado 2
              </pre>

              <h3>Variables</h3>
              <p>
                Puedes usar variables en el formato <code>{"{{variable}}"}</code> que serán reemplazadas con los datos
                de la reserva:
              </p>
              <pre className="bg-gray-100 p-2 rounded">
                Número de reserva: {"{{numeroReserva}}"}
                <br />
                Nombre del cliente: {"{{cliente.nombre}}"}
                <br />
                DNI: {"{{cliente.dni}}"}
                <br />
                Modelo: {"{{modelo}}"}
                <br />
                Matrícula: {"{{matricula}}"}
                <br />
                Fecha de entrega: {"{{fechaEntrega}}"}
                <br />
                Hora de entrega: {"{{horaEntrega}}"}
                <br />
                Fecha de devolución: {"{{fechaDevolucion}}"}
                <br />
                Hora de devolución: {"{{horaDevolucion}}"}
                <br />
                Importe restante: {"{{importeRestante}}"}
                <br />
                Precio diario: {"{{precioDiario}}"}
                <br />
                Suplemento: {"{{suplemento}}"}
                <br />
                Notas: {"{{notas}}"}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
