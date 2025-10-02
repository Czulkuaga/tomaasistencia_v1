"use client"
import { useState, useEffect, useCallback } from 'react'
import { getCookie } from "cookies-next";
import { GETStandsAll, DELETEStands, PATCHStands, GETAsistenciaSearch } from "@/actions/feature/stands-action"
import { GETEvents } from "@/actions/feature/event-action"
import { MdDelete } from "react-icons/md";
import { IoQrCode } from "react-icons/io5";
import { FaUserEdit } from "react-icons/fa";
import ModalStand from './ModalStand';
import { GETEncuesta } from "@/actions/survey/survey-action"
import QRCode from 'react-qr-code';
import ModalVista from "@/components/stands/ModalVista"
import { IoEye } from "react-icons/io5";


interface Stands {
    id_stand?: number
    name?: string;
    company_name?: string;
    description?: string;
    location?: string;
    qr_code: string;
    token?: string;
    event: number;
    survey?: number;
    is_active: boolean
    is_scoring: boolean;
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

export default function Stands() {

    const [stand, setStand] = useState<Stands[]>([]);
    const [idevent, setIdEvent] = useState<{ id_event: number; name: string }[]>([]);
    const [idencuesta, setIdEncuesta] = useState<Survey[]>([]);
    const [editModal, setEditModal] = useState(false);
    const [isCreateProdu, setIsCreateProdu] = useState(false);
    const [selectedStands, setSelectedStands] = useState<Stands | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrValue, setQrValue] = useState<string>('');
    const [vista, setVista] = useState(false);


