import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { obtenerAutocaravanaPorModelo } from "../lib/autocaravanas-store"
import { obtenerPlantilla } from "../lib/plantillas-store"
import { obtenerConfiguracion } from "../lib/config-store"

interface ReservationTemplateProps {
  numeroReserva: string
  modelo: string
  reservaDetalles: any
  clienteData: any
  totalDias: number
  importeTotal: number
  importeSenal: number
  importeRestante: number
  suplemento?: number
  descripcionSuplemento?: string
  matriculaPersonalizada?: string
  reservaValidada?: boolean // Nuevo parámetro
}

// Función para formatear la forma de pago
function formatFormaPago(formaPago?: string): string {
  if (!formaPago) return "Transferencia previa"

  switch (formaPago) {
    case "bizum":
      return "Bizum"
    case "contado":
      return "Contado"
    case "transferencia":
      return "Transferencia previa"
    default:
      return formaPago
  }
}

// Añadir una función para determinar la matrícula según el modelo
function obtenerMatricula(modelo: string, matriculaPersonalizada?: string): string {
  if (matriculaPersonalizada && matriculaPersonalizada.trim() !== "") {
    return matriculaPersonalizada
  }
  const autocaravana = obtenerAutocaravanaPorModelo(modelo)
  return autocaravana ? autocaravana.matricula : ""
}

