"use client"

import React from "react"
import { SyncStatus } from "@/components/sync-status"

export function TopAppBar({ 
  onLogout 
}: { 
  onLogout?: () => void 
}) {
  return (
    <header className="fixed top-0 w-full z-50 bg-stone-50/80 dark:bg-emerald-950/80 backdrop-blur-xl flex items-center justify-between px-6 py-4 w-full text-emerald-900 dark:text-emerald-50 font-headline tracking-tight border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <button className="text-emerald-900 dark:text-emerald-50 hover:opacity-80 transition-opacity scale-95 active:scale-90">
          <span className="material-symbols-outlined pointer-events-none">menu</span>
        </button>
        <span className="text-2xl font-bold tracking-tighter">Caravalia</span>
      </div>
      <div className="flex items-center gap-4">
        <SyncStatus />
        {onLogout && (
          <button 
            onClick={onLogout}
            className="text-[10px] bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full uppercase font-bold tracking-wider hover:opacity-80 transition-opacity shadow-sm"
            title="Cerrar sesión"
          >
            Salir
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary">person</span>
        </div>
      </div>
    </header>
  )
}
