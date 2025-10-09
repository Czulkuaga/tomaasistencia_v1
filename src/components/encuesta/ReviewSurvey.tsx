"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, BarChart3, PieChart, MessageSquare, X } from "lucide-react";
import { getCookie } from "cookies-next";

import { GETSurveyWithTree } from "@/actions/survey/survey-tree-action";
import { GETSurveyAnswers } from "@/actions/survey/survey-answers-list-action";

// Ajusta estos imports si tus rutas difieren (ya existen en tu app)
import { GETActivityAll } from "@/actions/feature/activity-action";
import { GETStands } from "@/actions/feature/stands-action";
import { GETDeliverables } from "@/actions/feature/deliverables-action";

type Category = "actividades" | "stands" | "entregables";

type ItemRow =
    | { id: number; name: string; survey?: number | null }
    | { id: number; name: string; survey: number };

type UIType = "multiple_choice" | "single_choice" | "yes_no" | "text";

type AggregatedResponse =
    | {
    questionId: number;
    question: string;
    type: Exclude<UIType, "text">;
    answers: Record<string, number>;
}
    | {
    questionId: number;
    question: string;
    type: "text";
    answers: string[];
};

function qtypeToUI(qtype?: string): UIType {
    switch (qtype) {
        case "MUL": return "multiple_choice";
        case "RAD": return "single_choice";
        case "Y/N": return "yes_no";
        case "TXT": return "text";
        default:    return "multiple_choice";
    }
}

