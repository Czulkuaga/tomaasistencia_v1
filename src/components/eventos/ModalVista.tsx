"use client";
import React from "react";
import { FiInfo } from "react-icons/fi";

interface Events {
  id_event?: number
  name?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean
}

interface ModalVistaProps {
  isOpen: boolean;
  onClose: () => void;
  event: Events | null; // 👈 evento seleccionado
}

export default function ModalVista({ isOpen, onClose, event }: ModalVistaProps) {
  if (!isOpen || !event) return null; // 👈 no renderiza si no hay evento

  return (
    <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}>
      <div
        className="relative bg-white/95 w-full max-w-2xl rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banda superior de acento */}
        <span className="absolute inset-x-0 -top-1 h-1 rounded-t-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400" />

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="">
              <FiInfo className="text-violet-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-violet-600">Visualizar los Eventos</h2>

            </div>
          </div>


        </div>

        {/* Cuerpo */}
        <div className="overflow-auto max-h-[60vh] pr-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Nombre */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Nombre</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {event?.name || "—"}
              </p>
            </div>

            {/* Descripción */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.description || "—"}
              </p>
            </div>

            {/* País */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">País</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.country || "—"}
              </p>
            </div>

            {/* Departamento */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Departamento</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.state || "—"}
              </p>
            </div>

            {/* Ciudad */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Ciudad</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.city || "—"}
              </p>
            </div>

            {/* Dirección */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Dirección</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.address || "—"}
              </p>
            </div>

            {/* Fecha de inicio */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de inicio</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.start_date || "—"}
              </p>
            </div>

            {/* Fecha fin */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Fecha fin</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.end_date || "—"}
              </p>
            </div>

            {/* Hora de inicio */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Hora de inicio</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.start_time || "—"}
              </p>
            </div>

            {/* Hora fin */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Hora fin</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.end_time || "—"}
              </p>
            </div>

            {/* Activo */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Activo</p>
              <p className="mt-1 text-gray-800  leading-relaxed">
                {event?.is_active ? "Sí" : "No"}
              </p>
            </div>
          </div>
        </div>



        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div >

  );
}
