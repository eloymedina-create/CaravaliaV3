"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen, Calendar, Car, Settings, Database, HelpCircle, FileText, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AyudaPage() {
  const [activeTab, setActiveTab] = useState("introduccion")

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-all">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Manual de Ayuda</h1>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-caravalia-600" />
          </div>
        </div>

        {/* Contenido principal */}
        <Card className="mb-6">
          <CardHeader className="bg-caravalia-50 border-b">
            <CardTitle>Guía de Usuario - Caravalia</CardTitle>
            <CardDescription>
              Manual completo para aprender a utilizar todas las funcionalidades de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto p-0 bg-gray-50 border-b">
                <TabsTrigger value="introduccion" className="py-3 px-4 data-[state=active]:bg-white">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Introducción
                </TabsTrigger>
                <TabsTrigger value="reservas" className="py-3 px-4 data-[state=active]:bg-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservas
                </TabsTrigger>
                <TabsTrigger value="autocaravanas" className="py-3 px-4 data-[state=active]:bg-white">
                  <Car className="h-4 w-4 mr-2" />
                  Autocaravanas
                </TabsTrigger>
                <TabsTrigger value="copias" className="py-3 px-4 data-[state=active]:bg-white">
                  <Database className="h-4 w-4 mr-2" />
                  Copias de Seguridad
                </TabsTrigger>
                <TabsTrigger value="configuracion" className="py-3 px-4 data-[state=active]:bg-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </TabsTrigger>
              </TabsList>

              {/* Contenido de las pestañas */}
              <div className="p-6">
                <TabsContent value="introduccion">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800">Bienvenido a Caravalia</h2>
                        <p className="mt-2">
                          Caravalia es una aplicación diseñada para gestionar reservas de autocaravanas de manera
                          sencilla y eficiente. Este manual te guiará a través de todas las funcionalidades disponibles
                          en la aplicación.
                        </p>
                      </div>
                      <div className="w-full md:w-1/3 rounded-lg overflow-hidden shadow-md">
                        <div className="bg-caravalia-100 p-6 flex justify-center">
                          <Image
                            src="/colorful-illustrated-caravan.png"
                            alt="Caravalia"
                            width={180}
                            height={180}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <Alert className="bg-caravalia-50 border-caravalia-200">
                      <HelpCircle className="h-4 w-4 text-caravalia-600" />
                      <AlertTitle>Consejo</AlertTitle>
                      <AlertDescription>
                        Puedes acceder a esta ayuda en cualquier momento desde la página principal haciendo clic en el
                        botón "Ayuda".
                      </AlertDescription>
                    </Alert>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Funcionalidades principales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <Calendar className="h-6 w-6 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Gestión de reservas</strong>
                          <p className="text-sm text-gray-600">Crear, editar, eliminar y validar reservas.</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <Car className="h-6 w-6 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Gestión de autocaravanas</strong>
                          <p className="text-sm text-gray-600">Añadir, editar y eliminar modelos de autocaravanas.</p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <FileText className="h-6 w-6 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Generación de documentos</strong>
                          <p className="text-sm text-gray-600">
                            Crear contratos y resúmenes de reserva en formato PDF.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <Database className="h-6 w-6 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Copias de seguridad</strong>
                          <p className="text-sm text-gray-600">
                            Exportar e importar datos para mantener la información segura.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Navegación</h3>
                    <p>La aplicación está organizada en varias secciones accesibles desde la página principal:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Autocaravanas:</strong> Muestra los modelos disponibles para crear nuevas reservas.
                      </li>
                      <li>
                        <strong>Acciones rápidas:</strong> Acceso directo a las funciones más utilizadas.
                      </li>
                      <li>
                        <strong>Configuración:</strong> Opciones para personalizar la aplicación.
                      </li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="reservas">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800">Gestión de Reservas</h2>

                    <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-700">Crear una nueva reserva</h3>
                        <ol className="list-decimal pl-6 space-y-2 mt-2">
                          <li>
                            <strong>Seleccionar autocaravana:</strong> En la página principal, haz clic en el modelo de
                            autocaravana deseado.
                          </li>
                          <li>
                            <strong>Detalles de la reserva:</strong> Completa la información sobre fechas, precios y
                            otros detalles.
                          </li>
                          <li>
                            <strong>Datos del cliente:</strong> Introduce la información del cliente que realiza la
                            reserva.
                          </li>
                          <li>
                            <strong>Confirmación:</strong> Revisa todos los datos y confirma la reserva.
                          </li>
                        </ol>
                      </div>
                      <div className="w-full md:w-1/3 rounded-lg overflow-hidden shadow-md">
                        <div className="bg-gray-50 p-4 flex justify-center">
                          <Image
                            src="/formulario-de-reserva.png"
                            alt="Proceso de reserva"
                            width={160}
                            height={160}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Ver y gestionar reservas existentes</h3>
                    <p>
                      Para acceder al listado de reservas, haz clic en el botón "Listado de reservas" en la sección de
                      Acciones rápidas.
                    </p>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
                      <h4 className="font-medium text-gray-800 mb-2">En esta página podrás:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-sm">
                            <strong>Buscar reservas:</strong> Utiliza el campo de búsqueda para filtrar por nombre,
                            modelo, etc.
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-sm">
                            <strong>Editar reservas:</strong> Haz clic en el icono de lápiz para modificar una reserva
                            existente.
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-sm">
                            <strong>Eliminar reservas:</strong> Utiliza el icono de papelera para eliminar una reserva.
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-sm">
                            <strong>Validar reservas:</strong> Marca una reserva como validada con el icono de check.
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-sm">
                            <strong>Generar contrato:</strong> Crea un contrato en formato Word para la reserva
                            seleccionada.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Generar resumen de reserva</h3>
                    <p>
                      Desde la página de confirmación o desde el listado de reservas, puedes generar un resumen de la
                      reserva:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2 mt-2">
                      <li>Accede a la reserva deseada.</li>
                      <li>Haz clic en "Enviar resumen".</li>
                      <li>
                        Se generará un documento A4 con todos los detalles de la reserva y se guardará automáticamente
                        en tu dispositivo.
                      </li>
                      <li>Puedes encontrar este documento en tu carpeta de descargas.</li>
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="autocaravanas">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800">Gestión de Autocaravanas</h2>

                        <h3 className="text-lg font-medium text-gray-700 mt-4">
                          Acceder a la gestión de autocaravanas
                        </h3>
                        <p className="mt-2">
                          Para gestionar los modelos de autocaravanas disponibles, haz clic en "Editar autocaravanas" en
                          la sección de Configuración de la página principal.
                        </p>
                      </div>
                      <div className="w-full md:w-1/3 rounded-lg overflow-hidden shadow-md">
                        <div className="bg-gray-50 p-4 flex justify-center">
                          <Image
                            src="/autocaravana-ilustracion.png"
                            alt="Gestión de autocaravanas"
                            width={160}
                            height={160}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Añadir una nueva autocaravana</h3>
                    <ol className="list-decimal pl-6 space-y-2 mt-2">
                      <li>En la página de gestión de autocaravanas, haz clic en "Añadir autocaravana".</li>
                      <li>
                        Completa el formulario con la información del modelo:
                        <div className="bg-white p-4 rounded-lg border border-gray-200 mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <p className="text-sm">
                              <strong>Modelo:</strong> Nombre del modelo de autocaravana.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <p className="text-sm">
                              <strong>Matrícula:</strong> Número de matrícula del vehículo.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <p className="text-sm">
                              <strong>Número de bastidor:</strong> Identificador único del vehículo.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <p className="text-sm">
                              <strong>Activa:</strong> Indica si la autocaravana está disponible para reservas.
                            </p>
                          </div>
                        </div>
                      </li>
                      <li>Haz clic en "Guardar" para añadir la nueva autocaravana.</li>
                    </ol>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Editar o eliminar autocaravanas</h3>
                    <p>En la página de gestión de autocaravanas:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      <li>
                        <strong>Editar:</strong> Haz clic en el icono de lápiz junto a la autocaravana que deseas
                        modificar.
                      </li>
                      <li>
                        <strong>Eliminar:</strong> Haz clic en el icono de papelera para eliminar una autocaravana.
                      </li>
                      <li>
                        <strong>Activar/Desactivar:</strong> Utiliza el interruptor para cambiar el estado de
                        disponibilidad.
                      </li>
                    </ul>

                    <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                      <AlertTitle>Importante</AlertTitle>
                      <AlertDescription>
                        Eliminar una autocaravana no afectará a las reservas existentes, pero no podrás crear nuevas
                        reservas para ese modelo.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>

                <TabsContent value="copias">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800">Copias de Seguridad</h2>

                        <h3 className="text-lg font-medium text-gray-700 mt-4">Acceder a las copias de seguridad</h3>
                        <p className="mt-2">
                          Para gestionar las copias de seguridad, haz clic en "Diagnóstico y Cop. Seg." en la sección de
                          Acciones rápidas de la página principal.
                        </p>
                      </div>
                      <div className="w-full md:w-1/3 rounded-lg overflow-hidden shadow-md">
                        <div className="bg-gray-50 p-4 flex justify-center">
                          <Image
                            src="/backup-database-icon.png"
                            alt="Copias de seguridad"
                            width={160}
                            height={160}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-700">Exportar copia de seguridad</h3>
                        <ol className="list-decimal pl-6 space-y-2 mt-2">
                          <li>En la página de Diagnóstico, busca la sección "Exportar/Importar reservas".</li>
                          <li>Haz clic en el botón "Exportar Copia de Seguridad JSON".</li>
                          <li>Se descargará un archivo con el nombre "COPIA SEG. CARAVALIA (fecha).JSON".</li>
                          <li>Guarda este archivo en un lugar seguro.</li>
                        </ol>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-700">Importar copia de seguridad</h3>
                        <ol className="list-decimal pl-6 space-y-2 mt-2">
                          <li>En la página de Diagnóstico, busca la sección "Exportar/Importar reservas".</li>
                          <li>Haz clic en el botón "Importar Copia de Seguridad JSON".</li>
                          <li>Selecciona el archivo JSON que contiene la copia de seguridad.</li>
                          <li>Confirma la importación cuando se te solicite.</li>
                        </ol>
                      </div>
                    </div>

                    <Alert className="bg-red-50 border-red-200 mt-4">
                      <AlertTitle>Advertencia</AlertTitle>
                      <AlertDescription>
                        Importar una copia de seguridad reemplazará todas las reservas actuales. Asegúrate de exportar
                        tus datos actuales antes de importar una copia de seguridad antigua.
                      </AlertDescription>
                    </Alert>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Frecuencia recomendada</h3>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mt-2">
                      <p>Se recomienda realizar copias de seguridad:</p>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Después de crear varias reservas nuevas.</li>
                        <li>Antes de realizar cambios importantes en la configuración.</li>
                        <li>Periódicamente (semanal o mensualmente) como medida preventiva.</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="configuracion">
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-800">Configuración</h2>

                        <h3 className="text-lg font-medium text-gray-700 mt-4">Acceder a la configuración</h3>
                        <p className="mt-2">
                          Para acceder a las opciones de configuración, haz clic en "Configuración" en la sección de
                          Configuración de la página principal.
                        </p>
                      </div>
                      <div className="w-full md:w-1/3 rounded-lg overflow-hidden shadow-md">
                        <div className="bg-gray-50 p-4 flex justify-center">
                          <Image
                            src="/settings-gear-icon.png"
                            alt="Configuración"
                            width={160}
                            height={160}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Opciones disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <Settings className="h-5 w-5 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Información de la empresa</strong>
                          <p className="text-sm text-gray-600">
                            Configura los datos de tu empresa que aparecerán en los documentos generados.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <FileText className="h-5 w-5 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Condiciones generales</strong>
                          <p className="text-sm text-gray-600">
                            Personaliza los textos de las condiciones que aparecen en los contratos y resúmenes.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <Car className="h-5 w-5 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Gestión de autocaravanas</strong>
                          <p className="text-sm text-gray-600">
                            Añade, edita o elimina los modelos de autocaravanas disponibles.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3">
                        <Database className="h-5 w-5 text-caravalia-600 mt-1" />
                        <div>
                          <strong>Copias de seguridad</strong>
                          <p className="text-sm text-gray-600">
                            Exporta e importa datos para mantener la información segura.
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-700 mt-6">Guardar cambios</h3>
                    <p>
                      Después de realizar cualquier modificación en la configuración, asegúrate de hacer clic en el
                      botón "Guardar" para aplicar los cambios.
                    </p>

                    <Alert className="bg-caravalia-50 border-caravalia-200 mt-2">
                      <AlertTitle>Consejo</AlertTitle>
                      <AlertDescription>
                        Los cambios en la configuración afectarán a las nuevas reservas que se creen, pero no
                        modificarán las reservas existentes.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sección de ayuda adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preguntas frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <strong className="text-caravalia-700">¿Cómo puedo editar una reserva existente?</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Ve al Listado de reservas y haz clic en el icono de lápiz junto a la reserva que deseas modificar.
                  </p>
                </li>
                <li>
                  <strong className="text-caravalia-700">¿Qué significa validar una reserva?</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Validar una reserva confirma que ha sido revisada y aprobada. También registra la fecha de
                    validación.
                  </p>
                </li>
                <li>
                  <strong className="text-caravalia-700">¿Cómo puedo recuperar una reserva eliminada?</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Solo es posible si tienes una copia de seguridad anterior a la eliminación. Importa esa copia para
                    recuperar los datos.
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consejos útiles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <strong className="text-caravalia-700">Realiza copias de seguridad regularmente</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Exporta tus datos periódicamente para evitar pérdidas de información.
                  </p>
                </li>
                <li>
                  <strong className="text-caravalia-700">Utiliza la búsqueda en el listado de reservas</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Para encontrar rápidamente una reserva, usa el campo de búsqueda con el nombre del cliente o modelo.
                  </p>
                </li>
                <li>
                  <strong className="text-caravalia-700">Revisa el calendario regularmente</strong>
                  <p className="text-sm text-gray-600 mt-1">
                    Mantén actualizado el calendario para evitar solapamientos de reservas.
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Manual de Ayuda - Caravalia</p>
          <p className="mt-1">Si necesitas asistencia adicional, contacta con el soporte técnico.</p>
        </div>
      </div>
    </main>
  )
}
