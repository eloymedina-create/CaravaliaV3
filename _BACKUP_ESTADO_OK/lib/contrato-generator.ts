import FileSaver from "file-saver"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  BorderStyle,
  convertInchesToTwip,
  HeadingLevel,
} from "docx"
import type { ReservaCompleta } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { obtenerAutocaravanaPorModelo } from "./autocaravanas-store"
import { obtenerPlantilla } from "./plantillas-store"
import { marked } from "marked"
import { parseFechaSegura } from "./utils-date"

// Función para formatear la fecha en español
function formatearFecha(fecha: string): string {
  return format(parseFechaSegura(fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
}

// Reemplazar la función procesarPlantilla para resaltar variables en negrita
function procesarPlantilla(texto: string, datos: any): string {
  // Eliminar las líneas "El arrendador" "El arrendatario" al final del documento
  let textoModificado = texto

  // Añadir más saltos de página antes de "Tercera,-Fianza" para asegurar que aparezca en la hoja 2
  textoModificado = textoModificado.replace(/Tercera,-Fianza/g, "\n\n\n\n\n\n\n\nTercera,-Fianza")

  // Añadir saltos de página antes de "Séptima: uso y Disfrute conforme a Ley" para que aparezca en la hoja 3
  textoModificado = textoModificado.replace(
    /Séptima: uso y Disfrute conforme a Ley/g,
    "\n\n\n\n\n\n\n\nSéptima: uso y Disfrute conforme a Ley",
  )

  // Añadir saltos de página antes de "undécima.-Seguro" para que aparezca en la siguiente página
  textoModificado = textoModificado.replace(/undécima\.-Seguro/g, "\n\n\n\n\n\n\n\nundécima.-Seguro")

  // Asegurarse de que la plantilla incluya los datos de dirección, población y provincia
  // Buscar el patrón donde normalmente aparecería el nombre y DNI del cliente
  const patronCliente = /con DNI: {{cliente\.dni}}/g

  // Reemplazar con nombre, DNI y dirección completa (sin la frase redundante)
  textoModificado = textoModificado.replace(
    patronCliente,
    "con DNI: {{cliente.dni}}, domiciliado en {{cliente.direccion}}, {{cliente.poblacion}}, {{cliente.provincia}}, en adelante el arrendatario.",
  )

  // Eliminar la frase redundante "y domicilio en , de ()" que puede aparecer después de la provincia
  textoModificado = textoModificado.replace(/y domicilio en\s*,\s*de\s*$$$$/g, "")
  textoModificado = textoModificado.replace(/y domicilio en\s*,\s*de\s*$$\s*$$/g, "")
  textoModificado = textoModificado.replace(/y domicilio en\s*,\s*$$\s*$$/g, "")
  textoModificado = textoModificado.replace(/y domicilio en\s*,\s*de\s*/g, "")
  textoModificado = textoModificado.replace(/y domicilio en\s*,/g, "")
  textoModificado = textoModificado.replace(/y domicilio en/g, "")

  // Eliminar específicamente el patrón ", de (" que aparece después de la provincia
  textoModificado = textoModificado.replace(/{{cliente\.provincia}}\s*,\s*de\s*\(/g, "{{cliente.provincia}}")
  textoModificado = textoModificado.replace(/{{cliente\.provincia}}\s*,\s*de\s*$$$$/g, "{{cliente.provincia}}")

  // Eliminar cualquier paréntesis de cierre suelto
  textoModificado = textoModificado.replace(/{{cliente\.provincia}}\s*\)/g, "{{cliente.provincia}}")

  // Buscar y eliminar el patrón específico que se ve en la imagen
  textoModificado = textoModificado.replace(/CÓRDOBA\s*,\s*de\s*\(/g, "CÓRDOBA")
  textoModificado = textoModificado.replace(/CÓRDOBA\s*,\s*de\s*$$$$/g, "CÓRDOBA")
  textoModificado = textoModificado.replace(/CÓRDOBA\s*\)/g, "CÓRDOBA")

  // Buscar y eliminar cualquier instancia de ", de (" en todo el documento
  textoModificado = textoModificado.replace(/,\s*de\s*\(/g, "")
  textoModificado = textoModificado.replace(/\)/g, "")

  // Aumentar el espacio entre "El arrendador" y "El arrendatario" para permitir firmas
  textoModificado = textoModificado.replace(
    /El arrendador\s*El arrendatario/g,
    "El arrendador\n\n\n\n\n\n\n\nEl arrendatario",
  )

  // Reemplazar variables en formato {{variable}} y marcarlas para negrita
  return textoModificado.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    // Permitir acceso a propiedades anidadas como cliente.nombre
    const partes = variable.trim().split(".")
    let valor = datos

    for (const parte of partes) {
      if (valor === undefined || valor === null) return match
      valor = valor[parte]
    }

    // Si el valor es undefined o null, devolver cadena vacía
    // Marcar el valor con **valor** para convertirlo en negrita en markdown
    return valor !== undefined && valor !== null ? `**${valor}**` : ""
  })
}

