"use client";
import React, { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { FiInfo } from "react-icons/fi";
import { GETSurveyDetail } from "@/actions/survey/survey-action";
import { GETEventDetail } from "@/actions/feature/event-action"; 


interface Entregable {
  id_deliverable?: number
  name?: string;
  description?: string
  place?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  event?: number
  survey?: number;  
  is_active?: boolean
}

interface ModalVistaProps {
  isOpen: boolean;
  onClose: () => void;
  deliverable: Entregable | null; // 👈 evento seleccionado
}

export default function ModalVista({ isOpen, onClose, deliverable }: ModalVistaProps) {
  const [surveyName, setSurveyName] = useState<string>("");
    const [eventName, setEventName] = useState<string>("");

    useEffect(() => {
      let ignore = false;
    
      const loadNames = async () => {
        if (!isOpen || !deliverable) { setSurveyName(""); setEventName(""); return; }
        const token = (getCookie("authToken") as string) || "";
    
        const [surveyRes, eventRes] = await Promise.all([
          deliverable.survey ? GETSurveyDetail(deliverable.survey, token) : Promise.resolve(null),
          deliverable.event  ? GETEventDetail(deliverable.event,  token)  : Promise.resolve(null),
        ]);
    
        if (!ignore) {
          setSurveyName(surveyRes?.name ?? "");
          setEventName(eventRes?.name ?? "");
        }
      };
    
      loadNames();
      return () => { ignore = true; };
    }, [isOpen, deliverable]); // 👈 agrega 'activity'
  if (!isOpen || !deliverable) return null; // 👈 no renderiza si no hay evento

  return (
      <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="relative bg-white/95 w-full max-w-2xl rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="absolute inset-x-0 -top-1 h-1 rounded-t-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400" />
          <div className="flex items-center gap-3 mb-4">
            <FiInfo className="text-violet-600" size={20} />
            <h2 className="text-lg font-semibold text-violet-600">Información de Entregables</h2>
          </div>
  
          <div className="overflow-auto max-h-[60vh] pr-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Evento (nombre) */}
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Evento</p>
                <p className="mt-1 text-gray-800 leading-relaxed">
                  {deliverable.event ? (eventName || "Cargando…") : "—"}
                </p>
              </div>
  
              {/* Encuesta (nombre) */}
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Encuesta vinculada</p>
                <p className="mt-1 text-gray-800 leading-relaxed">
                  {deliverable.survey ? (surveyName || "Cargando…") : "—"}
                </p>
              </div>
  
              {/* Resto de campos */}
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Nombre</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.name || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.description || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Lugar</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.place || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de inicio</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.start_date || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Fecha fin</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.end_date || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Hora de inicio</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.start_time || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Hora fin</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.end_time || "—"}</p>
              </div>
  
              <div className="rounded-xl border border-violet-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Activo</p>
                <p className="mt-1 text-gray-800 leading-relaxed">{deliverable.is_active ? "Sí" : "No"}</p>
              </div>
            </div>
  
            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-violet-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }