"use client"

import { obtenerReservas, limpiarCache as limpiarCacheReservas } from "@/lib/reservas-store"
import { obtenerAutocaravanas, limpiarCache as limpiarCacheAutos } from "@/lib/autocaravanas-store"
import { obtenerGastosLocal } from "@/lib/rentabilidad-store"
import { obtenerPreciosReferenciaLocal, obtenerRegistrosPreciosLocal } from "@/lib/precios-store"
import { obtenerVales } from "@/lib/vales-store"
import { sobreescribirNubeConLocal } from "@/lib/sync-utils"

interface FullBackup {
  version: string
  timestamp: string
  // Datos de negocio
  reservas: any[]
  autocaravanas: any[]
  gastos: any[]
  preciosReferencia: any[]
  registrosPrecios: any[]
  usuarios: any[]
  vales: any[]
  // Configuración y estado de la app
  configuracion: {
    empresa: Record<string, any>
    preferencias: Record<string, any>
    seguridad: Record<string, any>
    sistema: Record<string, any>
  }
}

// Claves específicas de configuración a incluir en el backup
const CLAVES_CONFIG = {
  empresa: [
    "empresa-nombre", "empresa-cif", "empresa-direccion", 
    "empresa-poblacion", "empresa-cp", "empresa-telefono", 
    "empresa-email", "empresaData"
  ],
  preferencias: [
    "imprimir-logo", "imprimir-pie", "imprimir-compacto", "condiciones", "plantillasDocumentos"
  ],
  seguridad: [
    "app-pin", "admin-password"
  ],
  sistema: [
    "lastSyncTime",
    "firebase-api-key",
    "firebase-project-id",
    "firebase-app-id",
    "firebase-auth-domain",
    "firebase-storage-bucket",
    "firebase-messaging-sender-id",
    "useFirebase",
    "sheets-api-url",
    "useMockApi",
    "registro-actividad",
  ],
}

// Función para exportar la copia de seguridad TOTAL
export function exportarBackup(): string | null {
  try {
    const config: FullBackup["configuracion"] = {
      empresa: {},
      preferencias: {},
      seguridad: {},
      sistema: {}
    }

    // Capturar todas las claves de configuración
    Object.entries(CLAVES_CONFIG).forEach(([seccion, claves]) => {
      claves.forEach(clave => {
        const valor = localStorage.getItem(clave)
        if (valor !== null) {
          (config as any)[seccion][clave] = valor
        }
      })
    })

    const backup: FullBackup = {
      version: "2.4", // Incluye Usuarios y Migración Multi-Usuario
      timestamp: new Date().toISOString(),
      reservas: obtenerReservas(),
      autocaravanas: obtenerAutocaravanas(),
      gastos: obtenerGastosLocal(),
      preciosReferencia: obtenerPreciosReferenciaLocal(),
      registrosPrecios: obtenerRegistrosPreciosLocal(),
      usuarios: JSON.parse(localStorage.getItem("caravalia-usuarios") || "[]"),
      vales: obtenerVales(),
      configuracion: config
    }

    // CAPTURA DINÁMICA: Escanear todo localStorage para contadores y otros datos dinámicos
    // Esto asegura que la numeración de facturas/reservas se mantenga íntegra
    if (typeof window !== "undefined") {
      const dinamico: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        // Capturar contadores de secuencia y cualquier otra clave de sistema prefijada
        if (key && (key.startsWith("ultimo-numero-") || key.startsWith("contador-"))) {
          dinamico[key] = localStorage.getItem(key) || ""
        }
      }
      // Añadir al objeto sistema para que se restaure automáticamente en Caso A
      backup.configuracion.sistema = {
        ...backup.configuracion.sistema,
        ...dinamico
      }
    }
    
    return JSON.stringify(backup)
  } catch (error) {
    console.error("Error al exportar la copia de seguridad:", error)
    return null
  }
}

// Función para restaurar la copia de seguridad (Soporta formatos 2.0, 2.1, 2.2 y 2.3)
export async function restaurarBackup(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json)

    // Caso A: Backup con Configuración (Versión 2.1+)
    if (parseFloat(data.version) >= 2.1 && data.configuracion) {
      // Restaurar configuración
      Object.values(data.configuracion).forEach((seccion: any) => {
        Object.entries(seccion).forEach(([clave, valor]) => {
          localStorage.setItem(clave, valor as string)
        })
      })
    }

    // Caso B: Backup Estructural (Versión 2.0 en adelante)
    if (parseFloat(data.version) >= 2.0 && data.reservas) {
      localStorage.setItem("caravalia-reservas", JSON.stringify(data.reservas))
      localStorage.setItem("caravalia-autocaravanas", JSON.stringify(data.autocaravanas || []))
      localStorage.setItem("gastos", JSON.stringify(data.gastos || []))
      localStorage.setItem("preciosReferencia", JSON.stringify(data.preciosReferencia || []))
      localStorage.setItem("preciosReferencia", JSON.stringify(data.preciosReferencia || []))
      localStorage.setItem("registrosPrecios", JSON.stringify(data.registrosPrecios || []))
      
      if (data.usuarios) {
        localStorage.setItem("caravalia-usuarios", JSON.stringify(data.usuarios))
      }

      if (data.vales) {
        localStorage.setItem("caravalia-vales", JSON.stringify(data.vales))
      }
    } 
    // Caso C: Backup Viejo (Solo un array de reservas)
    else if (Array.isArray(data)) {
      localStorage.setItem("caravalia-reservas", json)
    } 
    else {
      throw new Error("Formato de backup no reconocido")
    }

    // Limpiar cachés para forzar recarga de los stores locales
    limpiarCacheReservas()
    limpiarCacheAutos()

    // ── COORDINACIÓN CON LA NUBE ──
    // Si Firebase está configurado después de la restauración, 
    // forzamos que la Nube sea igual a la copia de seguridad recién restaurada.
    const useFirebase = localStorage.getItem("useFirebase") === "true"
    if (useFirebase) {
      console.log("Sincronizando restauración con Firebase...")
      await sobreescribirNubeConLocal()
    }
    
    return true
  } catch (error) {
    console.error("Error al restaurar la copia de seguridad:", error)
    return false
  }
}
