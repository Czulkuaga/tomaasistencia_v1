import CreateSurvey from "@/components/encuesta/CreateSurvey"

export default function CrearEncuestaPage() {
  return (
    <div className="min-h-screen pt-10 sm:pt-8 lg:pt-8 px-2 sm:px-4 lg:px-6 space-y-6">
      <div className="p-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl pt-6 font-bold text-purple-400">Crear Nueva Encuesta</h1>
            <p className="text-gray-500">Diseña tu encuesta agregando preguntas y opciones</p>
          </div>
        </div>
      </div>
      <CreateSurvey />
    </div>
  )
}
