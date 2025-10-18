"use client";

import { useCallback, useState, useTransition } from "react";
import type { Event } from "@/types/events";
import { DELETEvent } from "@/actions/feature/event-action";
import { IoEye, IoQrCode } from "react-icons/io5";
import { FaUserEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { RiImageAddFill } from "react-icons/ri";
import ModalVista from "@/components/eventos/ModalVista";
import ModalCreateE from "@/components/eventos/ModalCreateE";
import ModalEditEvent from "./ModalEditEvent";
import { QrCode } from "./QrCode";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEventImage } from "./ChangeEventImage";
import { PATCHEvent } from "@/actions/feature/event-action";

interface Props {
  initialData?: Event[]
  initialPage?: number
  initialPageSize?: number
  totalPages?: number
  totalCount?: number
  token: string
}

const REGISTER_URL = process.env.NEXT_PUBLIC_REGISTER_URL ?? "";

export default function EventosClient({ initialData, initialPage, initialPageSize, totalPages, totalCount, token }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  // const [term, setTerm] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();

  // const [data, setData] = useState<EventResponse>(initialData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [vista, setVista] = useState(false);
  const [openQrModal, setQrModalOpen] = useState(false);
  const [openModalEventImage, setOpenModalEventImage] = useState(false)

  // UI optimista: eliminar
  const handleDelete = async (id_event: number) => {
    try {
      await DELETEvent(id_event, token);
      // SSR se revalida por server action; la UI aquí ya refleja el cambio
    } catch (e) {
      // Si falla, podrías re-hidratar desde el server o mostrar toast
      console.error("Error al eliminar", e);
    }
  };

  const openModalToQr = (event: Event) => {
    setSelectedEvent(event);
    setQrModalOpen(true);
  }

  const openModalChangeEventImage = (event: Event) => {
    setSelectedEvent(event);
    setOpenModalEventImage(true);
  }

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

  // Paginación
  const handlePreviousPage = useCallback(() => {
    if (initialPage && initialPage > 1) {
      setQuery({
        page: initialPage - 1,
        page_size: initialPageSize,
      });
    }
  }, [initialPage, initialPageSize, setQuery]);

  const handleNextPage = useCallback(() => {
    if (initialPage && totalPages && initialPage < totalPages) {
      setQuery({
        page: initialPage + 1,
        page_size: initialPageSize,
      });
    }
  }, [initialPage, totalPages, initialPageSize, setQuery]);

  const isFirst = initialPage ? initialPage <= 1 : true;
  const isLast = initialPage && totalPages ? initialPage >= totalPages : true;

  const handlerUpdateImage = async (eventSelected:Event, urlImage: string) => {

    const eventId=eventSelected?.id_event ?? 0
    const eventDataToUpdate = {...eventSelected,event_image:urlImage}

    try {
      const res = await PATCHEvent(eventId, token, eventDataToUpdate);
    } catch (error) {
      console.log(error)
    }
  }

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
            {initialData && initialData?.length > 0 ? (
              initialData.map((eve) => (
                <tr key={eve.id_event} className="odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400">
                  <td className="border border-gray-300 p-1 max-w-[150px] truncate text-left">{eve.name}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.city}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.start_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.end_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.start_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.end_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.is_active ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.is_public_event ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[190px] truncate">
                    <div className="flex justify-center items-center gap-2 sm:gap-4">

                      <button onClick={() => openModalToQr(eve)}>
                        <IoQrCode size={20} className="text-purple-950 hover:text-violet-500 transition block" />
                      </button>

                      <button onClick={() => openModalChangeEventImage(eve)}>
                        <RiImageAddFill size={20} />
                      </button>

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

      {/* 🔽 Paginador */}
      {/* Paginador (usar props del SSR) */}
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

      {
        isCreateOpen && (
          <ModalCreateE
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            token={token}
          />
        )
      }

      {
        selectedEvent && openQrModal && (
          <QrCode
            selectedEvent={selectedEvent}
            qrValue={selectedEvent ? `${REGISTER_URL}/register/asistente/${selectedEvent.id_event}` : ''}
            setQrModalOpen={setQrModalOpen}
          />
        )
      }

      {
        selectedEvent && openModalEventImage && (
          <ChangeEventImage
            selectedEvent={selectedEvent}
            setOpenModalEventImage={setOpenModalEventImage}
            onSaved={(selectedEvent, url) => handlerUpdateImage(selectedEvent, url)} 
          />
        )
      }

    </section>
  );
}
