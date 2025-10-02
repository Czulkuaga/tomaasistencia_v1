"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import {
  GETAsistenciaActividad,
  GETAsistenciaStand,
  GETAsistenciaEntregable,
} from "@/actions/feature/reporte-action";
import { GETEvents } from "@/actions/feature/event-action";

type RowActividad = {
  id_actividad: number;
  actividad: string;
  asistentes_unicos: number;
  pct_asistencia: number;
};
type AsistenciaStands = {
  id_stand: number;
  stand: string;
  asistentes_unicos: number;
  pct_asistencia: number;
};
type AsistenciaEntregable = {
  id_deliverable: number;
  entregable: string;
  asistentes_unicos: number;
  pct_asistencia: number;
};

interface EventItem {
  id_event: number;
  name: string;
}

export default function ReporteAsistencia() {
  const [asistenciasActividad, setAsistenciaActividad] = useState<RowActividad[]>([]);
  const [asistenciaStands, setAsistenciaStands] = useState<AsistenciaStands[]>([]);
  const [asistenciasEntregable, setAsistenciasEntregable] = useState<AsistenciaEntregable[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [eventId, setEventId] = useState<number>(0);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    const GetEventosList = async () => {
      try {
        setEventsLoading(true);
        const token = (getCookie("authToken") as string) ?? "";
        if (!token) return;
        const response = await GETEvents({ token });
        setEvents(response?.results ?? []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    GetEventosList();
  }, []);

  const generar = async () => {
    try {
      setLoading(true);
      setErr(null);

      const token = String(getCookie("authToken") || "");
      if (!token) throw new Error("No hay token en cookies.");

      const base = { token } as any;
      const params = eventId > 0 ? { ...base, event_id: eventId } : base;

      const [acts, stands, delivs] = await Promise.all([
        GETAsistenciaActividad(params).catch(() => []),
        GETAsistenciaStand(params).catch(() => []),
        GETAsistenciaEntregable(params).catch(() => []),
      ]);

      setAsistenciaActividad(Array.isArray(acts) ? acts : []);
      setAsistenciaStands(Array.isArray(stands) ? stands : []);
      setAsistenciasEntregable(Array.isArray(delivs) ? delivs : []);
    } catch (e: any) {
      setErr(e?.message || "Error generando reporte");
      setAsistenciaActividad([]);
      setAsistenciaStands([]);
      setAsistenciasEntregable([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">Evento:</label>
        <select
          value={eventId}
          onChange={(e) => setEventId(Number(e.target.value))}
          className="w-full md:w-80 px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
          disabled={eventsLoading}
        >
          <option value="">-- Seleccione un evento --</option>
          {eventsLoading && <option>Cargando eventos…</option>}
          {!eventsLoading && events.length === 0 && <option>No hay eventos</option>}
          {!eventsLoading &&
            events.map((ev) => (
              <option key={ev.id_event} value={ev.id_event}>
                {ev.name}
              </option>
            ))}
        </select>

        <button
          onClick={generar}
          disabled={loading}
          className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "Generando…" : "Generar"}
        </button>

        {err && <span className="text-red-600 text-sm ml-2">{err}</span>}
      </div>

      {/* TABLA: Actividades (sin % Part.) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="bg-violet-600 px-3 py-2">
          <h2 className="text-sm md:text-base font-bold text-white">Actividades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-violet-100 border-b border-gray-200">
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900">Actividad</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">Asistentes únicos</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900">% Asistente.</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasActividad.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              ) : (
                asistenciasActividad.map((r, i) => (
                  <tr key={`act-${i}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5 text-xs md:text-sm text-gray-900">{r.actividad}</td>
                    <td className="px-2 py-1.5 text-xs md:text-sm text-right font-medium whitespace-nowrap">
                      {r.asistentes_unicos}
                    </td>
                    <td className="px-2 py-1.5 text-xs md:text-sm text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                        {typeof r.pct_asistencia === "number" ? `${r.pct_asistencia.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA: Stands (sin % Part.) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="bg-violet-600 px-3 py-2">
          <h2 className="text-sm md:text-base font-bold text-white">Stands</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-violet-100 border-b border-gray-200">
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900">Stand</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">Asistentes únicos</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900">% Asistente.</th>
              </tr>
            </thead>
            <tbody>
              {asistenciaStands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              ) : (
                asistenciaStands.map((r, i) => (
                  <tr key={`std-${i}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5 text-xs md:text-sm text-gray-900">{r.stand}</td>
                    <td className="px-2 py-1.5 text-xs md:text-sm text-right font-medium whitespace-nowrap">
                      {r.asistentes_unicos}
                    </td>
                    <td className="px-2 py-1.5 text-xs md:text-sm text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                        {typeof r.pct_asistencia === "number" ? `${r.pct_asistencia.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA: Entregables (sin % Part.) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="bg-violet-600 px-3 py-2">
          <h2 className="text-sm md:text-base font-bold text-white">Entregables</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-violet-100 border-b border-gray-200">
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900">Entregable</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">Asistentes únicos</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-900">% Asistente.</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasEntregable.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              ) : (
                asistenciasEntregable.map((r, i) => (
                  <tr key={`deliv-${i}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5 text-xs md:text-sm text-gray-900">{r.entregable}</td>
                    <td className="px-2 py-1.5 text-xs md:text-sm text-right font-medium whitespace-nowrap">
                      {r.asistentes_unicos}
                    </td>
                    <td className="px-2 py-1.5 text-xs md:text-sm text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                        {typeof r.pct_asistencia === "number" ? `${r.pct_asistencia.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
