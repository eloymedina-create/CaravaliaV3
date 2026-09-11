"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

interface SimpleDatePickerProps {
  date: Date | null
  onDateChange: (date: Date | null) => void
  placeholder?: string
  id?: string
}

export function SimpleDatePicker({ date, onDateChange, placeholder = "Seleccionar fecha", id }: SimpleDatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        id={id}
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setOpen(true)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "dd/MM/yyyy", { locale: es }) : <span>{placeholder}</span>}
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg p-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Selecciona una fecha</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-6 w-6 p-0">
              ×
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={(newDate) => {
              onDateChange(newDate)
              setOpen(false)
            }}
            weekStartsOn={1}
            locale={es}
          />
        </div>
      )}
    </div>
  )
}
