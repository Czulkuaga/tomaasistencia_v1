"use client";
import React, { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { getCookie } from "cookies-next";
import { GETSurveyDetail } from "@/actions/survey/survey-action";
import { GETEventDetail } from "@/actions/feature/event-action";

interface Stands {
  id_stand?: number
  name?: string;
  company_name?: string;
  description?: string;
  location?: string;
  qr_code: string;
  token?: string;
  event: number;
  survey?: number; 
  is_active?: boolean

}

interface ModalVistaProps {
  isOpen: boolean;
  onClose: () => void;
  stand: Stands | null;
}

export default function ModalVista({ isOpen, onClose, stand }: ModalVistaProps) {
  
  const [surveyName, setSurveyName] = useState<string>("");
    const [eventName, setEventName] = useState<string>("");
  
    useEffect(() => {
    let ignore = false;
  
    const loadNames = async () => {
      if (!isOpen || !stand) { setSurveyName(""); setEventName(""); return; }
      const token = (getCookie("authToken") as string) || "";
  
      const [surveyRes, eventRes] = await Promise.all([
        stand.survey ? GETSurveyDetail(stand.survey, token) : Promise.resolve(null),
        stand.event  ? GETEventDetail(stand.event,  token)  : Promise.resolve(null),
      ]);
  
      if (!ignore) {
        setSurveyName(surveyRes?.name ?? "");
        setEventName(eventRes?.name ?? "");
      }
    };
  
    loadNames();
    return () => { ignore = true; };
  }, [isOpen, stand]);
  
  
  if (!isOpen || !stand) return null;

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
              <h2 className="text-lg font-semibold text-violet-600">Información de los Stand</h2>

            </div>
          </div>


        </div>


        {/* Cuerpo */}
        <div className="overflow-auto max-h-[60vh] pr-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Evento */}
           
           {/* Evento (nombre) */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Evento</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand.event ? (eventName || "Cargando…") : "—"}
              </p>
            </div>

            {/* Encuesta (nombre) */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Encuesta vinculada</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand.survey ? (surveyName || "Cargando…") : "—"}
              </p>
            </div>

            {/* Nombre */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Nombre</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand?.name || "—"}
              </p>
            </div>

            {/* Descripción */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand?.description || "—"}
              </p>
            </div>

            {/* País */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Nombre Empresa</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand?.company_name || "—"}
              </p>
            </div>

            {/* Departamento */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Lugar</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand?.location || "—"}
              </p>
            </div>

            {/* Activo */}
            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Activo</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {stand?.is_active ? "Sí" : "No"}
              </p>
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
      </div>
    </div>
  );
}