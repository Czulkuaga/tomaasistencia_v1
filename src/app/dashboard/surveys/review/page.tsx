import ReviewSurvey from "@/components/encuesta/ReviewSurvey"

export default function ReviewPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Revisión de Datos</h1>
                    <p className="text-gray-600 mt-1">Analiza los resultados de las encuestas por categoría</p>
                </div>
            </div>
            <ReviewSurvey />
        </div>
    )
}
