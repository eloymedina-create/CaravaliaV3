"use client"

import { Truck, Home, Bus, Caravan } from "lucide-react"
import { AutocaravanaIcon } from "@/components/icons/autocaravana-icon"
import { AutocaravanaIcon2 } from "./autocaravana-icon-2"
import { AutocaravanaIcon3 } from "./autocaravana-icon-3"
import { AutocaravanaIcon4 } from "./autocaravana-icon-4"
import { useState } from "react"

export default function MuestraCompleta() {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)

  const handleSelect = (iconName: string) => {
    setSelectedIcon(iconName)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6 text-center">Todas las Opciones de Iconos</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
          </div>
        </div>

        {/* Opción 5: Autocaravana personalizada 2 */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "autocaravana2" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("autocaravana2")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <AutocaravanaIcon2 size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Autocaravana 2</h3>
          </div>
        </div>

        {/* Opción 6: Autocaravana personalizada 3 */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "autocaravana3" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("autocaravana3")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <AutocaravanaIcon3 size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Autocaravana 3</h3>
          </div>
        </div>

        {/* Opción 7: Autocaravana personalizada 4 */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedIcon === "autocaravana4" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => handleSelect("autocaravana4")}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <AutocaravanaIcon4 size={40} className="text-blue-600" />
            </div>
            <h3 className="font-medium">Autocaravana 4</h3>
          </div>
        </div>

        {/* Opción 8: Truck */}
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
                  : selectedIcon === "home-truck"
                    ? "Casa Móvil"
                    : selectedIcon === "bus"
                      ? "Autobus/Camper"
                      : selectedIcon === "autocaravana2"
                        ? "Autocaravana 2"
                        : selectedIcon === "autocaravana3"
                          ? "Autocaravana 3"
                          : selectedIcon === "autocaravana4"
                            ? "Autocaravana 4"
                            : "Camión"}
            </strong>
          </p>
        </div>
      )}
    </div>
  )
}
