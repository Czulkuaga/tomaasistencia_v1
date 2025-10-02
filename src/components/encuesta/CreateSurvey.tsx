"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POSTCreateSurvey } from "@/actions/survey/survey-action";
import { ReplaceSurveyTree } from "@/actions/survey/survey-sync-action";
import { getCookie } from "cookies-next";

type UIQuestion = {
    id: number;
    text: string;
    type: "multiple_choice" | "yes_no" | "text" | "radio_button";
    options: string[];
};

export default function CreateSurvey() {
    const router = useRouter();
    const [surveyName, setSurveyName] = useState<string>("");
    const [questions, setQuestions] = useState<UIQuestion[]>([]);
    const [saving, setSaving] = useState(false);

    const addQuestion = () => {
        const newQuestion: UIQuestion = {
            id: Date.now(),
            text: "",
            type: "multiple_choice",
            options: [""],
        };
        setQuestions((prev) => [...prev, newQuestion]);
    };

    const updateQuestion = (questionId: number, field: keyof UIQuestion, value: any) => {
        if (field === "type") {
            let newOptions: string[] = [];
            if (value === "yes_no") newOptions = ["Sí", "No"];
            else if (value === "multiple_choice" || value === "radio_button") newOptions = [""];
            else if (value === "text") newOptions = [];
            setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, [field]: value, options: newOptions } : q));
        } else {
            setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, [field]: value } : q));
        }
    };

    const deleteQuestion = (questionId: number) => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    };

    const addOption = (questionId: number) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, ""] } : q)),
        );
    };

    const updateOption = (questionId: number, optionIndex: number, value: string) => {
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

    const deleteOption = (questionId: number, optionIndex: number) => {
        setQuestions((prev) =>
            prev.map((q) =>
                q.id === questionId ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) } : q,
            ),
        );
    };

    const handleSave = async () => {
        if (!surveyName.trim() || saving) return;

        // validación básica MUL/RAD
        const invalid = questions.some(q => (
            (q.type === "multiple_choice" || q.type === "radio_button") &&
            (!q.options || q.options.filter(o => o?.trim()).length === 0)
        ));
        if (invalid) {
            alert("Las preguntas de Opción Múltiple / Opción Única deben tener al menos una opción.");
            return;
        }

        setSaving(true);
        try {
            const token = getCookie("authToken") as string; // confirma el nombre real de tu cookie
            const created = await POSTCreateSurvey({
                name: surveyName.trim(),
                description: "",
                is_active: true,
                token,
            });

            if (!created?.ok) {
                console.error("Create survey failed:", created);
                const reason = created?.error || "No se pudo crear la encuesta";
                alert(`Error creando la encuesta: ${reason}`);
                return;
            }

            const surveyId = created.id ?? created?.data?.id ?? created?.data?.id_survey;
            if (!surveyId) {
                console.error("Respuesta sin ID utilizable:", created);
                alert("La API no devolvió un ID de encuesta. Revisa el backend.");
                return;
            }

            console.log("Voy a crear estructura con preguntas:", questions);

            const treeRes = await ReplaceSurveyTree({ token, surveyId, questions });
            console.log("Resultado ReplaceSurveyTree:", treeRes);
            if (!treeRes.ok) {
                alert("Algunas preguntas/opciones no se crearon. Revisa consola.");
                return;
            }

            router.push("/dashboard/surveys");
        } catch (e) {
            console.error("Error creando encuesta:", e);
            alert("No se pudo crear la encuesta. Revisa la consola para más detalles.");
        } finally {
            setSaving(false);
        }
    };


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
                                    key={question.id}
                                    className="bg-white border border-gray-200 rounded-lg border-l-4 border-l-purple-500 shadow-sm"
                                >
                                    <div className="px-6 py-3 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-violet-700">Pregunta {questionIndex + 1}</h3>
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
                                            <label className="block text-sm font-medium text-gray-700">Texto de la pregunta</label>
                                            <textarea
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, "text", e.target.value)}
                                                placeholder="Escribe tu pregunta aquí..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-base resize-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Tipo de pregunta</label>
                                            <div className="relative">
                                                <select
                                                    value={question.type}
                                                    onChange={(e) => updateQuestion(question.id, "type", e.target.value as UIQuestion["type"])}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
                                                >
                                                    <option value="multiple_choice">Opción Múltiple</option>
                                                    <option value="radio_button">Opción Única</option>
                                                    <option value="yes_no">Sí/No</option>
                                                    <option value="text">Texto Libre</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {(question.type === "multiple_choice" || question.type === "radio_button") && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-medium text-gray-700">Opciones de respuesta</label>
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
                                                        <div key={optionIndex} className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
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
                                                <label className="block text-sm font-medium text-gray-700">Opciones de respuesta</label>
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
                                                    <strong>Texto libre:</strong> Los usuarios podrán escribir su respuesta libremente. No
                                                    requiere opciones predefinidas.
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
                            {saving ? "Guardando..." : "Crear Encuesta"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
