import { isFirebaseActivo } from "./firebase-client"
import { guardarConfigFirebase } from "./firebase-adapter"

export interface AppConfig {
  fianza: number
  porcentajeSenal: number
}

const CONFIG_KEY = "caravalia_app_config"

const defaultConfig: AppConfig = {
  fianza: 900,
  porcentajeSenal: 30,
}

export function obtenerConfiguracion(): AppConfig {
  if (typeof window === "undefined") return defaultConfig

  try {
    const saved = localStorage.getItem(CONFIG_KEY)
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error("Error al obtener configuración:", error)
  }

  return defaultConfig
}

export function guardarConfiguracion(config: Partial<AppConfig>): boolean {
  if (typeof window === "undefined") return false

  try {
    const current = obtenerConfiguracion()
    const updated = { ...current, ...config, sincronizado: true }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("storage"))
    
    if (isFirebaseActivo()) {
      guardarConfigFirebase(updated)
    }
    return true
  } catch (error) {
    console.error("Error al guardar configuración:", error)
    return false
  }
}
