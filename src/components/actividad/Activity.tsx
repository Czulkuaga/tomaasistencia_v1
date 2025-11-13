"use client"
import { useState, useEffect, useCallback, useTransition } from 'react'
import { getCookie } from "cookies-next";
import { DELETEActivity } from "@/actions/feature/activity-action"
import { GETEvents } from "@/actions/feature/event-action"
import { MdDelete } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import ModalActivity from "@/components/actividad/ModalActivity"
import { GETEncuesta } from "@/actions/survey/survey-action"
import { IoQrCode } from "react-icons/io5";
import QRCode from 'react-qr-code';
import ModalVista from './ModalVista';
import { IoEye } from "react-icons/io5";
import { ModalEditActivity } from './ModalEditActivity';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EventSelector } from '../ui/EventSelector';

interface ControlAsistenteProps {
  initialData?: Activity[]
  initialPage?: number
  initialPageSize?: number
  initialSearch?: string
  totalPages?: number
  totalCount?: number
  initialEvent?: number | undefined
  is_staff: boolean
  main_user: boolean
}

interface Activity {
  id_actividad: number
  name: string;
  description: string
  place: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event: number
  survey: number;
  qr_code: string;
  is_active: boolean
  is_scoring: boolean
}

interface EventItem {
  id_event: number;
  name: string;
}

interface Survey {
  id_survey: number;
  name: string;
}

const REGISTER_URL = process.env.NEXT_PUBLIC_REGISTER_URL ?? "";

