"use client"

/**
 * Utilidad única para el registro de auditoría.
 * Identifica automáticamente al usuario activo de la sesión.
 */
export const registrarActividad = (accion: string) => {
  try {
    if (typeof window === "undefined") return

    // Obtener registros existentes o inicializar array vacío
    const registrosString = localStorage.getItem("registro-actividad") || "[]"
    const registros = JSON.parse(registrosString)

    // Obtener el usuario activo de la sesión (se establece al hacer login)
    const activeUser = localStorage.getItem("activeUser") || "Usuario"

    // Añadir nuevo registro
    registros.push({
      accion,
      fecha: new Date().toISOString(),
      usuario: activeUser,
    })

    // Limitar a los últimos 200 registros (aumentado para mayor trazabilidad)
    const registrosLimitados = registros.slice(-200)

    // Guardar en localStorage
    localStorage.setItem("registro-actividad", JSON.stringify(registrosLimitados))
    
    // Si Firebase está activo, opcionalmente podrías sincronizar el log aquí
    // pero por ahora mantenemos localStorage + Backup central para velocidad.
    console.log(`Auditoría [${activeUser}]: ${accion}`)
  } catch (error) {
    console.error("Error al registrar actividad:", error)
  }
}

export const obtenerRegistroActividad = () => {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("registro-actividad") || "[]"
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export const limpiarRegistroActividad = () => {
  if (typeof window === "undefined") return
  localStorage.setItem("registro-actividad", "[]")
}
