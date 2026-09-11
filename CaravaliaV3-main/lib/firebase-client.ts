import { initializeApp, getApps, deleteApp, type FirebaseApp } from "firebase/app"
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  collection,
  getDocs,
  limit,
  query,
  type Firestore,
} from "firebase/firestore"

// ──────────────────────────────────────────────
// Claves de almacenamiento local
// ──────────────────────────────────────────────
const STORAGE_KEYS = {
  apiKey: "firebase-api-key",
  authDomain: "firebase-auth-domain",
  projectId: "firebase-project-id",
  storageBucket: "firebase-storage-bucket",
  messagingSenderId: "firebase-messaging-sender-id",
  appId: "firebase-app-id",
  useFirebase: "useFirebase",
} as const

// ──────────────────────────────────────────────
// Lectura de credenciales
// ──────────────────────────────────────────────
export function obtenerCredencialesFirebase() {
  if (typeof window === "undefined") {
    return null
  }

  // Valores por defecto (priorizando variables de entorno para Vercel)
  const defaultApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBrE2iJjXZhtxauv-p5edYk1sLt4kYdBP4"
  const defaultProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "caravaliav2"
  const defaultAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:915217195809:web:e604ea6856fc2d2ab39460"


  const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey) || defaultApiKey
  const projectId = localStorage.getItem(STORAGE_KEYS.projectId) || defaultProjectId

  if (!apiKey || !projectId) {
    return null
  }

  return {
    apiKey,
    authDomain: localStorage.getItem(STORAGE_KEYS.authDomain) || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: localStorage.getItem(STORAGE_KEYS.storageBucket) || `${projectId}.firebasestorage.app`,
    messagingSenderId: localStorage.getItem(STORAGE_KEYS.messagingSenderId) || "",
    appId: localStorage.getItem(STORAGE_KEYS.appId) || defaultAppId,
  }
}

// ──────────────────────────────────────────────
// Persistencia de credenciales
// ──────────────────────────────────────────────
export function guardarCredencialesFirebase(config: {
  apiKey: string
  authDomain?: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}): void {
  localStorage.setItem(STORAGE_KEYS.apiKey, config.apiKey)
  localStorage.setItem(STORAGE_KEYS.projectId, config.projectId)

  if (config.authDomain) {
    localStorage.setItem(STORAGE_KEYS.authDomain, config.authDomain)
  }
  if (config.storageBucket) {
    localStorage.setItem(STORAGE_KEYS.storageBucket, config.storageBucket)
  }
  if (config.messagingSenderId) {
    localStorage.setItem(STORAGE_KEYS.messagingSenderId, config.messagingSenderId)
  }
  if (config.appId) {
    localStorage.setItem(STORAGE_KEYS.appId, config.appId)
  }
}

// ──────────────────────────────────────────────
// Flags de activación
// ──────────────────────────────────────────────
export function isFirebaseActivo(): boolean {
  if (typeof window === "undefined") return false
  
  const savedValue = localStorage.getItem(STORAGE_KEYS.useFirebase)
  // Por defecto es true si no se ha configurado explícitamente como false
  return savedValue === null || savedValue === "true"
}

export function setFirebaseActivo(activo: boolean): void {
  localStorage.setItem(STORAGE_KEYS.useFirebase, activo.toString())
}

// ──────────────────────────────────────────────
// Singleton de la instancia Firebase
// ──────────────────────────────────────────────
let firebaseApp: FirebaseApp | null = null
let firestoreDb: Firestore | null = null

/**
 * Crea (o reutiliza) la instancia singleton de Firebase.
 * Si las credenciales cambian, destruye la instancia anterior
 * y crea una nueva.
 */
export function createFirebaseApp(): FirebaseApp | null {
  const config = obtenerCredencialesFirebase()

  if (!config) {
    console.warn("Firebase: No hay credenciales configuradas.")
    return null
  }

  // Si ya existe una app, verificar que las credenciales no hayan cambiado
  const existingApps = getApps()
  if (existingApps.length > 0) {
    const existingApp = existingApps[0]
    if (existingApp.options.projectId === config.projectId) {
      firebaseApp = existingApp
      return existingApp
    }
    // Las credenciales cambiaron: destruir la app anterior
    deleteApp(existingApp)
    firebaseApp = null
    firestoreDb = null
  }

  try {
    firebaseApp = initializeApp(config)
    console.log("Firebase: App inicializada correctamente para proyecto:", config.projectId)
    return firebaseApp
  } catch (error) {
    console.error("Firebase: Error al inicializar la app:", error)
    return null
  }
}

/**
 * Devuelve la instancia de Firestore.
 * Crea la app de Firebase si no existe.
 */
export function getFirestoreDb(): Firestore | null {
  if (firestoreDb) return firestoreDb

  const app = createFirebaseApp()
  if (!app) return null

  try {
    firestoreDb = getFirestore(app)
    
    // Habilitar persistencia offline si estamos en el navegador
    if (typeof window !== "undefined") {
      enableMultiTabIndexedDbPersistence(firestoreDb).catch((err) => {
        if (err.code === "failed-precondition") {
          // Múltiples pestañas abiertas, la persistencia solo se puede habilitar en una.
          console.warn("Firebase: Persistencia falló (pre-condición):", err)
        } else if (err.code === "unimplemented") {
          // El navegador actual no admite persistencia.
          console.warn("Firebase: Navegador no admite persistencia.")
        } else {
          console.error("Firebase: Error al habilitar persistencia:", err)
        }
      })
    }
    
    return firestoreDb
  } catch (error) {
    console.error("Firebase: Error al obtener Firestore:", error)
    return null
  }
}

// ──────────────────────────────────────────────
// Comprobación de conexión
// ──────────────────────────────────────────────
export async function comprobarConexionFirebase(): Promise<boolean> {
  try {
    const db = getFirestoreDb()
    if (!db) return false

    // Intentar leer un documento para verificar la conexión
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout de conexión Firebase (10s)")), 10000)
    )

    const fetchPromise = (async () => {
      const q = query(collection(db, "reservas"), limit(1))
      await getDocs(q)
      return true
    })()

    return await Promise.race([fetchPromise, timeoutPromise])
  } catch (error) {
    console.error("Firebase: Error al comprobar conexión:", error)
    return false
  }
}