// Modificar la función markdownADocx para manejar texto en negrita
function markdownADocx(markdown: string): Paragraph[] {
  const tokens = marked.lexer(markdown)
  const parrafos: Paragraph[] = []

  for (const token of tokens) {
    if (token.type === "heading") {
      // Determinar el nivel de encabezado adecuado
      let headingLevel
      switch (token.depth) {
        case 1:
          headingLevel = HeadingLevel.HEADING_1
          break
        case 2:
          headingLevel = HeadingLevel.HEADING_2
          break
        case 3:
          headingLevel = HeadingLevel.HEADING_3
          break
        default:
          headingLevel = HeadingLevel.HEADING_4
      }

      parrafos.push(
        new Paragraph({
          children: [
            new TextRun({
              text: token.text,
              bold: true,
              size: 28 - token.depth * 2,
            }),
          ],
          heading: headingLevel,
          alignment: token.depth === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { after: 120 }, // Reducido de 200 a 120 para ahorrar espacio
        }),
      )
    } else if (token.type === "paragraph") {
      // Procesar el texto para detectar partes en negrita (entre **)
      const textRuns = []
      const text = token.text
      const boldPattern = /\*\*(.*?)\*\*/g
      let lastIndex = 0
      let match

      while ((match = boldPattern.exec(text)) !== null) {
        // Texto normal antes del texto en negrita
        if (match.index > lastIndex) {
          textRuns.push(
            new TextRun({
              text: text.substring(lastIndex, match.index),
              size: 24,
            }),
          )
        }

        // Texto en negrita
        textRuns.push(
          new TextRun({
            text: match[1], // El texto entre **
            bold: true,
            size: 24,
          }),
        )

        lastIndex = match.index + match[0].length
      }

      // Texto restante después del último texto en negrita
      if (lastIndex < text.length) {
        textRuns.push(
          new TextRun({
            text: text.substring(lastIndex),
            size: 24,
          }),
        )
      }

      parrafos.push(
        new Paragraph({
          children: textRuns,
          alignment: AlignmentType.LEFT,
          spacing: { after: 120 }, // Reducido para ahorrar espacio
        }),
      )
    } else if (token.type === "list") {
      for (let i = 0; i < token.items.length; i++) {
        const item = token.items[i]

        // Procesar el texto del ítem para detectar partes en negrita
        const textRuns = []
        const text = `${i + 1}. ${item.text}`
        const boldPattern = /\*\*(.*?)\*\*/g
        let lastIndex = 0
        let match

        while ((match = boldPattern.exec(text)) !== null) {
          // Texto normal antes del texto en negrita
          if (match.index > lastIndex) {
            textRuns.push(
              new TextRun({
                text: text.substring(lastIndex, match.index),
                size: 24,
              }),
            )
          }

          // Texto en negrita
          textRuns.push(
            new TextRun({
              text: match[1], // El texto entre **
              bold: true,
              size: 24,
            }),
          )

          lastIndex = match.index + match[0].length
        }

        // Texto restante después del último texto en negrita
        if (lastIndex < text.length) {
          textRuns.push(
            new TextRun({
              text: text.substring(lastIndex),
              size: 24,
            }),
          )
        }

        parrafos.push(
          new Paragraph({
            children: textRuns,
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 }, // Reducido para ahorrar espacio
          }),
        )
      }
    } else if (token.type === "space") {
      parrafos.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 120 }, // Reducido para ahorrar espacio
        }),
      )
    }
  }

  return parrafos
}

