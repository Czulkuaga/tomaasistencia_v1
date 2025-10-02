import React from 'react'
import Entregables from '@/components/entregables/Entregables'


export default function PageEvent() {

    return (
        <div className="min-h-screen pt-0 sm:pt-0 lg:pt-0 px-2 sm:px-4 lg:px-6 space-y-6">
            {/* Encabezado */}

            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Entregables</h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    ¡Puedes ingresar tus entregables para tu proximo evento!
                </p>
            </div>


            <Entregables />
        </div>
    )
}
