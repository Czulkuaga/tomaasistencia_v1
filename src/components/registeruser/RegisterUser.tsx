// components/registeruser/RegisterUser.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCookie } from "cookies-next";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { POSTCrontol } from "@/actions/feature/control-action";
import { POSTCrontolStand } from "@/actions/feature/control-stand-action";
import { POSTCrontolDeliverables } from "@/actions/feature/control-deliverables-action";
import { POSTattendeeByEmail } from "@/actions/survey/survey-action";
import { GETActivityPublic } from "@/actions/feature/activity-action";
import { GETStandPublic } from "@/actions/feature/stands-action";
import { GETDeliverablesPublic } from "@/actions/feature/deliverables-action";

import estilo from "./RegisterUser.module.css";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const asUrl = (t: string) => { try { return new URL(t); } catch { return null; } };

// QR URL → params
function parseFromUrl(u: URL) {
    const atv = u.searchParams.get("atv") || undefined;
    const std = u.searchParams.get("std") || undefined;
    const deliv = u.searchParams.get("deliv") || undefined;
    const email = u.searchParams.get("email") || undefined;
    const att =
        u.searchParams.get("att") ||
        u.searchParams.get("attendee_id") ||
        u.searchParams.get("id") ||
        undefined;

    return {
        atv: atv ? Number(atv) : undefined,
        std: std ? Number(std) : undefined,
        deliv: deliv ? Number(deliv) : undefined,
        email: email || undefined,
        attendeeId: att && Number.isFinite(Number(att)) ? Number(att) : undefined,
        activityTitle: u.searchParams.get("activity") || undefined,
        eventTitle: u.searchParams.get("event") || undefined,
    };
}

// de texto: "ATT|<id>|<email?>"
function parseAttPayload(text: string) {
    const p = text.split("|");
    if ((p[0] || "").toUpperCase() !== "ATT") return { attendeeId: undefined, email: undefined };
    const id = Number(p[1]);
    return {
        attendeeId: Number.isFinite(id) ? id : undefined,
        email: p[2] ? String(p[2]) : undefined,
    };
}

type Ctx = "activity" | "stand" | "deliverables";

type SurveyPromptState = {
    open: boolean;
    message: string;           // "¡Registro guardado con éxito!" o "Ya se encuentra registrado."
    surveyUrl?: string;        // si hay id_survey
    attendeeName?: string;     // opcional, para mostrar
};

