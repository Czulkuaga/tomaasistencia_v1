"use client";

import { X } from "lucide-react";

type UIQuestionType = "multiple_choice" | "yes_no" | "text" | "TXT" | "RAD" | "CHK" | string;

type OptionItem = string | { id?: number | string; value?: string };

interface UIQuestion {
    id?: number | string;
    text?: string;
    type?: UIQuestionType;
    options?: OptionItem[];
}

interface UISurvey {
    id?: number | string;
    name?: string;
    createdDate?: string | Date;
    created_at?: string | Date;  // por si el backend lo manda así
    createdAt?: string | Date;   // variante
    questions?: UIQuestion[];
}

interface SurveyDetailsModalProps {
    survey: UISurvey | null;
    isOpen: boolean;
    onClose: () => void;
}

function getQuestionTypeLabel(type?: UIQuestionType) {
    switch (type) {
        case "multiple_choice":
        case "MUL":
            return "Opción múltiple";
        case "radio_button":
        case "RAD":
            return "Selección única";
        case "yes_no":
        case "Y/N":
            return "Sí/No";
        case "text":
        case "TXT":
            return "Texto libre";
        default:
            return String(type ?? "");
    }
}

function getOptionLabel(opt: OptionItem): string {
    if (typeof opt === "string") return opt;
    if (opt && typeof opt === "object") return opt.value ?? "";
    return "";
}

export function SurveyDetailsModal({ survey, isOpen, onClose }: SurveyDetailsModalProps) {
    if (!isOpen || !survey) return null;

    const created =
        survey.createdDate ?? survey.created_at ?? survey.createdAt ?? null;
    const createdLabel = created
        ? new Date(created).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
        : "—";

    const questions = Array.isArray(survey.questions) ? survey.questions : [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[96vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Detalles de la Encuesta</h2>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-6">
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h3 className="text-lg font-semibold text-purple-800 mb-2">{survey.name ?? "—"}</h3>
                            <div className="text-sm text-purple-600">
                                <p>
                                    <strong>Fecha de creación:</strong> {createdLabel}
                                </p>
                                <p>
                                    <strong>Total de preguntas:</strong> {questions.length}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Preguntas de la Encuesta</h4>

                            {questions.length > 0 ? (
                                <div className="space-y-4">
                                    {questions.map((question, index) => {
                                        const opts = Array.isArray(question.options) ? question.options : [];
                                        const isText = question.type === "text" || question.type === "TXT";

                                        return (
                                            <div key={String(question.id ?? index)} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-medium text-gray-900">Pregunta {index + 1}</h5>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                              {getQuestionTypeLabel(question.type)}
                            </span>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3">
                                                    <p className="text-gray-900 mb-3 font-medium">{question.text ?? "—"}</p>

                                                    {opts.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700 mb-2">Opciones de respuesta:</p>
                                                            <ul className="space-y-1">
                                                                {opts.map((option, optionIndex) => (
                                                                    <li key={String(optionIndex)} className="flex items-center text-sm text-gray-600">
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-violet-100 text-violet-600 rounded-full text-xs font-medium mr-2">
                                      {optionIndex + 1}
                                    </span>
                                                                        {getOptionLabel(option)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {isText && (
                                                        <p className="text-sm text-gray-500 italic">
                                                            Los usuarios pueden escribir su respuesta libremente.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Esta encuesta no tiene preguntas configuradas.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 pt-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="inline-flex items-center px-4 py-2 mb-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
