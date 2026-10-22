import { parse, isValid, differenceInCalendarDays } from "date-fns"

/**
 * Parsea una fecha de forma segura intentando varios formatos (ISO, YYYY-MM-DD y dd/MM/yyyy)
 * @param fecha Cualquier valor que represente una fecha
 * @returns Un objeto Date válido o la fecha actual si es inválida
 */
export function parseFechaSegura(fecha: any): Date {
  if (!fecha) return new Date()
  
  // Si ya es un objeto Date
  if (fecha instanceof Date && !isNaN(fecha.getTime())) {
    return fecha
  }

  // Si es una cadena
  if (typeof fecha === "string") {
    // Si viene en formato simple YYYY-MM-DD (del input type="date"), fijamos hora neutra al mediodía local
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, m, d] = fecha.split("-").map(Number)
      return new Date(y, m - 1, d, 12, 0, 0)
    }

    // 1. Intentar parsear como ISO (YYYY-MM-DD...)
    const fechaISO = new Date(fecha)
    if (!isNaN(fechaISO.getTime())) {
      return fechaISO
    }

    // 2. Intentar parsear como dd/MM/yyyy
    try {
      const parsedDate = parse(fecha, "dd/MM/yyyy", new Date())
      if (isValid(parsedDate)) {
        return parsedDate
      }
    } catch (e) {
      // Continuar al siguiente intento
    }
    
    // 3. Intentar parsear como dd-MM-yyyy (por si acaso)
    try {
      const parsedDate = parse(fecha, "dd-MM-yyyy", new Date())
      if (isValid(parsedDate)) {
        return parsedDate
      }
    } catch (e) {
      // Continuar
    }
  }

  // Si todo falla, devolver la fecha actual para evitar errores de ejecución
  // pero registrar el error para depuración
  console.warn("No se pudo parsear la fecha:", fecha)
  return new Date()
}

/**
 * Calcula los días de alquiler de forma blindada por días naturales de calendario (ambos inclusive).
 * Es 100% inmune a cambios de horario estacionales (verano/invierno - DST), desfases de horas y zonas horarias.
 * 
 * Ejemplos:
 * - 23 de octubre a 25 de octubre -> 3 días (23, 24, 25)
 * - 23 de octubre a 26 de octubre -> 4 días (23, 24, 25, 26) incluso atravesando el cambio de hora nocturno
 * - 23 de octubre a 23 de octubre -> 1 día
 */
export function calcularDiasAlquiler(fechaInicio: any, fechaFin: any): number {
  if (!fechaInicio || !fechaFin) return 1

  const dIni = parseFechaSegura(fechaInicio)
  const dFin = parseFechaSegura(fechaFin)

  const dias = differenceInCalendarDays(dFin, dIni) + 1
  return Math.max(1, isNaN(dias) ? 1 : dias)
}

