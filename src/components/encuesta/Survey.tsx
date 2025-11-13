"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Eye, Edit, Trash2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { DELETESurvey } from "@/actions/survey/survey-action";
import { SurveyDetailsModal } from "@/components/encuesta/survey-details-modal";
import { GETSurveyWithTree } from "@/actions/survey/survey-tree-action";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GETEvents } from "@/actions/feature/event-action";
import { EventSelector } from "../ui/EventSelector";
import { IoEye } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";

interface SurveyProps {
    initialData?: SurveyItem[]
    initialPage?: number
    initialPageSize?: number
    initialSearch?: string
    totalPages?: number
    totalCount?: number
    initialEvent?: number | undefined
    is_staff: boolean
    main_user: boolean
}

type SurveyItem = {
    id_survey: number;
    name: string;
    description: string;
    question_count?: number;
    questions?: Question[]
};

type Question = {
    id_question: number;
    options: OptionItem[],
    order: number,
    qtype: string,
    required: boolean,
    text: string
}

type OptionItem = string | { id?: number | string; value?: string };

interface EventItem {
    id_event: number;
    name: string;
}

export default function Survey({ initialData, initialPage, initialPageSize, initialSearch, totalPages, totalCount, initialEvent, is_staff, main_user }: SurveyProps) {

    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = useSearchParams();
    const [term, setTerm] = useState(initialSearch ?? "");
    const [isPending, startTransition] = useTransition();

    const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [idevent, setIdEvent] = useState<EventItem[]>([]);

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

    const handleViewSurvey = async (survey: SurveyItem) => {
        try {
            // const token = getCookie("authToken") as string;
            const tree = await GETSurveyWithTree(survey.id_survey);
            const questions = tree?.questions ?? [];

            console.log(questions)

            setSelectedSurvey({
                ...survey,
                name: tree?.name ?? survey.name,
                description: tree?.description ?? "",
                question_count: tree?.questions.length,
                questions: questions
            });
            setIsDetailsModalOpen(true);
        } catch (e) {
            console.error("handleViewSurvey error:", e);
            setSelectedSurvey({ ...survey, description: "Error cargando detalles" });
            setIsDetailsModalOpen(true);
        }
    };

    const handleDeleteSurvey = async (surveyId: number) => {
        const confirmed = confirm("¿Eliminar esta encuesta? (soft-delete)");
        if (!confirmed) return;

        try {
            const token = getCookie("authToken") as string;
            const r = await DELETESurvey(surveyId, token);
        } catch (e) {
            console.error("DELETESurvey error:", e);
            alert("Error eliminando la encuesta");
        }
    };

    useEffect(() => {
        GetEventosList();
    }, [])

    return (
        <section className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] space-y-6 overflow-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Sistema de Gestión de Encuestas</h1>
            <p className="text-gray-500 text-sm sm:text-base">Administra y crea encuestas de manera eficiente</p>

            <div className='w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                {
                    main_user === true && (
                        <Link href="/dashboard/surveys/create">
                            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Encuesta
                            </button>
                        </Link>
                    )
                }

                {
                    main_user === false && is_staff === true && (
                        <Link href="/dashboard/surveys/create">
                            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Encuesta
                            </button>
                        </Link>
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

            <div className="w-full overflow-x-auto rounded-lg shadow">
                <table className="w-full min-w-[1000px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
                    <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
                        <tr className="bg-violet-500">
                            <th className="border p-1 sm:p-2 text-center">Nombre de la Encuesta</th>
                            <th className="border p-1 sm:p-2 text-center">Descripción</th>
                            <th className="border p-1 sm:p-2 text-center">Preguntas</th>
                            <th className="border p-1 sm:p-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            initialData && initialData.length > 0 ? (
                                initialData.map((survey, idx) => (
                                    <tr
                                        key={`survey-${String(survey.id_survey)}-${idx}`}
                                        className='odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400'
                                    >
                                        <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                                            {survey.name}
                                        </td>
                                        <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                                            {survey.description || "—"}
                                        </td>
                                        <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">
                                            {typeof survey.question_count === "number"
                                                ? `${survey.question_count} preguntas`
                                                : "—"}
                                        </td>
                                        <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">
                                            {
                                                main_user === true && (
                                                    <div className="flex justify-center items-center gap-2 sm:gap-4">
                                                        <button
                                                            onClick={() => handleViewSurvey(survey)}
                                                            className="text-purple-400 hover:text-violet-500 transition block"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <Link href={`/dashboard/surveys/edit/${survey.id_survey}`}>
                                                            <button className="hover:opacity-80">
                                                                <FaUserEdit size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                                                            </button>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteSurvey(survey.id_survey)}
                                                        >
                                                            <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition block" />
                                                        </button>
                                                    </div>
                                                )
                                            }

                                            {
                                                main_user === false && is_staff === true && (
                                                    <div className="flex justify-center items-center gap-2 sm:gap-4">
                                                        <button
                                                            onClick={() => handleViewSurvey(survey)}
                                                            className="text-purple-400 hover:text-violet-500 transition block"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <Link href={`/dashboard/surveys/edit/${survey.id_survey}`}>
                                                            <button className="hover:opacity-80">
                                                                <FaUserEdit size={20} className="text-purple-400 hover:text-violet-500 transition block" />
                                                            </button>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteSurvey(survey.id_survey)}
                                                        >
                                                            <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition block" />
                                                        </button>
                                                    </div>
                                                )
                                            }

                                            {
                                                main_user === false && is_staff === false && (
                                                    <div className="flex justify-center items-center gap-2 sm:gap-4">
                                                        <button
                                                            onClick={() => handleViewSurvey(survey)}
                                                            className="text-purple-400 hover:text-violet-500 transition block"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )
                                            }

                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center text-red-500">No se encontraron datos</td>
                                </tr>
                            )
                        }
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
            {/* 🔼 Fin Paginador */}

            <SurveyDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                survey={selectedSurvey}
            />

        </section>
    );
}
