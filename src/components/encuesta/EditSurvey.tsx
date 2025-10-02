"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { PATCHSurvey } from "@/actions/survey/survey-action";
import { ReplaceSurveyTree } from "@/actions/survey/survey-sync-action";
import { GETSurveyWithTree } from "@/actions/survey/survey-tree-action";
import { getCookie } from "cookies-next";

type UIQuestion = {
    id: number | string;
    text: string;
    type: "multiple_choice" | "yes_no" | "text" | "radio_button";
    options: string[];
};

export default function EditSurvey() {
    const router = useRouter();
    const params = useParams();
    const surveyId = Number.parseInt(params.id as string);

    const [surveyName, setSurveyName] = useState<string>("");
    const [questions, setQuestions] = useState<UIQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const _token = getCookie("authToken") as string; // (no se usa aquí)
                const tree = await GETSurveyWithTree(surveyId);   // endpoint público
                if (!tree) {
                    setSurveyName("");
                    setQuestions([]);
                    return;
                }

                setSurveyName(tree.name || "");

                // --- Mapeo robusto del árbol a UI ---
                const uiQs: UIQuestion[] = (tree.questions ?? []).map((q: any) => {
                    // ids y campos desde API normalizada o cruda
                    const rawId = q.id ?? q.id_question;
                    const rawType = q.type ?? q.qtype; // puede venir como "RAD" | "MUL" | "TXT" | "Y/N" o ya normalizado

                    // normaliza al tipo de UI esperado por el front
                    const toUiType = (t?: string): UIQuestion["type"] => {
                        switch (t) {
                            case "MUL":
                            case "multiple_choice":
                                return "multiple_choice";
                            case "RAD":
                            case "radio_button":
                                return "radio_button";
                            case "TXT":
                            case "text":
                                return "text";
                            case "Y/N":
                            case "yes_no":
                                return "yes_no";
                            default: {
                                // fallback: intenta detectar Sí/No por contenido de opciones
                                const vals = (q.options ?? []).map((op: any) => String(op.value ?? "").toLowerCase());
                                const hasYes = vals.includes("sí") || vals.includes("si");
                                const hasNo = vals.includes("no");
                                if (hasYes && hasNo) return "yes_no";
                                return "multiple_choice";
                            }
                        }
                    };

                    const uiType = toUiType(rawType);

                    return {
                        id: rawId,
                        text: q.text ?? "",
                        type: uiType,
                        // En Edit no necesitamos IDs de opción; ReplaceSurveyTree recrea
                        options:
                            uiType === "text" ? [] : (q.options ?? []).map((op: any) => String(op.value ?? "")),
                    };
                });

                setQuestions(uiQs);
            } catch (e) {
                console.error("Load survey tree error:", e);
                setSurveyName("");
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [surveyId]);

    const addQuestion = () => {
        const newQuestion: UIQuestion = {
            id: Date.now(),
            text: "",
            type: "multiple_choice",
            options: [""],
        };
        setQuestions((prev) => [...prev, newQuestion]);
    };

    const updateQuestion = (questionId: number | string, field: keyof UIQuestion, value: any) => {
        if (field === "type") {
            let newOptions: string[] = [];
            if (value === "yes_no") newOptions = ["Sí", "No"];
            else if (value === "multiple_choice" || value === "radio_button") newOptions = [""];
            else if (value === "text") newOptions = [];
            setQuestions((prev) =>
                prev.map((q) => (q.id === questionId ? { ...q, [field]: value, options: newOptions } : q)),
            );
        } else {
            setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)));
        }
    };

    const deleteQuestion = (questionId: number | string) => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    };

    const addOption = (questionId: number | string) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, ""] } : q)),
        );
    };

    const updateOption = (questionId: number | string, optionIndex: number, value: string) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map((opt, idx) => (idx === optionIndex ? value : opt)),
                    }
                    : q,
            ),
        );
    };

    const deleteOption = (questionId: number | string, optionIndex: number) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) } : q,
            ),
        );
    };

    const handleSave = async () => {
        if (!surveyName.trim() || saving) return;
        setSaving(true);
        try {
            const token = getCookie("authToken") as string;

            // 1) actualizar metadatos (encabezado)
            const meta = await PATCHSurvey(surveyId, token, { name: surveyName.trim() });
            if ((meta as any)?.error) {
                alert("No se pudo actualizar el encabezado de la encuesta");
                return;
            }

            // 2) reemplazar estructura completa (preguntas/opciones)
            const treeRes = await ReplaceSurveyTree({ token, surveyId, questions });
            if (!treeRes?.ok) {
                console.error("ReplaceSurveyTree errors:", treeRes?.errors);
                alert("No se pudieron aplicar todos los cambios en preguntas/opciones.");
                return;
            }

            router.push("/dashboard/surveys");
        } catch (e) {
            console.error("Update survey error:", e);
            alert("No se pudo actualizar la encuesta.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Cargando encuesta...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard/surveys">
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-purple-600">Información General</h2>
                        </div>
                        <div className="px-6 py-4">
                            <div className="space-y-2">
                                <label htmlFor="surveyName" className="block text-sm font-medium text-gray-700">
                                    Nombre de la Encuesta
                                </label>
                                <input
                                    id="surveyName"
                                    type="text"
                                    value={surveyName}
                                    onChange={(e) => setSurveyName(e.target.value)}
                                    placeholder="Ingresa el nombre de la encuesta"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-purple-600">Preguntas</h2>
                                <button
                                    onClick={addQuestion}
                                    className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Pregunta
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-6">
                            {questions.map((question, questionIndex) => (
                                <div
                                    key={`q-${String(question.id ?? "tmp")}-${questionIndex}`}
                                    className="bg-white border border-gray-200 rounded-lg border-l-4 border-l-purple-500 shadow-sm"
                                >
                                    <div className="px-6 py-3 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-violet-700">
                                                Pregunta {questionIndex + 1}
                                            </h3>
                                            <button
                                                onClick={() => deleteQuestion(question.id)}
                                                className="inline-flex items-center p-2 border border-gray-300 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Texto de la pregunta
                                            </label>
                                            <textarea
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                                                placeholder="Escribe tu pregunta aquí..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Tipo de pregunta
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={
                                                        ["multiple_choice", "radio_button", "yes_no", "text"].includes(
                                                            question.type,
                                                        )
                                                            ? question.type
                                                            : "multiple_choice"
                                                    }
                                                    onChange={(e) =>
                                                        updateQuestion(
                                                            question.id,
                                                            "type",
                                                            e.target.value as UIQuestion["type"],
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
                                                >
                                                    <option value="multiple_choice">Opción múltiple</option>
                                                    <option value="radio_button">Opción Única</option>
                                                    <option value="yes_no">Sí/No</option>
                                                    <option value="text">Texto libre</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {(question.type === "multiple_choice" || question.type === "radio_button") && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Opciones de respuesta
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                              {question.type === "multiple_choice"
                                  ? "Selección múltiple"
                                  : "Selección única"}
                            </span>
                                                    </label>
                                                    <button
                                                        onClick={() => addOption(question.id)}
                                                        className="inline-flex items-center px-3 py-1 text-sm border border-purple-200 rounded-md text-purple-600 hover:bg-purple-50 transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Opción
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {question.options.map((option, optionIndex) => (
                                                        <div
                                                            key={`opt-${String(question.id ?? "tmp")}-${optionIndex}`}
                                                            className="flex gap-2"
                                                        >
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) =>
                                                                    updateOption(question.id, optionIndex, e.target.value)
                                                                }
                                                                placeholder={`Opción ${optionIndex + 1}`}
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                                            />
                                                            {question.options.length > 1 && (
                                                                <button
                                                                    onClick={() => deleteOption(question.id, optionIndex)}
                                                                    className="inline-flex items-center p-2 border border-gray-300 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {question.type === "yes_no" && (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Opciones de respuesta
                                                </label>
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value="Sí"
                                                        disabled
                                                        className="w-full px-3 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-md"
                                                    />
                                                    <input
                                                        type="text"
                                                        value="No"
                                                        disabled
                                                        className="w-full px-3 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-md"
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Las opciones Sí/No son automáticas y no se pueden modificar
                                                </p>
                                            </div>
                                        )}

                                        {question.type === "text" && (
                                            <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                                                <p className="text-sm text-violet-700">
                                                    <strong>Texto libre:</strong> Los usuarios podrán escribir su respuesta
                                                    libremente. No requiere opciones predefinidas.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {questions.length === 0 && (
                                <div className="border-2 border-dashed border-violet-300 rounded-lg">
                                    <div className="py-12 text-center text-gray-500">
                                        <div className="space-y-2">
                                            <p className="text-lg">No hay preguntas agregadas</p>
                                            <p>Haz clic en "Agregar Pregunta" para comenzar a diseñar tu encuesta</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end pb-8">
                        <Link href="/dashboard/surveys">
                            <button className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors bg-transparent">
                                Cancelar
                            </button>
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={!surveyName.trim() || saving}
                            className="inline-flex items-center px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Guardando..." : "Actualizar Encuesta"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
