import { guardarPlantillaFirebase, eliminarPlantillaFirebase } from "./firebase-adapter"
import { isFirebaseActivo } from "./firebase-client"

// Tipos para las plantillas de documentos
export interface PlantillaDocumento {
  id: string
  nombre: string
  contenido: string
  ultimaModificacion: string
  tipo: "contrato" | "condiciones" | "otros"
}

// Plantillas predeterminadas
const plantillasDefault: PlantillaDocumento[] = [
  {
    id: "contrato-principal",
    nombre: "Contrato de Alquiler",
    tipo: "contrato",
    ultimaModificacion: new Date().toISOString(),
    contenido: `
# CONTRATO DE ALQUILER

## REUNIDOS

### DE UNA PARTE:
Antonio Trujillo Wizner con DNI 45887190M en representación de la empresa
MYMARKET COR S.L.U. con CIF: B56133655, en adelante el arrendador

### Y DE OTRA:
{{cliente.nombre}} con DNI: {{cliente.dni}}, domiciliado en {{cliente.direccion}}, {{cliente.poblacion}}, {{cliente.provincia}}, en adelante el arrendatario.

Ambas partes intervienen en su propio nombre y derecho, reconociéndose, como así lo verifican en este acto, la mutua capacidad legal necesaria para la formalización del presente documento, y, con su expreso consentimiento,

## EXPONEN

I.- Que el arrendador es dueño de la autocaravana marca Roller Team modelo {{modelo}}, con matrícula {{matricula}}, con {{kilometros}} kilómetros.

Dicha autocaravana consta de los servicios y elementos funcionando bien para el correcto uso y disfrute, así como de la documentación y seguro reglamentarios vigentes.

II.- Que el arrendatario está interesado en arrendar el anterior vehículo sin conductor, a lo que accede el arrendador y lo llevan a efecto de conformidad con las siguientes,

## ESTIPULACIONES

### Primera.- Objeto y tiempo de alquiler
El arrendador arrienda la autocaravana (sin conductor) descrita en el expositivo I anterior al arrendatario desde el día {{fechaEntrega}} a las {{horaEntrega}} hasta el día {{fechaDevolucion}} a las {{horaDevolucion}}, siendo el lugar de entrega y recogida del vehículo las instalaciones de CARAVALIA en Córdoba en la Calle Ingeniero Barbudo, nave 18F.

### Segunda.- Precio del alquiler
El precio de alquiler del vehículo es de {{precioDiario}}€ al día, lo que supone un total de precio de alquiler ascendente a {{precioSinSuplemento}}€ más suplementos si estos existieran, y que se abona al momento de recogida e inicio del arrendamiento de la autocaravana.

  Suplemento (detallado en el anexo):  {{suplemento || "0"}}€

Queda incluido en el precio el Seguro a todo riesgo con franquicia de 900€, la cual se entrega mediante transferencia inmediata o tarjeta.

### Tercera.- Fianza
Con anterioridad a este acto el arrendatario ha debido hacer transferencia por un importe de 900€ como fianza para garantizar el buen uso y correcta devolución del vehículo.

La fianza se devolverá tras examinar el vehículo, que, en caso de desperfectos por mal uso, determinará por nota detallada el importe que el cliente deberá abonar, autorizando el arrendatario a compensar dicha fianza depositada. Si no se puede valorar los daños inmediatamente, la arrendadora dispondrá de 30 días para devolver el importe de la fianza sobrante, una vez deducido el coste de reparación de los desperfectos o daños causados.

Si los desperfectos o deterioros fueran superiores a 900 €, serán por cuenta de la cía de seguros que cubre el riesgo de la autocaravana a partir de dicha cantidad (franquicia), salvo que el arrendatario hubiese actuado con mala fe y la citada cía de seguros rehúse el abono, pues en tal caso el importe de las reparaciones serán íntegras por el arrendatario.

### Cuarta.- Fuerza Mayor y Caso Fortuíto
No procederá por parte del arrendatario exigir indemnización alguna si, por motivo de fuerza mayor o por causa fortuita, el vehículo no pudiera entregarse el día convenido. Se entiende por causa mayor un elemento atmosférico insuperable y por caso fortuito una avería o siniestro no reparable para la fecha prevista de entrega de la autocaravana.

En tal supuesto se devolverá íntegra al arrendatario la cantidad entregada en concepto de señal y reserva más la fianza.

### Quinta.- Resolución anticipada
En caso de que el arrendatario, por propia decisión unilateral, inicie con retraso o termine anticipadamente el alquiler, no tendrá derecho a reembolso alguno.

La no presentación del arrendatario en el lugar y hora convenidos para el inicio del presente contrato, tendrá la consideración de rescisión unilateral del contrato y de la reserva, por parte del arrendatario, con los siguientes efectos:

1. Penalización del 100% del valor del alquiler contratado.
2. El arrendador podrá disponer del vehículo reservado no teniendo el arrendatario derecho a indemnización ni compensación ninguna.

### Sexta.- Requisitos
La edad mínima para poder conducir el vehículo es de 20 años y 2 años de vigencia del permiso de conducción.

El arrendatario entregará a la firma de este contrato copia de su permiso de conducción, o de la persona que conduce el vehículo, asumiendo el arrendatario toda responsabilidad por no atender este requisito, ya sean posibles sanciones de tráfico, o rehúse por parte de la CÍA de seguro ante cualquier siniestro.

### Séptima.- Uso y Disfrute conforme a Ley
Se prohíbe expresamente destinar el vehículo a cualquier actividad contraria a la moral, las leyes y las buenas costumbres. Expresamente queda prohibido transportar más números de personas que el permitido por la Ficha Técnica del vehículo, realizar carreras, transporte de mercancías u objetos, estén o no permitidos por nuestra legislación, ceder su uso a título oneroso o lucrativo.

### Octava.- Sanciones y multas- Paralización del vehículo
El arrendatario será responsable ante cualquier sanción o multa, que, por contravenir las disposiciones vigentes le fueren impuestas.

Si por culpa del arrendatario fuese el vehículo retenido o embargado, serán por su cuenta y riesgo los gastos y el lucro cesante de la arrendadora durante el tiempo que dure la indisponibilidad del vehículo, aplicándose por cada día que se retenga o embargue el importe diario, según modelo y tarifas vigentes del precio de alquiler del vehículo.

En caso de paralización del vehículo por causa única y exclusivamente imputable al arrendatario, éste será responsable de los perjuicios derivados de dicha paralización y en consecuencia correrá con los gastos de alquiler todos los días que quede inmovilizado según tarifa vigente.

### Novena.- Sanciones y multas- Depósitos de gasolina, aguas limpias, aguas residuales, WC, butano
El vehículo arrendado se entrega en perfectas condiciones para su uso y disfrute, con el depósito de combustible (gasoil) lleno, habiendo sido instruido debidamente el arrendatario por parte del arrendador o personal a su cargo.

La devolución del vehículo el día convenido se realizará en las mismas condiciones, con su interior y exterior limpio y con el WC y los depósitos de aguas residuales debidamente vaciados, así como el depósito de combustible lleno.

El resto de consumibles deben venir tal y como se entregan incluyendo gas, gasoil y adblue.

En caso contrario, acepta el arrendatario el pago de la cantidad fija de 120 € que, en su caso, se detraerá de la fianza, cantidad a la que habría que sumar el total del importe de llenado de combustible.

### Décima.- Prórroga.-
En principio se prohíbe la prórroga de este contrato.

Si el arrendatario quiere prolongar el arrendamiento del vehículo sobre las fechas establecidas, deberá comunicarlo al Arrendador con 3 días a la finalización del contrato, siendo facultad del Arrendador autorizar la prórroga, por las disponibilidades del arrendador, por lo que no se asume por compromiso previo.

Los retrasos en la entrega no autorizados ni debidos a fuerza mayor, serán penalizados con una tarifa diaria triple a la cantidad aplicada en contrato.

### Undécima.- Seguro.-
El vehículo objeto de este contrato se encuentra asegurado según la ley,

De resultar algún siniestro durante la vigencia del contrato de arrendamiento, el arrendatario soportará dicho importe, que desde ahora autoriza pueda ser compensado en su caso con la fianza constituida. Serán de cuenta exclusiva del arrendatario las responsabilidades civiles que se deriven de hechos o circunstancias no contempladas como incluidas en la póliza.

### Duodécima.- Otros
Hay un límite de 300km diarios de media acumulables. Es decir que por ejemplo 5 días son 1.500km.

Está prohibido fumar dentro del vehículo.

Y leído el presente documento, ambas partes lo firman en señal de conformidad y ratificación de su contenido, haciéndolo por duplicado y a un solo efecto.

El arrendador:

El arrendatario:

# ANEXO I

DÍA CONFIRMADO DE DEVOLUCIÓN: 

HORA DE ENTREGA CONFIRMADA: 

KM AUTOCARAVANA AL DEVOLVERLA: 

Notas: {{notas || ""}}

El arrendador:

El arrendatario:
    `,
  },
  {
    id: "condiciones-generales",
    nombre: "Condiciones Generales",
    tipo: "condiciones",
    ultimaModificacion: new Date().toISOString(),
    contenido: `
# CONDICIONES GENERALES

El día de la entrega se hará un bloqueo en tarjeta del total de la fianza (900€). El resto del importe se abonará en efectivo o por transferencia previa. El límite de kilómetros diarios es de 300km/día acumulables con lo que, como ejemplo, en 5 días el límite de km sería de 1.500km. Si se superan, el costo sería de 50€ por cada 100km de más realizados. Recuerde que es necesario para la retirada del vehículo el carnet de conducir vigente de todos los ocupantes que vayan a conducir, DNI vigente de todos los ocupantes del vehículo y justificante del pago del total de la fianza.

El cliente declara que ha leído y acepta las condiciones de la presente reserva y las condiciones generales que acompañan, cuyos términos se dan por conocidos. Esta reserva será válida solo cuando se haya realizado la entrega mediante cualquiera de los medios disponibles y quedará confirmada en el momento del pago de la señal del 30% del total del importe.
    `,
  },
  {
    id: "pie-pagina",
    nombre: "Pie de Página",
    tipo: "otros",
    ultimaModificacion: new Date().toISOString(),
    contenido: `
Caravalia es una firma de MyMarket Cor SLU. / CIF: B56133655 / Ingeniero Barbudo, 18 / 14013 / Córdoba / Tfno: 957614918
    `,
  },
]

