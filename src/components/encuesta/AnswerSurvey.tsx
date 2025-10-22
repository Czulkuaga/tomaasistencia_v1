"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { GETSurveyWithTree } from "@/actions/survey/survey-tree-action";
import { POSTSurveyAnswersBulk } from "@/actions/survey/survey-answer-action";

type UIType = "text" | "multiple_choice" | "single_choice" | "yes_no";

type UIOption = { id: number; label: string };
type UIQuestion = {
    id: number;
    text: string;
    type: UIType;
    required: boolean;
    options: UIOption[];
};
type UISurvey = {
    id: number;
    name: string;
    description: string;
    questions: UIQuestion[];
};

type AnswersState = {
    [questionId: number]: Set<number> | number | null | string;
};

// Utilidad para loguear correctamente Sets
function serializeAnswersForLog(answers: AnswersState) {
    const out: Record<string, any> = {};
    Object.entries(answers).forEach(([qid, val]) => {
        out[qid] = val instanceof Set ? Array.from(val) : val;
    });
    return out;
}

export default function AnswerSurvey({ surveyId }: { surveyId: string }) {
    const router = useRouter();
    const search = useSearchParams();

    // Extrae tipo/id_value desde la URL (?atv=.. || ?std=.. || ?deliv=..  y ?att=..)
    const meta = useMemo(() => {
        const att = Number(search.get("att") || 0) || undefined;
        const atv = Number(search.get("atv") || 0) || undefined;
        const std = Number(search.get("std") || 0) || undefined;
        const deliv = Number(search.get("deliv") || 0) || undefined;

        let type: "atv" | "std" | "deliv" | undefined;
        let id_value: number | undefined;

        if (atv) { type = "atv"; id_value = atv; }
        else if (std) { type = "std"; id_value = std; }
        else if (deliv) { type = "deliv"; id_value = deliv; }

        return { attendee: att, type, id_value };
    }, [search]);

    const [loading, setLoading] = useState(true);
    const [survey, setSurvey] = useState<UISurvey | null>(null);
    const [answers, setAnswers] = useState<AnswersState>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const id = Number(surveyId);

            console.log("[AnswerSurvey] surveyId:", surveyId);
            console.log("[AnswerSurvey] Meta (desde query):", meta);

            const tree = await GETSurveyWithTree(id); // público, sin token
            console.log("[AnswerSurvey] GETSurveyWithTree tree:", tree);

            if (!tree) {
                setSurvey(null);
                setLoading(false);
                return;
            }

            // Mapeo del backend al modelo de UI
            const qs: UIQuestion[] = (tree.questions || [])
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((q) => {
                    let type: UIType = "text";
                    if (q.qtype === "TXT") type = "text";
                    else if (q.qtype === "MUL") type = "multiple_choice";
                    else if (q.qtype === "RAD") type = "single_choice";
                    else if (q.qtype === "Y/N") type = "yes_no";

                    const options: UIOption[] = (q.options || [])
                        .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
                        .map((o) => ({ id: o.id_option, label: o.value }));

                    return {
                        id: q.id_question,
                        text: q.text,
                        type,
                        required: !!q.required,
                        options,
                    };
                });

            const builtSurvey: UISurvey = {
                id: tree.id_survey,
                name: tree.name,
                description: tree.description,
                questions: qs,
            };

            console.log("[AnswerSurvey] Survey (normalizada):", builtSurvey);

            setSurvey(builtSurvey);

            // Inicializa estado de respuestas con tipos correctos
            const init: AnswersState = {};
            for (const q of qs) {
                if (q.type === "multiple_choice") init[q.id] = new Set<number>();
                else if (q.type === "single_choice" || q.type === "yes_no") init[q.id] = null;
                else init[q.id] = "";
            }
            setAnswers(init);
            setLoading(false);
            setShowErrors(false);
        })();
    }, [surveyId, meta]);

    const handleTextChange = (qid: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [qid]: value }));
    };

    const handleCheckboxChange = (qid: number, optId: number, checked: boolean) => {
        setAnswers((prev) => {
            const current = prev[qid] as Set<number> | undefined;
            const setVal = current instanceof Set ? new Set(current) : new Set<number>();
            if (checked) setVal.add(optId);
            else setVal.delete(optId);
            return { ...prev, [qid]: setVal };
        });
    };

    const handleRadioChange = (qid: number, optId: number) => {
        setAnswers((prev) => ({ ...prev, [qid]: optId }));
    };

    const handleYesNoToggle = (qid: number, yesId: number, noId: number) => {
        setAnswers((prev) => {
            const current = (prev[qid] as number | null) ?? null;
            const next = current === yesId ? noId : yesId;
            return { ...prev, [qid]: next };
        });
    };

    // --- Validación de completitud ---
    const isQuestionAnswered = (q: UIQuestion): boolean => {
        const val = answers[q.id];
        switch (q.type) {
            case "text":
                return typeof val === "string" && val.trim().length > 0;
            case "multiple_choice":
                return val instanceof Set && val.size > 0;
            case "single_choice":
                return typeof val === "number";
            case "yes_no":
                return typeof val === "number";
            default:
                return false;
        }
    };

    const missingQuestions = useMemo(
        () => (survey ? survey.questions.filter((q) => q.required && !isQuestionAnswered(q)) : []),
        [survey, answers] // <- agregar answers aquí
    );
    const isComplete = missingQuestions.length === 0;

    const renderQuestion = (q: UIQuestion, idx: number) => {
        const unanswered = showErrors && !isQuestionAnswered(q);

        if (q.type === "text") {
            const val = (answers[q.id] as string) ?? "";
            return (
                <div
                    id={`q-${q.id}`}
                    key={`q-${q.id}-${idx}`}
                    className={`bg-white rounded-lg border shadow-sm p-6 ${unanswered ? "border-red-300" : "border-gray-200"}`}
                >
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                        {q.text}{q.required ? " *" : ""}
                    </label>
                    <textarea
                        value={val}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none ${unanswered ? "border-red-300" : "border-gray-300"}`}
                        placeholder="Escribe tu respuesta aquí..."
                    />
                    {unanswered && <p className="mt-2 text-sm text-red-600">Esta pregunta es obligatoria.</p>}
                </div>
            );
        }

        if (q.type === "multiple_choice") {
            const current = answers[q.id];
            const setVal: Set<number> = current instanceof Set ? current : new Set<number>();
            return (
                <div
                    id={`q-${q.id}`}
                    key={`q-${q.id}-${idx}`}
                    className={`bg-white rounded-lg border shadow-sm p-6 ${unanswered ? "border-red-300" : "border-gray-200"}`}
                >
                    <label className="block text-sm font-medium text-gray-900 mb-4">
                        {q.text}{q.required ? " *" : ""}
                    </label>
                    <div className="space-y-3">
                        {(q.options || []).map((opt) => (
                            <label key={`opt-${opt.id}`} className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={setVal.has(opt.id)}
                                    onChange={(e) => handleCheckboxChange(q.id, opt.id, e.target.checked)}
                                    className="h-4 w-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
                                />
                                <span className="ml-3 text-sm text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {unanswered && <p className="mt-2 text-sm text-red-600">Selecciona al menos una opción.</p>}
                </div>
            );
        }

        if (q.type === "single_choice") {
            const current = (answers[q.id] as number | null) ?? null;
            return (
                <div
                    id={`q-${q.id}`}
                    key={`q-${q.id}-${idx}`}
                    className={`bg-white rounded-lg border shadow-sm p-6 ${unanswered ? "border-red-300" : "border-gray-200"}`}
                >
                    <label className="block text-sm font-medium text-gray-900 mb-4">
                        {q.text}{q.required ? " *" : ""}
                    </label>
                    <div className="space-y-3">
                        {(q.options || []).map((opt) => (
                            <label key={`opt-${opt.id}`} className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    checked={current === opt.id}
                                    onChange={() => handleRadioChange(q.id, opt.id)}
                                    className="h-4 w-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
                                />
                                <span className="ml-3 text-sm text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {unanswered && <p className="mt-2 text-sm text-red-600">Selecciona una opción.</p>}
                </div>
            );
        }

        if (q.type === "yes_no") {
            const yes = q.options.find((o) => o.label.toLowerCase() === "sí" || o.label.toLowerCase() === "si");
            const no = q.options.find((o) => o.label.toLowerCase() === "no");
            const yesId = yes?.id ?? 1;
            const noId = no?.id ?? 0;
            const selected = (answers[q.id] as number | null) ?? null;
            const isYes = selected === yesId;

            return (
                <div
                    id={`q-${q.id}`}
                    key={`q-${q.id}-${idx}`}
                    className={`bg-white rounded-lg border shadow-sm p-6 ${unanswered ? "border-red-300" : "border-gray-200"}`}
                >
                    <label className="block text-sm font-medium text-gray-900 mb-4">
                        {q.text}{q.required ? " *" : ""}
                    </label>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">No</span>
                        <button
                            type="button"
                            onClick={() => handleYesNoToggle(q.id, yesId, noId)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isYes ? "bg-purple-600" : "bg-gray-200"}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYes ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className="text-sm text-gray-700">Sí</span>
                    </div>
                    {unanswered && <p className="mt-2 text-sm text-red-600">Selecciona Sí o No.</p>}
                </div>
            );
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!survey) return;

        // Validación de completitud
        if (!isComplete) {
            setShowErrors(true);
            const first = missingQuestions[0];
            if (first) {
                const el = document.getElementById(`q-${first.id}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            alert("Por favor responde todas las preguntas antes de enviar.");
            return;
        }

        // LOG CLIENTE: meta y respuestas
        // console.log("[AnswerSurvey] Meta para envío:", meta);
        // console.log("[AnswerSurvey] Respuestas (raw):", answers);
        // console.log("[AnswerSurvey] Respuestas (serialize):", serializeAnswersForLog(answers));

        if (!meta.attendee || !meta.type || !meta.id_value) {
            alert("Faltan parámetros en la URL: att y uno de atv/std/deliv.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Armar payload
            const payload: {
                answers: Array<{
                    survey: number;
                    question: number;
                    option?: number;
                    attendee: number;
                    type: "atv" | "std" | "deliv";
                    id_value: number;
                    value_text?: string;
                }>;
            } = { answers: [] };

            for (const q of survey.questions) {
                const val = answers[q.id];

                if (q.type === "multiple_choice") {
                    const setVal: Set<number> = val instanceof Set ? val : new Set<number>();
                    setVal.forEach((optId) => {
                        payload.answers.push({
                            survey: survey.id,
                            question: q.id,
                            option: optId,
                            attendee: meta.attendee!,
                            type: meta.type!,
                            id_value: meta.id_value!,
                        });
                    });
                } else if (q.type === "single_choice" || q.type === "yes_no") {
                    const optId = (val as number | null);
                    if (typeof optId === "number") { // <- en lugar de if (optId)
                        payload.answers.push({
                            survey: survey.id,
                            question: q.id,
                            option: optId,
                            attendee: meta.attendee!,
                            type: meta.type!,
                            id_value: meta.id_value!,
                        });
                    }
                } else if (q.type === "text") {
                    const text = String(val || "").trim();
                    if (text) {
                        payload.answers.push({
                            survey: survey.id,
                            question: q.id,
                            attendee: meta.attendee!,
                            type: meta.type!,
                            id_value: meta.id_value!,
                            value_text: text,
                        });
                    }
                }
            }

            // LOG CLIENTE: payload final
            // console.log("[AnswerSurvey] Payload final a enviar:", JSON.stringify(payload, null, 2));
            // console.log("[AnswerSurvey] Total respuestas a enviar:", payload.answers.length);

            // Llamar server action
            const res = await POSTSurveyAnswersBulk(payload);

            // LOG CLIENTE: respuesta de server action
            // console.log("[AnswerSurvey] Resultado server action:", res);

            if (!res?.ok) {
                console.error("[AnswerSurvey] Envío fallido:", res);
                alert("La encuesta ya ha sido contestada");
                setIsSubmitting(false);
                return;
            }

            alert("¡Encuesta enviada exitosamente!");
            router.push("/register/encuesta/success");
        } catch (err) {
            console.error("[AnswerSurvey] Error enviando respuestas:", err);
            alert("Error enviando respuestas");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                        <p className="text-gray-600">Cargando encuesta...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!survey) {
        return (
            <div className="bg-gray-50 min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Encuesta no encontrada</h2>
                        <p className="text-gray-600 mb-6">La encuesta que buscas no existe o ha sido eliminada.</p>
                        <button
                            onClick={() => router.push("/")}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.push("/")}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </button>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{survey.name}</h1>
                        <p className="text-gray-600">{survey.description}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {survey.questions.map((q, idx) => renderQuestion(q, idx))}

                    {/* Submit Button */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !isComplete}
                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                onClick={() => { if (!isComplete) setShowErrors(true); }}
                                aria-disabled={!isComplete}
                                title={!isComplete ? "Responde todas las preguntas para enviar" : "Enviar encuesta"}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar Encuesta
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}