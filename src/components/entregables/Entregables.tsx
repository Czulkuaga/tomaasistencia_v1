"use client"
import { useState, useEffect, useCallback } from 'react'
import { getCookie } from "cookies-next";
import { GETDeliverablesAll, DELETEDeliverables, PUTDeliverables } from "@/actions/feature/deliverables-action"
import { GETEvents } from "@/actions/feature/event-action"
import { MdDelete } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import { GETEncuesta } from "@/actions/survey/survey-action"
import ModalEntregable from "@/components/entregables/ModalEntregable"
import { IoQrCode } from "react-icons/io5";
import QRCode from 'react-qr-code';
import ModalVista from '@/components/entregables/ModalVista';
import { IoEye } from "react-icons/io5";

interface Entregables {
  id_deliverable?: number
  name?: string;
  description?: string
  place?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  event?: number
  survey?: number;
  qr_code: string;
  is_active?: boolean
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

export default function Entregables() {

  const [deliverable, setDeliverable] = useState<Entregables[]>([]);
  const [idevent, setIdEvent] = useState<EventItem[]>([]);
  const [idencuesta, setIdEncuesta] = useState<Survey[]>([]);
  const [isCreateProdu, setIsCreateProdu] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedeliverable, setSelecteDeliverable] = useState<Entregables | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState<string>('');
  const [vista, setVista] = useState(false);

  // para contar el numero de caracteres de la descripcion
  const [contador, setContador] = useState<number>(selectedeliverable?.description?.length ?? 0);
  const [contadorname, setContadorName] = useState<number>(selectedeliverable?.name?.length ?? 0);
  const [contadorlugar, setContadorLugar] = useState<number>(selectedeliverable?.place?.length ?? 0);

  // todo el tema de la paginacion 
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    page: 1,
    page_size: 20,
    total_pages: 0
  });




  // Función para obtener actividades
  const GETDeliverables = useCallback(async () => {
    try {
      const token = getCookie("authToken") as string ?? "";
      const response = await GETDeliverablesAll({ token, page: currentPage, pageSize, });
      setDeliverable(response.results);
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
    GETDeliverables();
    GetEventosList();
    GetEncuestaList();
  }, [GETDeliverables])

  useEffect(() => {
    setContador(selectedeliverable?.description?.length ?? 0);
  }, [selectedeliverable]);

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
  const handledelete = async (id_deliverable: number) => {
    try {
      const token = (getCookie("authToken") as string) || "";
      // UI optimista (opcional): comenta si prefieres esperar la confirmación
      // setActivity(prev => prev.filter(a => a.id_actividad !== id_actividad));

      const res = await DELETEDeliverables(id_deliverable, token);

      if (res?.ok === false) {
        console.error("No se pudo eliminar:", res.error);
        // muestra toast si usas alguno
        return;
      }

      // Éxito → ahora sí actualiza lista
      setDeliverable(prev => prev.filter(a => a.id_deliverable !== id_deliverable));
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);

    }
  };



  const handleUpdate = async (id_deliverable: number, updatedData: FormData) => {
    try {
      const token = getCookie("authToken") as string || "";
      const jsonData = Object.fromEntries(updatedData.entries());

      // Actualizamos localmente
      setDeliverable(prev =>
        prev.map(a => a.id_deliverable === id_deliverable ? { ...a, ...jsonData } : a)
      );

      // Llamamos al PUT
      const res = await PUTDeliverables(id_deliverable, token, jsonData);
      if (res.message !== "Producto actualizado") {
        console.log("No se pudo actualizar la actividad.");
      }
    } catch (error) {
      console.error("Error al actualizar la actividad", error);
    }
  };

  function handleQR(deliverable: Entregables) {
    setQrValue(deliverable.qr_code || '');
    setSelecteDeliverable(deliverable);
    setQrModalOpen(true);
  }


  return (
    <section className="space-y-6 overflow-auto w-full">
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold mb-4"
        onClick={() => setIsCreateProdu(true)}
      >
        + Crear Entregable
      </button>

      <ModalEntregable
        isOpen={isCreateProdu}
        onClose={() => setIsCreateProdu(false)}
        refreshTypes={GETDeliverables} // ✅ Pasamos la función de refresco
      />

      <ModalVista isOpen={vista} onClose={() => setVista(false)} deliverable={selectedeliverable} />

      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
          <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
            <tr className="bg-violet-500">
              <th className="border p-1 sm:p-2 text-center">EVENTO</th>
              <th className="border p-1 sm:p-2 text-center">NOMBRE</th>
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
            {deliverable && deliverable.length > 0 ? (
              deliverable.map((entrega) => (
                <tr key={entrega.id_deliverable} className='odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400'>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                    {idevent.find((eve) => Number(eve.id_event) === Number(entrega.event))?.name}
                  </td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.name}</td>
                  {/* <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">{acti.description}</td> */}
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.place}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.start_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.end_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.start_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.end_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{entrega.is_active ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                    <div className="flex justify-center items-center gap-2 sm:gap-4">
                      <button onClick={() => handleQR(entrega)}>
                        <IoQrCode size={20} className="text-gray-950 hover:text-gray-500 transition block" />
                      </button>

                      <button
                        onClick={() => {
                          setSelecteDeliverable(entrega);
                          setEditModal(true);
                        }}
                      >
                        <FaUserEdit size={20} className="text-violet-400 hover:text-violet-500 transition block" />
                      </button>
                      <button onClick={() => handledelete(entrega.id_deliverable!)}>
                        <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition block" />
                      </button>
                      <button
                        onClick={() => {
                          setSelecteDeliverable(entrega);
                          setVista(true);
                        }}
                        title="Ver información"
                        className="hover:opacity-80"
                      >
                        <IoEye size={20} className="text-blue-500" />
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



      {editModal && selectedeliverable && (
        <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdate(selectedeliverable.id_deliverable!, formData);
              setEditModal(false);
            }}
            className="
        bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8 relative
        max-h-[90vh] overflow-y-auto
      "
          >
            <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
              Editar Entregables
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
                  defaultValue={selectedeliverable.event}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
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
                  defaultValue={selectedeliverable.survey}
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
                  defaultValue={selectedeliverable.name}
                  onChange={(e) => setContadorName(e.target.value.length)}
                  maxLength={100}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
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
                  defaultValue={selectedeliverable.description}
                  rows={3}
                  onChange={(e) => setContador(e.target.value.length)}
                  maxLength={255}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
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
                  onChange={(e) => setContadorLugar(e.target.value.length)}
                  maxLength={100}
                  defaultValue={selectedeliverable.place}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
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
                  defaultValue={selectedeliverable.start_date}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  name="end_date"
                  defaultValue={selectedeliverable.end_date}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
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
                  defaultValue={selectedeliverable.start_time}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Hora de fin
                </label>
                <input
                  type="time"
                  name="end_time"
                  defaultValue={selectedeliverable.end_time}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>



              {/* Activo */}
              <div className="flex items-center gap-2 col-span-2 mt-2">
                <input
                  type="checkbox"
                  checked={selectedeliverable?.is_active || false}
                  className="w-5 h-5 border rounded"
                  onChange={(e) =>
                    setSelecteDeliverable((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev
                    )
                  }
                />
                <label className="text-sm font-medium text-gray-400">Activo</label>
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
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

            <h3 className="text-lg font-semibold mb-4 text-center">{selectedeliverable?.name}</h3>

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
                href={`${REGISTER_URL}/register?deliv=${selectedeliverable?.id_deliverable}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700"
              >
                Abrir registro
              </a>

              <button
                onClick={() => setQrModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
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
