"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está en la página de login
    if (pathname === "/login") {
      setIsLoading(false)
      return
    }

    // Verificar si el usuario está autenticado
    const authToken = localStorage.getItem("auth-token")

    if (!authToken) {
      // Redirigir a login si no está autenticado
      router.push("/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router, pathname])

  // Mostrar nada mientras se verifica la autenticación
  if (isLoading) {
    return null
  }

  // Si estamos en la página de login o el usuario está autenticado, mostrar el contenido
  if (pathname === "/login" || isAuthenticated) {
    return <>{children}</>
  }

  // En cualquier otro caso, no mostrar nada (estamos redirigiendo)
  return null
}
