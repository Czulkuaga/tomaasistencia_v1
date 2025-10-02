import EditSurvey from "@/components/encuesta/EditSurvey"

export default function EditarEncuestaPage() {
  return (
    <div className="min-h-screen pt-10 sm:pt-8 lg:pt-8 px-2 sm:px-4 lg:px-6 space-y-6">
      <div className="p-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl pt-6 font-bold text-purple-400">Editar Encuesta</h1>
            <p className="text-gray-500">Modifica las preguntas y opciones de tu encuesta</p>
          </div>
        </div>
      </div>
      <EditSurvey />
    </div>
  )
}