// Funciones para gestionar las plantillas

// Obtener todas las plantillas
export function obtenerPlantillas(): PlantillaDocumento[] {
  try {
    const plantillasGuardadas = localStorage.getItem("plantillasDocumentos")
    if (!plantillasGuardadas) {
      // Si no hay plantillas guardadas, inicializar con las predeterminadas
      localStorage.setItem("plantillasDocumentos", JSON.stringify(plantillasDefault))
      return plantillasDefault
    }
    return JSON.parse(plantillasGuardadas)
  } catch (error) {
    console.error("Error al obtener plantillas:", error)
    return plantillasDefault
  }
}

// Obtener una plantilla específica por ID
export function obtenerPlantilla(id: string): PlantillaDocumento | undefined {
  const plantillas = obtenerPlantillas()
  return plantillas.find((p) => p.id === id)
}

// Guardar una plantilla (nueva o actualizada)
export function guardarPlantilla(plantilla: PlantillaDocumento): boolean {
  try {
    const plantillas = obtenerPlantillas()
    const index = plantillas.findIndex((p) => p.id === plantilla.id)

    // Actualizar la fecha de modificación
    plantilla.ultimaModificacion = new Date().toISOString()

    if (index >= 0) {
      // Actualizar plantilla existente
      plantillas[index] = plantilla
    } else {
      // Añadir nueva plantilla
      plantillas.push(plantilla)
    }

    localStorage.setItem("plantillasDocumentos", JSON.stringify(plantillas))
    
    // Sincronizar con Firebase si está activo
    if (isFirebaseActivo()) {
      guardarPlantillaFirebase(plantilla)
    }
    
    return true
  } catch (error) {
    console.error("Error al guardar plantilla:", error)
    return false
  }
}

