'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getCookie } from 'cookies-next'
import { GETControlAll } from '@/actions/feature/control-action'
import ButtonDownloadActivity from '../download-control/ButtonDownloadActivity'

type Control = {
  id_asistencia: number
  attendee_name: string
  event_name: string
  activity_name: string 
  date: string
  time: string
}

type PaginationInfo = {
  count: number
  page: number
  page_size: number
  total_pages: number
}

const PAGE_SIZE = 40

export default function ControlAsistente() {
  const [control, setControl] = useState<Control[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  // 🔢 Estado de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    page: 1,
    page_size: PAGE_SIZE,
    total_pages: 0,
  })

   const mapApiToControl = (r: any): Control => ({
    id_asistencia: r.id_visita,
    attendee_name: r.attendee_name,
    event_name: r.event_name,
    activity_name: r.activity_name ?? null,
    date: r.date,
    time: r.time,
  })

  // 🧭 Cargar datos (paginado servidor)
  useEffect(() => {
        const token = (getCookie('authToken') as string) ?? ''
        if (!token) { setError('No hay token de autenticación'); return }
    
        let cancelled = false
        const load = async () => {
          setLoading(true); setError('')
          try {
            const data: any = await GETControlAll({ token, page: currentPage, pageSize: PAGE_SIZE })
            const arr: any[] = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : [])
            const rows = arr.map(mapApiToControl)
            rows.sort((a,b)=>`${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    
            if (!cancelled) {
              setControl(rows)
              const meta: PaginationInfo = {
                count: Number(data?.count) || rows.length,
                page: Number(data?.page) || currentPage,
                page_size: Number(data?.page_size) || PAGE_SIZE,
                total_pages: Number(data?.total_pages) ||
                  Math.max(1, Math.ceil((Number(data?.count) || rows.length)/PAGE_SIZE)),
              }
              setPaginationInfo(meta)
            }
          } catch (e:any) {
            if (!cancelled) setError(e?.message || 'Error al consultar controles')
          } finally {
            if (!cancelled) setLoading(false)
          }
        }
        load()
        return () => { cancelled = true }
      }, [currentPage])
    
      // ✅ Traer TODAS las páginas para exportar
      const getAllRows = async () => {
        const token = (getCookie('authToken') as string) ?? ''
        if (!token) throw new Error('No hay token')
    
        // intenta un pageSize grande para minimizar requests
        const PAGE_SIZE_ALL = 1000
    
        // 1) primera página: para conocer total_pages
        const first: any = await GETControlAll({ token, page: 1, pageSize: PAGE_SIZE_ALL })
        const firstArr: any[] = Array.isArray(first) ? first : (Array.isArray(first?.results) ? first.results : [])
        const acc: Control[] = firstArr.map(mapApiToControl)
    
        const count = Number(first?.count ?? acc.length)
        const totalPages = Number(first?.total_pages) || Math.max(1, Math.ceil(count / PAGE_SIZE_ALL))
    
        // 2) resto de páginas en paralelo (si hay)
        if (totalPages > 1) {
          const promises = Array.from({ length: totalPages - 1 }, (_, i) =>
            GETControlAll({ token, page: i + 2, pageSize: PAGE_SIZE_ALL })
          )
          const pages = await Promise.all(promises)
          for (const p of pages) {
            const arr: any[] = Array.isArray(p) ? p : (Array.isArray(p?.results) ? p.results : [])
            acc.push(...arr.map(mapApiToControl))
          }
        }
    
        // 3) ordenar global
        acc.sort((a,b)=>`${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    
        // 4) shape que espera el botón/Excel
        return acc.map(r => ({
          event_name: r.event_name,
          activity_name: r.activity_name,
          attendee_name: r.attendee_name,
          date: r.date,
          time: r.time,
        }))
      }

  // 🧮 Números de página (máx 5 visibles)
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

  // ⏮️⏭️ Handlers de paginación
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1) }
  const handleNextPage = () => { if (currentPage < paginationInfo.total_pages) setCurrentPage(p => p + 1) }
  const handlePageClick = (page: number) => setCurrentPage(page)

  return (
    <section className="space-y-6 overflow-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                   <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Actividad registrados</h1>
           
                   {/* 🔽 Exportar TODO */}
                   <ButtonDownloadActivity getRows={getAllRows} />
                 </div>

      {loading && <div className="p-3 border rounded">Cargando…</div>}
      {!loading && error && <div className="p-3 border rounded text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          <div className="w-full overflow-x-auto rounded-lg shadow">
            <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
              <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
                <tr className="bg-violet-500">
                  <th className="border p-1 text-center sm:p-2">Evento</th>
                  <th className="border p-1 text-center sm:p-2">Actividad</th>
                  <th className="border p-1 text-center sm:p-2">Nombre</th>
                  <th className="border p-1 text-center sm:p-2">Fecha</th>
                  <th className="border p-1 text-center sm:p-2">Hora</th>
                </tr>
              </thead>
              <tbody>
                {control.length ? (
                  control.map((row) => (
                    <tr key={row.id_asistencia} className="odd:bg-purple-50">
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.event_name}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.activity_name || '—'}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.attendee_name}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.date}</td>
                      <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{row.time}</td>
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

          {/* 🔽 Paginador */}
          {paginationInfo.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Página {paginationInfo.page} de {paginationInfo.total_pages} · {paginationInfo.count} registros
              </div>

              <div className="flex items-center gap-2">
                {/* Botón Anterior */}
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                  }`}
                >
                  Anterior
                </button>

                {/* Números de página */}
                <div className="flex gap-1">
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === paginationInfo.total_pages}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === paginationInfo.total_pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
