"use client";

import { useState } from "react";
import type { Event, EventResponse } from "@/types/events";
import Link from "next/link";
import { DELETEvent } from "@/actions/feature/event-action";
import { IoEye } from "react-icons/io5";
import { FaUserEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import ModalVista from "@/components/eventos/ModalVista";
import ModalCreateE from "@/components/eventos/ModalCreateE";
import ModalEditEvent from "./ModalEditEvent";

interface Props {
  token: string;
  initialData: EventResponse;
}

export default function EventosClient({ token, initialData }: Props) {
  const [data, setData] = useState<EventResponse>(initialData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [vista, setVista] = useState(false);

  const { events, page, page_size, total_pages } = data;

  // console.log("EventosClient render", { data });

  // UI optimista: eliminar
  const handleDelete = async (id_event: number) => {
    try {
      // Optimista
      setData((prev) => ({ ...prev, events: prev.events.filter(e => e.id_event !== id_event) }));
      await DELETEvent(id_event, token);
      // SSR se revalida por server action; la UI aquí ya refleja el cambio
    } catch (e) {
      // Si falla, podrías re-hidratar desde el server o mostrar toast
      console.error("Error al eliminar", e);
    }
  };

  // Helper para numeración de páginas visible (máx 5)
  const getPageNumbers = () => {
    const maxToShow = 5;
    let start = Math.max(1, page - Math.floor(maxToShow / 2));
    const end = Math.min(total_pages, start + maxToShow - 1);
    if (end - start + 1 < maxToShow) start = Math.max(1, end - maxToShow + 1);
    const arr: number[] = [];
    for (let p = start; p <= end; p++) arr.push(p);
    return arr;
  };

  return (
    <section className="space-y-6 overflow-auto w-full">
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold mb-4"
        onClick={() => setIsCreateOpen(true)}
      >
        + Crear Evento
      </button>

      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
          <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
            <tr className="bg-violet-500">
              <th className="border p-1 text-center sm:p-2">NOMBRE</th>
              <th className="border p-1 text-center sm:p-2 w-18">CIUDAD</th>
              <th className="border p-1 text-center sm:p-2 w-18">FECHA DE INICIO</th>
              <th className="border p-1 text-center sm:p-2 w-18">FECHA FIN</th>
              <th className="border p-1 text-center sm:p-2 w-18">HORA DE INICIO</th>
              <th className="border p-1 text-center sm:p-2 w-18">HORA FIN</th>
              <th className="border p-1 text-center sm:p-2 w-18">ACTIVO</th>
              <th className="border p-1 text-center sm:p-2 w-18">PÚBLICO</th>
              <th className="border p-1 text-center sm:p-2 w-18">ACCIONES</th>
            </tr>
          </thead>

          <tbody>
            {events.length ? (
              events.map((eve) => (
                <tr key={eve.id_event} className="odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400">
                  <td className="border border-gray-300 p-1 max-w-[150px] truncate text-left">{eve.name}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.city}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.start_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.end_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.start_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.end_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.is_active ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.is_public_event ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                    <div className="flex justify-center items-center gap-2 sm:gap-4">
                      <button
                        onClick={() => { setSelectedEvent(eve); setVista(true); }}
                        title="Ver información"
                        className="hover:opacity-80"
                      >
                        <IoEye size={20} className="text-purple-400 hover:text-violet-500 transition" />
                      </button>

                      <button
                        onClick={() => { setSelectedEvent(eve); setEditModal(true); }}
                        title="Editar"
                      >
                        <FaUserEdit size={20} className="text-purple-400 hover:text-purple-500 transition" />
                      </button>

                      <button onClick={() => eve.id_event && handleDelete(eve.id_event)} title="Eliminar">
                        <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={12} className="align-middle text-center text-red-500">No se encontraron datos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación SSR por URL */}
      {total_pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Página {page} de {total_pages}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`?page=${Math.max(1, page - 1)}&pageSize=${page_size}`}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                : "bg-teal-100 text-teal-600 hover:bg-sky-200"
                }`}
              prefetch
            >
              Anterior
            </Link>

            <div className="flex gap-1">
              {getPageNumbers().map((p) => (
                <Link
                  key={p}
                  href={`?page=${p}&pageSize=${page_size}`}
                  prefetch
                  className={`w-8 h-8 grid place-content-center rounded-md text-sm font-medium transition-colors ${p === page ? "bg-violet-500 text-white"
                    : "bg-violet-100 text-gray-600 hover:bg-violet-100 hover:text-violet-600"
                    }`}
                >
                  {p}
                </Link>
              ))}
            </div>

            <Link
              href={`?page=${Math.min(total_pages, page + 1)}&pageSize=${page_size}`}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${page === total_pages ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                }`}
              prefetch
            >
              Siguiente
            </Link>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editModal && selectedEvent && (
        <ModalEditEvent
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          event={selectedEvent}
          token={token}
        />
      )}
      {/* Modal de vista */}
      {
        vista && selectedEvent && (
          <ModalVista isOpen={vista} onClose={() => setVista(false)} event={selectedEvent} />
        )
      }

      
      <ModalCreateE
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        token={token}
        // Si al crear quieres refrescar SSR, puedes:
        // onCreated={() => router.refresh()}
      />
    </section>
  );
}
