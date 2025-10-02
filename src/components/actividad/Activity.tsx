"use client"
import { useState, useEffect, useCallback } from 'react'
import { getCookie } from "cookies-next";
import { GETActivityAll, DELETEActivity, PUTActivity } from "@/actions/feature/activity-action"
import { GETEvents } from "@/actions/feature/event-action"
import { MdDelete } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import ModalActivity from "@/components/actividad/ModalActivity"
import { GETEncuesta } from "@/actions/survey/survey-action"
import { IoQrCode } from "react-icons/io5";
import QRCode from 'react-qr-code';
import ModalVista from './ModalVista';
import { IoEye } from "react-icons/io5";

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

interface PaginationInfo {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const REGISTER_URL = process.env.NEXT_PUBLIC_REGISTER_URL ?? "";

export default function Activity() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [idevent, setIdEvent] = useState<EventItem[]>([]);
  const [idencuesta, setIdEncuesta] = useState<Survey[]>([]);
  const [isCreateProdu, setIsCreateProdu] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState<string>('');
  const [vista, setVista] = useState(false);

  // para contar el numero de caracteres de la descripcion
  const [contador, setContador] = useState<number>(selectedActivity?.description?.length ?? 0);
  const [contadorname, setContadorName] = useState<number>(selectedActivity?.name?.length ?? 0);
  const [contadorlugar, setContadorLugar] = useState<number>(selectedActivity?.place?.length ?? 0);

