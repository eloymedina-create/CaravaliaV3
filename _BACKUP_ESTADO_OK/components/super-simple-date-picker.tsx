"use client"

import { useState, useRef, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SuperSimpleDatePickerProps {
  id?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  align?: "left" | "right"
}

export function SuperSimpleDatePicker({
  id,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  align = "left",
}: SuperSimpleDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value || new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar el calendario al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Actualizar el mes actual cuando cambia el valor
  useEffect(() => {
    if (value) {
      setCurrentMonth(value)
    }
  }, [value])

  // Navegar al mes anterior
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Seleccionar una fecha
  const handleSelectDate = (date: Date) => {
    onChange(date)
    setOpen(false)
  }

  // Limpiar la selección
  const handleClear = () => {
    onChange(undefined)
    setOpen(false)
  }

  // Seleccionar hoy
  const handleToday = () => {
    const today = new Date()
    onChange(today)
    setCurrentMonth(today)
    setOpen(false)
  }

  // Generar días del mes actual
  const daysInMonth = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }

  // Obtener el nombre del día de la semana
  const getDayName = (day: number) => {
    const days = ["L", "M", "X", "J", "V", "S", "D"]
    return days[day]
  }

  // Obtener el primer día de la semana (0 = domingo, 1 = lunes, etc.)
  const getFirstDayOfMonth = () => {
    const firstDay = startOfMonth(currentMonth).getDay()
    // Convertir de 0-6 (domingo a sábado) a 1-7 (lunes a domingo)
    return firstDay === 0 ? 6 : firstDay - 1
  }

  // Generar espacios en blanco para los días anteriores al primer día del mes
  const blanks = Array(getFirstDayOfMonth()).fill(null)

  // Combinar espacios en blanco y días del mes
  const allDays = [...blanks, ...daysInMonth()]

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal border-caravalia-200 bg-white hover:bg-caravalia-50 hover:border-caravalia-300"
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-caravalia-500" />
        {value ? (
          format(value, "dd/MM/yyyy", { locale: es })
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      {open && (
        <div className={cn(
          "absolute z-50 mt-1 bg-white border border-caravalia-200 rounded-md shadow-lg p-3 w-[300px]",
          align === "right" ? "right-0" : "left-0"
        )}>
          <div className="flex justify-between items-center mb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 text-caravalia-600 hover:text-caravalia-800 hover:bg-caravalia-100"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium capitalize">{format(currentMonth, "MMMM yyyy", { locale: es })}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 text-caravalia-600 hover:text-caravalia-800 hover:bg-caravalia-100"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="text-center text-xs font-medium text-gray-500 h-7 flex items-center justify-center"
              >
                {getDayName(i)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {allDays.map((day, index) => {
              if (!day) {
                return <div key={`blank-${index}`} className="h-7" />
              }

              const isSelected = value ? isSameDay(day, value) : false
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isTodayDate = isToday(day)

              return (
                <Button
                  key={day.toString()}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 p-0 text-sm rounded-md",
                    isSelected && "bg-caravalia-600 text-white hover:bg-caravalia-700",
                    !isSelected && isTodayDate && "border border-caravalia-400 text-caravalia-600",
                    !isSelected && !isTodayDate && "hover:bg-caravalia-100",
                    !isCurrentMonth && "text-gray-300 hover:bg-gray-50",
                  )}
                  onClick={() => handleSelectDate(day)}
                >
                  {format(day, "d")}
                </Button>
              )
            })}
          </div>

          <div className="flex justify-between mt-3 pt-2 border-t border-caravalia-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-caravalia-600 hover:text-caravalia-800 hover:bg-caravalia-100"
              onClick={handleClear}
            >
              Borrar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-caravalia-600 hover:text-caravalia-800 hover:bg-caravalia-100"
              onClick={handleToday}
            >
              Hoy
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
