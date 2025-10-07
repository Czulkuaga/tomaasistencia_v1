'use client'

import React, { useCallback, useState, useTransition } from 'react'
// import ButtonDownloadStand from '../download-control/ButtonDownloadStand'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface ControlStandProps {
  initialData?: Control[]
  initialPage?: number
  initialPageSize?: number
  initialSearch?: string
  totalPages?: number
  totalCount?: number
}

type Control = {
  id_visita: number | string
  attendee_name: string
  event_name: string
  stand_name: string
  date: string
  time: string
}

export default function ControlStand({ initialData, initialPage, initialPageSize, initialSearch, totalPages, totalCount }: ControlStandProps) {

  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [term, setTerm] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();

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
    });
  }, [term, setQuery, initialPageSize]);

  // Limpiar
  const handleClear = useCallback(() => {
    setTerm("");
    setQuery({ search: undefined, page: initialPage, page_size: initialPageSize });
  }, [setQuery, initialPageSize, initialPage]);

  // Paginación
  const handlePreviousPage = useCallback(() => {
    if (initialPage && initialPage > 1) {
      setQuery({
        page: initialPage - 1,
        page_size: initialPageSize,
        search: term.trim() || undefined,
      });
    }
  }, [initialPage, initialPageSize, term, setQuery]);

  const handleNextPage = useCallback(() => {
    if (initialPage && totalPages && initialPage < totalPages) {
      setQuery({
        page: initialPage + 1,
        page_size: initialPageSize,
        search: term.trim() || undefined,
      });
    }
  }, [initialPage, totalPages, initialPageSize, term, setQuery]);

  const isFirst = initialPage ? initialPage <= 1 : true;
  const isLast = initialPage && totalPages ? initialPage >= totalPages : true;

  return (
    <section className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] space-y-6 overflow-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Stand registrados</h1>

        {/* 🔽 Exportar TODO */}
        {/* <ButtonDownloadStand getRows={getAllRows} /> */}
      </div>

      <div className="flex items-center gap-2 mb-4">
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

      {initialData && initialData.length > 0 && (
        <>
          <div className="w-full overflow-x-auto rounded-lg shadow">
            <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
              <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
                <tr className="bg-violet-500">
                  <th className="border p-1 text-center sm:p-2">Evento</th>
                  <th className="border p-1 text-center sm:p-2">Stand</th>
                  <th className="border p-1 text-center sm:p-2">Nombre</th>
                  <th className="border p-1 text-center sm:p-2">Fecha</th>
                  <th className="border p-1 text-center sm:p-2">Hora</th>
                </tr>
              </thead>
              <tbody>
                {initialData && initialData.length > 0 ? (
                  initialData.map((row) => (
                    <tr key={row.id_visita} className="odd:bg-purple-50">
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.event_name || '—'}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.stand_name || '—'}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.attendee_name || '—'}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.date || '—'}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.time || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-red-500">
                      No hay registros de control.
                    </td>
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