export function ReservationA4Template({
  numeroReserva,
  modelo,
  reservaDetalles,
  clienteData,
  totalDias,
  importeTotal,
  importeSenal,
  importeRestante,
  suplemento,
  descripcionSuplemento,
  matriculaPersonalizada,
  reservaValidada = false, // Valor por defecto
}: ReservationTemplateProps) {
  const config = obtenerConfiguracion()
  // Determinar la fecha de validación a mostrar
  const fechaValidacion = reservaDetalles.fechaValidacion ? new Date(reservaDetalles.fechaValidacion) : new Date() // Si no hay fecha específica, usar la fecha actual
  const porcentajeMostrar = reservaDetalles.porcentaje !== undefined ? reservaDetalles.porcentaje : config.porcentajeSenal

  // --- LÓGICA PARA PLANTILLAS DINÁMICAS ---
  const plantillaCondiciones = obtenerPlantilla("condiciones-generales")
  const plantillaPie = obtenerPlantilla("pie-pagina")

  const procesarTexto = (texto: string) => {
    if (!texto) return ""
    let t = texto
    const config = obtenerConfiguracion()

    // Reemplazos básicos de placeholders que podrían ser útiles en las condiciones
    const datos = {
      cliente: clienteData,
      modelo,
      numeroReserva,
      totalDias,
      importeTotal,
      importeSenal,
      importeRestante,
      kmTotales: totalDias * 300,
      fianza: config.fianza,
      porcentajeSenal: porcentajeMostrar
    }

    return t.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const partes = variable.trim().split(".")
      let valor: any = datos
      for (const parte of partes) {
        if (valor === undefined || valor === null) return match
        valor = valor[parte]
      }
      return valor !== undefined && valor !== null ? valor : ""
    })
  }

  const contenidoCondiciones = plantillaCondiciones ? procesarTexto(plantillaCondiciones.contenido) : ""
  const contenidoPie = plantillaPie ? procesarTexto(plantillaPie.contenido) : ""

  return (
    <div
      className="bg-white w-full mx-auto relative"
      style={{
        width: "210mm",
        height: "297mm",
        padding: "10mm",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Encabezado reorganizado - Eliminada la línea divisoria (border-b) */}
      <div className="flex justify-between items-center pb-1 mb-2">
        <div className="w-24 h-24 relative">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
            alt="Caravalia Logo"
            fill
            className="object-contain"
          />
        </div>

        <div className="flex flex-col items-center mx-auto">
          <p className="text-sm text-black font-medium text-center">
            Autocaravana modelo {modelo}
            <br />
            Matrícula {obtenerMatricula(modelo, matriculaPersonalizada)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className="border-2 border-caravalia-600 rounded-md inline-block bg-caravalia-50 text-center"
            style={{ padding: "8px 8px" }}
          >
            <h1 className="text-lg font-bold text-black" style={{ lineHeight: 1 }}>
              <span className="font-medium">Reserva nº </span>
              <span className="text-black">{numeroReserva}</span>
            </h1>
          </div>

          <p className="text-xs text-black text-center">Fecha: {format(new Date(), "dd/MM/yyyy", { locale: es })}</p>
        </div>
      </div>

      {/* Sello de Reserva Confirmada cuando la reserva está validada - Subido 1cm */}
      {reservaValidada && (
        <div
          className="absolute"
          style={{
            top: "165mm", // Subido 1cm (10mm) desde 175mm
            right: "20mm",
            opacity: 0.8,
            zIndex: 10,
          }}
        >
          <div
            style={{
              border: "3px solid #e11d48",
              borderRadius: "6px",
              padding: "8px 16px",
              color: "#e11d48",
              fontWeight: "bold",
              fontSize: "20px",
              textTransform: "uppercase",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: "14px", marginBottom: "2px", fontWeight: "normal", lineHeight: 1.1 }}>
              *** Validada con fecha {format(fechaValidacion, "dd/MM/yy", { locale: es })} ***
            </div>
            <div style={{ lineHeight: 1.1 }}>Reserva Confirmada</div>
          </div>
        </div>
      )}

      {/* Resto del contenido sin cambios */}
      <div className="space-y-3 flex-grow">
        {/* Datos del cliente - DESTACADO */}
        <div className="border border-caravalia-300 rounded-lg p-3 bg-caravalia-50 shadow-md">
          <h2 className="text-sm font-bold mb-2 text-caravalia-800 border-b border-caravalia-200 pb-1 uppercase">
            Datos del Cliente
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Nombre:</span> {clienteData.nombre}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">DNI:</span> {clienteData.dni}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Dirección:</span> {clienteData.direccion}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Teléfono:</span> {clienteData.telefono}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Email:</span> {clienteData.email}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Población:</span> {clienteData.poblacion} ({clienteData.provincia})
              </p>
            </div>
          </div>
        </div>

        {/* Fechas y horarios */}
        <div className="border border-caravalia-200 rounded-lg p-3 bg-white shadow-sm">
          <h2 className="text-sm font-bold mb-2 text-caravalia-800 border-b border-caravalia-200 pb-1 uppercase">
            Fechas y Horarios
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Fecha de entrega:</span>
                <br />
                {format(new Date(reservaDetalles.fechaEntrega), "dd/MM/yyyy", { locale: es })}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Hora de entrega:</span>
                <br />
                {reservaDetalles.horaEntrega}h
              </p>
            </div>
            <div>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Fecha de devolución:</span>
                <br />
                {format(new Date(reservaDetalles.fechaDevolucion), "dd/MM/yyyy", { locale: es })}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Hora de devolución:</span>
                <br />
                {reservaDetalles.horaDevolucion}h
              </p>
            </div>
          </div>
          <p className="text-xs mt-1">
            <span className="font-semibold text-caravalia-700">Duración total:</span> {totalDias} días
          </p>
        </div>

        {/* Detalles económicos */}
        <div className="border border-caravalia-200 rounded-lg p-3 bg-white shadow-sm">
          <h2 className="text-sm font-bold mb-2 text-caravalia-800 border-b border-caravalia-200 pb-1 uppercase">
            Detalles Económicos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Precio por día:</span> {reservaDetalles.precioDiario}
                €
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Suplemento:</span>{" "}
                {reservaDetalles.suplemento || "0"}€
              </p>
              {Number(reservaDetalles.suplemento) > 0 && descripcionSuplemento && (
                <p className="text-xs mb-1">
                  <span className="font-semibold text-caravalia-700">Concepto:</span> {descripcionSuplemento}
                </p>
              )}
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Días de alquiler:</span> {totalDias}
              </p>
              <p className="text-sm font-bold mt-1 text-caravalia-800">Importe total: {importeTotal}€</p>
            </div>
            <div>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Señal ({porcentajeMostrar}%):</span> {importeSenal}€
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Forma de pago señal:</span>{" "}
                {formatFormaPago(reservaDetalles.formaPago)}
                {reservaValidada && (
                  <span className="text-xs font-bold text-caravalia-600 ml-1">
                    ({format(fechaValidacion, "dd/MM/yyyy", { locale: es })})
                  </span>
                )}
              </p>
              <p className="text-xs mb-1">
                <span className="font-semibold text-caravalia-700">Fianza:</span> {config.fianza}€
              </p>
              <p className="text-sm font-bold mt-1 text-caravalia-800">Importe restante: {importeRestante}€</p>
              <p className="text-xs mt-1">
                <span className="font-semibold text-caravalia-700">Forma de pago:</span> Contado o mediante
                transferencia inmediata con fecha{" "}
                {format(new Date(reservaDetalles.fechaEntrega), "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Total de kilómetros sin recargo */}
        <div className="border border-caravalia-200 rounded-lg p-3 bg-white shadow-sm">
          <p className="text-sm font-semibold">
            <span className="font-bold text-caravalia-700">Total de km. sin recargo:</span>{" "}
            <span className="font-bold">{totalDias * 300} km</span>
          </p>
        </div>

        {/* Notas (si existen) - Marco ampliado y fuente más pequeña */}
        {clienteData.notas && (
          <div className="border border-caravalia-200 rounded-lg p-3 bg-white shadow-sm">
            <h2 className="text-sm font-bold mb-2 text-caravalia-800 border-b border-caravalia-200 pb-1 uppercase">
              Notas
            </h2>
            <p className="text-[9px]" style={{ lineHeight: "1.2" }}>
              {clienteData.notas}
            </p>
          </div>
        )}

        {/* Condiciones - Colocadas debajo de los detalles económicos */}
        <div className="border border-caravalia-200 rounded-lg p-3 bg-white shadow-sm mt-3">
          <h3 className="text-sm font-bold mb-2 text-caravalia-800 border-b border-caravalia-200 pb-1">CONDICIONES</h3>
          <div className="text-[10px] text-caravalia-600 whitespace-pre-wrap" style={{ lineHeight: "1.3" }}>
            {contenidoCondiciones ? (
              contenidoCondiciones.split('\n').map((line, i) => (
                <p key={i} className={line.includes('300km/día') ? "font-bold text-red-600" : ""}>
                  {line}
                </p>
              ))
            ) : (
              <>
                <p>
                  El día de la entrega se hará un bloqueo en tarjeta del total de la fianza ({config.fianza}€). El resto del importe se
                  abonará en efectivo o por transferencia previa.{" "}
                  <span className="font-bold text-red-600">
                    El límite de kilómetros diarios es de 300km/día acumulables con lo que, como ejemplo, en 5 días el
                    límite de km sería de 1.500km. Si se superan, el costo sería de 50€ por cada 100km de más realizados.
                  </span>{" "}
                  Recuerde que es necesario para la retirada del vehículo el carnet de conducir vigente de todos los
                  ocupantes que vayan a conducir, DNI vigente de todos los ocupantes del vehículo y justificante del pago
                  del total de la fianza.
                </p>
                <p className="mt-2">
                  El cliente declara que ha leído y acepta las condiciones de la presente reserva y las condiciones
                  generales que acompañan, cuyos términos se dan por conocidos. Esta reserva será válida solo cuando se haya
                  realizado la entrega mediante cualquiera de los medios disponibles y quedará confirmada en el momento del
                  pago de la señal del {porcentajeMostrar}% del total del importe.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Espacio flexible para empujar la firma hacia abajo */}
      <div className="flex-grow"></div>

      {/* Firma */}
      <div className="mt-auto mb-4">
        <p className="text-xs font-medium text-caravalia-700 mb-2 text-center">Firmado por MyMarket Cor SLU</p>
        <div className="flex justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sello%20MyMarket%20firma%20Antonio-shDfG8DxpLyeHQZ9L6LHPvMYfl7dGS.png"
            alt="Firma MyMarket"
            style={{
              width: "200px",
              height: "auto",
              maxWidth: "100%",
            }}
          />
        </div>
      </div>

      {/* Pie de página - Datos de la empresa - Colocados al final del documento con más espacio */}
      <div className="mt-2 w-full text-center border-t border-caravalia-100 pt-2 mb-2">
        <p className="text-[10px] text-caravalia-500">
          {contenidoPie || "Caravalia es una firma de MyMarket Cor SLU. / CIF: B56133655 / Ingeniero Barbudo, 18 / 14013 / Córdoba / Tfno: 957614918"}
        </p>
      </div>
    </div>
  )
}
