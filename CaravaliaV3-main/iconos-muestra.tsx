"use client"

import { Truck, Home, Bus, Caravan } from "lucide-react"
import { AutocaravanaIcon } from "@/components/icons/autocaravana-icon"
import { useState } from "react"

export default function MuestraIconos() {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)

  const handleSelect = (iconName: string) => {
    setSelectedIcon(iconName)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6 text-center">Opciones de Iconos para Autocaravanas</h2>

      <div className="grid grid-cols-2 gap-6">
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
            <p className="text-sm text-gray-500 text-center mt-2">
              El icono personalizado que ya estás usando en la aplicación
            </p>
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
            <p className="text-sm text-gray-500 text-center mt-2">Un icono de caravana simple y moderno</p>
          </div>
        </div>

        {/* Opción 3: Combinación de Home y Truck */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "home-truck" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("home-truck")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3 relative">
              <Truck size={40} className="text-blue-600" />
              <Home size={20} className="text-blue-800 absolute top-2 right-2" />
            </div>
            <h3 className="font-medium">Casa Móvil</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Combinación de camión y casa para representar una autocaravana
            </p>
          </div>
        </div>

        {/* Opción 4: Bus modificado */}
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
            <h3 className="font-medium">Autobus/Camper</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Un icono de autobús que puede representar una autocaravana tipo camper
            </p>
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
                  : selectedIcon === "home-truck"
                    ? "Casa Móvil"
                    : "Autobus/Camper"}
            </strong>
          </p>
        </div>
      )}
    </div>
  )
}