export default function RegisterUser() {
    const searchParams = useSearchParams();

    // Contextos
    const [actId, setActId] = useState<number | undefined>(undefined);
    const [standId, setStandId] = useState<number | undefined>(undefined);
    const [entregableId, setEntregableId] = useState<number | undefined>(undefined);
    const [ctx, setCtx] = useState<Ctx>("activity");

    // Nombres
    const [activityName, setActivityName] = useState<string | undefined>(undefined);
    const [standName, setStandName] = useState<string | undefined>(undefined);
    const [entregableName, setEntregableName] = useState<string | undefined>(undefined);
    const [eventName, setEventName] = useState<string | undefined>(undefined);
    const [eventId, setEventId] = useState<number | undefined>(undefined);

    // UI feedback actual (mensajes legacy en tarjetas)
    const [msg, setMsg] = useState<string | null>(null);
    const [msgKind, setMsgKind] = useState<"success" | "already" | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    // NUEVO: alerta superior con botón "Encuesta" / "Cancelar"
    const [surveyPrompt, setSurveyPrompt] = useState<SurveyPromptState | null>(null);

    // Error parámetros
    const [paramError, setParamError] = useState<string | null>(null);

    // Escáner
    const [running, setRunning] = useState(false);
    const [scanMsg, setScanMsg] = useState<string | null>(null);
    const [processingQr, setProcessingQr] = useState(false);
    const [surveyId, setSurveyId] = useState<number | undefined>(undefined);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    // Email manual
    const [email, setEmail] = useState("");

    // Utilidad: construir URL de encuesta
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
        const base = origin || ""; // si no hay origin, dejamos la URL relativa

        let query = "";
        if (ctx === "activity" && atv) query = `atv=${atv}&att=${attendee}`;
        if (ctx === "stand" && std) query = `std=${std}&att=${attendee}`;
        if (ctx === "deliverables" && deliv) query = `deliv=${deliv}&att=${attendee}`;

        return `${base}/register/encuesta/${surveyId}?${query}`;
    };

    // Lee parámetros (?atv | ?std | ?deliv)
    useEffect(() => {
        const activity = searchParams.get("atv");
        const stands = searchParams.get("std");
        const entregable = searchParams.get("deliv");

        if (activity) setActId(Number(activity));
        if (stands) setStandId(Number(stands));
        if (entregable) setEntregableId(Number(entregable));

        const hasAtv = !!activity;
        const hasStd = !!stands;
        const hasDeliv = !!entregable;
        const count = [hasAtv, hasStd, hasDeliv].filter(Boolean).length;

        if (count > 1) {
            setParamError("Los parametros estan mal por favor revisa.");
        } else {
            setParamError(null);
            if (hasDeliv) setCtx("deliverables");
            else if (hasStd) setCtx("stand");
            else if (hasAtv) setCtx("activity");
        }

        const aName = searchParams.get("activity") || undefined;
        const eName = searchParams.get("event") || undefined;
        if (aName) setActivityName(prev => prev ?? aName);
        if (eName) setEventName(prev => prev ?? eName);
    }, [searchParams]);

    // Carga info de actividad
    useEffect(() => {
        if (!actId) return;
        (async () => {
            try {
                const res = await GETActivityPublic(actId);
                if (res?.activity_name) setActivityName(res.activity_name);
                if (res?.event_name) setEventName(res.event_name);
                if (res?.survey_id) setSurveyId(Number(res.survey_id));
                if (Number.isFinite(Number(res?.event_id))) setEventId(Number(res.event_id));
            } catch (e) {
                console.error("GETActivityPublic error:", e);
            }
        })();
    }, [actId]);

    // Carga info de stand
    useEffect(() => {
        if (!standId) return;
        (async () => {
            try {
                const res = await GETStandPublic(standId);
                if (res?.stand_name) setStandName(res.stand_name);
                if (res?.event_name) setEventName(res.event_name);
                if (res?.survey_id) setSurveyId(Number(res.survey_id));
                if (Number.isFinite(Number(res?.event_id))) setEventId(Number(res.event_id));
            } catch (e) {
                console.error("GETStandPublic error:", e);
            }
        })();
    }, [standId]);

    // Carga info de entregable
    useEffect(() => {
        if (!entregableId) return;
        (async () => {
            try {
                const r = await GETDeliverablesPublic(entregableId);
                const name = r?.entregable_name ?? r?.deliverable_name ?? r?.name;
                if (name) setEntregableName(name);
                if (r?.event_name) setEventName(r.event_name);
                if (r?.survey_id) setSurveyId(Number(r.survey_id));
                if (Number.isFinite(Number(r?.event_id))) setEventId(Number(r.event_id));
            } catch (e) {
                console.error("GETDeliverablesPublic error:", e);
            }
        })();
    }, [entregableId]);

    // Escanear QR
    async function startScanner() {
        setErr(null); setMsg(null); setMsgKind(null);
        setSurveyPrompt(null);
        setScanMsg("Cámara activa. Apunta al QR…");
        setProcessingQr(false);

        if (running || controlsRef.current) return;
        setRunning(true);

        const reader = new BrowserMultiFormatReader();
        try {
            const devices = await BrowserMultiFormatReader.listVideoInputDevices();
            if (!devices.length) throw new Error("No se encontraron cámaras (revisa permisos del navegador).");
            const back = devices.find(d => /back|rear|environment|trás|tras|atras/i.test(d.label));
            const preferred = back?.deviceId || devices[0]?.deviceId;

            const controls = await reader.decodeFromVideoDevice(preferred, videoRef.current!, async (result: any) => {
                if (!result || processingQr) return;

                setProcessingQr(true);
                const raw: string = result.getText();
                setScanMsg("Leyendo QR…");

                let nextActId: number | undefined;
                let nextStandId: number | undefined;
                let nextDelivId: number | undefined;
                let attendeeIdFromQR: number | undefined;
                let emailFromQR: string | undefined;

                const url = asUrl(raw);
                if (url) {
                    const parsed = parseFromUrl(url);
                    nextActId = parsed.atv;
                    nextStandId = parsed.std;
                    nextDelivId = parsed.deliv;
                    attendeeIdFromQR = parsed.attendeeId;
                    emailFromQR = parsed.email || undefined;

                    if (parsed.activityTitle) setActivityName(parsed.activityTitle);
                    if (parsed.eventTitle) setEventName(parsed.eventTitle);

                    if (nextActId) {
                        setActId(nextActId);
                        try {
                            const r = await GETActivityPublic(nextActId);
                            if (r?.activity_name) setActivityName(r.activity_name);
                            if (r?.event_name) setEventName(r.event_name);
                            if (Number.isFinite(Number(r?.event_id))) setEventId(Number(r.event_id));
                        } catch { }
                    }

                    if (nextStandId) {
                        setStandId(nextStandId);
                        try {
                            const r = await GETStandPublic(nextStandId);
                            if (r?.stand_name) setStandName(r.stand_name);
                            if (r?.event_name) setEventName(r.event_name);
                            if (Number.isFinite(Number(r?.event_id))) setEventId(Number(r.event_id));
                        } catch { }
                    }

                    if (nextDelivId) {
                        setEntregableId(nextDelivId);
                        try {
                            const r = await GETDeliverablesPublic(nextDelivId);
                            const name = r?.entregable_name ?? r?.deliverable_name ?? r?.name;
                            if (name) setEntregableName(name);
                            if (r?.event_name) setEventName(r.event_name);
                            if (Number.isFinite(Number(r?.event_id))) setEventId(Number(r.event_id));
                        } catch { }
                    }

                    if (nextStandId && !nextActId) setCtx("stand");
                    if (nextActId && !nextStandId) setCtx("activity");
                    if (nextDelivId) setCtx("deliverables");
                } else {
                    const attPayload = parseAttPayload(raw);
                    attendeeIdFromQR = attPayload.attendeeId ?? attendeeIdFromQR;
                    emailFromQR = attPayload.email ?? emailFromQR;
                    if (!attendeeIdFromQR && !emailFromQR && EMAIL_RE.test(raw.trim())) {
                        emailFromQR = raw.trim();
                    }
                }

                // solo contexto sin id/email → seguir leyendo
                if (!attendeeIdFromQR && !emailFromQR) {
                    setProcessingQr(false);
                    setScanMsg(nextStandId ? "QR de stand leído." : "QR de actividad leído.");
                    return;
                }

                setScanMsg("Procesando QR… ⏳");
                await registerAttendance({ attendeeId: attendeeIdFromQR, email: emailFromQR });

                setProcessingQr(false);
                stopScanner();
                setScanMsg(null);
            });

            controlsRef.current = controls;
        } catch (e: any) {
            const m = String(e?.message || e || "");
            setErr(/permission|notallowed|denied/i.test(m)
                ? "Permiso de cámara denegado. Actívalo en el navegador y recarga."
                : m || "No se pudo activar la cámara."
            );
            setScanMsg(null);
            setRunning(false);
        }
    }

    function stopScanner() {
        try { controlsRef.current?.stop(); } catch { }
        controlsRef.current = null;
        setRunning(false);
    }
    useEffect(() => () => stopScanner(), []);

    // Registro (manual o QR)
    async function registerAttendance(opts: { email?: string; attendeeId?: number }) {
        if (paramError) { setErr(paramError); return; }
        if (ctx === "activity" && !actId) { setErr("Falta la actividad (?atv)."); return; }
        if (ctx === "stand" && !standId) { setErr("Falta el stand (?std)."); return; }
        if (ctx === "deliverables" && !entregableId) { setErr("Falta el entregable (?deliv)."); return; }

        const emailOk = (opts.email || "").trim().toLowerCase();
        const token = (getCookie("authToken") as string) || "";
        if (!opts.attendeeId && !EMAIL_RE.test(emailOk)) {
            setErr("Ingresa un correo válido o un id de asistente.");
            return;
        }

        try {
            setSending(true);
            setErr(null); setMsg(null); setMsgKind(null);
            setSurveyPrompt(null);

            let res: any;

            if (ctx === "stand") {
                // asegurar event_id local antes de enviar
                let evId = eventId;
                if (!Number.isFinite(Number(evId)) && standId) {
                    try {
                        const r = await GETStandPublic(standId);
                        const maybe = Number(r?.event_id);
                        if (Number.isFinite(maybe)) {
                            evId = maybe;
                            setEventId(maybe);
                        }
                    } catch { }
                }

                res = await POSTCrontolStand({
                    
                    stand_id: Number(standId),token,
                    event_id: Number(evId),
                    ...(opts.attendeeId
                        ? { attendee_id: opts.attendeeId }
                        : { attendee_email: emailOk }),
                } as any);

            } else if (ctx === "deliverables") {
                res = await POSTCrontolDeliverables({
                    deliverable_id: Number(entregableId),token,
                    ...(opts.attendeeId
                        ? { attendee_id: opts.attendeeId }
                        : { attendee_email: emailOk }),
                } as any);

            } else {
                res = await POSTCrontol({
                    activity_id: Number(actId),token,
                    ...(opts.attendeeId
                        ? { attendee_id: opts.attendeeId }
                        : { attendee_email: emailOk }),
                } as any);
            }

            const code = res?.code ?? res?.error_code ?? res?.statusCode;
            const text = `${res?.message ?? ""} ${res?.error ?? ""}`.toLowerCase();
            const duplicate =
                res?.already === true ||
                code === 409 ||
                code === "DUPLICATE" ||
                code === "ALREADY_REGISTERED" ||
                /ya se encuentra registrado|ya esta registrado|already|duplicate/.test(text) ||
                (Array.isArray(res?.non_field_errors) && res.non_field_errors.some((s: string) => /unique/i.test(s)));

            // Extra: ids para armar URL de encuesta
            const attendeeIdFromRes: number | undefined =
                Number.isFinite(Number(res?.attendee)) ? Number(res.attendee) : opts.attendeeId;

            const id_survey: number | undefined =
                Number.isFinite(Number(res?.id_survey)) ? Number(res.id_survey) : undefined;

            // Determinar id_value (según contexto y shape que devuelva backend)
            const id_value =
                ctx === "activity"
                    ? (Number.isFinite(Number(res?.activity)) ? Number(res.activity) :
                        Number.isFinite(Number(res?.activity_id)) ? Number(res.activity_id) : actId)
                    : ctx === "stand"
                        ? (Number.isFinite(Number(res?.stand)) ? Number(res.stand) :
                            Number.isFinite(Number(res?.stand_id)) ? Number(res.stand_id) : standId)
                        : (Number.isFinite(Number(res?.deliverable)) ? Number(res.deliverable) :
                            Number.isFinite(Number(res?.deliverable_id)) ? Number(res.deliverable_id) : entregableId);

            const surveyUrl =
                surveyId && attendeeIdFromRes && id_value
                    ? buildSurveyUrl({
                        surveyId,
                        ctx,
                        atv: ctx === "activity" ? id_value : undefined,
                        std: ctx === "stand" ? id_value : undefined,
                        deliv: ctx === "deliverables" ? id_value : undefined,
                        attendee: attendeeIdFromRes,
                    })
                    : undefined;

            // UI según duplicado o éxito
            if (duplicate) {
                setErr(null);
                setMsg("Ya se encuentra registrado.");
                setMsgKind("already");

                // Mostrar alerta con botón de encuesta si trae survey
                setSurveyPrompt({
                    open: true,
                    message: "Ya se encuentra registrado.",
                    surveyUrl,
                    attendeeName: res?.attendee_name,
                });
                setEmail("");
                return;
            }

            if (res && typeof res === "object" && "error" in res && res.error) {
                throw new Error(String(res.error));
            }

            setErr(null);
            setMsg("¡Registro guardado con éxito!");
            setMsgKind("success");

            // Mostrar alerta con botón de encuesta si aplica
            setSurveyPrompt({
                open: true,
                message: "¡Registro guardado con éxito!",
                surveyUrl,
                attendeeName: res?.attendee_name,
            });

            setEmail("");
        } catch (e: any) {
            const t = String(e?.message || "").toLowerCase();
            if (t.includes("409") || t.includes("already") || t.includes("duplic") || /unique/.test(t)) {
                setErr(null);
                setMsg("Ya se encuentra registrado.");
                setMsgKind("already");
                setSurveyPrompt({
                    open: true,
                    message: "Ya se encuentra registrado.",
                    surveyUrl: undefined,
                });
            } else {
                setMsgKind(null);
                setErr(String(e?.message || "No se pudo registrar."));
            }
        } finally {
            setSending(false);
        }
    }

    // Submit manual
    const onSubmitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = await POSTattendeeByEmail(email, Number(actId))
        await registerAttendance({ email, attendeeId: data.attendee_id});
    };

    // Encabezado
    const displayEvent = eventName ?? (eventId ? `Evento ${eventId}` : "—");
    const displayContext =
        ctx === "stand"
            ? (standName ?? (standId ? `Stand ${standId}` : "—"))
            : ctx === "deliverables"
                ? (entregableName ?? (entregableId ? `Entregable ${entregableId}` : "—"))
                : (activityName ?? (actId ? `Actividad ${actId}` : "—"));

    // Handlers alerta de encuesta
    const closeSurveyPrompt = () => setSurveyPrompt(null);
    const goToSurvey = () => {
        if (surveyPrompt?.surveyUrl) {
            window.location.href = surveyPrompt.surveyUrl;
        }
    };

    return (
        <div className={estilo.container}>
            <h1 className={estilo.pageTitle}>
                <span className={estilo.eventText}>{displayEvent}</span>
                <span className={`${estilo.contextText} ${estilo[ctx]}`}>
                    {displayContext}
                </span>
            </h1>

            {/* ALERTA SUPERIOR con botones (Encuesta / Cancelar) */}
            {surveyPrompt?.open && (
                <div
                    style={{
                        width: "min(960px, 96vw)",    // grande y responsivo
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
                                    className={estilo.btnencuesta}
                                >
                                    Ir a la encuesta
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={closeSurveyPrompt}
                                className={estilo.btnGhost}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paramError && <div className={estilo.alertError}>{paramError}</div>}
            {msg && <div className={msgKind === "already" ? estilo.alertAlready : estilo.alertSuccess}>{msg}</div>}
            {err && <div className={estilo.alertError}>{err}</div>}

            <div className={estilo.card}>
                {/* Fila: título + botón */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 10 }}>
                    <div className={estilo.sectionTitle} style={{ margin: 0 }}>
                        {ctx === "stand" ? "Leer QR (Asistente)"
                            : ctx === "deliverables" ? "Leer QR (Asistente)"
                                : "Leer QR (Asistente)"}
                    </div>

                    {!running ? (
                        <button
                            type="button"
                            onClick={startScanner}
                            disabled={sending}
                            className={estilo.btn}
                            style={{ marginLeft: 12 }}
                        >
                            Activar cámara
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={stopScanner}
                            className={estilo.btnGhost}
                            style={{ marginLeft: 12 }}
                        >
                            Detener
                        </button>
                    )}
                </div>

                {/* Abajo: mensaje + video */}
                {scanMsg && <div className={estilo.scanMsg}>{scanMsg}</div>}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`${estilo.video} ${!running ? estilo.videoHidden : ""}`}
                />
            </div>

            <div className={estilo.card}>
                <div className={estilo.sectionTitle}>
                    {ctx === "stand" ? "Registro manual"
                        : ctx === "deliverables" ? "Información del entregable"
                            : "Registro manual"}
                </div>
                <form onSubmit={onSubmitManual} className={estilo.formGrid}>
                    <input
                        type="email"
                        placeholder="Correo del asistente"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={
                            Boolean(paramError)
                            || (ctx === "activity" && !actId)
                            || (ctx === "stand" && !standId)
                            || (ctx === "deliverables" && !entregableId)
                            || sending
                        }
                        className={estilo.input}
                    />
                    <button
                        type="submit"
                        disabled={
                            Boolean(paramError)
                            || (ctx === "activity" && !actId)
                            || (ctx === "stand" && !standId)
                            || (ctx === "deliverables" && !entregableId)
                            || sending
                        }
                        className={estilo.btn}
                    >
                        {sending ? "Registrando…" : "Registrar asistencia"}
                    </button>
                </form>
            </div>
        </div>
    );
}

