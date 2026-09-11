"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { useCounterStorage } from "@/lib/hooks/use-counter-storage"
import { obtenerSiguienteNumeroReserva, verificarDuplicadoEnAño } from "@/lib/reservas-store"

export default function ReservaModeloPage({ params }: { params: Promise<{ modelo: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const modelo = decodeURIComponent(resolvedParams.modelo)

  const [numeroReserva, setNumeroReserva] = useState("")
  const [storedNumeroReserva, setStoredNumeroReserva] = useLocalStorage(`reserva-${modelo}`, "")
  const [esDuplicado, setEsDuplicado] = useState(false)
  const { counter, setCounterValue } = useCounterStorage(modelo, "0")

  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true

      if (storedNumeroReserva) {
        setNumeroReserva(storedNumeroReserva)
      } else {
        const añoActual = new Date().getFullYear()
        const nextNumber = obtenerSiguienteNumeroReserva(añoActual)
        setNumeroReserva(nextNumber)
      }
    }
  }, [storedNumeroReserva])

  useEffect(() => {
    if (numeroReserva.trim() !== "") {
      const añoActual = new Date().getFullYear()
      const duplicado = verificarDuplicadoEnAño(numeroReserva, añoActual)
      setEsDuplicado(duplicado)
    } else {
      setEsDuplicado(false)
    }
  }, [numeroReserva])

  const handleContinuar = () => {
    if (numeroReserva.trim() === "") return

    setStoredNumeroReserva(numeroReserva)

    const currentCounter = Number.parseInt(counter, 10)
    const currentReserva = Number.parseInt(numeroReserva, 10)
    if (!isNaN(currentReserva) && currentReserva >= currentCounter) {
      setCounterValue(numeroReserva)
    }

    router.push(`/reserva/${encodeURIComponent(modelo)}/detalles?numero=${numeroReserva}`)
  }

  const handleCancel = () => {
    router.push("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#EBEBEB]">
      {/* 
        Container Ticket 
        La clase voucher-tear está definida en globals.css y dibuja semicírculos blancos con bordes transparentes.
      */}
      <div className="w-full max-w-md flex flex-col shadow-sm filter drop-shadow-md">
        
        {/* Cuerpo Principal del Ticket */}
        <div className="bg-white rounded-t-[2.5rem] flex flex-col items-center pt-12 pb-10 relative overflow-hidden">
          
          {/* Top Icon */}
          <div className="w-16 h-16 rounded-full bg-[#E5F3EA] flex items-center justify-center text-[#003829] mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[2rem]">confirmation_number</span>
          </div>

          {/* Title & Desc */}
          <h1 className="text-3xl font-extrabold text-[#003829] font-headline tracking-tighter mb-8">Número de Reserva</h1>

          {/* Input area */}
          <div className="w-full px-8 mb-8 relative">
            <div className="relative flex flex-col items-center w-full">
               <div className={`w-full rounded-[2.5rem] bg-[#F5F5F5] border transition-colors relative z-0 flex items-center justify-center min-h-[90px] ${esDuplicado ? 'border-[#ffdad6]' : 'border-transparent'}`}>
                  <input
                    type="text"
                    value={numeroReserva}
                    onChange={(e) => setNumeroReserva(e.target.value)}
                    className={`w-full bg-transparent text-center text-4xl font-extrabold outline-none font-headline tracking-tighter ${
                      esDuplicado ? "text-[#93000a]" : "text-[#004D3F]"
                    }`}
                    autoFocus
                  />
               </div>
            </div>
            
            {esDuplicado && (
              <div className="flex items-center justify-center gap-2 text-[#93000a] mt-3 bg-[#ffdad6] py-2 px-4 rounded-xl text-xs font-bold font-body w-fit mx-auto">
                <span className="material-symbols-outlined text-[1rem]">error</span>
                <p>Este número ya existe en este año</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="w-full px-8 flex flex-col gap-3 z-10 relative">
            <button 
              onClick={handleContinuar}
              disabled={!numeroReserva.trim()}
              className="w-full py-[18px] bg-[#003829] text-white rounded-[2rem] font-bold font-headline text-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md"
            >
              Continuar
            </button>
            <button 
              onClick={handleCancel}
              className="w-full py-4 text-[#707974] rounded-full font-bold font-headline hover:text-[#003829] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>


        {/* Footer del Ticket */}
        <div className="bg-white rounded-b-[2.5rem] bg-transparent pb-8 px-10 h-10 w-full relative">
        </div>

      </div>
    </main>
  )
}
