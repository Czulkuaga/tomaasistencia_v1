import Survey from "@/components/encuesta/Survey"

export default function EncuestaPage() {
  return (
    <div className="min-h-screen pt-10 sm:pt-8 lg:pt-8 px-2 sm:px-4 lg:px-6 space-y-6">
      
        {/* Encabezado */}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Sistema de Gestión de Encuestas</h1>
            <p className="text-gray-500 text-sm sm:text-base">Administra y crea encuestas de manera eficiente</p>
          </div>


      <Survey />
    </div>
  )
}
