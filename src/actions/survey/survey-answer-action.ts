"use server";

const BASE_URL = process.env.SERVER_URL!;

const parseJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try { return raw ? JSON.parse(raw) : null; } catch { return { non_json: true, raw }; }
};

export async function POSTSurveyAnswersBulk(payload: {
    answers: Array<{
        survey: number;
        question: number;
        option?: number;
        attendee: number;
        type: "atv" | "std" | "deliv";
        id_value: number;
        value_text?: string;
    }>;
}) {
    const url = `${BASE_URL}/api/survey-answers/bulk/`;

    // LOG SERVER: payload que llega al server action
    console.log("[POSTSurveyAnswersBulk] URL:", url);
    console.log("[POSTSurveyAnswersBulk] Payload recibido (server):", JSON.stringify(payload, null, 2));
    console.log("[POSTSurveyAnswersBulk] Conteo de respuestas:", payload?.answers?.length ?? 0);

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // endpoint sin token
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        const data = await parseJsonSafe(res);

        // LOG SERVER: respuesta del backend
        console.log("[POSTSurveyAnswersBulk] HTTP:", res.status);
        console.log("[POSTSurveyAnswersBulk] Respuesta backend:", data);

        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                error: data?.detail || data?.message || `HTTP ${res.status}`,
                data,
            };
        }

        return { ok: true, status: res.status, data };
    } catch (e: any) {
        console.error("[POSTSurveyAnswersBulk] Error de red:", e?.message);
        return { ok: false, error: e?.message || "Error de red" };
    }
}

