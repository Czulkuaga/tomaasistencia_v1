// src/actions/survey/survey-answers-list-action.ts
"use server";

const BASE_URL = process.env.SERVER_URL!; // p.ej. https://qaapiasistencia.aliatic.app

type AnswerRow = {
    id_answer: number;
    survey: number;
    question: number;
    option?: number | null;
    value_text?: string | null;
    attendee: number;
    submitted_at: string;
    type: "atv" | "std" | "deliv";
    id_value: number;
    id_bp?: string;
};

type Paginated<T> = {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

const parseJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try { return raw ? JSON.parse(raw) : null; } catch { return { non_json: true, raw }; }
};

export async function GETSurveyAnswers(params: {
    type: "atv" | "std" | "deliv";
    id_value: number;
    survey: number;
    page?: number;
    page_size?: number;
    token: string;               // <-- obligatorio, sin leer cookies
}) {
    const { type, id_value, survey, page = 1, page_size = 1000, token } = params;

    if (!token?.trim()) {
        return { ok: false, status: 401, error: "Falta token en parámetros." };
    }

    let urlStr = "";
    try {
        const url = new URL(`${BASE_URL}/api/survey-answers/`); // DRF con slash final
        url.searchParams.set("type", type);
        url.searchParams.set("id_value", String(id_value));
        url.searchParams.set("survey", String(survey));
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(page_size));
        urlStr = url.toString();
    } catch (e: any) {
        return { ok: false, error: `URL inválida. Revisa SERVER_URL. Detalle: ${e?.message || e}` };
    }

    try {
        const res = await fetch(urlStr, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,   // <-- protegido por token
            },
            cache: "no-store",
        });

        const data = await parseJsonSafe(res);
        console.log("[GETSurveyAnswers] GET", urlStr, "-> HTTP", res.status);

        if (!res.ok) {
            const msg = data?.detail || data?.message || `HTTP ${res.status}`;
            console.error("[GETSurveyAnswers] !ok:", { status: res.status, msg, data });
            return { ok: false, status: res.status, error: msg, data };
        }

        const normalized: Paginated<AnswerRow> = Array.isArray(data)
            ? { count: (data as AnswerRow[]).length, page, page_size, total_pages: 1, next: null, previous: null, results: data as AnswerRow[] }
            : (data as Paginated<AnswerRow>);

        return { ok: true, status: res.status, data: normalized };
    } catch (e: any) {
        console.error("[GETSurveyAnswers] Error de red:", e?.message || e);
        return { ok: false, error: e?.message || "Error de red" };
    }
}