// Eliminar una plantilla
export function eliminarPlantilla(id: string): boolean {
  try {
    const plantillas = obtenerPlantillas()
    const nuevasPlantillas = plantillas.filter((p) => p.id !== id)

    if (nuevasPlantillas.length === plantillas.length) {
      // No se encontró la plantilla
      return false
    }

    localStorage.setItem("plantillasDocumentos", JSON.stringify(nuevasPlantillas))
    
    // Sincronizar con Firebase si está activo
    if (isFirebaseActivo()) {
      eliminarPlantillaFirebase(id)
    }
    
    return true
  } catch (error) {
    console.error("Error al eliminar plantilla:", error)
    return false
  }
}

// Restaurar una plantilla a su valor predeterminado
export function restaurarPlantillaDefault(id: string): boolean {
  try {
    const plantillaDefault = plantillasDefault.find((p) => p.id === id)
    if (!plantillaDefault) {
      return false
    }

    return guardarPlantilla({
      ...plantillaDefault,
      ultimaModificacion: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error al restaurar plantilla:", error)
    return false
  }
}

// Restaurar todas las plantillas a sus valores predeterminados
export function restaurarTodasPlantillas(): boolean {
  try {
    const plantillasActualizadas = plantillasDefault.map((p) => ({
      ...p,
      ultimaModificacion: new Date().toISOString(),
    }))

    localStorage.setItem("plantillasDocumentos", JSON.stringify(plantillasActualizadas))
    
    // Sincronizar con Firebase si está activo
    if (isFirebaseActivo()) {
      plantillasActualizadas.forEach(p => guardarPlantillaFirebase(p))
    }
    
    return true
  } catch (error) {
    console.error("Error al restaurar todas las plantillas:", error)
    return false
  }
}
