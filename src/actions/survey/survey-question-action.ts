// src/actions/feature/survey-question-action.ts
"use server";

const BASE_URL = process.env.SERVER_URL;

export interface QuestionUpsert {
    survey: number;
    order: number;
    text: string;
    qtype: "MUL" | "TXT" | "RAD" | "Y/N"; // <-- actualizado
    required: boolean;
}

const parseJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try { return raw ? JSON.parse(raw) : null; } catch { return { non_json: true, raw }; }
};

export const GETSurveyQuestions = async ({
                                             token,
                                             surveyId,
                                             search = "",
                                         }: {
    token: string;
    surveyId?: number;
    search?: string;
}) => {
    try {
        const url = new URL(`${BASE_URL}/api/survey-questions/`);
        if (search) url.searchParams.set("search", search);
        if (surveyId != null) url.searchParams.set("survey", String(surveyId)); // si el backend no lo soporta, lo ignora

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        const data = await parseJsonSafe(res);
        if (!res.ok) {
            console.error("GETSurveyQuestions !ok:", data);
            return [];
        }
        return Array.isArray(data) ? data : data?.results || [];
    } catch (e) {
        console.error("GETSurveyQuestions error:", e);
        return [];
    }
};

export const POSTCreateSurveyQuestion = async (token: string, body: QuestionUpsert) => {
    const res = await fetch(`${BASE_URL}/api/survey-questions/`, {
        method: "POST",
        headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) {
        const msg = data?.detail || data?.message || `HTTP ${res.status}`;
        console.error("POSTCreateSurveyQuestion !ok:", { body, data });
        throw new Error(msg);
    }

    const id = data?.id ?? data?.id_question ?? data?.data?.id ?? data?.data?.id_question;
    return { ok: true, id, data };
};

export const PATCHSurveyQuestion = async (id_question: number, token: string, partial: Partial<QuestionUpsert>) => {
    const res = await fetch(`${BASE_URL}/api/survey-questions/${id_question}/`, {
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

export const DELETESurveyQuestion = async (id_question: number, token: string) => {
    const res = await fetch(`${BASE_URL}/api/survey-questions/${id_question}/`, {
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
