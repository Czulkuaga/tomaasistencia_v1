import React from 'react'
import Eventos from '@/components/eventos/Eventos'


export default function PageEvent() {
  return (
    <div className="min-h-screen pt-0 sm:pt-0 lg:pt-0 px-2 sm:px-4 lg:px-6 space-y-6">
        {/* <div className="min-h-screen -mt-6 px-2 sm:px-4 lg:px-6 space-y-6"></div> */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Evento</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Aquí puedes crear tu evento y añadir toda la información necesaria
        </p>
      </div>
      <Eventos />
    </div>
  );
}
