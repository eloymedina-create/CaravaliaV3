export interface ReservaDetalles {
  numeroReserva: string
  modelo: string
  fechaEntrega: string
  fechaDevolucion: string
  horaEntrega: string
  horaDevolucion: string
  precioDiario: string
  suplemento?: string // Añadir suplemento
  descripcionSuplemento?: string // Añadir descripción del suplemento
  formaPago?: string
  fechaValidacion?: string // Añadir fecha de validación
  porcentaje?: number // Porcentaje de señal aplicado en esta reserva
}

export interface ClienteData {
  nombre: string
  dni: string
  telefono: string
  notas: string
  direccion?: string // Nuevo campo opcional para dirección completa
  poblacion?: string // Nuevo campo opcional para población
  provincia?: string // Nuevo campo opcional para provincia
  email?: string // Nuevo campo opcional para email
}

export interface ReservaCompleta {
  id: string // Identificador único para la reserva
  numeroReserva: string
  modelo: string
  fechaCreacion: string
  detalles: ReservaDetalles
  cliente: ClienteData
  totalDias: number
  importeTotal: number
  importeSenal: number
  importeRestante: number
  formaPago?: string // Añadir forma de pago
  validado?: boolean // Añadir campo para validación
  fechaValidacion?: string // Añadir fecha de validación
  contratoGenerado?: boolean // Añadir campo para indicar si se ha generado el contrato
  kilometrosContrato?: string // Añadir campo para guardar los kilómetros del contrato
  anulada?: boolean // Campo para indicar si la reserva está anulada
  importeDevuelto?: number // Cantidad devuelta al anular
  fechaAnulacion?: string // Fecha de anulación
  motivoAnulacion?: string // Razón de la cancelación
  valeId?: string // ID del vale regalo aplicado
  importeVale?: number // Importe del vale descuento aplicado
  destinos?: string // Destinos del viaje (separados por comas). Ej: "Algarve, Sevilla, Madrid"
  sincronizado?: boolean // Indica si la reserva ya ha sido subida a Firebase exitosamente
}

// Nueva interfaz para Vales Descuento
export interface ValeDescuento {
  id: string
  numeroVale: string // Formato: VALE-2026-001
  titular: {
    nombre: string
    dni: string
    telefono: string
  }
  importe: number
  estado: "disponible" | "asignado"
  reservaId?: string // ID de la reserva a la que se ha asignado
  fechaCreacion: string
  fechaAsignacion?: string
}

// Interfaz para el historial de acciones sobre vales
export interface ValeHistorico {
  id: string
  fecha: string
  valeId: string
  numeroVale: string
  accion: "creacion" | "edicion" | "asignacion" | "eliminacion" | "liberacion"
  descripcion: string
  usuario: string
}

// Nueva interfaz para las autocaravanas
export interface Autocaravana {
  id: string
  modelo: string
  matricula: string
  numeroBastidor?: string // Nuevo campo para número de bastidor
  activa: boolean
}

// Nuevas interfaces para el módulo de rentabilidad
export interface Gasto {
  id: string
  fecha: string
  modeloId: string
  modelo?: string // Campo calculado para mostrar el modelo en lugar del ID
  concepto: string
  importe: number
  notas?: string
  createdAt: string
  updatedAt: string
  sincronizado?: boolean
}

export interface ResumenRentabilidad {
  id: string
  año: number
  mes: number
  modeloId: string
  modelo?: string // Campo calculado
  ingresosTotales: number
  gastosTotales: number
  beneficioNeto: number
  precioMedioAlquiler: number
  diasAlquilados: number
  updatedAt: string
}

export interface FiltrosRentabilidad {
  año: number
  mes: number | null
  modeloId: string | null
  fechaInicio?: Date | null
  fechaFin?: Date | null
}

export type Reserva = ReservaCompleta
export type DetallesReserva = ReservaDetalles
export type ClienteReserva = ClienteData
export interface Bloqueo {
  id: string
  fecha: string
  hora: string
  descripcion: string
  modeloId?: string
  sincronizado?: boolean
  updatedAt?: string
}
