import React from 'react'
import Asisten from "@/components/asistente/Asisten"


export default function pageAsistente() {
    return (
        <div className="min-h-screen pt-0 sm:pt-0 lg:pt-0 px-2 sm:px-4 lg:px-6 space-y-6">
            {/* Encabezado */}
            <div>

                <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Asistente</h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    ¡Inscríbete y participa en los eventos!
                </p>

            </div>

            <Asisten />
        </div>
    )
}