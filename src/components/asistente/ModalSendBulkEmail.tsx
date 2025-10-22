"use client"

import { EventImage } from "@/types/events";
import { useEffect, useState } from "react";

interface Props {
    attendees: Asistencia[];
    event_id?: number;
    setOpenModalSendBulkEmail: () => void;
    token: string;
}

interface Asistencia {
    id_asistente?: number
    identification_type?: string
    identification_number?: string
    name?: string;
    country?: string;
    phone?: number;
    company_name?: string;
    email?: string;
    qr_code: string;
    token?: string;
    event?: number
    start_time?: string;
    is_active?: boolean;
    asistencia?: string;
}

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL

export const ModalSendBulkEmail = ({ attendees, event_id, setOpenModalSendBulkEmail, token }: Props) => {

    const [errors, setErrors] = useState<{ general?: string } | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [load, setLoad] = useState(false);

    const onSubmit = async () => {
        setErrors(null);
        setSuccessMessage(null);
        setLoad(true);

        const formData = {
            event_id: event_id,
            subject: "Tu entrada al evento",
            attach_qr_png: true,
            attach_ticket_png: true,
            html: "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Entrada digital</title><link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap\" rel=\"stylesheet\"></head><body style=\"margin:0; padding:0; background-color:#0f172a; font-family:'Poppins', Arial, sans-serif;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%); padding:30px 0;\"><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"360\" style=\"max-width:360px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.25);\"><tr><td style=\"background:url('BANNERField') no-repeat center/cover; height:180px; background-size:90%;\"><div style=\"height:180px; display:block;\"></div></td></tr><tr><td style=\"padding:24px 24px 12px 24px; text-align:center; color:#0f172a;\"><h2 style=\"margin:0; font-size:18px; font-weight:600;\">Entrada Digital</h2><p style=\"margin:6px 0 20px 0; font-size:14px; color:#475569;\">Presenta este código QR en el acceso al evento</p>QRField</td></tr><tr><td style=\"padding:20px 24px 24px 24px; background:#f9fafb; border-top:1px solid #e2e8f0; text-align:center;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-size:14px; color:#111827;\"><tr><td style=\"padding-bottom:8px;\"><strong>Nombre:</strong><br>NAMEField</td></tr><tr><td style=\"padding-bottom:8px;\"><strong>Evento:</strong><br>EVENTField</td></tr></table></td></tr><tr><td align=\"center\" style=\"background:#0f172a; padding:16px;\"><p style=\"margin:0; font-size:12px; color:#94a3b8;\">©️ 2025 Aliatic S.A.S. Todos los derechos reservados.</p></td></tr></table></td></tr></table></body></html>"
        }

        try {
            const res = await fetch(`${serverUrl}/api/attendees/send-bulk-template-mail/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData)
                }
            )

            // intenta parsear JSON, pero no revientes si no es JSON
            let body: any = null;
            try { body = await res.json(); } catch { /* puede venir vacío o texto */ }

            // reglas de éxito/fracaso:
            //  - HTTP no-2xx => error
            //  - o si el backend manda { ok: false } => error
            if (!res.ok || body?.ok === false) {
                const msg =
                    body?.error ||
                    body?.detail ||
                    body?.message ||
                    `Error ${res.status}: no se pudieron enviar los correos.`;
                setErrors({ general: msg });
                return;
            }

            // éxito
            const msgOk = body?.message || "Correos enviados correctamente.";
            setSuccessMessage(msgOk);
        } catch (e: any) {
            setErrors({ general: e?.message || "Error de red. Intenta nuevamente." });
        } finally {
            setLoad(false);
        }
    }

    useEffect(() => {
        if (!successMessage) return;
        const t = setTimeout(() => setSuccessMessage(null), 4000);
        return () => clearTimeout(t);
    }, [successMessage]);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start md:items-center justify-center z-50 p-4"
                role="dialog"
                aria-modal="true"
            >
                <div className="w-full max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col max-h-[90vh] min-h-0">

                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg md:text-xl font-semibold">
                                Enviar correo a asistentes
                            </h2>
                            <span className="text-sm text-gray-500">
                                {attendees.length} asistente{attendees.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        {/* ALERTAS */}
                        <div className="mt-4 space-y-3" aria-live="polite">
                            {errors?.general && (
                                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                                    {errors.general}
                                </div>
                            )}
                            {successMessage && (
                                <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
                                    {successMessage}
                                </div>
                            )}
                        </div>

                        {/* DATA */}
                        {attendees.length === 0 ? (
                            <div className="mt-6 rounded-lg border border-dashed p-6 text-center text-gray-500">
                                No hay asistentes para mostrar.
                            </div>
                        ) : (
                            <>
                                {/* LISTA MÓVIL: área scrollable */}
                                <div className="mt-6 md:hidden flex-1 min-h-0 overflow-y-auto -mx-1 pr-2">
                                    <div className="grid gap-3">
                                        {attendees.map((a) => (
                                            <div key={a.id_asistente ?? a.email ?? a.qr_code} className="rounded-xl border p-4">
                                                <p className="text-sm text-gray-500">Nombre</p>
                                                <p className="font-medium">{a.name?.trim() || "—"}</p>

                                                <div className="mt-3">
                                                    <p className="text-sm text-gray-500">Correo</p>
                                                    <p className="font-medium break-words">{a.email?.trim() || "—"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>


                                {/* Desktop: Table */}
                                <div className="hidden md:block">
                                    <div className="rounded-xl border">
                                        {/* Contenedor scrollable */}
                                        <div className="max-h-[70vh] overflow-auto">
                                            <table className="min-w-full w-full text-sm table-fixed">
                                                {/* Define anchos de columnas para un layout estable */}
                                                <colgroup>
                                                    <col className="w-2/5" />
                                                    <col className="w-3/5" />
                                                </colgroup>

                                                {/* Header sticky */}
                                                <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                                        <th className="px-4 py-3 text-left font-medium">Correo</th>
                                                    </tr>
                                                </thead>

                                                <tbody className="divide-y">
                                                    {attendees.map((a) => (
                                                        <tr
                                                            key={a.id_asistente ?? a.email ?? a.qr_code}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <span className="font-medium break-words">
                                                                    {a.name?.trim() || "—"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {/* Si prefieres cortar en una línea, usa truncate; para partir en varias, usa break-words */}
                                                                <span className="inline-block align-middle break-words">
                                                                    {a.email?.trim() || "—"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                            </>
                        )}

                        {/* Botones */}
                        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            <button
                                type="button"
                                onClick={setOpenModalSendBulkEmail}
                                className="px-5 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-500 hover:text-white transition disabled:opacity-50"
                                disabled={load}
                            >
                                Cerrar
                            </button>

                            <button
                                type="button"
                                onClick={onSubmit}
                                disabled={load || attendees.length === 0}
                                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                                title={attendees.length === 0 ? "No hay asistentes para notificar" : "Enviar E-Mails"}
                            >
                                {load && (
                                    <span className="h-4 w-4 inline-block animate-spin rounded-full border-2 border-white border-b-transparent" />
                                )}
                                {load ? "Enviando..." : "Enviar E-Mails"}
                            </button>
                        </div>

                    </div>
                </div>
            </div >

        </>
    )
}