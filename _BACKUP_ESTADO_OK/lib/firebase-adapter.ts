import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  type DocumentData,
} from "firebase/firestore"
import { isFirebaseActivo, comprobarConexionFirebase, getFirestoreDb } from "./firebase-client"
import type { ReservaCompleta, Autocaravana, Gasto, ValeDescuento } from "./types"
import type { PrecioReferencia, RegistroPrecio } from "./precios-types"
import type { PlantillaDocumento } from "./plantillas-store"

// ──────────────────────────────────────────────
// Nombres de colecciones (centralizados)
// ──────────────────────────────────────────────
const COLECCIONES = {
  reservas: "reservas",
  autocaravanas: "autocaravanas",
  precios_referencia: "precios_referencia",
  registros_precios: "registros_precios",
  gastos: "gastos",
  usuarios: "usuarios",
  vales: "vales",
  plantillas: "plantillas",
} as const

// Re-exportar desde el cliente para conveniencia si es necesario, 
// pero mejor importar desde el cliente directamente.
export { isFirebaseActivo, comprobarConexionFirebase }

function requireDb() {
  const db = getFirestoreDb()
  if (!db) {
    throw new Error("Firebase no está configurado. Configure las credenciales en Ajustes.")
  }
  return db
}

/**
 * Elimina recursivamente todas las propiedades con valor 'undefined' de un objeto,
 * ya que Firestore no admite este tipo de dato.
 */
function limpiarObjetoParaFirebase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(limpiarObjetoParaFirebase);
  }

  const cleanObj: any = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined) {
      cleanObj[key] = limpiarObjetoParaFirebase(value);
    }
  });

  return cleanObj;
}

// ═══════════════════════════════════════════════
// RESERVAS
// ═══════════════════════════════════════════════

export async function obtenerReservasFirebase(): Promise<ReservaCompleta[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.reservas))
    return snapshot.docs.map((d) => d.data() as ReservaCompleta)
  } catch (error) {
    console.error("Firebase: Error al obtener reservas:", error)
    return []
  }
}

export async function guardarReservaFirebase(reserva: ReservaCompleta): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.reservas, reserva.id)
    
    // Limpiar objeto para evitar errores con campos 'undefined'
    const datosLimpios = limpiarObjetoParaFirebase({
      ...reserva,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Reserva guardada:", reserva.id)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar reserva:", error)
    return false
  }
}

export async function eliminarReservaFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.reservas, id))
    console.log("Firebase: Reserva eliminada:", id)
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar reserva:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// AUTOCARAVANAS
// ═══════════════════════════════════════════════

export async function obtenerAutocaravanasFirebase(): Promise<Autocaravana[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.autocaravanas))
    return snapshot.docs.map((d) => d.data() as Autocaravana)
  } catch (error) {
    console.error("Firebase: Error al obtener autocaravanas:", error)
    return []
  }
}

export async function guardarAutocaravanaFirebase(autocaravana: Autocaravana): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.autocaravanas, autocaravana.id)
    
    const datosLimpios = limpiarObjetoParaFirebase({
      ...autocaravana,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Autocaravana guardada:", autocaravana.id)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar autocaravana:", error)
    return false
  }
}

export async function eliminarAutocaravanaFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.autocaravanas, id))
    console.log("Firebase: Autocaravana eliminada:", id)
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar autocaravana:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// PRECIOS DE REFERENCIA
// ═══════════════════════════════════════════════

export async function obtenerPreciosReferenciaFirebase(): Promise<PrecioReferencia[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.precios_referencia))
    return snapshot.docs.map((d) => d.data() as PrecioReferencia)
  } catch (error) {
    console.error("Firebase: Error al obtener precios de referencia:", error)
    return []
  }
}

export async function guardarPrecioReferenciaFirebase(precio: PrecioReferencia): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.precios_referencia, precio.modeloId)
    
    const datosLimpios = limpiarObjetoParaFirebase({
      ...precio,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Precio de referencia guardado:", precio.modeloId)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar precio de referencia:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// REGISTROS DE PRECIOS
// ═══════════════════════════════════════════════

export async function obtenerRegistrosPreciosFirebase(): Promise<RegistroPrecio[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.registros_precios))
    return snapshot.docs.map((d) => d.data() as RegistroPrecio)
  } catch (error) {
    console.error("Firebase: Error al obtener registros de precios:", error)
    return []
  }
}

export async function guardarRegistroPrecioFirebase(registro: RegistroPrecio): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.registros_precios, registro.id)
    
    const datosLimpios = limpiarObjetoParaFirebase({
      ...registro,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Registro de precio guardado:", registro.id)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar registro de precio:", error)
    return false
  }
}

export async function eliminarRegistroPrecioFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.registros_precios, id))
    console.log("Firebase: Registro de precio eliminado:", id)
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar registro de precio:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// GASTOS
// ═══════════════════════════════════════════════

