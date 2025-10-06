'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getCookie } from 'cookies-next'
import { GETControEncuestalAll, GETEncuestaSearch } from '@/actions/feature/control-encuesta'

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

type PaginationInfo = {
  count: number
  page: number
  page_size: number
  total_pages: number
}

type EventOption = { id: number; name: string }

const PAGE_SIZE = 60
const PAGE_SIZE_ALL = 1000

export default function ControlEncuesta() {
  const [control, setControl] = useState<Control[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    page: 1,
    page_size: PAGE_SIZE,
    total_pages: 0,
  })

  // búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [appliedSearch, setAppliedSearch] = useState<string>('')

  // filtro por evento
  const [eventId, setEventId] = useState<number>(0) // 0 = todos
  const [allEventOptions, setAllEventOptions] = useState<EventOption[]>([])

  const toArray = (data: any) =>
    Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []

  const mapApiToControl = (r: any): Control => ({
    id_answer: r.id_answer,
    attendee_name: r.attendee_name,
    event_name: r.event_name,
    survey_name: r.survey_name ?? null,
    entity_name: r.entity_name ?? null,
    type_name: r.type_name ?? null,
    modification_time: r.modification_time,
    submitted_at: r.submitted_at,
    modification_user: r.modification_user,
    event: typeof r.event === 'number' || typeof r.event === 'string' ? Number(r.event) : undefined,
  })

  // 1) Cargar TODOS los eventos para el select
  useEffect(() => {
    const token = (getCookie('authToken') as string) ?? ''
    if (!token) return

    let cancelled = false
    const loadAllEvents = async () => {
      try {
        const first: any = await GETControEncuestalAll({ token, page: 1, pageSize: PAGE_SIZE_ALL })
        const arrFirst = toArray(first)
        const acc = arrFirst.map(mapApiToControl)

        const totalPages =
          Number(first?.total_pages) || Math.max(1, Math.ceil((Number(first?.count) || acc.length) / PAGE_SIZE_ALL))
        if (totalPages > 1) {
          const promises: Promise<any>[] = []
          for (let p = 2; p <= totalPages; p++) {
            promises.push(GETControEncuestalAll({ token, page: p, pageSize: PAGE_SIZE_ALL }))
          }
          const pages = await Promise.all(promises)
          for (const pg of pages) {
            const a = toArray(pg)
            acc.push(...a.map(mapApiToControl))
          }
        }

        const map = new Map<number, string>()
        for (const r of acc) {
          const id = Number(r.event ?? NaN)
          const name = (r.event_name || '').trim()
          if (Number.isFinite(id) && id > 0 && name && !map.has(id)) map.set(id, name)
        }

        if (map.size === 0) {
          const byName = new Map<string, number>()
          let seq = -1
          for (const r of acc) {
            const name = (r.event_name || '').trim()
            if (name && !byName.has(name)) byName.set(name, seq--)
          }
          const opts: EventOption[] = []
          byName.forEach((fakeId, name) => opts.push({ id: fakeId, name }))
          if (!cancelled) setAllEventOptions(opts.sort((a, b) => a.name.localeCompare(b.name)))
          return
        }

        const opts: EventOption[] = Array.from(map, ([id, name]) => ({ id, name }))
        if (!cancelled) setAllEventOptions(opts.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (e) {
        if (!cancelled) setAllEventOptions([])
      }
    }

    loadAllEvents()
    return () => {
      cancelled = true
    }
  }, [])

  // nombre del evento seleccionado
  const selectedEventName = useMemo(() => {
    return allEventOptions.find((o) => o.id === eventId)?.name.toLowerCase().trim() || ''
  }, [eventId, allEventOptions])

  // 2) Carga de filas (búsqueda + paginación + filtro por evento)
  useEffect(() => {
    const token = (getCookie('authToken') as string) ?? ''
    if (!token) {
      setError('No hay token de autenticación')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        let pool: Control[] = []

        if (appliedSearch && appliedSearch.trim().length >= 2) {
          // Búsqueda
          const data: any = await GETEncuestaSearch({ token, search: appliedSearch.trim() })
          pool = toArray(data).map(mapApiToControl)

          // Aplicar filtro por evento si está activo
          if (eventId) {
            pool = pool.filter((row: Control) => {
              const idMatches = Number(row.event ?? NaN) === eventId
              const nameMatches = (row.event_name || '').toLowerCase().trim() === selectedEventName
              return idMatches || nameMatches
            })
          }

          // Paginación en cliente para búsqueda
          const total = pool.length
          const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
          const safePage = Math.min(currentPage, totalPages)
          const start = (safePage - 1) * PAGE_SIZE
          const end = start + PAGE_SIZE
          const pageRows = pool.slice(start, end)

          if (!cancelled) {
            setControl(pageRows)
            setPaginationInfo({
              count: total,
              page: safePage,
              page_size: PAGE_SIZE,
              total_pages: totalPages,
            })
            if (safePage !== currentPage) setCurrentPage(safePage)
          }
        } else if (eventId) {
          // Cargar TODOS los registros para el evento seleccionado
          const first: any = await GETControEncuestalAll({
            token,
            page: 1,
            pageSize: PAGE_SIZE_ALL,
            ...(eventId ? { eventId } : {}),
          })
          pool = toArray(first).map(mapApiToControl)

          const totalPages =
            Number(first?.total_pages) || Math.max(1, Math.ceil((Number(first?.count) || pool.length) / PAGE_SIZE_ALL))
          if (totalPages > 1) {
            const promises: Promise<any>[] = []
            for (let p = 2; p <= totalPages; p++) {
              promises.push(
                GETControEncuestalAll({
                  token,
                  page: p,
                  pageSize: PAGE_SIZE_ALL,
                  ...(eventId ? { eventId } : {}),
                })
              )
            }
            const pages = await Promise.all(promises)
            for (const pg of pages) {
              const a = toArray(pg)
              pool.push(...a.map(mapApiToControl))
            }
          }

          // Filtro por evento (en cliente, por compatibilidad)
          pool = pool.filter((row: Control) => {
            const idMatches = Number(row.event ?? NaN) === eventId
            const nameMatches = (row.event_name || '').toLowerCase().trim() === selectedEventName
            return idMatches || nameMatches
          })

          if (!cancelled) {
            setControl(pool)
            setPaginationInfo({
              count: pool.length,
              page: 1,
              page_size: pool.length,
              total_pages: 1,
            })
            setCurrentPage(1)
          }
        } else {
          // Carga normal con paginación
          const data: any = await GETControEncuestalAll({ token, page: currentPage, pageSize: PAGE_SIZE })
          pool = toArray(data).map(mapApiToControl)

          if (!cancelled) {
            setControl(pool)
            setPaginationInfo({
              count: Number(data?.count) || pool.length,
              page: Number(data?.page) || currentPage,
              page_size: Number(data?.page_size) || PAGE_SIZE,
              total_pages:
                Number(data?.total_pages) ||
                Math.max(1, Math.ceil((Number(data?.count) || pool.length) / PAGE_SIZE)),
            })
          }
        }

        // Ordenar por modification_time
        pool.sort((a, b) => b.modification_time.localeCompare(a.modification_time))
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error al consultar controles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [currentPage, appliedSearch, eventId, selectedEventName])

  // paginación
  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxPagesToShow = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(paginationInfo.total_pages, startPage + maxPagesToShow - 1)
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i)
    return pages
  }, [currentPage, paginationInfo.total_pages])

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1)
  }
  const handleNextPage = () => {
    if (currentPage < paginationInfo.total_pages) setCurrentPage((p) => p + 1)
  }
  const handlePageClick = (page: number) => setCurrentPage(page)

  // búsqueda
  const onClickBuscar = () => {
    setCurrentPage(1)
    setAppliedSearch(searchTerm.trim())
  }
  const onClickLimpiar = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setCurrentPage(1)
    // setEventId(0) // Descomentar si quieres limpiar el evento al limpiar la búsqueda
  }

  return (
    <section className="space-y-6 overflow-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-purple-400">Registro De Encuesta</h1>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={eventId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setEventId(Number(e.target.value) || 0)
              setCurrentPage(1)
            }}
            className="min-w-[220px] px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value={0}>Todos los eventos</option>
            {allEventOptions.length === 0 && <option disabled>No hay eventos disponibles</option>}
            {allEventOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar por nombre, evento, encuesta…"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') onClickBuscar()
            }}
            className="w-full md:w-80 px-3 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="button"
            onClick={onClickBuscar}
            className="px-3 py-2 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700"
            disabled={loading}
          >
            Buscar
          </button>
          {(appliedSearch || searchTerm) && (
            <button
              type="button"
              onClick={onClickLimpiar}
              className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
              disabled={loading}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {loading && <div className="p-3 border rounded">Cargando…</div>}
      {!loading && error && <div className="p-3 border rounded text-red-600">{error}</div>}

      {!loading && !error && (
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
                {control.length ? (
                  control.map((row) => (
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

          {paginationInfo.total_pages > 1 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Página {paginationInfo.page} de {paginationInfo.total_pages} · {paginationInfo.count} registros
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-md text-sm ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                  }`}
                >
                  Anterior
                </button>
                <div className="flex gap-1">
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-md text-sm ${
                        p === currentPage
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === paginationInfo.total_pages}
                  className={`px-3 py-2 rounded-md text-sm ${
                    currentPage === paginationInfo.total_pages
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}