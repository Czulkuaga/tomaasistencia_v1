"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Edit, Trash2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { GETSurveys, DELETESurvey } from "@/actions/survey/survey-action";
import { SurveyDetailsModal } from "@/components/encuesta/survey-details-modal";
import { GETSurveyWithTree } from "@/actions/survey/survey-tree-action";

type SurveyItem = {
    id: number;
    name: string;
    createdDate: string;
    questions?: any[];
    question_count?: number;
};

export default function Survey() {
    const [surveys, setSurveys] = useState<SurveyItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getCookie("authToken") as string;
            const data = await GETSurveys({ token, search: "", page: 1, pageSize: 50 });

            const list = Array.isArray(data) ? data : data?.results || [];

            const normalized: SurveyItem[] = list.map((s: any) => {
                const id = s.id_survey ?? s.id;
                const creationDateRaw =
                    s.creation_date ??
                    s.created_at ??
                    s.createdAt ??
                    s.created_date ??
                    s.createdDate ??
                    null;

                const creationTimeRaw = s.creation_time ?? s.creationTime ?? null;

                const createdDateISO =
                    creationDateRaw && creationTimeRaw
                        ? new Date(`${creationDateRaw}T${creationTimeRaw}`).toISOString()
                        : creationDateRaw
                            ? new Date(creationDateRaw).toISOString()
                            : new Date().toISOString();

                return {
                    id,
                    name: s.name,
                    createdDate: createdDateISO,
                    questions: Array.isArray(s.questions) ? s.questions : undefined,
                    // usa el nuevo campo; conservamos fallback por si en algún ambiente aún existe el viejo
                    question_count: Number(
                        s.question_count ?? s.questions_count ?? 0),
                };
            });

            // de-dup por id (por si el endpoint devuelve duplicados)
            const dedupById = Array.from(new Map(normalized.map(n => [n.id, n])).values());
            setSurveys(dedupById);
        } catch (e) {
            console.error("GETSurveys error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSurveys = useMemo(
        () => surveys.filter((survey) => survey.name?.toLowerCase().includes(searchTerm.toLowerCase())),
        [surveys, searchTerm],
    );

    const handleViewSurvey = async (survey: SurveyItem) => {
        try {
            const token = getCookie("authToken") as string;
            const tree = await GETSurveyWithTree(survey.id);
            const questions = tree?.questions ?? [];

            setSelectedSurvey({
                ...survey,
                name: tree?.name ?? survey.name,
                questions,
                createdDate: survey.createdDate,
            });
            setIsDetailsModalOpen(true);

            // actualizar el conteo (campo nuevo)
            setSurveys(prev =>
                prev.map(s =>
                    s.id === survey.id ? { ...s, question_count: questions.length } : s
                )
            );
        } catch (e) {
            console.error("handleViewSurvey error:", e);
            setSelectedSurvey({ ...survey, questions: [] });
            setIsDetailsModalOpen(true);
        }
    };


    const handleDeleteSurvey = async (surveyId: number) => {
        const confirmed = confirm("¿Eliminar esta encuesta? (soft-delete)");
        if (!confirmed) return;

        try {
            const token = getCookie("authToken") as string;
            const r = await DELETESurvey(surveyId, token);
            if (r?.ok || r?.status === 204) {
                setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
            } else {
                alert(r?.error || "No se pudo eliminar la encuesta");
            }
        } catch (e) {
            console.error("DELETESurvey error:", e);
            alert("Error eliminando la encuesta");
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-gray-500">Cargando encuestas...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 space-y-6 overflow-auto w-full">
            <div className="">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Buscar encuestas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <Link href="/dashboard/surveys/create">
                            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Encuesta
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-purple-400">Encuestas ({filteredSurveys.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
                            <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
                            <tr className="bg-violet-500">
                                <th className="border p-1 text-center sm:p-2 text-white uppercase tracking-wider">
                                    Nombre de la Encuesta
                                </th>
                                <th className="border p-1 text-center sm:p-2 text-white uppercase tracking-wider">
                                    Fecha de Creación
                                </th>
                                <th className="border p-1 text-center sm:p-2 text-white uppercase tracking-wider">
                                    Preguntas
                                </th>
                                <th className="border p-1 text-center sm:p-2 text-white uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSurveys.map((survey, idx) => (
                                <tr
                                    key={`survey-${String(survey.id)}-${idx}`}
                                    className="odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400"
                                >
                                    <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">
                                        <div className="text-sm font-medium text-gray-900">{survey.name}</div>
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">
                                        <div className="text-sm text-gray-500">
                                            {new Date(survey.createdDate).toLocaleDateString("es-ES")}
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">
                                        <div className="text-sm text-gray-500">
                                            {typeof survey.question_count === "number"
                                                ? `${survey.question_count} preguntas`
                                                : "—"}
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleViewSurvey(survey)}
                                                className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <Link href={`/dashboard/surveys/edit/${survey.id}`}>
                                                <button className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteSurvey(survey.id)}
                                                className="inline-flex items-center p-2 border border-gray-300 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSurveys.length === 0 && (
                                <tr key="surveys-empty">
                                    <td colSpan={4} className="px-6 py-8 text-center text-red-500">
                                        No se encontraron encuestas.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <SurveyDetailsModal
                    survey={selectedSurvey}
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                />
            </div>
        </div>
    );
}
