// components/registeruser/RegisterUser.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { POSTCrontol } from "@/actions/feature/control-action";
import { POSTCrontolStand } from "@/actions/feature/control-stand-action";
import { POSTCrontolDeliverables } from "@/actions/feature/control-deliverables-action";
import { POSTattendeeByEmail } from "@/actions/survey/survey-action";

interface Props {
    activity?: Actividad | null;
    stand?: any;
    deliverable?: any;
    atvId?: number | null;
    stdId?: number | null;
    delivId?: number | null;
}

type Actividad = {
    activity_name?: string;
    event_name?: string;
    survey_id?: number;
    error?: string;
};

interface FormErrors {
    formError?: string;
    [key: string]: string | undefined;
}

type Ctx = "activity" | "stand" | "deliverables";

type SurveyPromptState = {
    open: boolean;
    message: string;
    surveyUrl?: string;
    attendeeName?: string;
};

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Reemplaza parseAttPayload por esta versión fuerte:
function parseAttFromText(text: string): { attendeeId: number; eventId?: number } | null {
    const parts = text.trim().split("|");
    if (!parts.length || parts[0].toUpperCase() !== "ATT") return null;

    const attendeeId = Number(parts[1]);
    const eventId = Number(parts[2]); // opcional: úsalo solo si tu backend lo pide

    if (!Number.isFinite(attendeeId)) return null;
    return {
        attendeeId,
        eventId: Number.isFinite(eventId) ? eventId : undefined,
    };
}

