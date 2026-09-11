"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BasicDatePickerProps {
  date: Date | null
  onDateChange: (date: Date) => void
  placeholder?: string
  id?: string
}

export function BasicDatePicker({ date, onDateChange, placeholder = "Seleccionar fecha", id }: BasicDatePickerProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Actualizar el valor del input cuando cambia la fecha
  useEffect(() => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy", { locale: es }))
    } else {
      setInputValue("")
    }
  }, [date])

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)

    // Intentar parsear la fecha
    const parts = e.target.value.split("/")
    if (parts.length === 3) {
      const day = Number.parseInt(parts[0], 10)
      const month = Number.parseInt(parts[1], 10) - 1 // Los meses en JS son 0-11
      const year = Number.parseInt(parts[2], 10)

      const newDate = new Date(year, month, day)

      // Verificar que la fecha es válida
      if (!isNaN(newDate.getTime())) {
        onDateChange(newDate)
      }
    }
  }

  // Abrir el selector de fecha nativo al hacer clic en el botón
  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker()
    }
  }

  return (
    <div className="relative flex w-full">
      <Input
        ref={inputRef}
        type="date"
        id={id}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          if (e.target.value) {
            onDateChange(new Date(e.target.value))
          }
        }}
        className="absolute opacity-0 w-full h-full cursor-pointer z-10"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className="pr-10 w-full"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full"
        onClick={handleButtonClick}
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
