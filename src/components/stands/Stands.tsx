"use client"
import { useState, useEffect, useCallback, useTransition } from 'react'
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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EventSelector } from '../ui/EventSelector';

interface ControlAsistenteProps {
    initialData?: Stands[]
    initialPage?: number
    initialPageSize?: number
    initialSearch?: string
    totalPages?: number
    totalCount?: number
    initialEvent?: number | undefined
}

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

export default function Stands({ initialData, initialPage, initialPageSize, initialSearch, totalPages, totalCount, initialEvent }: ControlAsistenteProps) {

    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [term, setTerm] = useState(initialSearch ?? "");
    const [isPending, startTransition] = useTransition();

    const [stand, setStand] = useState<Stands[]>([]);
    const [idevent, setIdEvent] = useState<{ id_event: number; name: string }[]>([]);
    const [idencuesta, setIdEncuesta] = useState<Survey[]>([]);
    const [editModal, setEditModal] = useState(false);
    const [isCreateProdu, setIsCreateProdu] = useState(false);
    const [selectedStands, setSelectedStands] = useState<Stands | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrValue, setQrValue] = useState<string>('');
    const [vista, setVista] = useState(false);

    // para contar el numero de caracteres de la descripcion
    const [contador, setContador] = useState<number>(selectedStands?.description?.length ?? 0);
    const [contadorname, setContadorName] = useState<number>(selectedStands?.name?.length ?? 0);
    const [contadorempresa, setContadorEmpresa] = useState<number>(selectedStands?.company_name?.length ?? 0);
    const [contadorlugar, setContadorLugar] = useState<number>(selectedStands?.location?.length ?? 0);

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



    // const GetAsistente = useCallback(async () => {
    //     try {
    //         const token = getCookie("authToken") as string ?? "";

    //         if (!token) {
    //             console.error("No hay un token válido");
    //             return;
    //         }

    //         let response: any;

    //         if (appliedSearch.trim().length > 0) {
    //             response = await GETAsistenciaSearch({ token, search: appliedSearch.trim() });

    //             const results = Array.isArray(response) ? response : (response.results ?? []);
    //             setStand(results);

    //             setPaginationInfo({
    //                 count: Array.isArray(response) ? response.length : (response.count ?? results.length),
    //                 page: 1,
    //                 page_size: results.length,
    //                 total_pages: 1,
    //             });

    //         } else {
    //             const response = await GETStandsAll({ token, page: currentPage, pageSize, });
    //             setStand(response.results);
    //             console.log("arriba", response)
    //             setPaginationInfo({
    //                 count: response.count,
    //                 page: response.page,
    //                 page_size: response.page_size,
    //                 total_pages: response.total_pages
    //             })

    //         }


    //     } catch (error) {
    //         console.error("Error fetching products:", error);
    //     }
    // }, [initialPage, totalPages, appliedSearch])

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
        // GetAsistente();
        GetEventosList();
        GetEncuestaList();
    }, [])

    useEffect(() => {
        setContador(selectedStands?.description?.length ?? 0);
    }, [selectedStands]);


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
        <section className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] space-y-6 overflow-auto">
            <div className="flex flex-col gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Actividades</h1>
                <p className="text-gray-500 text-sm sm:text-base">
                    ¡Puedes ingresar tus actividades para tu proximo evento!
                </p>

                <div className='w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                    <button
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold"
                        onClick={() => setIsCreateProdu(true)}
                    >
                        + Crear Stands
                    </button>

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
            </div>

            {/* <ModalStand
                isOpen={isCreateProdu}
                onClose={() => setIsCreateProdu(false)}
                refreshTypes={GetAsistente} // 
            /> */}

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
                        {initialData && initialData.length > 0 ? (
                            initialData.map((stad, idx) => (
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
