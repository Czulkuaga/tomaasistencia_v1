'use client'

import React, { useCallback, useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getCookie } from 'cookies-next'
import { GETEvents } from '@/actions/feature/event-action'
import { EventSelector } from '../ui/EventSelector'

interface ControlSurveyProps {
  initialData?: Control[]
  initialPage?: number
  initialPageSize?: number
  initialSearch?: string
  totalPages?: number
  totalCount?: number
  initialEvent?: number | undefined
}

type Control = {
  id_answer: number | string
  attendee_name: string
  event_name: string
  survey_name: string
  entity_name: string
  type_name: string
  modification_time: string
  submitted_at: string
  modification_user: string
  event?: number
}

interface EventItem {
  id_event: number;
  name: string;
}

export default function ControlEncuesta({ initialData, initialPage, initialPageSize, initialSearch, totalPages, totalCount, initialEvent }: ControlSurveyProps) {

  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [term, setTerm] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();
  const [idevent, setIdEvent] = useState<EventItem[]>([]);

  // Util para construir/actualizar la querystring
  const setQuery = useCallback(
    (next: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(urlSearchParams?.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, String(v));
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, urlSearchParams]
  );

  // Buscar
  const handleSearch = useCallback(() => {
    setQuery({
      search: term.trim() || undefined,
      page: 1,
      page_size: initialPageSize,
      event: initialEvent || undefined,  // 👈 aquí va
    });
  }, [term, initialEvent, setQuery, initialPageSize]);

  // Limpiar: quita search, conserva (o resetea) event
  const handleClear = useCallback(() => {
    setTerm("");
    setQuery({
      search: undefined,
      page: 1,
      page_size: initialPageSize,
      event: initialEvent || undefined,  // 👈 mantiene filtro de evento
    });
  }, [initialEvent, setQuery, initialPageSize]);

  // Paginación
  const handlePreviousPage = useCallback(() => {
    if (initialPage && initialPage > 1) {
      setQuery({
        page: initialPage - 1,
        page_size: initialPageSize,
        search: term.trim() || undefined,
        event: initialEvent || undefined, // 👈
      });
    }
  }, [initialPage, initialPageSize, term, initialEvent, setQuery]);

  const handleNextPage = useCallback(() => {
    if (initialPage && totalPages && initialPage < totalPages) {
      setQuery({
        page: initialPage + 1,
        page_size: initialPageSize,
        search: term.trim() || undefined,
        event: initialEvent || undefined, // 👈
      });
    }
  }, [initialPage, totalPages, initialPageSize, term, initialEvent, setQuery]);

  const isFirst = initialPage ? initialPage <= 1 : true;
  const isLast = initialPage && totalPages ? initialPage >= totalPages : true;

  // Obtener lista de eventos
  const GetEventosList = async () => {
    try {
      const token = getCookie("authToken") as string ?? "";
      if (!token) return;
      const response = await GETEvents({ token });
      setIdEvent(response.results);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    GetEventosList();
  }, [])

  return (
    <section className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] space-y-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-purple-400">Registro De Encuesta</h1>

      </div>

      <div className="w-full flex items-center gap-2 mb-4 justify-end">
        <div className="flex items-center flex-col md:flex-row gap-2 mb-4">
          <EventSelector
            options={idevent.map(e => ({ id: e.id_event, name: e.name }))}
            initialValue={initialEvent}
          />

          <div>
            <input
              type="text"
              placeholder="Buscar"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-64 border border-violet-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
            <button
              onClick={handleSearch}
              disabled={isPending}
              className="px-3 py-2 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {isPending ? "Buscando…" : "Buscar"}
            </button>

            {!!term && (
              <button
                onClick={handleClear}
                className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
              >
                Limpiar
              </button>
            )}
          </div>

        </div>
      </div>

      {initialData && initialData.length > 0 && (
        <>
          <div className="w-full overflow-x-auto rounded-lg shadow">
            <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs md:text-sm shadow-sm">
              <thead className="bg-violet-500 text-violet-50 uppercase text-[10px] md:text-xs font-semibold">
                <tr>
                  <th className="border p-2">Evento</th>
                  <th className="border p-2">Nombre</th>
                  <th className="border p-2">Encuesta</th>
                  <th className="border p-2">Tipo</th>
                  <th className="border p-2">Entidad</th>
                  <th className="border p-2">Fecha</th>
                  <th className="border p-2">Hora</th>
                </tr>
              </thead>
              <tbody>
                {initialData && initialData.length > 0 ? (
                  initialData.map((row) => (
                    <tr key={row.id_answer} className="odd:bg-purple-50">
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.event_name || '—'}</td>
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.attendee_name || '—'}</td>
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.survey_name || '—'}</td>
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.type_name || '—'}</td>
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.entity_name || '—'}</td>
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.submitted_at || '—'}</td>
                      <td className="border p-1 text-left max-w-[200px] truncate">{row.modification_time || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-red-500">No hay registros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginador */}
          {totalPages && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Página {initialPage} de {totalPages}
                {typeof totalCount === "number" ? <> · {totalCount} registros</> : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={isFirst && isPending}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isFirst ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-violet-100 text-violet-600 hover:bg-violet-200"}`}
                >
                  {isPending ? "Cargando…" : "Anterior"}
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={isLast && isPending}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isLast ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                    }`}
                >
                  {isPending ? "Cargando…" : "Siguiente"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}