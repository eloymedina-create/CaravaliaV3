"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SimpleInputDateProps {
  id?: string
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
}

export function SimpleInputDate({
  id,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
}: SimpleInputDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  // Actualizar la fecha formateada cuando cambia el valor
  useEffect(() => {
    if (value) {
      setFormattedDate(format(value, "dd/MM/yyyy", { locale: es }))
    } else {
      setFormattedDate("")
    }
  }, [value])

  // Función para abrir el selector de fecha nativo
  const openDatePicker = () => {
    // Crear un input de tipo date temporal
    const tempInput = document.createElement("input")
    tempInput.type = "date"
    tempInput.style.position = "absolute"
    tempInput.style.left = "-9999px" // Fuera de la pantalla

    // Establecer el valor actual si existe
    if (value) {
      tempInput.value = format(value, "yyyy-MM-dd")
    }

    // Manejar el cambio de fecha
    tempInput.onchange = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.value) {
        const newDate = new Date(e.target.value)
        onChange(newDate)
      }
      // Eliminar el input temporal después de usarlo
      document.body.removeChild(tempInput)
    }

    // Manejar el caso en que el usuario cancele la selección
    tempInput.onblur = () => {
      // Dar un pequeño tiempo para que el evento change se dispare primero si es necesario
      setTimeout(() => {
        if (document.body.contains(tempInput)) {
          document.body.removeChild(tempInput)
        }
      }, 100)
    }

    // Añadir el input al DOM y abrirlo
    document.body.appendChild(tempInput)
    tempInput.click()
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full justify-start text-left font-normal ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={disabled ? undefined : openDatePicker}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {formattedDate || placeholder}
    </Button>
  )
}
