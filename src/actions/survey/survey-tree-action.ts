// src/actions/survey/survey-tree-action.ts
"use server";

const BASE_URL = process.env.SERVER_URL;

type RawOption = {
    id_option?: number;
    value?: string;
    seq?: number;
    question?: number;
    id?: number;
};

type RawQuestion = {
    id_question?: number;
    id?: number;
    text?: string;
    qtype?: "RAD" | "MUL" | "TXT" | "Y/N";
    type?: string;
    required?: boolean;
    order?: number;
    options?: RawOption[];
};

type RawSurveyTree = {
    id_survey?: number;
    id?: number;
    name?: string;
    description?: string;
    questions?: RawQuestion[];
};

const parseJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try { return raw ? JSON.parse(raw) : null; } catch { return { non_json: true, raw }; }
};

export const GETSurveyWithTree = async (...args: any[]) => {
    // Soporta GETSurveyWithTree(surveyId) ó GETSurveyWithTree(token, surveyId)
    const surveyId: number =
        typeof args[0] === "number" ? args[0] :
            typeof args[1] === "number" ? args[1] :
                NaN;

    if (!Number.isFinite(surveyId)) {
        console.error("GETSurveyWithTree !ok: surveyId inválido", { args });
        return null;
    }

    const url = `${BASE_URL}/api/surveys/${surveyId}/questions`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-type": "application/json" }, // público (sin token)
            cache: "no-store",
        });
        const data = await parseJsonSafe(res);

        if (!res.ok) {
            console.error("GETSurveyWithTree !ok:", { url, data, status: res.status });
            return null;
        }

        const raw = data as RawSurveyTree;

        // Normaliza para el front (mantén *_survey, *_question, *_option)
        return {
            id_survey: raw.id_survey ?? raw.id ?? surveyId,
            name: raw.name ?? "",
            description: raw.description ?? "",
            questions: (raw.questions ?? []).map((rq) => {
                const qid = rq.id_question ?? rq.id ?? 0;
                const qtype = rq.qtype ?? (rq.type as any);

                const options = Array.isArray(rq.options)
                    ? rq.options
                        .sort((a, b) => (Number(a.seq || 0) - Number(b.seq || 0)))
                        .map((op) => ({
                            id_option: op.id_option ?? op.id ?? 0,
                            value: op.value ?? "",
                            seq: op.seq ?? 0,
                            question: qid,
                        }))
                    : [];

                return {
                    id_question: qid,
                    text: rq.text ?? "",
                    qtype: qtype,        // "MUL" | "RAD" | "Y/N" | "TXT"
                    required: !!rq.required,
                    order: rq.order ?? 0,
                    options,
                };
            }),
        };
    } catch (e: any) {
        console.error("GETSurveyWithTree error:", { url, error: e?.message });
        return null;
    }
};