export async function obtenerGastosFirebase(): Promise<Gasto[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.gastos))
    return snapshot.docs.map((d) => d.data() as Gasto)
  } catch (error) {
    console.error("Firebase: Error al obtener gastos:", error)
    return []
  }
}

export async function guardarGastoFirebase(gasto: Gasto): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.gastos, gasto.id)
    
    const datosLimpios = limpiarObjetoParaFirebase({
      ...gasto,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Gasto guardado:", gasto.id)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar gasto:", error)
    return false
  }
}

export async function eliminarGastoFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.gastos, id))
    console.log("Firebase: Gasto eliminado:", id)
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar gasto:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════

export async function obtenerUsuariosFirebase(): Promise<any[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.usuarios))
    return snapshot.docs.map((d) => d.data())
  } catch (error) {
    console.error("Firebase: Error al obtener usuarios:", error)
    return []
  }
}

export async function guardarUsuarioFirebase(usuario: any): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.usuarios, usuario.id || usuario.nombre)
    
    const datosLimpios = limpiarObjetoParaFirebase({
      ...usuario,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar usuario:", error)
    return false
  }
}

export async function eliminarUsuarioFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.usuarios, id))
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar usuario:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// VALES REGALO
// ═══════════════════════════════════════════════

export async function obtenerValesFirebase(): Promise<ValeDescuento[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.vales))
    return snapshot.docs.map((d) => d.data() as ValeDescuento)
  } catch (error) {
    console.error("Firebase: Error al obtener vales:", error)
    return []
  }
}

export async function guardarValeFirebase(vale: ValeDescuento): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.vales, vale.id)
    
    // Limpiamos el objeto para evitar errores con campos 'undefined'
    const datosLimpios = limpiarObjetoParaFirebase({
      ...vale,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Vale guardado:", vale.id)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar vale:", error)
    return false
  }
}

export async function eliminarValeFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.vales, id))
    console.log("Firebase: Vale eliminado:", id)
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar vale:", error)
    return false
  }
}

// ═══════════════════════════════════════════════
// PLANTILLAS DE DOCUMENTOS
// ═══════════════════════════════════════════════

export async function obtenerPlantillasFirebase(): Promise<PlantillaDocumento[]> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, COLECCIONES.plantillas))
    return snapshot.docs.map((d) => d.data() as PlantillaDocumento)
  } catch (error) {
    console.error("Firebase: Error al obtener plantillas:", error)
    return []
  }
}

