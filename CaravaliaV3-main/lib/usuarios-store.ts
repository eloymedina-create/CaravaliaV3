"use client"

import { 
  obtenerUsuariosFirebase, 
  guardarUsuarioFirebase, 
  eliminarUsuarioFirebase 
} from "./firebase-adapter"

export interface Usuario {
  id: string
  nombre: string
  pin: string
  fechaAlta: string
}

const CLAVE_USUARIOS = "caravalia-usuarios"

/**
 * Obtiene la lista de usuarios. Prioriza Firebase si está disponible,
 * si no, usa localStorage. Siempre asegura un usuario admin por defecto.
 */
export async function obtenerUsuarios(): Promise<Usuario[]> {
  try {
    // 1. Intentar obtener de Firebase
    const usuariosNube = await obtenerUsuariosFirebase()
    if (usuariosNube && usuariosNube.length > 0) {
      localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuariosNube))
      return usuariosNube as Usuario[]
    }

    // 2. Fallback a LocalStorage
    const raw = localStorage.getItem(CLAVE_USUARIOS)
    if (raw) {
      return JSON.parse(raw) as Usuario[]
    }

    // 3. Crear usuario por defecto si no hay nada
    const defaultUser: Usuario = {
      id: "admin-default",
      nombre: "Administrador",
      pin: localStorage.getItem("admin-password") || localStorage.getItem("app-pin") || "8521",
      fechaAlta: new Date().toISOString()
    }
    const inicial = [defaultUser]
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(inicial))
    
    // Intentar persistir en nube el usuario inicial
    await guardarUsuarioFirebase(defaultUser)
    
    return inicial
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

export async function guardarUsuario(usuario: Usuario): Promise<boolean> {
  try {
    const usuarios = await obtenerUsuarios()
    const index = usuarios.findIndex(u => u.id === usuario.id)
    
    if (index >= 0) {
      usuarios[index] = usuario
    } else {
      usuarios.push(usuario)
    }

    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios))
    return await guardarUsuarioFirebase(usuario)
  } catch (error) {
    console.error("Error al guardar usuario:", error)
    return false
  }
}

export async function eliminarUsuario(id: string): Promise<boolean> {
  try {
    const usuarios = await obtenerUsuarios()
    const filtrados = usuarios.filter(u => u.id !== id)
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(filtrados))
    
    // Intentar eliminar de Firebase, pero no bloquear si falla
    eliminarUsuarioFirebase(id).catch(err => {
      console.warn("Sincronización de borrado con Firebase falló (se reintentará en el próximo inicio):", err)
    })
    
    return true // Éxito en local
  } catch (error) {
    console.error("Error al eliminar usuario en local:", error)
    return false
  }
}

export async function verificarPin(nombre: string, pin: string): Promise<Usuario | null> {
  const usuarios = await obtenerUsuarios()
  const usuario = usuarios.find(u => u.nombre === nombre && u.pin === pin)
  return usuario || null
}

export function establecerUsuarioActivo(nombre: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("activeUser", nombre)
  }
}

export function obtenerUsuarioActivo(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("activeUser") || "Usuario"
  }
  return "Usuario"
}