  // todo el tema de la paginacion 
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    page: 1,
    page_size: 15,
    total_pages: 0
  });

  // const baseUrl =
  //   process.env.NEXT_PUBLIC_APP_URL ||
  //   (typeof window !== "undefined" ? window.location.origin : "");




  // Función para obtener actividades
  const GetActivity = useCallback(async () => {
    try {
      const token = getCookie("authToken") as string ?? "";
      const response = await GETActivityAll({ token, page: currentPage, pageSize, });
      setActivity(response.results);
      setPaginationInfo({
        count: response.count,
        page: response.page,
        page_size: response.page_size,
        total_pages: response.total_pages
      })

    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  }, [currentPage, pageSize])

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

  useEffect(() => {
    GetActivity();
    GetEventosList();
    GetEncuestaList();
  }, [GetActivity])

  useEffect(() => {
    setContador(selectedActivity?.description?.length ?? 0);
  }, [selectedActivity]);

  // Funciones de paginación
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < paginationInfo.total_pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2)); // ← let porque se reasigna abajo
    const endPage = Math.min(paginationInfo.total_pages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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

      // Éxito → ahora sí actualiza lista
      setActivity(prev => prev.filter(a => a.id_actividad !== id_actividad));
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);

    }
  };



  const handleUpdate = async (id_actividad: number, updatedData: FormData) => {

    try {
      const token = getCookie("authToken") as string || "";
      const jsonData = Object.fromEntries(updatedData.entries());

      // Actualizamos localmente
      setActivity(prev =>
        prev.map(a => a.id_actividad === id_actividad ? { ...a, ...jsonData } : a)
      );

      // Llamamos al PUT
      const res = await PUTActivity(id_actividad, token, jsonData);
      if (res.message !== "Producto actualizado") {
        // console.log("No se pudo actualizar la actividad.");
      }
    } catch (error) {
      console.error("Error al actualizar la actividad", error);
    }
  };

  function handleQR(activity: Activity) {
    setQrValue(activity.qr_code || '');
    setSelectedActivity(activity);
    setQrModalOpen(true);
  }


  return (
    <section className="space-y-6 overflow-auto w-full">
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold mb-4"
        onClick={() => setIsCreateProdu(true)}
      >
        + Crear Actividad
      </button>

      <ModalActivity
        isOpen={isCreateProdu}
        onClose={() => setIsCreateProdu(false)}
        refreshTypes={GetActivity} // ✅ Pasamos la función de refresco
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
            {activity && activity.length > 0 ? (
              activity.map((acti) => (
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


      {paginationInfo.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Página {paginationInfo.page} de {paginationInfo.total_pages}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Anterior */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                }`}
            >

              Anterior
            </button>

            {/* Números de página */}
            <div className="flex gap-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${page === currentPage
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-teak-100 hover:text-violet-600'
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
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === paginationInfo.total_pages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                }`}
            >
              Siguiente

            </button>
          </div>
        </div>
      )}



      {editModal && selectedActivity && (
        <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!formData.has('is_scoring')) {
                formData.set('is_scoring', 'false');
              } else {
                formData.set('is_scoring', 'true');
              }

              if (!formData.has('is_active')) {
                formData.set('is_active', 'false');
              } else {
                formData.set('is_active', 'true');
              }

  
              handleUpdate(selectedActivity.id_actividad!, formData);
              setEditModal(false);
            }}
            className="
        bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8 relative
        max-h-[90vh] overflow-y-auto
      "
          >
            <h2 className="text-2xl font-bold text-violet-600 mb-6 text-center">
              Editar Actividad
            </h2>

            {/* Grid de Inputs */}
            <div className="grid grid-cols-2 gap-4">

              {/* Evento */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Evento
                </label>
                <select
                  name="event"
                  defaultValue={selectedActivity.event}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                >
                  {idevent.map((eve) => (
                    <option key={eve.id_event} value={eve.id_event}>
                      {eve.name}
                    </option>
                  ))}
                </select>
              </div>

              {/*Encuestas*/}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Encuesta
                </label>
                <select
                  name="survey"
                  defaultValue={selectedActivity.survey}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                >
                  <option value="">-- Selecciona una encuesta --</option> {/* 👈 opción por defecto */}
                  {idencuesta.map((eve) => (
                    <option key={eve.id_survey} value={eve.id_survey}>
                      {eve.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  name="name"
                  defaultValue={selectedActivity.name}
                  maxLength={100}
                  onChange={(e) => setContadorName(e.target.value.length)}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                  required
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {contadorname}/100
                </div>
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedActivity.description}
                  rows={3}
                  maxLength={255}
                  onChange={(e) => setContador(e.target.value.length)}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {contador}/255
                </div>
              </div>

              {/* Lugar */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Lugar
                </label>
                <input
                  name="place"
                  maxLength={100}
                  defaultValue={selectedActivity.place}
                  onChange={(e) => setContadorLugar(e.target.value.length)}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {contadorlugar}/100
                </div>
              </div>

              {/* Fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={selectedActivity.start_date}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  name="end_date"
                  defaultValue={selectedActivity.end_date}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                />
              </div>

              {/* Horas */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  name="start_time"
                  defaultValue={selectedActivity.start_time}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Hora de fin
                </label>
                <input
                  type="time"
                  name="end_time"
                  defaultValue={selectedActivity.end_time}
                  className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                />
              </div>



              {/* Activo */}
              <div className="flex items-center gap-2 col-span-2 mt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={Boolean(selectedActivity?.is_active)}
                  className="w-5 h-5 border rounded"
                  onChange={(e) =>
                    setSelectedActivity((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev
                    )
                  }
                />
                <label className="text-sm font-medium text-gray-400">Activo</label>
              </div>

              {/*is_scoring  */}
              <div className="flex items-center gap-2 col-span-2 mt-2">
                <input
                  type="checkbox"
                  name="is_scoring"
                  checked={Boolean(selectedActivity?.is_scoring)}
                  className="w-5 h-5 border rounded"
                  onChange={(e) =>
                    setSelectedActivity((prev) =>
                      prev ? { ...prev, is_scoring: e.target.checked } : prev
                    )
                  }
                />
                <label className="text-sm font-medium text-gray-400">Ponderable</label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-4 py-2 rounded-lg border border-purple-300 text-purple-400 hover:bg-purple-100 "
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-violet-700"
              >
                Guardar
              </button>
            </div>
          </form>
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


    </section>
  )
}
