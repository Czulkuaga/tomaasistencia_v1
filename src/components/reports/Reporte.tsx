// components/reports/ReporteTabla.tsx
"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { GETReporte, GETAsistenciaActividad, GETAsistenciaStand, GETAsistenciaEntregable, GETReporteCompany } from "@/actions/feature/reporte-action";
import { GETEvents } from "@/actions/feature/event-action"



type RowAsistente = {
  nombre: string;
  company_name: string | null;
  actividades_asistidas: number;
  actividades_totales: number;
  pct_asistencia: number;
};

type RowActividad = {
  id_actividad: number;
  actividad: string;
  asistentes_unicos: number;
};
type AsistenciaStands = {
  id_stand: number;
  stand: string;
  asistentes_unicos: number;
};
type AsistenciaEntregable = {
  id_deliverable: number;
  entregable: string;
  asistentes_unicos: number;
};

type RowCompanies = {
  empresa: string;
  asistentes_con_ingreso: number;
};

interface EventItem {
  id_event: number;
  name: string;
}

type ReportKey = "by-company" | "activity-attendance" | "attendance-per-attendee" | "top-companies" | "stand-attendance" | "deliverable-attendance";

export default function ReporteTabla() {
  const [selected, setSelected] = useState<ReportKey>("attendance-per-attendee");

  const [rowsAsistente, setRowsAsistente] = useState<RowAsistente[]>([]);

  const [asistenciasActividad, setAsistenciaActividad] = useState<RowActividad[]>([]);
  const [asistenciaStands, setAsistenciaStands] = useState<AsistenciaStands[]>([]);
  const [asistenciasEntregable, setAsistenciasEntregable] = useState<AsistenciaEntregable[]>([]);

  const [rowsCompany, setRowsCompany] = useState<RowCompanies[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [eventId, setEventId] = useState<number>(0);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);


  const GetEventosList = async () => {
    try {
      setEventsLoading(true);            // ⬅️ empieza “cargando”
      const token = (getCookie("authToken") as string) ?? "";
      if (!token) return;

      const response = await GETEvents({ token });
      // ajusta si tu API no devuelve { results: [...] }
      setEvents(response?.results ?? []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);                     // opcional: limpia si falla
    } finally {
      setEventsLoading(false);           // ⬅️ termina “cargando”
    }
  };


  useEffect(() => {
    GetEventosList();
  }, [])

  const exportar = async () => {
    try {
      let data: any[] = [];
      let sheetName = "";
      let filename = "";

      if (selected === "attendance-per-attendee") {
        data = rowsAsistente.map(r => ({
          Asistente: r.nombre,
          Empresa: r.company_name ?? "—",
          Asistidas: r.actividades_asistidas,
          Totales: r.actividades_totales,
          "% Asistencia": Number.isFinite(r.pct_asistencia) ? Number(r.pct_asistencia).toFixed(1) : "0.0",
        }));
        sheetName = "Asistencia por asistente";
        filename = "reporte_asistente";
      }

      else if (selected === "activity-attendance") {
        data = asistenciasActividad.map(r => ({
          Actividad: r.actividad,
          "Asistentes únicos": r.asistentes_unicos,
        }));
        sheetName = "Asistencia actividades";
        filename = "reporte_actividades";
      }

      else if (selected === "stand-attendance") {
        data = asistenciaStands.map(r => ({
          Stand: r.stand,
          "Asistentes únicos": r.asistentes_unicos,
        }));
        sheetName = "Asistencia stands";
        filename = "reporte_stands";
      }

      else if (selected === "deliverable-attendance") {
        data = asistenciasEntregable.map(r => ({
          Entregable: r.entregable,
          "Asistentes únicos": r.asistentes_unicos,
        }));
        sheetName = "Asistencia entregables";
        filename = "reporte_entregables";
      }

      else if (selected === "top-companies") {
        data = rowsCompany.map(r => ({
          Compañía: r.empresa,
          "Asistentes con ingreso": r.asistentes_con_ingreso,
        }));
        sheetName = "Top compañías";
        filename = "reporte_companias";
      }

      if (!data.length) {
        alert("No hay datos para descargar. Genera el reporte primero.");
        return;
      }

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);


      const fname = `${filename}.xlsx`;

      XLSX.writeFile(wb, fname);
    } catch (e) {
      console.error(e);
      alert("No se pudo descargar el archivo.");
    }
  };



  const generar = async () => {
    try {
      setLoading(true);
      setErr(null);

      const token = String(getCookie("authToken") || "");
      if (!token) throw new Error("No hay token en cookies.");

      const base = { token } as any;
      const withEvent = eventId > 0 ? { ...base, event_id: eventId } : base;

      if (selected === "attendance-per-attendee") {
        const data = await GETReporte(withEvent);
        setRowsAsistente(Array.isArray(data) ? data : []);
        setAsistenciaActividad([]);
      } else if (selected === "activity-attendance") {
        const data = await GETAsistenciaActividad(withEvent);
        setAsistenciaActividad(Array.isArray(data) ? data : []);
        setRowsAsistente([]);
      } else if (selected === "stand-attendance") {
        const data = await GETAsistenciaStand(withEvent);
        setAsistenciaStands(Array.isArray(data) ? data : []);
        setRowsAsistente([]);
      } else if (selected === "deliverable-attendance") {
        const data = await GETAsistenciaEntregable(withEvent);
        setAsistenciasEntregable(Array.isArray(data) ? data : []);
        setRowsAsistente([]);
      } else if (selected === "top-companies") {
        const data = await GETReporteCompany(withEvent);
        setRowsCompany(Array.isArray(data) ? data : []);
        setRowsAsistente([]);
      }
    } catch (e: any) {
      setErr(e?.message || "Error generando reporte");
      setRowsAsistente([]); setAsistenciaActividad([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-4 space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">

        {/* 👇 Select de eventos mostrando NOMBRES */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Evento:</label>

          <select
            value={eventId}
            onChange={(e) => setEventId(Number(e.target.value))}
            className="min-w-[260px] border rounded px-3 py-2"
            disabled={eventsLoading}
          >
            <option value={0}>Todos los eventos</option>   {/* ← NUEVO */}
            {eventsLoading && <option>Cargando eventos…</option>}
            {!eventsLoading && events.length === 0 && <option>No hay eventos</option>}
            {!eventsLoading && events.map(ev => (
              <option key={ev.id_event} value={ev.id_event}>{ev.name}</option>
            ))}
          </select>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as ReportKey)}
            className="border rounded px-3 py-2"
          >
            <option value="top-companies">Asistencia por Empresas</option>
            <option value="activity-attendance">Asistencia De Actividades</option>
            <option value="stand-attendance">Asistencia De Stands</option>
            <option value="deliverable-attendance">Asistencia De Entregables</option>
            <option value="attendance-per-attendee"> Asistencia Por Asistente</option>
          </select>




          {/* (Opcional) input para ID manual */}
          {/* 
          <input
            type="number"
            value={eventId}
            onChange={(e) => setEventId(Number(e.target.value))}
            className="w-24 border rounded px-2 py-2"
            min={1}
            title="Editar ID manualmente"
          />
          */}
        </div>


        <button
          onClick={generar}
          disabled={loading}
          className="rounded px-4 py-2 border hover:bg-purple-100 disabled:opacity-60"
        >
          {loading ? "Generando…" : "Generar"}
        </button>

        {/* 👉 Nuevo botón Descargar */}
        <button
          onClick={exportar}
          disabled={loading}
          className="rounded px-4 py-2 border hover:bg-purple-100 disabled:opacity-60"
          title="Descargar la tabla actual en Excel"
        >
          Descargar
        </button>
      </div>

      {err && <div className="text-red-600">{err}</div>}

      {/* Tabla: Porcentaje de asistencia por asistente */}
      {selected === "attendance-per-attendee" && (
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-0 md:min-w-[1100px] border border-gray-200 rounded-lg text-[11px] md:text-sm shadow-sm">
            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] md:text-xs font-semibold">
              <tr className="bg-violet-500">
                <th className="p-1 md:p-2 border leading-tight">Asistente</th>
                <th className="p-1 md:p-2 border leading-tight">Empresa</th>
                <th className="p-1 md:p-2 border text-right leading-tight">Asistidas</th>
                <th className="p-1 md:p-2 border text-right leading-tight">Totales</th>
                <th className="p-1 md:p-2 border text-right leading-tight">% Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {rowsAsistente.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-2 md:p-4 text-center text-gray-500">
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              ) : (
                rowsAsistente.map((r, i) => (
                  <tr key={i} className="odd:bg-purple-50">
                    <td className="p-1 md:p-2 border whitespace-nowrap truncate max-w-[140px] md:max-w-none">{r.nombre}</td>
                    <td className="p-1 md:p-2 border whitespace-nowrap truncate max-w-[140px] md:max-w-none">{r.company_name ?? "—"}</td>
                    <td className="p-1 md:p-2 border text-right">{r.actividades_asistidas}</td>
                    <td className="p-1 md:p-2 border text-right">{r.actividades_totales}</td>
                    <td className="p-1 md:p-2 border text-right">
                      {Number.isFinite(r.pct_asistencia) ? r.pct_asistencia.toFixed(1) : "0.0"}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla: Asistencia en actividades (id_actividad, actividad, asistentes_unicos) */}
      {selected === "activity-attendance" && (
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-0 md:min-w-[1100px] border border-gray-200 rounded-lg text-[11px] md:text-sm shadow-sm">
            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] md:text-xs font-semibold">
              <tr className="bg-violet-500">
                <th className="p-1 md:p-2 border leading-tight">Actividad</th>
                <th className="p-1 md:p-2 border text-right leading-tight">Asistentes únicos</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasActividad.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-2 md:p-4 text-center text-gray-500">
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              ) : (
                asistenciasActividad.map((r, i) => (
                  <tr key={i} className="odd:bg-purple-50">
                    <td className="p-1 md:p-2 border whitespace-nowrap truncate max-w-[60px] md:max-w-none">
                      {r.actividad}
                    </td>
                    <td className="p-0.5 md:p-2 border text-right w-[56px] md:w-auto whitespace-nowrap overflow-hidden font-mono tracking-tight text-[11px] md:text-sm">{r.asistentes_unicos}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      )}
      {selected === "stand-attendance" && (
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
              <tr className="bg-violet-500">
                <th className="p-2 border">Stands</th>
                <th className="p-2 border text-right">Asistentes únicos</th>
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
                  <tr key={i} className="odd:bg-purple-50">
                    <td className="p-2 border">{r.stand}</td>
                    <td className="p-2 border text-right">{r.asistentes_unicos}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {selected === "deliverable-attendance" && (
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
              <tr className="bg-violet-500">
                <th className="p-2 border">Entregable</th>
                <th className="p-2 border text-right">Asistentes únicos</th>
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
                  <tr key={i} className="odd:bg-purple-50">
                    <td className="p-2 border">{r.entregable}</td>
                    <td className="p-2 border text-right">{r.asistentes_unicos}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Placeholder “por empresas” */}
      {selected === "top-companies" && (
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
              <tr className="bg-violet-500">
                <th className="p-2 border">Compañia</th>
                <th className="p-2 border text-right">Compañias</th>
              </tr>
            </thead>
            <tbody>
              {rowsCompany.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    {loading ? "Cargando…" : "Sin datos"}
                  </td>
                </tr>
              ) : (
                rowsCompany.map((r, i) => (
                  <tr key={i} className="odd:bg-purple-50">
                    <td className="p-2 border">{r.empresa}</td>
                    <td className="p-2 border text-right">{r.asistentes_con_ingreso}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
