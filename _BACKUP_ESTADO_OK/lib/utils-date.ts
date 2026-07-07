import { parse, isValid } from "date-fns"

/**
 * Parsea una fecha de forma segura intentando varios formatos (ISO y dd/MM/yyyy)
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
