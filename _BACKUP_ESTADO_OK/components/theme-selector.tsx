"use client"

import { useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface ThemePreviewProps {
  theme: string
  label: string
  isActive: boolean
  onClick: () => void
}

const ThemePreview = ({ theme, label, isActive, onClick }: ThemePreviewProps) => {
  const [showPreview, setShowPreview] = useState(false)

  // Colores para las vistas previas
  const previewColors: Record<string, { primary: string; bg: string; text: string }> = {
    light: { primary: "#16a34a", bg: "#ffffff", text: "#111827" },
    dark: { primary: "#22c55e", bg: "#1f2937", text: "#f3f4f6" },
    blue: { primary: "#2563eb", bg: "#ffffff", text: "#111827" },
    purple: { primary: "#9333ea", bg: "#ffffff", text: "#111827" },
  }

  const colors = previewColors[theme] || previewColors.light

  return (
    <div className="relative">
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        className={`h-9 px-4 ${isActive ? "bg-theme-primary text-white" : "hover:bg-gray-100"}`}
      >
        {isActive && <Check className="mr-1 h-4 w-4" />}
        {label}
      </Button>

      {/* Vista previa en miniatura */}
      {showPreview && (
        <div className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
          <div style={{ backgroundColor: colors.bg }} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: colors.text }} className="text-xs font-medium">
                Vista previa
              </div>
              <div style={{ backgroundColor: colors.primary }} className="w-4 h-4 rounded-full"></div>
            </div>
            <div
              style={{ backgroundColor: colors.bg, borderColor: colors.primary }}
              className="border rounded-md p-2 mb-2"
            >
              <div style={{ backgroundColor: colors.primary }} className="w-full h-2 rounded-full mb-1"></div>
              <div style={{ backgroundColor: `${colors.primary}40` }} className="w-3/4 h-2 rounded-full"></div>
            </div>
            <div style={{ color: colors.text }} className="text-xs truncate">
              Tema {label}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-wrap gap-2">
      <ThemePreview theme="light" label="Claro" isActive={theme === "light"} onClick={() => setTheme("light")} />
      <ThemePreview theme="dark" label="Oscuro" isActive={theme === "dark"} onClick={() => setTheme("dark")} />
      <ThemePreview theme="blue" label="Azul" isActive={theme === "blue"} onClick={() => setTheme("blue")} />
      <ThemePreview theme="purple" label="Morado" isActive={theme === "purple"} onClick={() => setTheme("purple")} />
    </div>
  )
}
