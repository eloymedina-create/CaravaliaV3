
const fs = require("fs");
const path = "./app/page.tsx";
let content = fs.readFileSync(path, "utf8");

const autocaravanasReplacement = `const autocaravanasCards = useMemo(() => {
    return autocaravanas.map((autocaravana) => (
      <Link key={autocaravana.id} href={\`/reserva/\${encodeURIComponent(autocaravana.modelo)}\`} className="group w-full flex items-center justify-between bg-primary text-on-primary px-8 py-6 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary-container shadow-sm mb-4">
        <div className="flex flex-col items-start">
          <span className="font-headline font-bold text-xl tracking-tight">{autocaravana.modelo}</span>
          <span className="text-sm opacity-80 font-body">{autocaravana.matricula} - Activa</span>
        </div>
        <span className="material-symbols-outlined text-3xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </Link>
    ))
  }, [autocaravanas])`;

content = content.replace(/const autocaravanasCards = useMemo\(\(\) => \{[\s\S]*?\}, \[autocaravanas\]\)/, autocaravanasReplacement);

const returnReplacement = `return (
    <main className="flex flex-col items-center justify-start w-full min-h-screen bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopAppBar onLogout={() => {
        localStorage.removeItem("auth-token")
        sessionStorage.removeItem("adminAuthenticated")
        window.location.href = "/login"
      }} />

      <div className="w-full max-w-xl flex flex-col items-center relative overflow-hidden px-6 py-24 md:py-32">
        {resultadoSync === "success" && (
          <Alert className="mb-6 bg-green-50 border-green-200 w-full rounded-full shadow-sm">
            <span className="material-symbols-outlined h-4 w-4 text-green-600 relative top-1">check_circle</span>
            <AlertTitle className="text-green-800 ml-6 tracking-tight">Sincronización exitosa</AlertTitle>
            <AlertDescription className="text-green-700 ml-6">{mensajeSync}</AlertDescription>
          </Alert>
        )}

        {resultadoSync === "error" && (
          <Alert variant="destructive" className="mb-6 w-full rounded-full shadow-sm">
            <span className="material-symbols-outlined h-4 w-4 text-red-600 relative top-1">error</span>
            <AlertTitle className="ml-6 tracking-tight">Error de sincronización</AlertTitle>
            <AlertDescription className="ml-6">{mensajeSync}</AlertDescription>
          </Alert>
        )}

        {/* Branding Section */}
        <div className="relative z-10 flex flex-col items-center mb-16 space-y-4">
          <div className="w-24 h-24 bg-primary text-on-primary rounded-lg flex items-center justify-center transform -rotate-6 shadow-xl mb-4 relative z-20">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "\"\\\"FILL\\\" 1\"" }}>airport_shuttle</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline relative z-20">Caravalia</h1>
          <p className="text-secondary font-medium tracking-widest font-label uppercase opacity-80 text-xs relative z-20">Digital Concierge</p>
          
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
          <button onClick={() => window.open("https://calendar.google.com", "_blank")} className="w-full flex items-center justify-between bg-secondary-container text-on-secondary-container px-8 py-6 rounded-[2rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Calendario</span>
              <span className="text-sm opacity-70 font-body">Google Calendar</span>
            </div>
            <span className="material-symbols-outlined text-2xl">event</span>
          </button>

          <Link href="/reservas" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-6 rounded-[2rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Listado de Reservas</span>
              <span className="text-sm opacity-70 font-body">Historial y logística</span>
            </div>
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </Link>

          <Link href="/autocaravanas" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-6 rounded-[2rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Flota</span>
              <span className="text-sm opacity-70 font-body">Gestión de vehículos</span>
            </div>
            <span className="material-symbols-outlined text-2xl">rv_hookup</span>
          </Link>

          <Link href="/precios" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-6 rounded-[2rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Tarifas</span>
              <span className="text-sm opacity-70 font-body">Gestión de precios</span>
            </div>
            <span className="material-symbols-outlined text-2xl">sell</span>
          </Link>
          
          <Link href="/documentos" className="w-full flex items-center justify-between bg-surface-container-high text-on-secondary-container px-8 py-6 rounded-[2rem] transition-all duration-300 hover:opacity-80 active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Documentos</span>
              <span className="text-sm opacity-70 font-body">Catálogo legal</span>
            </div>
            <span className="material-symbols-outlined text-2xl">description</span>
          </Link>

          <button onClick={() => setShowAdminAuth(true)} className="w-full flex items-center justify-between bg-error-container/30 text-error px-8 py-6 rounded-[2rem] transition-all duration-300 hover:bg-error-container hover:text-on-error-container active:scale-[0.98]">
            <div className="flex flex-col items-start text-left">
              <span className="font-headline font-bold text-lg tracking-tight">Admin & Sync</span>
              <span className="text-sm opacity-70 font-body">Avanzado</span>
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
  )`;

content = content.replace(/return \(\s*<main className="min-h-screen[\s\S]*?\)\s*\}$/, returnReplacement + "\n}");

fs.writeFileSync(path, content);
console.log("Rewrite complete.");