// CSV: escapar comillas sin template literals
function esc(s: string): string {
    return '"' + String(s).replace(/"/g, '""') + '"';
}

export default function ReviewSurvey() {
    const [selectedCategory, setSelectedCategory] = useState<Category | "">("");
    const [items, setItems] = useState<ItemRow[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [surveyId, setSurveyId] = useState<number | null>(null);

    const [surveyName, setSurveyName] = useState<string>("");
    const [responses, setResponses] = useState<AggregatedResponse[] | null>(null);
    const [loading, setLoading] = useState(false);

    const [showTextModal, setShowTextModal] = useState(false);
    const [selectedTextResponses, setSelectedTextResponses] =
        useState<Extract<AggregatedResponse, { type: "text" }> | null>(null);


    // 1) Cargar items por categoría (vía SA)
    useEffect(() => {
        (async () => {
            setItems([]);
            setSelectedItemId("");
            setSurveyId(null);
            setResponses(null);
            setSurveyName("");

            if (!selectedCategory) return;

            const token = getCookie("authToken") as string;

            try {
                if (selectedCategory === "actividades") {
                    const data = await GETActivityAll({ token, page_size: 1000});
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    const mapped: ItemRow[] = list.map((r: any) => ({
                        id: r.id_actividad ?? r.id,
                        name: r.name ?? r.title ?? `Actividad ${r.id_actividad ?? r.id}`,
                        survey: r.survey ?? null,
                    }));
                    setItems(mapped);
                } else if (selectedCategory === "stands") {
                    const data = await GETStands({ token});
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    const mapped: ItemRow[] = list.map((r: any) => ({
                        id: r.id_stand ?? r.id,
                        name: r.name ?? `Stand ${r.id_stand ?? r.id}`,
                        survey: r.survey ?? null,
                    }));
                    setItems(mapped);
                } else if (selectedCategory === "entregables") {
                    const data = await GETDeliverables({ token});
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    const mapped: ItemRow[] = list.map((r: any) => ({
                        id: r.id_deliverable ?? r.id_deliv ?? r.id,
                        name: r.name ?? `Entregable ${r.id_deliverable ?? r.id}`,
                        survey: r.survey ?? null,
                    }));
                    setItems(mapped);
                }
            } catch (e) {
                console.error("Cargar items error:", e);
            }
        })();
    }, [selectedCategory]);

// 2) Al elegir item, cargar Tree + Answers
    useEffect(() => {
        (async () => {
            setResponses(null);
            setSurveyName("");
            setSurveyId(null);

            if (!selectedItemId || !selectedCategory) return;
            const item = items.find((i) => String(i.id) === String(selectedItemId));
            if (!item) return;

            const sId = (item as any).survey ?? null;
            if (!sId) { setSurveyId(null); return; }

            setLoading(true);
            try {
                // a) Árbol de encuesta
                const tree = await GETSurveyWithTree(Number(sId));
                if (!tree) { setSurveyId(null); setLoading(false); return; }

                setSurveyId(tree.id_survey ?? Number(sId));
                setSurveyName(tree.name ?? `Encuesta ${tree.id_survey ?? sId}`);

                const qById = new Map<number, { q: any; type: UIType }>();
                const optLabelById = new Map<number, string>();

                for (const rq of (tree.questions ?? [])) {
                    const qid = Number(rq.id_question);
                    const uiType = qtypeToUI(rq.qtype as any);

                    qById.set(qid, { q: rq, type: uiType });

                    for (const op of (rq.options ?? [])) {
                        const oid = Number(op.id_option);
                        optLabelById.set(oid, String(op.value ?? ""));
                    }
                }

                // b) Respuestas (paginado)
                const type: "atv" | "std" | "deliv" =
                    selectedCategory === "actividades" ? "atv" :
                        selectedCategory === "stands" ? "std" : "deliv";

                const id_value = Number(item.id);
                const survey = Number(sId);

                let page = 1;
                const page_size = 1000;
                let all: any[] = [];

                // lee el token del cookie en el cliente
                // dentro del useEffect que carga Tree + Answers
                const token = (getCookie("authToken") as string) || "";

                const first = await GETSurveyAnswers({ token, type, id_value, survey, page, page_size });
                console.log("[ReviewSurvey] GETSurveyAnswers:first ->", first);

                if (!first?.ok) { /* ... */ }

                all = (first.data?.results ?? []).slice();

                const totalPages = Number(first.data?.total_pages ?? 1);
                while (page < totalPages) {
                    page += 1;
                    const r = await GETSurveyAnswers({ token, type, id_value, survey, page, page_size }); // <-- token también aquí
                    console.log(`[ReviewSurvey] GETSurveyAnswers:page ${page} ->`, r);
                    if (!r?.ok) break;
                    all.push(...(r.data?.results ?? []));
                }


                // c) Agregación por tipo de pregunta
                const grouped = new Map<number, AggregatedResponse>();

                for (const row of all) {
                    const qid = Number(row.question);
                    const meta = qById.get(qid);
                    if (!meta) continue;

                    const qText = meta.q?.text ?? `Pregunta ${qid}`;
                    const t = meta.type;

                    if (t === "text") {
                        const prev = grouped.get(qid) as Extract<AggregatedResponse, { type: "text" }> | undefined;
                        const val = (row.value_text ?? "").toString().trim();
                        if (!prev) {
                            grouped.set(qid, { questionId: qid, question: qText, type: "text", answers: val ? [val] : [] });
                        } else {
                            if (val) prev.answers.push(val);
                        }
                    } else {
                        const oid = Number(row.option ?? 0);
                        const label =
                            t === "yes_no"
                                ? (optLabelById.get(oid) ?? (oid === 1 ? "Sí" : oid === 0 ? "No" : `Opción ${oid}`))
                                : (optLabelById.get(oid) ?? `Opción ${oid}`);

                        const prev = grouped.get(qid) as Extract<AggregatedResponse, { type: Exclude<UIType, "text"> }> | undefined;
                        if (!prev) {
                            grouped.set(qid, { questionId: qid, question: qText, type: t, answers: { [label]: 1 } });
                        } else {
                            prev.answers[label] = (prev.answers[label] ?? 0) + 1;
                        }
                    }
                }

                const agg = Array.from(grouped.values()).sort((a, b) => a.questionId - b.questionId);
                setResponses(agg);
            } catch (e) {
                console.error("Cargar tree/answers error:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedItemId, selectedCategory, items]);

    const selectedSurvey = useMemo(() => {
        if (!surveyId || !responses) return null;
        return { id: surveyId, name: surveyName || `Encuesta ${surveyId}`, responses };
    }, [surveyId, surveyName, responses]);

    const categories = [
        { value: "actividades", label: "Actividades" },
        { value: "stands", label: "Stands" },
        { value: "entregables", label: "Entregables" },
    ];

    const downloadResults = () => {
        if (!selectedSurvey) return;

        let csv = "Pregunta,Tipo,Opción,Cantidad,Porcentaje\n";

        selectedSurvey.responses.forEach((resp) => {
            if (resp.type === "text") {
                (resp.answers as string[]).forEach((answer, i) => {
                    csv += esc(resp.question) + "," + esc(resp.type) + "," + esc("Respuesta " + (i + 1)) + "," + esc(answer) + ",\n";
                });
            } else {
                const total = Object.values(resp.answers).reduce((s, n) => s + Number(n), 0);
                Object.entries(resp.answers).forEach(([option, count]) => {
                    const pct = total ? ((Number(count) / total) * 100).toFixed(1) + "%" : "0%";
                    csv += esc(resp.question) + "," + esc(resp.type) + "," + esc(option) + "," + esc(String(count)) + "," + esc(pct) + "\n";
                });
            }
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resultados-${selectedSurvey.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const openTextModal = (resp: AggregatedResponse) => {
        if (resp.type !== "text") return;
        setSelectedTextResponses(resp);
        setShowTextModal(true);
    };

    const renderChart = (resp: AggregatedResponse) => {
        if (resp.type === "text") {
            const arr = resp.answers as string[];
            return (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">Respuestas de texto</h4>
                            <p className="text-sm text-gray-600">Total: {arr.length} respuestas</p>
                        </div>
                        <button
                            onClick={() => openTextModal(resp)}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ver Respuestas
                        </button>
                    </div>
                </div>
            );
        }

        const total = Object.values(resp.answers).reduce((s, n) => s + Number(n), 0);

        return (
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                    {Object.entries(resp.answers).map(([option, count]) => {
                        const pct = total ? ((Number(count) / total) * 100).toFixed(1) : "0";
                        return (
                            <div key={option} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">{option}</span>
                                    <span className="text-gray-900 font-medium">
                    {count} ({pct}%)
                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 text-sm text-gray-500">Total de respuestas: {total}</div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Selectores */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Revisión de Datos de Encuestas</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Categoría</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as Category | "")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            >
                                <option value="">-- Seleccionar --</option>
                                {[
                                    { value: "actividades", label: "Actividades" },
                                    { value: "stands", label: "Stands" },
                                    { value: "entregables", label: "Entregables" },
                                ].map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccionar {selectedCategory ? (selectedCategory === "actividades" ? "Actividad" : selectedCategory === "stands" ? "Stand" : "Entregable") : "Item"}
                            </label>
                            <select
                                value={selectedItemId}
                                onChange={(e) => setSelectedItemId(e.target.value)}
                                disabled={!selectedCategory}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                            >
                                <option value="">-- Seleccionar --</option>
                                {items.map((it) => (
                                    <option key={it.id} value={it.id}>
                                        {it.name}{(it as any).survey ? "" : " (sin encuesta)"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedSurvey && (
                        <div className="flex justify-end">
                            <button
                                onClick={downloadResults}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* Estados */}
                {loading && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-500">
                        Cargando resultados…
                    </div>
                )}

                {!loading && !selectedSurvey && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un item para ver los resultados</h3>
                        <p className="text-gray-500">Elige una categoría e item para visualizar los datos y gráficos</p>
                    </div>
                )}

                {/* Gráficos */}
                {!loading && selectedSurvey && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="h-5 w-5 text-purple-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Resultados: {selectedSurvey.name}</h3>
                            </div>

                            {responses && responses.length > 0 ? (
                                <div className="space-y-8">
                                    {responses.map((resp, i) => (
                                        <div key={resp.questionId} className="border-b border-gray-200 pb-6 last:border-b-0">
                                            <h4 className="text-md font-medium text-gray-900 mb-4">
                                                {i + 1}. {resp.question}
                                            </h4>
                                            <div className="bg-gray-50 p-1 rounded-lg inline-block mb-3">
                        <span className="text-xs font-medium text-purple-700 px-2 py-1 bg-purple-100 rounded">
                          {resp.type === "multiple_choice" && "Opción Múltiple"}
                            {resp.type === "single_choice" && "Opción Única"}
                            {resp.type === "yes_no" && "Sí/No"}
                            {resp.type === "text" && "Texto Libre"}
                        </span>
                                            </div>
                                            {renderChart(resp)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">No hay respuestas para esta selección.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal de texto */}
                {showTextModal && selectedTextResponses && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Respuestas de Texto: {selectedTextResponses.question}
                                </h3>
                                <button
                                    onClick={() => setShowTextModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="space-y-4">
                                    {selectedTextResponses.answers.map((answer, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-800">{answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total de respuestas: {selectedTextResponses.answers.length}
                  </span>
                                    <button
                                        onClick={() => setShowTextModal(false)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