// Reemplazar la función generarContratoWord para incluir el logo y el encabezado
export async function generarContratoWord(
  reserva: ReservaCompleta,
  kilometros: string,
  horaRealEntrega: string,
): Promise<void> {
  try {
    // Obtener la fecha actual formateada
    const fechaActual = formatearFecha(new Date().toISOString())

    // Obtener la matrícula según el modelo desde el almacenamiento
    const autocaravana = obtenerAutocaravanaPorModelo(reserva.modelo)
    const matricula = autocaravana ? autocaravana.matricula : ""

    // Calcular el precio total sin suplemento
    const precioSinSuplemento = reserva.importeTotal - Number(reserva.detalles.suplemento || 0)

    // Obtener la plantilla del contrato
    const plantillaContrato = obtenerPlantilla("contrato-principal")

    if (!plantillaContrato) {
      throw new Error("No se encontró la plantilla del contrato")
    }

    // Asegurarse de que los campos de dirección, población y provincia estén disponibles
    const clienteCompleto = {
      ...reserva.cliente,
      direccion: reserva.cliente.direccion || "",
      poblacion: reserva.cliente.poblacion || "",
      provincia: reserva.cliente.provincia || "",
    }

    // Preparar los datos para la plantilla
    const datosPlantilla = {
      cliente: clienteCompleto,
      modelo: reserva.modelo,
      matricula,
      kilometros,
      fechaEntrega: formatearFecha(reserva.detalles.fechaEntrega),
      horaEntrega: horaRealEntrega || reserva.detalles.horaEntrega, // Usar la hora real de entrega si está disponible
      fechaDevolucion: formatearFecha(reserva.detalles.fechaDevolucion),
      horaDevolucion: reserva.detalles.horaDevolucion,
      precioDiario: reserva.detalles.precioDiario,
      precioSinSuplemento,
      suplemento: reserva.detalles.suplemento,
      notas: reserva.cliente.notas,
      fechaActual,
    }

    // Procesar la plantilla con los datos
    let contenidoProcesado = procesarPlantilla(plantillaContrato.contenido, datosPlantilla)

    // Aplicar un post-procesamiento para eliminar cualquier ", de (" que pueda haber quedado
    contenidoProcesado = contenidoProcesado.replace(/,\s*de\s*\(/g, "")
    contenidoProcesado = contenidoProcesado.replace(/\)/g, "")

    // Convertir el markdown a párrafos de docx
    const parrafosContrato = markdownADocx(contenidoProcesado)

    // Crear el encabezado con información de la empresa (sin imagen para evitar problemas)
    const headerParagraph = new Paragraph({
      children: [
        new TextRun({
          text: "Caravalia es una firma de MyMarket Cor SLU / CIF B56133655 / Ingeniero Barbudo, nave 18 / 14013 Córdoba / Tfno: 957614918",
          size: 16,
        }),
      ],
      spacing: { after: 200 },
      border: {
        bottom: {
          color: "#CCCCCC",
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      alignment: AlignmentType.CENTER,
    })

    // Crear el pie de página con el sello de firma electrónica en rojo fuerte
    const footerParagraph = new Paragraph({
      children: [
        new TextRun({
          text: "Firmado electrónicamente por MyMarket Cor SLU",
          size: 16,
          color: "#CC0000", // Rojo fuerte
          bold: true, // Negrita para que sea más visible
          italics: true, // Cursiva para distinguirlo del texto normal
        }),
      ],
      alignment: AlignmentType.RIGHT, // Alineado a la derecha
      spacing: { before: 200 }, // Espacio antes para que quede en la parte inferior
    })

    // Crear el documento con el encabezado y pie de página personalizados
    const doc = new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [headerParagraph],
            }),
          },
          footers: {
            default: new Footer({
              children: [footerParagraph],
            }),
          },
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.5),
                right: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.5),
              },
            },
          },
          children: parrafosContrato,
        },
      ],
    })

    // Generar el documento
    const buffer = await Packer.toBuffer(doc)

    // Crear un nombre de archivo para el contrato según el formato solicitado
    const fechaEntregaFormateada = format(parseFechaSegura(reserva.detalles.fechaEntrega), "d_MMMM_yyyy", { locale: es })
    const fechaDevolucionFormateada = format(parseFechaSegura(reserva.detalles.fechaDevolucion), "d_MMMM_yyyy", { locale: es })

    const nombreCliente = reserva.cliente.nombre.replace(/\s+/g, "_")
    const nombreArchivo = `Contrato_${nombreCliente}_RESERVA_${reserva.numeroReserva}_desde el día_${fechaEntregaFormateada}_al día_${fechaDevolucionFormateada}.docx`

    // Guardar el archivo
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    FileSaver.saveAs(blob, nombreArchivo)

    return Promise.resolve()
  } catch (error) {
    console.error("Error al generar el contrato:", error)
    return Promise.reject(error)
  }
}
