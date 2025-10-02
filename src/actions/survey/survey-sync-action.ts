"use server";

import { DELETESurveyQuestion, POSTCreateSurveyQuestion } from "./survey-question-action";
import { POSTCreateSurveyOption } from "./survey-option-action";
import { GETSurveyWithTree } from "./survey-tree-action";

type UIQuestion = {
    id?: number | string;
    text: string;
    type: "multiple_choice" | "radio_button" | "yes_no" | "text";
    options?: string[];
};

function uiTypeToQType(ui: UIQuestion["type"]): "TXT" | "MUL" | "RAD" | "Y/N" {
    if (ui === "text") return "TXT";
    if (ui === "yes_no") return "Y/N";
    if (ui === "radio_button") return "RAD";
    return "MUL";
}

export const ReplaceSurveyTree = async ({
                                            token,
                                            surveyId,
                                            questions,
                                        }: {
    token: string;
    surveyId: number;
    questions: UIQuestion[];
}) => {
    const createdSummary: Array<{ questionId: number; options: number[] }> = [];
    const errors: string[] = [];

    // 1) Trae el árbol actual para conocer IDs y ORDERS
    let currentTree: any = null;
    try {
        currentTree = await GETSurveyWithTree(surveyId);
    } catch (e) {
        console.warn("GETSurveyWithTree falló (pre-delete). Continuamos…", e);
    }

    // 2) Intenta borrar (soft) todas las preguntas actuales por ID
    try {
        const toDelete = currentTree?.questions ?? [];
        for (const q of toDelete) {
            // ⬇️ tomar el id real, venga como venga
            const qid =
                Number((q as any)?.id_question ?? (q as any)?.id ?? (q as any)?.question_id);

            if (Number.isFinite(qid)) {
                try {
                    await DELETESurveyQuestion(qid, token);
                    console.log("[ReplaceSurveyTree] Deleted question", qid);
                } catch (e: any) {
                    console.error("[ReplaceSurveyTree] Delete question failed:", qid, e?.message);
                    // seguimos
                }
            } else {
                console.warn("[ReplaceSurveyTree] Skip delete. No question id in node:", q);
            }
        }
    } catch (e) {
        console.warn("Borrado en bloque falló. Continuamos…", e);
    }

    // 3) Calcula un punto de arranque de orden que no colisione
    //    Usamos el árbol que teníamos (antes del delete), porque un soft-delete puede
    //    seguir ocupando el mismo (survey, order) si el índice es a nivel de DB.
    const existingOrders: number[] = Array.isArray(currentTree?.questions)
        ? currentTree.questions
            .map((q: any) => Number(q?.order) || 0)
            .filter((n: number) => n > 0)
        : [];
    let nextOrder = (existingOrders.length ? Math.max(...existingOrders) : 0) + 1;

    // Helper: crea pregunta con retry si hay colisión por (survey, order)
    const safeCreateQuestion = async (bodyBase: {
        survey: number;
        text: string;
        qtype: "TXT" | "MUL" | "RAD" | "Y/N";
        required: boolean;
    }) => {
        let attempts = 0;
        const MAX_ATTEMPTS = 10; // subimos los reintentos por si hay varios orders tomados

        while (attempts < MAX_ATTEMPTS) {
            const body = { ...bodyBase, order: nextOrder };
            try {
                console.log(body)
                const r = await POSTCreateSurveyQuestion(token, body as any);
                console.log("[ReplaceSurveyTree] created question:", { order: nextOrder, id: r.id });
                nextOrder++;
                return { ok: true, createdQ: r };
            } catch (e: any) {
                const msg = String(e?.message || "");
                console.warn("[ReplaceSurveyTree] create question failed:", msg, "order:", nextOrder);

                // ⚠️ Reintenta si:
                // - HTTP 400
                // - o el mensaje menciona 'unique' / 'order' (p.ej. "The fields survey, order must make a unique set.")
                const is400 = /HTTP\s*400/i.test(msg);
                const looksLikeUniqueCollision = /unique/i.test(msg) || /order/i.test(msg);

                if (is400 || looksLikeUniqueCollision) {
                    nextOrder++;
                    attempts++;
                    continue;
                }

                // Cualquier otro error: aborta
                return { ok: false, error: msg };
            }
        }

        return { ok: false, error: "No fue posible crear la pregunta sin colisión de (survey, order)" };
    };


    // 4) Crear nuevas (consecutivas a partir de nextOrder)
    for (const q of (questions || []).filter((x) => x.text && x.text.trim())) {
        try {
            const qtype = uiTypeToQType(q.type);

            const result = await safeCreateQuestion({
                survey: surveyId,
                text: q.text.trim(),
                qtype,               // "MUL" | "TXT" | "RAD" | "Y/N"
                required: true,
            });

            if (!result.ok) {
                console.error("Create question failed:", result.error);
                errors.push(result.error || "Error creando pregunta");
                // seguimos con las demás para crear lo que se pueda
                continue;
            }

            const createdQ = result.createdQ as any;
            const newQuestionId: number = createdQ.id ?? createdQ.data?.id;
            const createdOptions: number[] = [];

            if (qtype === "Y/N") {
                let seq = 1;
                for (const val of ["Sí", "No"]) {
                    const opt = await POSTCreateSurveyOption(token, { question: newQuestionId, seq, value: val });
                    createdOptions.push(opt.id ?? opt.data?.id);
                    seq++;
                }
            } else if (qtype === "MUL" || qtype === "RAD") {
                let seq = 1;
                for (const val of (q.options || []).filter((v) => v && v.trim())) {
                    const opt = await POSTCreateSurveyOption(token, { question: newQuestionId, seq, value: val.trim() });
                    createdOptions.push(opt.id ?? opt.data?.id);
                    seq++;
                }
            } // TXT no crea opciones

            createdSummary.push({ questionId: newQuestionId, options: createdOptions });
        } catch (e: any) {
            console.error("Create question/options failed:", e?.message);
            errors.push(e?.message || "Error creando pregunta/opciones");
        }
    }

    return { ok: errors.length === 0, created: createdSummary, errors };
};