export default function Activity({ initialData, initialPage, initialPageSize, initialSearch, totalPages, totalCount, initialEvent, is_staff, main_user }: ControlAsistenteProps) {

  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [term, setTerm] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();

  // const [activity, setActivity] = useState<Activity[]>([]);
  const [idevent, setIdEvent] = useState<EventItem[]>([]);
  const [idencuesta, setIdEncuesta] = useState<Survey[]>([]);
  const [isCreateProdu, setIsCreateProdu] = useState(false);
  const [editModal, setEditModal] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState<string>('');
  const [vista, setVista] = useState(false);

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
      pageSize: initialPageSize,
      event: initialEvent || undefined,  // 👈 aquí va
    });
  }, [term, initialEvent, setQuery, initialPageSize]);

  // Limpiar: quita search, conserva (o resetea) event
  const handleClear = useCallback(() => {
    setTerm("");
    setQuery({
      search: undefined,
      page: 1,
      pageSize: initialPageSize,
      event: initialEvent || undefined,  // 👈 mantiene filtro de evento
    });
  }, [initialEvent, setQuery, initialPageSize]);

  // Paginación
  const handlePreviousPage = useCallback(() => {
    if (initialPage && initialPage > 1) {
      setQuery({
        page: initialPage - 1,
        pageSize: initialPageSize,
        search: term.trim() || undefined,
        event: initialEvent || undefined, // 👈
      });
    }
  }, [initialPage, initialPageSize, term, initialEvent, setQuery]);

  const handleNextPage = useCallback(() => {
    if (initialPage && totalPages && initialPage < totalPages) {
      setQuery({
        page: initialPage + 1,
        pageSize: initialPageSize,
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

  const GetEncuestaList = async () => {
    try {
      const token = getCookie("authToken") as string ?? "";
      if (!token) return;
      const response = await GETEncuesta({ token });
      setIdEncuesta(response.results);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // metodo de eliminar
  const handledelete = async (id_actividad: number) => {
    try {
      const token = (getCookie("authToken") as string) || "";
      // UI optimista (opcional): comenta si prefieres esperar la confirmación
      // setActivity(prev => prev.filter(a => a.id_actividad !== id_actividad));

      const res = await DELETEActivity(id_actividad, token);

      if (res?.ok === false) {
        console.error("No se pudo eliminar:", res.error);
        // muestra toast si usas alguno
        return;
      }

      // Refrescar la lista después de eliminar
      router.refresh();
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);

    }
  };

  function handleQR(activity: Activity) {
    setQrValue(activity.qr_code || '');
    setSelectedActivity(activity);
    setQrModalOpen(true);
  }

  useEffect(() => {
    GetEventosList();
    GetEncuestaList();
  }, [editModal])

  return (
    <section className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] space-y-6 overflow-auto">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Actividades</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          ¡Puedes ingresar tus actividades para tu proximo evento!
        </p>

        <div className='w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          {
            main_user === true && (
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold"
                onClick={() => setIsCreateProdu(true)}
              >
                + Crear Actividad
              </button>
            )
          }

          {
            main_user === false && is_staff === true && (
              <button
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold"
                onClick={() => setIsCreateProdu(true)}
              >
                + Crear Actividad
              </button>
            )
          }

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

        <ModalActivity
          isOpen={isCreateProdu}
          onClose={() => setIsCreateProdu(false)}
        />

        <ModalVista isOpen={vista} onClose={() => setVista(false)} activity={selectedActivity} />

        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full min-w-[1000px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
              <tr className="bg-violet-500">
                <th className="border p-1 sm:p-2 text-center">EVENTO</th>
                <th className="border p-1 sm:p-2 text-center">ACTIVIDAD</th>
                {/* <th className="border p-1 sm:p-2 text-center">DESCRIPCIÓN</th> */}
                <th className="border p-1 sm:p-2 text-center">LUGAR</th>
                <th className="border p-1 sm:p-2 text-center">FECHA DE INICIO</th>
                <th className="border p-1 sm:p-2 text-center">FECHA FIN</th>
                <th className="border p-1 sm:p-2 text-center">HORA DE INICIO</th>
                <th className="border p-1 sm:p-2 text-center">HORA FIN</th>
                <th className="border p-1 sm:p-2 text-center">ACTIVO</th>
                <th className="border p-1 sm:p-2 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {initialData && initialData.length > 0 ? (
                initialData.map((acti) => (
                  <tr key={acti.id_actividad} className='odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400'>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                      {idevent.find((eve) => Number(eve.id_event) === Number(acti.event))?.name}
                    </td>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.name}</td>
                    {/* <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">{acti.description}</td> */}
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.place}</td>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.start_date}</td>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.end_date}</td>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.start_time}</td>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.end_time}</td>
                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{acti.is_active ? "Sí" : "No"}</td>
                    {
                      main_user === true && (
                        <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">

                          <div className="flex justify-center items-center gap-2 sm:gap-4">

                            <button onClick={() => handleQR(acti)}>
                              <IoQrCode size={20} className="text-purple-950 hover:text-violet-500 transition block" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedActivity(acti);
                                setVista(true);
                              }}
                              title="Ver información"
                              className="hover:opacity-80"
                            >
                              <IoEye size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                            </button>


                            <button
                              onClick={() => {
                                setSelectedActivity(acti);
                                setEditModal(true);
                              }}
                            >
                              <FaUserEdit size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                            </button>


                            <button onClick={() => handledelete(acti.id_actividad!)}>
                              <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition block" />
                            </button>
                          </div>
                        </td>
                      )
                    }
                    {
                      main_user === false && is_staff === true && (
                        <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">

                          <div className="flex justify-center items-center gap-2 sm:gap-4">

                            <button onClick={() => handleQR(acti)}>
                              <IoQrCode size={20} className="text-purple-950 hover:text-violet-500 transition block" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedActivity(acti);
                                setVista(true);
                              }}
                              title="Ver información"
                              className="hover:opacity-80"
                            >
                              <IoEye size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                            </button>


                            <button
                              onClick={() => {
                                setSelectedActivity(acti);
                                setEditModal(true);
                              }}
                            >
                              <FaUserEdit size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                            </button>


                            <button onClick={() => handledelete(acti.id_actividad!)}>
                              <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition block" />
                            </button>
                          </div>
                        </td>
                      )
                    }
                    {
                      main_user === false && is_staff === false && (
                        <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">

                          <div className="flex justify-center items-center gap-2 sm:gap-4">

                            <button onClick={() => handleQR(acti)}>
                              <IoQrCode size={20} className="text-purple-950 hover:text-violet-500 transition block" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedActivity(acti);
                                setVista(true);
                              }}
                              title="Ver información"
                              className="hover:opacity-80"
                            >
                              <IoEye size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                            </button>
                          </div>
                        </td>
                      )
                    }
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center text-red-500">No se encontraron datos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* 🔽 Paginador */}
        {/* Paginador (usar props del SSR) */}
        {(totalPages ? totalPages : 1) > 1 && (
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

        {qrModalOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-purple/50 backdrop-blur-sm px-4"
            onClick={() => setQrModalOpen(false)}
          >
            <div
              className="bg-white rounded-xl w-full max-w-sm p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setQrModalOpen(false)}
                className="absolute right-3 top-3 rounded-full px-2 py-1 text-gray-600 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                ✕
              </button>

              <h3 className="text-lg font-semibold mb-4 text-center">
                {selectedActivity?.name}
              </h3>

              <div className="flex items-center justify-center p-4 border rounded-lg">
                {/* Referencia para luego exportar el QR */}
                <div id="qr-download">
                  <QRCode
                    value={qrValue || ' '}
                    size={240}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => {
                    const svg = document.querySelector("#qr-download svg") as SVGElement;
                    if (!svg) return;

                    // Convertir el SVG a PNG usando canvas
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL("image/png");

                        const downloadLink = document.createElement("a");
                        downloadLink.href = pngFile;
                        downloadLink.download = "qr_code.png";
                        downloadLink.click();
                      }
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                  }}
                  className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700"
                >
                  Descargar
                </button>

                <a
                  href={`${REGISTER_URL}/register?atv=${selectedActivity?.id_actividad}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700"
                >
                  Abrir registro
                </a>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {
          editModal && (
            <ModalEditActivity
              setEditModal={setEditModal}
              selectedActivity={selectedActivity}
              setSelectedActivity={setSelectedActivity}
              idevent={idevent}
              idencuesta={idencuesta}
            />
          )
        }
      </div>
    </section>
  )
}
