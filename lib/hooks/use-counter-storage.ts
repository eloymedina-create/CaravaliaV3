"use client"

import { useState, useEffect } from "react"

// Hook personalizado para manejar contadores de reserva por modelo
export function useCounterStorage(modelo: string, initialValue = "0") {
  // Estado para almacenar el valor actual del contador
  const [counter, setCounter] = useState<string>(initialValue)
  const storageKey = `ultimo-numero-${modelo}`

  // Inicializar desde localStorage al montar el componente
  useEffect(() => {
    try {
      // Obtener el contador del localStorage
      const storedCounter = window.localStorage.getItem(storageKey)
      // Si existe un valor almacenado, usarlo; de lo contrario, usar el valor inicial
      if (storedCounter) {
        setCounter(storedCounter)
      } else {
        // Si no hay valor almacenado, guardar el valor inicial
        window.localStorage.setItem(storageKey, initialValue)
      }
    } catch (error) {
      console.error("Error al recuperar el contador:", error)
      setCounter(initialValue)
    }
  }, [storageKey, initialValue])

  // Función para obtener el siguiente valor del contador sin actualizar el estado
  const getNextCounterValue = () => {
    try {
      const currentValue = window.localStorage.getItem(storageKey) || counter
      return (Number.parseInt(currentValue, 10) + 1).toString()
    } catch (error) {
      console.error("Error al calcular el siguiente valor:", error)
      return (Number.parseInt(counter, 10) + 1).toString()
    }
  }

  // Función para establecer el contador a un valor específico
  const setCounterValue = (value: string) => {
    try {
      // Actualizar el estado
      setCounter(value)
      // Guardar en localStorage
      window.localStorage.setItem(storageKey, value)
    } catch (error) {
      console.error("Error al establecer el contador:", error)
    }
  }

  return { counter, getNextCounterValue, setCounterValue }
}
