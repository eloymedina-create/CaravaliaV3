
const fs = require("fs");
const path = "e:/DESCARGAS/Caravalia/app/page.tsx";
let content = fs.readFileSync(path, "utf8");

// Fix imports: restore Lucide icons for now or remove them correctly if they are used elsewhere
// But we actually just want to replace the main `return (`.
const returnIndex = content.indexOf(`  return (\r\n    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white`) || content.indexOf(`  return (\n    <main `) || content.indexOf(`  return (`);

if (returnIndex === -1) {
    console.error("Could not find the return statement");
    process.exit(1);
}

// Ensure autocaravanasCards is also replaced.
const autocaravanasReplacement = `const autocaravanasCards = useMemo(() => {
    return autocaravanas.map((autocaravana) => (
      <Link key={autocaravana.id} href={\`/reserva/\${encodeURIComponent(autocaravana.modelo)}\`} className="group w-full flex items-center justify-between bg-primary text-on-primary px-8 py-6 rounded-[1.5rem] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary/90 shadow-sm mb-4">
        <div className="flex flex-col items-start text-left">
          <span className="font-headline font-bold text-xl tracking-tight">{autocaravana.modelo}</span>
          <span className="text-xs opacity-70 font-body uppercase tracking-wider">{autocaravana.matricula} • Activa</span>
        </div>
        <span className="material-symbols-outlined text-3xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </Link>
    ))
  }, [autocaravanas])`;

content = content.replace(/const autocaravanasCards = useMemo\(\(\) => \{[\s\S]*?\}, \[autocaravanas\]\)/, autocaravanasReplacement);

const newReturn = `  return (
    <main className="flex flex-col items-center justify-start w-full min-h-screen bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopAppBar onLogout={() => {
        localStorage.removeItem("auth-token")
        sessionStorage.removeItem("adminAuthenticated")
        window.location.href = "/login"
      }} />

      <div className="w-full max-w-xl flex flex-col items-center relative overflow-hidden px-6 py-24 md:py-32">
        {resultadoSync === "success" && (
          <Alert className="mb-6 bg-green-50 border-green-200 w-full rounded-[1.5rem] shadow-sm">
            <span className="material-symbols-outlined h-5 w-5 text-green-600 relative top-1">check_circle</span>
            <AlertTitle className="text-green-800 ml-8 tracking-tight font-headline font-bold">Sincronización exitosa</AlertTitle>
            <AlertDescription className="text-green-700 ml-8 font-body text-sm mt-1">{mensajeSync}</AlertDescription>
          </Alert>
        )}

        {resultadoSync === "error" && (
          <Alert variant="destructive" className="mb-6 w-full rounded-[1.5rem] shadow-sm">
            <span className="material-symbols-outlined h-5 w-5 text-red-600 relative top-1">error</span>
            <AlertTitle className="ml-8 tracking-tight font-headline font-bold">Error de sincronización</AlertTitle>
            <AlertDescription className="ml-8 font-body text-sm mt-1">{mensajeSync}</AlertDescription>
          </Alert>
        )}

        {/* Branding Section */}
        <div className="relative z-10 flex flex-col items-center mb-16 space-y-3">
          <div className="w-20 h-20 bg-primary text-on-primary rounded-[1.5rem] flex items-center justify-center transform -rotate-3 shadow-lg mb-4 relative z-20">
            <span className="material-symbols-outlined text-[2.5rem]" style={{ fontVariationSettings: "\"\\\"FILL\\\" 1\"" }}>airport_shuttle</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline relative z-20">Caravalia</h1>
          <p className="text-secondary font-medium tracking-[0.2em] font-label uppercase opacity-80 text-[10px] relative z-20">Digital Concierge</p>
          
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-transparent pointer-events-none transform rounded-[100px] scale-150 -z-10 blur-3xl opacity-50"></div>
        </div>

        {/* Section: Autocaravanas Cards */}
        <div className="w-full relative z-10 mb-8">
          {autocaravanasCards}
        </div>

        {/* Divider */}
        <div className="w-full border-t border-dashed border-outline-variant mb-10 opacity-60"></div>

        {/* Actions Stack */}
        <div className="w-full space-y-4 relative z-10">
          <button onClick={() => window.open("https://calendar.google.com", "_blank")} className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-5 rounded-[1.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Calendario</span>
              <span className="text-xs opacity-70 font-body uppercase tracking-wider mt-1">Google Calendar</span>
            </div>
            <span className="material-symbols-outlined text-2xl text-secondary">event</span>
          </button>

          <Link href="/reservas" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-5 rounded-[1.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Listado de Reservas</span>
              <span className="text-xs opacity-70 font-body uppercase tracking-wider mt-1">Historial y logística</span>
            </div>
            <span className="material-symbols-outlined text-2xl text-secondary">receipt_long</span>
          </Link>

          <Link href="/autocaravanas" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-5 rounded-[1.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Flota</span>
              <span className="text-xs opacity-70 font-body uppercase tracking-wider mt-1">Gestión de vehículos</span>
            </div>
            <span className="material-symbols-outlined text-2xl text-secondary">rv_hookup</span>
          </Link>

          <Link href="/precios" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-5 rounded-[1.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Tarifas</span>
              <span className="text-xs opacity-70 font-body uppercase tracking-wider mt-1">Gestión de precios</span>
            </div>
            <span className="material-symbols-outlined text-2xl text-secondary">sell</span>
          </Link>
          
          <Link href="/documentos" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-5 rounded-[1.5rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Documentos</span>
              <span className="text-xs opacity-70 font-body uppercase tracking-wider mt-1">Catálogo legal</span>
            </div>
            <span className="material-symbols-outlined text-2xl text-secondary">description</span>
          </Link>

          <button onClick={() => setShowAdminAuth(true)} className="w-full flex items-center justify-between bg-error-container/30 text-error px-8 py-5 rounded-[1.5rem] transition-all duration-300 hover:bg-error-container hover:text-on-error-container active:scale-[0.98] mt-4">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Admin & Sync</span>
              <span className="text-xs opacity-70 font-body uppercase tracking-wider mt-1">Avanzado</span>
            </div>
            <span className="material-symbols-outlined text-2xl">shield_person</span>
          </button>
        </div>
        
        {/* Aesthetic Detail */}
        <div className="mt-16 w-full flex flex-col items-center opacity-30">
          <div className="w-full border-t-2 border-dashed border-outline-variant mb-4"></div>
          <p className="text-[10px] font-label tracking-[0.3em] uppercase text-outline mt-2 font-bold">Caravalia M3 • V3.0</p>
        </div>

        <AdminAuthDialog isOpen={showAdminAuth} onClose={() => setShowAdminAuth(false)} destination="/admin" />
      </div>
    </main>
  )
}
`;

// Find the last actual return in the component
let newBody = content.substring(0, content.lastIndexOf(`  return (`));
fs.writeFileSync(path, newBody + newReturn);
console.log("Fixed page.tsx");

