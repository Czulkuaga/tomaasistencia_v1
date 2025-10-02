"use client";
import React, { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { getCookie } from "cookies-next";
import { GETSurveyDetail } from "@/actions/survey/survey-action";
import { GETEventDetail } from "@/actions/feature/event-action";

interface Actividad {
  id_actividad?: number;
  name?: string;
  description?: string;
  place?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  event?: number;   // ← ID del evento
  survey?: number;  // ← ID de la encuesta
  is_active?: boolean;
}

interface ModalVistaProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Actividad | null;
}

export default function ModalVista({ isOpen, onClose, activity }: ModalVistaProps) {
  const [surveyName, setSurveyName] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");

  useEffect(() => {
    let ignore = false;

    const loadNames = async () => {
      if (!isOpen || !activity) { setSurveyName(""); setEventName(""); return; }
      const token = (getCookie("authToken") as string) || "";

      const [surveyRes, eventRes] = await Promise.all([
        activity.survey ? GETSurveyDetail(activity.survey, token) : Promise.resolve(null),
        activity.event ? GETEventDetail(activity.event, token) : Promise.resolve(null),
      ]);

      if (!ignore) {
        setSurveyName(surveyRes?.name ?? "");
        setEventName(eventRes?.name ?? "");
      }
    };

    loadNames();
    return () => { ignore = true; };
  }, [isOpen, activity]);


  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="relative bg-white/95 w-full max-w-2xl rounded-2xl shadow-2xl ring-1 ring-black/5 p-6 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="absolute inset-x-0 -top-1 h-1 rounded-t-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400" />
        <div className="flex items-center gap-3 mb-4">
          <FiInfo className="text-violet-600" size={20} />
          <h2 className="text-lg font-semibold text-violet-600">Información de la Actividad</h2>
        </div>

        <div className="overflow-auto max-h-[60vh] pr-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Evento (full width) */}
            <div className="rounded-xl border border-violet-100 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Evento</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {activity.event ? (eventName || "Cargando…") : "—"}
              </p>
            </div>

            {/* Encuesta vinculada (full width) */}
            <div className="rounded-xl border border-violet-100 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Encuesta vinculada</p>
              <p className="mt-1 text-gray-800 leading-relaxed">
                {activity.survey ? (surveyName || "Cargando…") : "—"}
              </p>
            </div>

            {/* Nombre (full width) */}
            <div className="relative rounded-xl border border-violet-100 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Nombre</p>
              <p className="mt-1 text-gray-800 leading-relaxed">{activity.name || "—"}</p>
              <span className="absolute right-3 bottom-2 text-xs text-gray-400">
                {(activity.name?.length ?? 0)}/100
              </span>
            </div>

            {/* Descripción (full width) */}
            <div className="relative rounded-xl border border-violet-100 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
              <p className="mt-1 text-gray-800 leading-relaxed whitespace-pre-wrap">
                {activity.description || "—"}
              </p>
              <span className="absolute right-3 bottom-2 text-xs text-gray-400">
                {(activity.description?.length ?? 0)}/255
              </span>
            </div>

            {/* A partir de aquí, todo queda en 2 columnas como ya lo tienes */}
            <div className="relative rounded-xl border border-violet-100 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Lugar</p>
               <p className="mt-1 text-gray-800 leading-relaxed whitespace-pre-wrap">
                {activity.place || "—"}
              </p>
               <span className="absolute right-3 bottom-2 text-xs text-gray-400">
                {(activity.place?.length ?? 0)}/100
              </span>
            </div>

            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de inicio</p>
              <p className="mt-1 text-gray-800 leading-relaxed">{activity.start_date || "—"}</p>
            </div>

            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Fecha fin</p>
              <p className="mt-1 text-gray-800 leading-relaxed">{activity.end_date || "—"}</p>
            </div>

            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Hora de inicio</p>
              <p className="mt-1 text-gray-800 leading-relaxed">{activity.start_time || "—"}</p>
            </div>

            <div className="rounded-xl border border-violet-100 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Hora fin</p>
              <p className="mt-1 text-gray-800 leading-relaxed">{activity.end_time || "—"}</p>
            </div>

            <div className="rounded-xl border border-violet-100 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Activo</p>
              <p className="mt-1 text-gray-800 leading-relaxed">{activity.is_active ? "Sí" : "No"}</p>
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
