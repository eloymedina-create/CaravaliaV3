"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"

export default function ClienteReservaPage({ params }: { params: Promise<{ modelo: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const numeroReserva = searchParams.get("numero") || ""
  const modelo = decodeURIComponent(resolvedParams.modelo)
  const esEdicion = searchParams.get("editar") === "true"

  const [nombre, setNombre] = useState("")
  const [dni, setDni] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [poblacion, setPoblacion] = useState("")
  const [provincia, setProvincia] = useState("")
  const [email, setEmail] = useState("")
  const [notas, setNotas] = useState("")
  const [showNotas, setShowNotas] = useState(false)

  const [reservaDetalles, setReservaDetalles] = useState<any>(null)

  useEffect(() => {
    const detallesGuardados = localStorage.getItem("reservaDetalles")
    if (detallesGuardados) {
      setReservaDetalles(JSON.parse(detallesGuardados))
    }

    const clienteGuardado = localStorage.getItem("reservaCliente")
    if (clienteGuardado) {
      try {
        const cliente = JSON.parse(clienteGuardado)
          if (cliente.nombre) setNombre(cliente.nombre)
          if (cliente.dni) setDni(cliente.dni)
          if (cliente.telefono) setTelefono(cliente.telefono)
          if (cliente.notas) setNotas(cliente.notas)
          if (cliente.direccion) setDireccion(cliente.direccion)
          if (cliente.poblacion) setPoblacion(cliente.poblacion)
          if (cliente.provincia) setProvincia(cliente.provincia)
          if (cliente.email) setEmail(cliente.email)
      } catch (error) {
        console.error("Error al cargar los datos del cliente:", error)
      }
    }
  }, [])

  const handleReservar = () => {
    if (!nombre || !dni || !telefono) return

    const clienteData = {
      nombre,
      dni,
      telefono,
      direccion,
      poblacion,
      provincia,
      email,
      notas,
    }

    localStorage.setItem("reservaCliente", JSON.stringify(clienteData))

    const queryParams = esEdicion ? `numero=${numeroReserva}&editar=true` : `numero=${numeroReserva}`
    router.push(`/reserva/${encodeURIComponent(modelo)}/confirmacion?${queryParams}`)
  }

  const handleVolver = () => {
    const queryParams = esEdicion ? `numero=${numeroReserva}&editar=true` : `numero=${numeroReserva}`
    router.push(`/reserva/${encodeURIComponent(modelo)}/detalles?${queryParams}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#EBEBEB]">
      
      <div className="w-full max-w-md flex flex-col shadow-sm filter drop-shadow-md">
        
        {/* Cuerpo Principal del Ticket */}
        <div className="bg-white rounded-t-[2.5rem] flex flex-col pt-10 pb-4 px-8 relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E5F3EA] flex items-center justify-center text-[#003829]">
                <span className="material-symbols-outlined text-xl">person_add</span>
              </div>
              <div>
                <span className="text-[11px] font-headline tracking-widest text-[#A0A8A3] font-bold uppercase">Reserva nº {numeroReserva}</span>
                <h2 className="text-xl font-extrabold text-[#003829] font-headline tracking-tight">Datos Cliente</h2>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            
            {/* Campos principales */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">person</span>
                Nombre y Apellidos
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toUpperCase())}
                placeholder="Nombre completo"
                className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold outline-none focus-visible:ring-[#baeed9] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dni" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">id_card</span>
                  DNI / NIE
                </Label>
                <Input
                  id="dni"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.toUpperCase())}
                  placeholder="Documento"
                  className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold text-center outline-none focus-visible:ring-[#baeed9] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefono" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">phone</span>
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.toUpperCase())}
                  placeholder="Móvil"
                  type="tel"
                  className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold text-center outline-none focus-visible:ring-[#baeed9] transition-all"
                />
              </div>
            </div>

            {/* Dirección y Detalles */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="direccion" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                Dirección Completa
              </Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                placeholder="Calle, número..."
                className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold outline-none focus-visible:ring-[#baeed9] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="poblacion" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">home</span>
                  Población
                </Label>
                <Input
                  id="poblacion"
                  value={poblacion}
                  onChange={(e) => setPoblacion(e.target.value.toUpperCase())}
                  placeholder="Población"
                  className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold text-center outline-none focus-visible:ring-[#baeed9] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="provincia" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  Provincia
                </Label>
                <Input
                  id="provincia"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value.toUpperCase())}
                  placeholder="Provincia"
                  className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold text-center outline-none focus-visible:ring-[#baeed9] transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[11px] font-headline font-bold text-[#707974] uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">mail</span>
                Correo Electrónico
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toUpperCase())}
                placeholder="ejemplo@correo.com"
                type="email"
                className="uppercase bg-[#F5F5F5] border-transparent rounded-[1.25rem] h-12 px-5 text-[#004D3F] font-bold outline-none focus-visible:ring-[#baeed9] transition-all"
              />
            </div>

            {/* Acción Notas */}
            <div className="flex justify-center mt-2 mb-4">
              <button 
                onClick={() => setShowNotas(true)}
                className="flex items-center gap-2 py-2 px-6 rounded-full bg-[#E5F3EA] text-[#003829] font-bold font-headline text-sm tracking-wide transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                {notas ? "EDITAR NOTAS" : "AGREGAR NOTAS"}
              </button>
            </div>

          </div>
        </div>


        {/* Footer del Ticket (Botones) */}
        <div className="bg-white rounded-b-[2.5rem] pt-4 pb-8 px-8 flex flex-col gap-3 relative overflow-hidden">
            <button 
              onClick={handleReservar}
              disabled={!nombre || !dni || !telefono}
              className="w-full py-[18px] bg-[#003829] text-white rounded-[2rem] font-bold font-headline text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:active:scale-100"
            >
              Reservar
            </button>
            <button 
              onClick={handleVolver}
              className="w-full py-3 text-[#707974] rounded-full font-bold font-headline hover:text-[#003829] transition-colors"
            >
              Volver
            </button>
        </div>

      </div>

      <Dialog open={showNotas} onOpenChange={setShowNotas}>
        <DialogContent className="sm:max-w-md bg-white border-transparent rounded-[1.5rem] shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-[#003829] font-headline font-bold">Modificar Notas</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value.toUpperCase())}
              placeholder="Ingrese observaciones, peticiones del cliente o extras..."
              rows={6}
              className="uppercase bg-[#F5F5F5] border-transparent focus:border-transparent focus-visible:ring-[#baeed9] rounded-[1rem] p-4 text-[#004D3F] font-medium"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setShowNotas(false)} 
              className="w-full py-4 bg-[#003829] text-white rounded-full font-bold font-headline transition-opacity hover:opacity-90"
            >
              Guardar Notas
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
