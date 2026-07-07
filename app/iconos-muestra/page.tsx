"use client"

import { Truck, Bus, Caravan } from "lucide-react"
import { AutocaravanaIcon } from "@/components/icons/autocaravana-icon"
import { useState } from "react"

export default function MuestraIconos() {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)

  const handleSelect = (iconName: string) => {
    setSelectedIcon(iconName)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Opciones de Iconos para Autocaravanas</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Opción 1: El icono actual personalizado */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "autocaravana" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("autocaravana")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <AutocaravanaIcon size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Icono Actual</h3>
          </div>
        </div>

        {/* Opción 2: Icono de Caravan de Lucide */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "caravan" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("caravan")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Caravan size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Caravana</h3>
          </div>
        </div>

        {/* Opción 3: Bus */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "bus" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("bus")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Bus size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Autobús/Camper</h3>
          </div>
        </div>

        {/* Opción 4: Truck */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "truck" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("truck")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Truck size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Camión</h3>
          </div>
        </div>
      </div>

      {selectedIcon && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-center text-green-700">
            Has seleccionado:{" "}
            <strong>
              {selectedIcon === "autocaravana"
                ? "Icono Actual"
                : selectedIcon === "caravan"
                  ? "Caravana"
                  : selectedIcon === "bus"
                    ? "Autobús/Camper"
                    : "Camión"}
            </strong>
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <a href="/" className="text-blue-600 hover:underline">
          Volver a la página principal
        </a>
      </div>
    </div>
  )
}
