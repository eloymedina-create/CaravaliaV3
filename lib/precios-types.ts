// Tipos para la gestión de precios

// Temporadas del año
export type Temporada = "alta" | "media" | "baja"

// Estructura para precios de referencia por temporada
export interface PrecioReferencia {
  modeloId: string
  modelo: string
  temporadaAlta: {
    precio: number
    fechaInicio: string // formato "DD/MM"
    fechaFin: string // formato "DD/MM"
  }
  temporadaMedia: {
    precio: number
    fechaInicio: string
    fechaFin: string
  }
  temporadaBaja: {
    precio: number
    fechaInicio: string
    fechaFin: string
  }
  añoActual: number
  updatedAt: string
}

// Estructura para el registro histórico de precios
export interface RegistroPrecio {
  id: string
  fecha: string // Fecha completa ISO
  modeloId: string
  modelo: string
  precioPorDia: number
  numeroDias: number
  precioTotal: number
  cliente?: string
  notas?: string
  aceptado: boolean // Si el cliente aceptó el precio o solo fue consulta
  temporada: Temporada
  createdAt: string
  updatedAt: string
}

// Estructura para filtros de búsqueda
export interface FiltrosPrecio {
  fechaInicio?: string
  fechaFin?: string
  modelo?: string
  cliente?: string
  temporada?: Temporada
  aceptado?: boolean
}

// Estructura para datos de gráficos de evolución
export interface DatoEvolucion {
  fecha: string
  precioPromedio: number
  cantidadRegistros: number
}

// Estructura para datos de gráficos de comparativa por modelo
export interface DatoComparativaModelo {
  modelo: string
  precioPromedio: number
  cantidadRegistros: number
}

// Estructura para datos de gráficos de distribución por temporada
export interface DatoDistribucionTemporada {
  temporada: Temporada
  nombre: string
  precioPromedio: number
  cantidadRegistros: number
  color: string
}
