"use client"
import { useCallback, useState, useEffect } from 'react'
import { getCookie } from "cookies-next";
import { GETEventsAll, PUTEvent, DELETEvent } from "@/actions/feature/event-action"
import { MdDelete } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import ModalCreateE from "@/components/eventos/ModalCreateE"
import ModalVista from './ModalVista';
import { IoEye } from "react-icons/io5";

interface Events {
  // id_bp?: string;
  id_event?: number
  name?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean
}

interface PaginationInfo {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function Eventos() {
  const [events, setEvents] = useState<Events[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [isCreateProdu, setIsCreateProdu] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Events | null>(null);

  const [vista, setVista] = useState(false);


  // todo el tema de la paginacion 
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    page: 1,
    page_size: 10,
    total_pages: 0
  });


  const GetEvento = useCallback(async () => {
    try {
      const token = getCookie("authToken") as string ?? "";

      // if (!token) {
      //   console.error("No hay un token válido");
      //   return;
      // }

      const response = await GETEventsAll({ token, page: currentPage, pageSize, });
      setEvents(response.results);
      // console.log("arriba", response)
      setPaginationInfo({
        count: response.count,
        page: response.page,
        page_size: response.page_size,
        total_pages: response.total_pages
      })

    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, [currentPage, pageSize])

  useEffect(() => {
    GetEvento();
  }, [GetEvento])

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

  // // ✅ Eliminar evento
  const handledelete = async (id_event: number) => {
    try {
      const token = (getCookie("authToken") as string) || "";
      const res = await DELETEvent(id_event, token);

      if (res?.ok === false) {
        console.error("No se pudo eliminar:", res.error);

        return;
      }

      setEvents(prev => prev.filter(e => e.id_event !== id_event));

    } catch (error) {
      console.error("Error al eliminar", error);
    }
  };


  // ✅ Editar evento (ejemplo básico)

  const handleUpdate = async (id_event: number, updatedData: FormData) => {
    try {
      const token = getCookie("authToken") as string || "";
      const jsonData = Object.fromEntries(updatedData.entries());

      // Actualizamos localmente
      setEvents(prev =>
        prev.map(a => a.id_event === id_event ? { ...a, ...jsonData } : a)
      );

      // Llamamos al PUT
      const res = await PUTEvent(id_event, token, jsonData);
      if (res.message !== "Producto actualizado") {
        console.log("No se pudo actualizar la actividad.");
      }
    } catch (error) {
      console.error("Error al actualizar la actividad", error);
    }
  };


  return (
    <section className="space-y-6 overflow-auto w-full">

      <button
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold mb-4"
        onClick={() => setIsCreateProdu(true)}
      >
        + Crear Evento
      </button>

      <ModalCreateE
        isOpen={isCreateProdu}
        onClose={() => setIsCreateProdu(false)}
        refreshTypes={GetEvento} // ✅ Pasamos la función de refresco
      />

      <ModalVista isOpen={vista} onClose={() => setVista(false)} event={selectedEvent} />



      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">

          <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">

            <tr className="bg-violet-500">
              <th className="border p-1 text-center sm:p-2">NOMBRE</th>
              {/* <th className="border p-1 text-center sm:p-2">DESCRIPCIÓN</th>
              <th className="border p-1 text-center sm:p-2">PAÍS</th>
              <th className="border p-1 text-center sm:p-2">ESTADO</th> */}
              <th className="border p-1 text-center sm:p-2 w-18">CIUDAD</th>
              {/* <th className="border p-1 text-center sm:p-2">DIRECCIÓN</th> */}
              <th className="border p-1 text-center sm:p-2 w-18">FECHA DE INICIO</th>
              <th className="border p-1 text-center sm:p-2 w-18">FECHA FIN</th>
              <th className="border p-1 text-center sm:p-2 w-18">HORA DE INICIO</th>
              <th className="border p-1 text-center sm:p-2 w-18">HORA FIN</th>
              <th className="border p-1 text-center sm:p-2 w-18">ACTIVO</th>
              <th className="border p-1 text-center sm:p-2 w-18">ACCIONES</th>
            </tr>
          </thead>
          <tbody >
            {Array.isArray(events) ? (
              events.map((eve) => (
                <tr key={eve.id_event} className="odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400">
                  <td className="border border-gray-300 p-1  max-w-[150px] truncate text-left">{eve.name}</td>
                  {/* <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">{eve.description}</td>
                  <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">{eve.state}</td>
                  <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate ">{eve.country}</td> */}
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.city}</td>
                  {/* <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">{eve.address}</td> */}
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.start_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.end_date}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.start_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.end_time}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{eve.is_active ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                    <div className="flex justify-center items-center gap-2 sm:gap-4">

                      <button
                        onClick={() => {
                          setSelectedEvent(eve);   // 👈 importante
                          setVista(true);          // 👈 abre el modal
                        }}
                        title="Ver información"
                        className="hover:opacity-80"
                      >
                        <IoEye size={20} className="text-purple-400 hover:text-violet-500 transition blockS" />
                      </button>


                      <button
                        onClick={() => {
                          setSelectedEvent(eve);
                          setEditModal(true);
                        }}
                      >
                        <FaUserEdit size={20} className="text-purple-400 hover:text-purple-500 transition" />
                      </button>

                      <button onClick={() => handledelete(eve.id_event!)}>
                        <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="align-middle text-center text-red-500">
                  No se encontraron datos
                </td>
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
                : 'bg-teal-100 text-teal-600 hover:bg-sky-200'
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
                    : 'bg-violet-100 text-gray-600 hover:bg-violet-100 hover:text-violet-600'
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
      {editModal && selectedEvent && (
        <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdate(selectedEvent.id_event!, formData);
              setEditModal(false);
            }}
            className="
        bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8 relative
        max-h-[90vh] overflow-y-auto   /* <= LO CLAVE */
      "
          >



            <h2 className="text-2xl font-bold text-violet-600 mb-6 text-center">
              Editar Evento
            </h2>

            {/* Grid de Inputs */}
            <div className="grid grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  name="name"
                  defaultValue={selectedEvent.name}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedEvent.description}
                  rows={3}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>

              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  País
                </label>
                <input
                  name="country"
                  defaultValue={selectedEvent.country}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Estado
                </label>
                <input
                  name="state"
                  defaultValue={selectedEvent.state}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>

              {/* Ciudad */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Ciudad
                </label>
                <input
                  name="city"
                  defaultValue={selectedEvent.city}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>

              {/* Dirección */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Dirección
                </label>
                <input
                  name="address"
                  defaultValue={selectedEvent.address}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>

              {/* Fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={selectedEvent.start_date}
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
                  defaultValue={selectedEvent.end_date}
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
                  defaultValue={selectedEvent.start_time}
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
                  defaultValue={selectedEvent.end_time}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />
              </div>

              {/* Activo */}
              <div className="flex items-center gap-2 col-span-2 mt-2">
                <input
                  type="checkbox"
                  checked={selectedEvent?.is_active || false}
                  className="w-5 h-5 border rounded"
                  onChange={(e) =>
                    setSelectedEvent((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev
                    )
                  }
                />
                <label className="text-sm font-medium text-gray-700">Activo</label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-5 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>

      )}
    </section>



  )
}

