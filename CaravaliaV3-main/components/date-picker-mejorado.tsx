"use client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export function DatePickerMejorado({
  date,
  setDate,
  placeholder = "Seleccionar fecha",
  className,
  id,
  disabled = false,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          weekStartsOn={1}
          locale={es}
          className="border-none shadow-none"
          styles={{
            caption_label: { textTransform: "capitalize" },
            table: { width: "100%" },
            head_cell: {
              textTransform: "capitalize",
              fontWeight: "bold",
              padding: "8px",
              textAlign: "center",
            },
            cell: {
              padding: "8px",
              textAlign: "center",
            },
            button: {
              width: "100%",
              height: "100%",
              borderRadius: "4px",
              padding: "8px",
              margin: "0",
            },
            nav_button: {
              padding: "8px",
            },
            nav: {
              display: "flex",
              justifyContent: "space-between",
              padding: "8px",
            },
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