    // todo el tema de la paginacion
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
        count: 0,
        page: 1,
        page_size: 15,
        total_pages: 0
    });

    // boton de busqueda
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // para contar el numero de caracteres de la descripcion
    const [contador, setContador] = useState<number>(selectedStands?.description?.length ?? 0);
    const [contadorname, setContadorName] = useState<number>(selectedStands?.name?.length ?? 0);
    const [contadorempresa, setContadorEmpresa] = useState<number>(selectedStands?.company_name?.length ?? 0);
    const [contadorlugar, setContadorLugar] = useState<number>(selectedStands?.location?.length ?? 0);





    const GetAsistente = useCallback(async () => {
        try {
            const token = getCookie("authToken") as string ?? "";

            if (!token) {
                console.error("No hay un token válido");
                return;
            }

            let response: any;

            if (appliedSearch.trim().length > 0) {
                response = await GETAsistenciaSearch({ token, search: appliedSearch.trim() });

                const results = Array.isArray(response) ? response : (response.results ?? []);
                setStand(results);

                setPaginationInfo({
                    count: Array.isArray(response) ? response.length : (response.count ?? results.length),
                    page: 1,
                    page_size: results.length,
                    total_pages: 1,
                });

            } else {
                const response = await GETStandsAll({ token, page: currentPage, pageSize, });
                setStand(response.results);
                console.log("arriba", response)
                setPaginationInfo({
                    count: response.count,
                    page: response.page,
                    page_size: response.page_size,
                    total_pages: response.total_pages
                })

            }


        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }, [currentPage, pageSize, appliedSearch])

    const GetEventosList = async () => {
        try {
            const token = getCookie("authToken") as string ?? "";
            if (!token) return;

            const response = await GETEvents({ token });
            setIdEvent(response.results);
        } catch (error) {
            console.error("Error fetching eventos:", error);
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
        GetAsistente();
        GetEventosList();
        GetEncuestaList();
    }, [GetAsistente])

    useEffect(() => {
        setContador(selectedStands?.description?.length ?? 0);
    }, [selectedStands]);

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
    const handledelete = async (id_stand: number) => {
        const token = (getCookie("authToken") as string) || "";
        const ok = await DELETEStands(id_stand, token);
        if (ok) {
            setStand(prev => prev.filter(p => p.id_stand !== id_stand)); // ✅ quita el item del estado
        } else {
            console.error("No se pudo eliminar el stand");
        }
    };


    // metodo de actulizar
    const handleUpdate = async (id_stand: number, updatedData: FormData) => {
        try {
            const token = getCookie("authToken") as string || "";
            const jsonData = Object.fromEntries(updatedData.entries());

            // Actualizamos localmente
            setStand(prev =>
                prev.map(a => a.id_stand === id_stand ? { ...a, ...jsonData } : a)
            );

            // Llamamos al PUT
            const res = await PATCHStands(id_stand, token, jsonData);
            if (res.message !== "Producto actualizado") {
                console.log("No se pudo actualizar la actividad.");
            }
        } catch (error) {
            console.error("Error al actualizar la actividad", error);
        }
    };


    function handleQR(stand: Stands) {
        setQrValue(stand.qr_code || '');
        setSelectedStands(stand);
        setQrModalOpen(true);
    }


    return (
        <section className="space-y-6 overflow-auto w-full">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold"
          onClick={() => setIsCreateProdu(true)}
        >
          + Crear Stands
        </button>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}  // ← no dispara búsqueda
            // si NO quieres que Enter busque, no agregues onKeyDown
            className="w-56 sm:w-72 border border-violet-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              setAppliedSearch(searchTerm); // ← aquí “se aplica” la búsqueda
            }}
            className="px-3 py-2 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700"
            title="Buscar"
          >
            Buscar
          </button>
          {(appliedSearch || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setAppliedSearch("");   // ← limpia búsqueda
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
              title="Limpiar"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

            <ModalStand
                isOpen={isCreateProdu}
                onClose={() => setIsCreateProdu(false)}
                refreshTypes={GetAsistente} // 
            />

            <ModalVista isOpen={vista} onClose={() => setVista(false)} stand={selectedStands} />


            <div className="w-full overflow-x-auto rounded-lg shadow">
                <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
                    <thead className="bg-violet-500 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
                        <tr>
                            <th className="border p-2 ">Evento</th>
                            <th className="border p-2 ">Nombre</th>
                            <th className="border p-2 ">Nombre Empresa</th>
                            {/* <th className="border p-2 ">Descripcion</th> */}
                            <th className="border p-2 ">Lugar</th>
                            <th className="border p-2 ">ACTIVO</th>
                            <th className="border p-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {Array.isArray(stand) && stand.length > 0 ? (
                            stand.map((stad, idx) => (
                                <tr key={stad.id_stand} className={idx % 2 === 0 ? "bg-white hover:bg-purple-100 transition border border-gray-50" : "bg-gray-100 hover:bg-purple-100 transition border border-gray-400"}>
                                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{idevent.find(e => Number(e.id_event) === Number(stad.event))?.name || "-"}</td>
                                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{stad.name}</td>
                                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{stad.company_name}</td>
                                    {/* <td className="border border-gray-400 p-2 text-center">{stad.description}</td> */}
                                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{stad.location}</td>
                                    <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{stad.is_active ? "Sí" : "No"}</td>
                                    <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">

                                        <div className="flex justify-center items-center gap-2 sm:gap-4">

                                            <button onClick={() => handleQR(stad)}>
                                                <IoQrCode size={20} className="text-purple-950 hover:text-violet-500 transition block" />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedStands(stad);   // 👈 importante
                                                    setVista(true);          // 👈 abre el modal
                                                }}
                                                title="Ver información"
                                                className="hover:opacity-80"
                                            >
                                                <IoEye size={20} className="text-purple-400 hover:text-violet-400" />
                                            </button>


                                            <button
                                                onClick={() => {
                                                    setSelectedStands(stad);
                                                    setEditModal(true);
                                                }}
                                            >
                                                <FaUserEdit size={20} className="text-purple-400 hover:text-violet-400 transition" />
                                            </button>



                                            <button onClick={() => handledelete(stad.id_stand!)}>
                                                <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition block" />
                                            </button>



                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={11} className="text-center text-red-500 p-4">
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


            {editModal && selectedStands && (
                <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">



                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            formData.set('is_active', selectedStands?.is_active ? 'true' : 'false');
                            formData.set('is_scoring', selectedStands?.is_scoring ? 'true' : 'false');
                            handleUpdate(selectedStands.id_stand!, formData);
                            setEditModal(false);
                            GetAsistente();
                        }}

                        className="
 bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8 relative
        max-h-[90vh] overflow-y-auto
      "
                    >
                        <h2 className="text-2xl font-bold text-violet-600 mb-6 text-center">Editar Stands</h2>
                        {/* Grid de Inputs */}
                        <div className="grid grid-cols-2 gap-4">


                            {/* Evento - ocupa todo el ancho */}
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium mb-1 text-gray-400">Evento</label>
                                <select
                                    name="event"
                                    defaultValue={selectedStands.event}
                                    className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                                >
                                    {idevent.map((eve) => (
                                        <option key={eve.id_event} value={eve.id_event}>
                                            {eve.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* SELECT DE ENCUESTA */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Encuesta
                                </label>
                                <select
                                    name="survey"
                                    defaultValue={selectedStands.survey ?? ""}  // 👈 si no hay encuesta, queda en blanco
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
                            <div className="flex flex-col sm:col-span-2">
                                <label className="text-sm font-medium mb-1 text-gray-400">Nombre</label>
                                <input
                                    name="name"
                                    defaultValue={selectedStands.name}
                                    placeholder="Nombre"
                                    maxLength={100}
                                    onChange={(e) => setContadorName(e.target.value.length)}
                                    className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                                    required
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {contadorname}/100
                                </div>
                            </div>



                            {/* Empresa */}
                            <div className="flex flex-col sm:col-span-2">
                                <label className="text-sm font-medium mb-1 text-gray-400">Empresa</label>
                                <input
                                    name="company_name"
                                    maxLength={100}
                                    onChange={(e) => setContadorEmpresa(e.target.value.length)}
                                    defaultValue={selectedStands.company_name}
                                    placeholder="Nombre Empresa"
                                    className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {contadorempresa}/100
                                </div>
                            </div>

                            {/* Descripcion */}
                            <div className="flex flex-col sm:col-span-2">
                                <label className="text-sm font-medium mb-1 text-gray-400">Descripcion</label>
                                <textarea
                                    name="description"
                                    maxLength={255}
                                    onChange={(e) => setContador(e.target.value.length)}
                                    defaultValue={selectedStands.description}
                                    className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {contador}/255
                                </div>
                            </div>

                            {/* Email - ocupa todo el ancho */}
                            <div className="flex flex-col md:col-span-2">
                                <label className="text-sm font-medium mb-1 text-gray-400">Lugar</label>
                                <input
                                    name="location"
                                    defaultValue={selectedStands.location}
                                    placeholder="Correo"
                                    maxLength={100}
                                    onChange={(e) => setContadorLugar(e.target.value.length)}
                                    type="location"
                                    className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {contadorlugar}/100
                                </div>
                            </div>

                            {/* Activo */}
                            <div className="flex items-center gap-2 col-span-2 mt-2">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={Boolean(selectedStands?.is_active)}
                                    className="w-5 h-5 border rounded"
                                    onChange={(e) =>
                                        setSelectedStands((prev) =>
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
                                    checked={Boolean(selectedStands?.is_scoring)}
                                    className="w-5 h-5 border rounded"
                                    onChange={(e) =>
                                        setSelectedStands((prev) =>
                                            prev ? { ...prev, is_scoring: e.target.checked } : prev
                                        )
                                    }
                                />
                                <label className="text-sm font-medium text-gray-400">Ponderable</label>
                            </div>
                        </div>





                        {/* Botones */}
                        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setEditModal(false)}
                                className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>

                </div>
            )}
            {qrModalOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-purple-/50 backdrop-blur-sm px-4"
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

                        <h3 className="text-lg font-semibold mb-4 text-center"> {selectedStands?.name}</h3>

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
                                href={`${REGISTER_URL}/register?std=${selectedStands?.id_stand}`}
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
