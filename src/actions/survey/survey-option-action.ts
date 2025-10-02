// src/actions/feature/survey-option-action.ts
"use server";

const BASE_URL = process.env.SERVER_URL;

export interface OptionUpsert {
    question: number;
    seq: number;       // <-- ahora es seq (no cons)
    value: string;
}

const parseJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try { return raw ? JSON.parse(raw) : null; } catch { return { non_json: true, raw }; }
};

export const GETQuestionOptions = async (token: string, questionId?: number) => {
    try {
        const url = new URL(`${BASE_URL}/api/survey-options/`);
        if (questionId != null) url.searchParams.set("question", String(questionId));
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
            cache: "no-store",
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) {
            console.error("GETQuestionOptions !ok:", data);
            return [];
        }
        return Array.isArray(data) ? data : data?.results || [];
    } catch (e) {
        console.error("GETQuestionOptions error:", e);
        return [];
    }
};

export const POSTCreateSurveyOption = async (token: string, body: OptionUpsert) => {
    const res = await fetch(`${BASE_URL}/api/survey-options/`, {
        method: "POST",
        headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
        const msg = data?.detail || data?.message || `HTTP ${res.status}`;
        console.error("POSTCreateSurveyOption !ok:", { body, data });
        throw new Error(msg);
    }
    const id = data?.id ?? data?.id_option ?? data?.data?.id ?? data?.data?.id_option;
    return { ok: true, id, data };
};

export const PATCHSurveyOption = async (id_option: number, token: string, partial: Partial<OptionUpsert>) => {
    const res = await fetch(`${BASE_URL}/api/survey-options/${id_option}/`, {
        method: "PATCH",
        headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(partial),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
        const msg = data?.detail || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return { ok: true, data };
};

export const DELETESurveyOption = async (id_option: number, token: string) => {
    const res = await fetch(`${BASE_URL}/api/survey-options/${id_option}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) return { ok: true, status: 204 };
    const data = await parseJsonSafe(res);
    if (!res.ok) {
        const msg = data?.detail || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return { ok: true, data };
};