export async function guardarPlantillaFirebase(plantilla: PlantillaDocumento): Promise<boolean> {
  try {
    const db = requireDb()
    const docRef = doc(db, COLECCIONES.plantillas, plantilla.id)
    
    const datosLimpios = limpiarObjetoParaFirebase({
      ...plantilla,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, datosLimpios)
    console.log("Firebase: Plantilla guardada:", plantilla.id)
    return true
  } catch (error) {
    console.error("Firebase: Error al guardar plantilla:", error)
    return false
  }
}

export async function eliminarPlantillaFirebase(id: string): Promise<boolean> {
  try {
    const db = requireDb()
    await deleteDoc(doc(db, COLECCIONES.plantillas, id))
    console.log("Firebase: Plantilla eliminada:", id)
    return true
  } catch (error) {
    console.error("Firebase: Error al eliminar plantilla:", error)
    return false
  }
}


// ═══════════════════════════════════════════════
// MIGRACIÓN: Subir todo el LocalStorage a Firebase
// ═══════════════════════════════════════════════

export async function migrarDatosLocalAFirebase(): Promise<{
  exito: boolean
  mensaje: string
  detalles: { reservas: number; autocaravanas: number; gastos: number; precios: number }
}> {
  const detalles = { reservas: 0, autocaravanas: 0, gastos: 0, precios: 0 }

  try {
    const db = requireDb()

    // ── Reservas ──
    const claveReservas = ["caravalia-reservas", "reservas"]
    for (const clave of claveReservas) {
      const raw = localStorage.getItem(clave)
      if (raw) {
        const reservas: ReservaCompleta[] = JSON.parse(raw)
        for (const r of reservas) {
          await guardarReservaFirebase(r)
          detalles.reservas++
        }
        break // Usar solo la primera clave que tenga datos
      }
    }

    // ── Autocaravanas ──
    const claveAutos = ["caravalia-autocaravanas", "autocaravanas"]
    for (const clave of claveAutos) {
      const rawAutos = localStorage.getItem(clave)
      if (rawAutos) {
        const autos: Autocaravana[] = JSON.parse(rawAutos)
        for (const a of autos) {
          await guardarAutocaravanaFirebase(a)
          detalles.autocaravanas++
        }
        break
      }
    }

    // ── Gastos ──
    const rawGastos = localStorage.getItem("gastos")
    if (rawGastos) {
      const gastos: Gasto[] = JSON.parse(rawGastos)
      for (const g of gastos) {
        await guardarGastoFirebase(g)
        detalles.gastos++
      }
    }

    // ── Precios de referencia ──
    const rawPrecios = localStorage.getItem("preciosReferencia")
    if (rawPrecios) {
      const precios: PrecioReferencia[] = JSON.parse(rawPrecios)
      for (const p of precios) {
        await guardarPrecioReferenciaFirebase(p)
        detalles.precios++
      }
    }

    // ── Registros de precios ──
    const rawRegistros = localStorage.getItem("registrosPrecios")
    if (rawRegistros) {
      const registros: RegistroPrecio[] = JSON.parse(rawRegistros)
      for (const r of registros) {
        await guardarRegistroPrecioFirebase(r)
      }
    }

    // ── Usuarios ──
    const rawUsuarios = typeof window !== "undefined" ? localStorage.getItem("caravalia-usuarios") : null
    if (rawUsuarios) {
      const usuarios = JSON.parse(rawUsuarios)
      for (const u of usuarios) {
        await guardarUsuarioFirebase(u)
      }
    }

    // ── Vales Regalo ──
    const rawVales = typeof window !== "undefined" ? localStorage.getItem("caravalia-vales") : null
    if (rawVales) {
      const vales: ValeDescuento[] = JSON.parse(rawVales)
      for (const v of vales) {
        await guardarValeFirebase(v)
        detalles.reservas++ // Usamos el contador de generales o podemos añadir uno nuevo si es necesario
      }
    }

    const total = detalles.reservas + detalles.autocaravanas + detalles.gastos + detalles.precios

    return {
      exito: true,
      mensaje: `Migración completada. ${total} registros migrados a Firebase.`,
      detalles,
    }
  } catch (error) {
    console.error("Firebase: Error durante la migración:", error)
    return {
      exito: false,
      mensaje: `Error durante la migración: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}

// ═══════════════════════════════════════════════
// LISTENERS (TIEMPO REAL)
// ═══════════════════════════════════════════════

/**
 * Escucha cambios en tiempo real de una colección específica
 */
export function escucharColeccionFirebase<T>(coleccionNombre: string, callback: (datos: T[]) => void): () => void {
  try {
    const db = requireDb()
    const q = query(collection(db, coleccionNombre))

    return onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((d) => d.data() as T)
      callback(datos)
    })
  } catch (error) {
    console.error(`Firebase: Error al suscribirse a ${coleccionNombre}:`, error)
    return () => {}
  }
}

export function escucharReservasFirebase(callback: (reservas: ReservaCompleta[]) => void): () => void {
  return escucharColeccionFirebase<ReservaCompleta>(COLECCIONES.reservas, callback)
}

export function escucharAutocaravanasFirebase(callback: (autos: Autocaravana[]) => void): () => void {
  return escucharColeccionFirebase<Autocaravana>(COLECCIONES.autocaravanas, callback)
}

export function escucharGastosFirebase(callback: (gastos: Gasto[]) => void): () => void {
  return escucharColeccionFirebase<Gasto>(COLECCIONES.gastos, callback)
}

export function escucharPreciosReferenciaFirebase(callback: (precios: PrecioReferencia[]) => void): () => void {
  return escucharColeccionFirebase<PrecioReferencia>(COLECCIONES.precios_referencia, callback)
}

export function escucharRegistrosPreciosFirebase(callback: (registros: RegistroPrecio[]) => void): () => void {
  return escucharColeccionFirebase<RegistroPrecio>(COLECCIONES.registros_precios, callback)
}

export function escucharUsuariosFirebase(callback: (usuarios: any[]) => void): () => void {
  return escucharColeccionFirebase<any>(COLECCIONES.usuarios, callback)
}

export function escucharValesFirebase(callback: (vales: ValeDescuento[]) => void): () => void {
  return escucharColeccionFirebase<ValeDescuento>(COLECCIONES.vales, callback)
}

export function escucharPlantillasFirebase(callback: (plantillas: PlantillaDocumento[]) => void): () => void {
  return escucharColeccionFirebase<PlantillaDocumento>(COLECCIONES.plantillas, callback)
}

/**
 * Elimina todos los documentos de una colección específica (Uso administrativo/restauración)
 */
export async function limpiarColeccionFirebase(coleccionNombre: string): Promise<boolean> {
  try {
    const db = requireDb()
    const snapshot = await getDocs(collection(db, coleccionNombre))
    
    console.log(`Firebase: Limpiando ${snapshot.size} documentos de ${coleccionNombre}...`)
    
    const promesas = snapshot.docs.map(d => deleteDoc(doc(db, coleccionNombre, d.id)))
    await Promise.all(promesas)
    
    return true
  } catch (error) {
    console.error(`Firebase: Error al limpiar colección ${coleccionNombre}:`, error)
    return false
  }
}
