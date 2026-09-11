import Image from "next/image"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { ValeDescuento } from "../lib/types"

interface VoucherTemplateProps {
  vale: ValeDescuento
}

/**
 * PLANTILLA EDITABLE DE VALE REGALO (A4)
 * -------------------------------------
 * Puede modificar los estilos fácilmente:
 * - Colores: cambie los códigos hexadecimales (Ej: #003829).
 * - Espacios: cambie clases como 'mb-8' (margin-bottom) o 'p-10' (padding).
 * - Tipografía: cambie el 'fontWeight' o 'fontSize'.
 */
export function VoucherA4Template({ vale }: VoucherTemplateProps) {
  const fechaEmision = vale.fechaCreacion ? new Date(vale.fechaCreacion) : new Date()

  return (
    <div
      className="bg-white mx-auto relative overflow-hidden"
      style={{
        width: "210mm",
        height: "297mm",
        padding: "20mm", // Margen general del documento
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        color: "#003829",
      }}
    >
      {/* 1. ENCABEZADO (Logo y Código) */}
      <div className="flex justify-between items-center mb-10 w-full">
        <div style={{ width: "220px" }}>
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png"
            alt="Caravalia Logo"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
        <div className="text-right">
          <div className="border border-[#003829] rounded-lg p-3 inline-block">
            <p className="text-[9px] font-bold uppercase opacity-50 mb-1">CÓDIGO DE VALE</p>
            <p className="text-lg font-black">{vale.numeroVale}</p>
          </div>
          <p className="text-[10px] font-bold mt-2 opacity-60">
            {format(fechaEmision, "dd 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* 2. TÍTULO PRINCIPAL (Diseño limpio sin líneas) */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black uppercase tracking-widest">
          Vale Regalo
        </h1>
      </div>

      {/* 3. CUERPO (Importe y Mensaje) */}
      <div className="flex-grow flex flex-col justify-center items-center">
        {/* Importe central limpio */}
        {!vale.ocultarImporte ? (
          <div className="mb-10 text-center">
            <span className="text-[11px] font-bold uppercase opacity-50 block mb-2 tracking-widest">VALOR DEL BONO</span>
            <span className="text-7xl font-black">{vale.importe.toFixed(0)}€</span>
            {vale.diasAlquiler && vale.diasAlquiler > 0 && (
              <div className="mt-4">
                <span
                  className="inline-block text-[13px] font-black uppercase tracking-widest border-2 border-[#003829] rounded-full px-6 py-2"
                  style={{ letterSpacing: "0.15em" }}
                >
                  CORRESPONDE A {vale.diasAlquiler} {vale.diasAlquiler === 1 ? "DÍA" : "DÍAS"} DE ALQUILER
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-10 text-center">
            <span className="text-[11px] font-bold uppercase opacity-50 block mb-2 tracking-widest">EXPERIENCIA</span>
            <span className="text-5xl font-black">AVENTURA SOBRE RUEDAS</span>
          </div>
        )}

        {/* Texto de dedicatoria */}
        <div className="text-center max-w-xl mb-12">
          <h2 className="text-xl font-bold mb-4">¡Tu próxima aventura comienza aquí!</h2>
          <p className="text-lg leading-relaxed italic opacity-80">
            "Este bono es la llave para descubrir la libertad definitiva. 
            Disfruta de la experiencia Caravalia y despierta cada día en un lugar nuevo."
          </p>
        </div>

        {/* Datos del beneficiario */}
        <div className="w-full max-w-lg bg-gray-50 rounded-2xl p-6 border border-gray-100">
           <div className="flex flex-col gap-4 text-center">
              <div>
                <span className="text-[9px] font-bold uppercase opacity-40 block mb-1">TITULAR</span>
                <span className="text-xl font-black">{vale.titular.nombre}</span>
              </div>
              <div className="flex justify-center gap-10">
                <div>
                  <span className="text-[9px] font-bold uppercase opacity-40 block">DNI</span>
                  <span className="text-sm font-bold">{vale.titular.dni}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase opacity-40 block">TELÉFONO</span>
                  <span className="text-sm font-bold">{vale.titular.telefono || "-"}</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. CIERRE (Condiciones y Sello) */}
      <div className="mt-auto pt-10" style={{ paddingBottom: "10mm" }}>
        <div className="flex justify-between items-end border-t border-gray-100 pt-6">
          <div className="max-w-[350px]">
            <p className="text-[9px] font-medium leading-tight opacity-50">
              * Válido para toda la flota Caravalia. Sujeto a disponibilidad y condiciones generales. 
              No canjeable por efectivo. ID: {vale.id.substring(0,8)}
            </p>
            {/* Datos Fiscales */}
            <p className="text-[8px] font-bold mt-4 opacity-30 uppercase tracking-tighter">
              Caravalia es una firma de MyMarket Cor SLU / CIF: B56133655 / Córdoba
            </p>
          </div>
          
          <div className="text-center">
            <span className="text-[8px] font-bold uppercase opacity-30 block mb-1 tracking-widest">SELLO DE VALIDACIÓN</span>
            <div style={{ width: "180px", height: "100px" }}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sello%20MyMarket%20firma%20Antonio-shDfG8DxpLyeHQZ9L6LHPvMYfl7dGS.png"
                alt="Sello"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Sello de estado de pago */}
          <div
            style={{
              position: "absolute",
              bottom: "35mm",
              right: "25mm",
              transform: "rotate(-15deg)",
              border: vale.pagado ? "4px double #16a34a" : "4px double #dc2626",
              borderRadius: "12px",
              padding: "8px 20px",
              opacity: 0.85,
            }}
          >
            <span
              style={{
                fontSize: vale.pagado ? "24px" : "16px",
                fontWeight: 900,
                letterSpacing: "0.15em",
                color: vale.pagado ? "#16a34a" : "#dc2626",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {vale.pagado ? "PAGADO" : "PENDIENTE DE PAGO"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