export default function RegisterUser({ activity, stand, deliverable, atvId, stdId, delivId }: Props) {

    // Contexto desde props (se usa en UI y en registro)
    const ctx: Ctx =
        atvId ? "activity" : stdId ? "stand" : delivId ? "deliverables" : "activity";

    // UI feedback
    const [error, setError] = useState<FormErrors>({});
    const [surveyPrompt, setSurveyPrompt] = useState<SurveyPromptState | null>(null);

    // Escáner
    const [running, setRunning] = useState(false);
    const [scanMsg, setScanMsg] = useState<string | null>(null);
    const [processingQr, setProcessingQr] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    // Email manual (UI)
    const [email, setEmail] = useState("");
    const [errorManualForm, setErrorManualForm] = useState<FormErrors>({})

    // URL de encuesta (construcción se mantiene igual)
    const buildSurveyUrl = ({
        surveyId,
        ctx,
        atv,
        std,
        deliv,
        attendee,
    }: {
        surveyId: number | string;
        ctx: Ctx;
        atv?: number;
        std?: number;
        deliv?: number;
        attendee: number;
    }) => {
        const origin =
            (typeof window !== "undefined" && window.location?.origin) || "";
        const base = origin || "";
        let query = "";
        if (ctx === "activity" && atv) query = `atv=${atv}&att=${attendee}`;
        if (ctx === "stand" && std) query = `std=${std}&att=${attendee}`;
        if (ctx === "deliverables" && deliv) query = `deliv=${deliv}&att=${attendee}`;
        return `${base}/register/encuesta/${surveyId}?${query}`;
    };

    // ---------- Escáner ----------
    const pickBackCamera = (devices: MediaDeviceInfo[]) => {
        const byLabel = devices.find((d) =>
            /back|rear|environment|trás|tras|atras/i.test(d.label)
        );
        return byLabel?.deviceId || devices[0]?.deviceId;
    };

    const stopScanner = useCallback(() => {
        try {
            controlsRef.current?.stop();
        } catch { }
        controlsRef.current = null;
        setRunning(false);
        setProcessingQr(false);
    }, []);

    const startScanner = useCallback(async () => {
        if (running || controlsRef.current) return;
        setError({});
        setSurveyPrompt(null);
        setScanMsg("Activando cámara…");
        setProcessingQr(false);

        const reader = new BrowserMultiFormatReader();
        try {
            const devices = await BrowserMultiFormatReader.listVideoInputDevices();
            if (!devices.length) throw new Error("No se encontraron cámaras (revisa permisos del navegador).");
            const preferred = pickBackCamera(devices);
            setRunning(true);
            setScanMsg("Cámara activa. Apunta al QR…");

            const controls = await reader.decodeFromVideoDevice(
                preferred,
                videoRef.current!,
                async (result: any) => {
                    if (!result || processingQr) return;

                    setProcessingQr(true);
                    setScanMsg("Leyendo QR…");

                    const rawText: string = result.text ?? result.getText?.() ?? "";
                    // 1) Parse ATT|id|eventId|...
                    const att = parseAttFromText(rawText);

                    // Si no cumple el formato ATT → seguimos leyendo (o loguea para depurar)
                    if (!att) {
                        setProcessingQr(false);
                        setScanMsg("QR leído sin datos válidos. Continúa apuntando…");
                        return;
                    }

                    try {
                        if (atvId) {
                            setScanMsg("Procesando QR… ⏳");
                            const res = await POSTCrontol({
                                activity_id: Number(atvId),
                                attendee_id: att.attendeeId,
                                event_id: att.eventId,
                            } as any);

                            // console.log("POSTCrontol", res);

                            setProcessingQr(false);
                            // setScanMsg(null);

                            if (res.ok === false && res.status !== 400) {
                                const msg =
                                    `Error ${res.status}: ${res.statusText || "desconocido"
                                    } - ${res.result || "No se pudo registrar."}`;
                                throw new Error(msg);
                            }

                            if (res.ok === false && res.status === 400 && activity?.survey_id) {
                                setScanMsg(null);
                                const surveyUrl = buildSurveyUrl({
                                    surveyId: activity.survey_id,
                                    ctx: "activity",
                                    atv: Number(atvId),
                                    attendee: att.attendeeId,
                                });
                                setSurveyPrompt({
                                    open: true,
                                    message: "¡Ya estás registrado!",
                                    surveyUrl,
                                    attendeeName: "", // opcional, si tienes nombre del asistente
                                });
                                return;
                            }

                            if (res.ok === true && res.status === 201 && activity?.survey_id) {
                                setScanMsg(null);
                                const surveyUrl = buildSurveyUrl({
                                    surveyId: activity.survey_id,
                                    ctx: "activity",
                                    atv: Number(atvId),
                                    attendee: att.attendeeId,
                                });
                                setSurveyPrompt({
                                    open: true,
                                    message: "¡Registro guardado con éxito!",
                                    surveyUrl,
                                    attendeeName: "", // opcional, si tienes nombre del asistente
                                });
                                return;
                            }


                            setScanMsg("¡Registro guardado con éxito!");
                        } else {
                            setProcessingQr(false);
                            // por si alguien abre esta pantalla sin atvId
                            throw new Error("Falta el id de la actividad (atvId).");
                        }

                        // UI éxito
                        // Si tienes encuesta:
                        // const surveyId = activity?.survey_id;
                        // if (surveyId) {
                        //   const surveyUrl = buildSurveyUrl({
                        //     surveyId,
                        //     ctx: "activity",
                        //     atv: Number(atvId),
                        //     attendee: att.attendeeId,
                        //   });
                        //   setSurveyPrompt({ open: true, message: "¡Registro guardado con éxito!", surveyUrl });
                        // }

                    } catch (e: any) {
                        const msg = String(e?.message || "No se pudo registrar.");
                        setError({ formError: msg });
                        setScanMsg(null);
                    } finally {
                        setProcessingQr(false);
                        stopScanner(); // UX móvil: cerramos cámara tras registrar
                        setTimeout(() => setScanMsg(null), 5000); // limpiar msg tras un tiempo
                    }
                }
            );
            controlsRef.current = controls;
        } catch (e: any) {
            const m = String(e?.message || e || "");
            setError({
                formError: /permission|notallowed|denied/i.test(m)
                    ? "Permiso de cámara denegado. Actívalo en el navegador y recarga."
                    : m || "No se pudo activar la cámara.",
            });
            setScanMsg(null);
            setRunning(false);
        }
    }, [
        running,
        processingQr,
        ctx,
        atvId,
        stdId,
        delivId,
        activity?.survey_id,
        stopScanner,
    ]);

    // Submit manual
    const onSubmitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorManualForm({})
        setScanMsg(null)

        const res = await POSTattendeeByEmail(email, Number(atvId))
        // await registerAttendance({ email, attendeeId: data.attendee_id });
        console.log(res)
        if (res.ok === false && 'error' in res) {
            setErrorManualForm({ formError: res.error });
            return;
        }
        if (res.ok === true && 'data' in res) {
            setScanMsg("¡Registro guardado con éxito!")
            const surveyUrl = buildSurveyUrl({
                surveyId: activity?.survey_id ?? 0,
                ctx: "activity",
                atv: Number(atvId),
                attendee: res.data.attendee_id,
            });
            setSurveyPrompt({
                open: true,
                message: "¡Registro guardado con éxito!",
                surveyUrl,
                attendeeName: "", // opcional, si tienes nombre del asistente
            });
            return;
        }


        // if (atvId) {
        //     setScanMsg("Procesando QR… ⏳");
        //     const res = await POSTCrontol({
        //         activity_id: Number(atvId),
        //         attendee_id: att.attendeeId,
        //         event_id: att.eventId,
        //     } as any);

        //     // console.log("POSTCrontol", res);

        //     setProcessingQr(false);
        //     // setScanMsg(null);

        //     if (res.ok === false && res.status !== 400) {
        //         const msg =
        //             `Error ${res.status}: ${res.statusText || "desconocido"
        //             } - ${res.result || "No se pudo registrar."}`;
        //         throw new Error(msg);
        //     }

        //     if (res.ok === false && res.status === 400 && activity?.survey_id) {
        //         setScanMsg(null);
        //         const surveyUrl = buildSurveyUrl({
        //             surveyId: activity.survey_id,
        //             ctx: "activity",
        //             atv: Number(atvId),
        //             attendee: att.attendeeId,
        //         });
        //         setSurveyPrompt({
        //             open: true,
        //             message: "¡Ya estás registrado!",
        //             surveyUrl,
        //             attendeeName: "", // opcional, si tienes nombre del asistente
        //         });
        //         return;
        //     }

        //     if (res.ok === true && res.status === 201 && activity?.survey_id) {
        //         setScanMsg(null);
        //         const surveyUrl = buildSurveyUrl({
        //             surveyId: activity.survey_id,
        //             ctx: "activity",
        //             atv: Number(atvId),
        //             attendee: att.attendeeId,
        //         });
        //         setSurveyPrompt({
        //             open: true,
        //             message: "¡Registro guardado con éxito!",
        //             surveyUrl,
        //             attendeeName: "", // opcional, si tienes nombre del asistente
        //         });
        //         return;
        //     }


        //     setScanMsg("¡Registro guardado con éxito!");
        // }
    };

    // Limpieza al desmontar
    useEffect(() => () => stopScanner(), [stopScanner]);

    // Pausar si pestaña no visible (evita locks en iOS y ahorra batería)
    useEffect(() => {
        const onVis = () => {
            if (document.hidden) stopScanner();
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, [stopScanner]);

    // Survey prompt handlers (mantengo tu API)
    const closeSurveyPrompt = () => setSurveyPrompt(null);
    const goToSurvey = () => {
        if (surveyPrompt?.surveyUrl) {
            window.location.href = surveyPrompt.surveyUrl;
        }
    };

    // Manejo de errores desde props de entrada
    useEffect(() => {
        if (stdId && stand?.error) {
            setError({ formError: stand.error });
        }
        if (atvId && activity?.error) {
            setError({ formError: activity.error });
        }
        if (delivId && deliverable?.error) {
            setError({ formError: deliverable.error });
        }
    }, [activity, stand, deliverable, stdId, atvId, delivId]);

    return (
        <main className="min-h-dvh bg-gradient-to-b from-white via-indigo-50/50 to-white text-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-indigo-100">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                                {atvId && activity
                                    ? activity.activity_name
                                    : stdId && stand
                                        ? stand.stand_name
                                        : delivId && deliverable
                                            ? deliverable.entregable_name ??
                                            deliverable.deliverable_name ??
                                            deliverable.name ??
                                            "Registro"
                                            : "Registro"}
                            </h1>
                            <p className="text-sm text-slate-600">
                                {atvId && activity
                                    ? activity.event_name
                                    : stdId && stand
                                        ? stand.event_name
                                        : delivId && deliverable
                                            ? deliverable.event_name
                                            : "Gestión de asistencias"}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            {ctx === "activity"
                                ? "Actividad"
                                : ctx === "stand"
                                    ? "Stand"
                                    : "Entregable"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-4 flex justify-center">
                <div className="max-w-md gap-6 p-4 sm:p-6">
                    {/* Section Errors */}
                    <div>
                        {error.formError && (
                            <div className="mb-4 rounded-lg bg-red-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-red-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            ></path>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{error.formError}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {scanMsg && (
                            <div className="mb-4 rounded-lg bg-blue-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-blue-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            ></path>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Info</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>{scanMsg}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        {/* ALERTA SUPERIOR con botones (Encuesta / Cancelar) */}
                        {surveyPrompt?.open && (
                            <div
                                style={{
                                    width: "w-full",    // grande y responsivo
                                    maxHeight: "90dvh",           // usa dvh para móviles modernos
                                    overflowY: "auto",
                                    borderRadius: 16,
                                    border: "1px solid #E9D5FF",
                                    background: "#FAF5FF",
                                    padding: 24,
                                    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                                    boxSizing: "border-box"
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ fontWeight: 700, color: "#6D28D9", fontSize: 16 }}>
                                        {surveyPrompt.message}
                                    </div>
                                    {surveyPrompt.attendeeName && (
                                        <div style={{ color: "#4B5563", fontSize: 14 }}>
                                            Asistente: <strong>{surveyPrompt.attendeeName}</strong>
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                        {surveyPrompt.surveyUrl && (
                                            <button
                                                type="button"
                                                onClick={goToSurvey}
                                                className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                            >
                                                Ir a la encuesta
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={closeSurveyPrompt}
                                            className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Columna: QR */}
                    {!error.formError && (
                        <div className="space-y-3">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs">
                                    QR
                                </span>
                                Leer QR (
                                {ctx === "activity"
                                    ? "Actividad"
                                    : ctx === "stand"
                                        ? "Stand"
                                        : "Entregable"}
                                )
                            </h2>

                            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3">
                                {/* Vista previa cámara */}
                                <div className="aspect-video w-full rounded-xl bg-white shadow-inner border border-indigo-100 overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className={`h-full w-full object-cover ${!running ? "opacity-30" : "opacity-100"
                                            }`}
                                    />
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    {!running ? (
                                        <button
                                            type="button"
                                            onClick={startScanner}
                                            className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        >
                                            Activar cámara
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={stopScanner}
                                            className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                        >
                                            Detener
                                        </button>
                                    )}
                                </div>

                                {/* Mensajes/estado */}
                                {scanMsg ? (
                                    <p className="mt-2 text-sm text-slate-600">{scanMsg}</p>
                                ) : (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Escanea el QR del asistente para registrar asistencia
                                        automáticamente.
                                    </p>
                                )}
                            </div>

                            {/* Columna: Registro manual (igual que lo tenías) */}
                            <div className="space-y-3">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs">
                                        @
                                    </span>
                                    Registro manual
                                </h2>

                                <div>
                                    {errorManualForm.formError && (
                                        <div className="mb-4 rounded-lg bg-red-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-red-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                        ></path>
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                                    <div className="mt-2 text-sm text-red-700">
                                                        <p>{errorManualForm.formError}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {scanMsg && (
                                        <div className="mb-4 rounded-lg bg-blue-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-blue-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                        ></path>
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-blue-800">Info</h3>
                                                    <div className="mt-2 text-sm text-blue-700">
                                                        <p>{scanMsg}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form
                                    className="rounded-2xl border border-violet-200 bg-violet-50/30 p-4 sm:p-5"
                                    onSubmit={onSubmitManual}
                                >
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Correo del asistente
                                    </label>
                                    <div className="mt-2 relative">
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nombre@correo.com"
                                            className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-300"
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">
                                                Tipo
                                            </label>
                                            <div className="mt-2 flex gap-2">
                                                <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
                                                    {ctx === "activity"
                                                        ? "Actividad"
                                                        : ctx === "stand"
                                                            ? "Stand"
                                                            : "Entregable"}
                                                </span>
                                                {/* <span className="text-xs text-slate-500 self-center">
                                                    (desde props)
                                                </span> */}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">
                                                Referencia
                                            </label>
                                            <input
                                                type="text"
                                                disabled
                                                value={
                                                    (ctx === "activity" && atvId) ||
                                                    (ctx === "stand" && stdId) ||
                                                    (ctx === "deliverables" && delivId) ||
                                                    ""
                                                }
                                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-300"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="cursor-pointer mt-5 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    >
                                        Registrar asistencia
                                    </button>

                                    <p className="mt-2 text-xs text-slate-500">
                                        Se enviará un correo de confirmación al asistente con el
                                        detalle del registro.
                                    </p>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Footer ligero */}
                    <div className="mt-6 text-center text-xs text-slate-500">
                        © {new Date().getFullYear()} ALIATIC SAS — Módulo de registro
                    </div>
                </div>
            </section>
        </main>
    );
}