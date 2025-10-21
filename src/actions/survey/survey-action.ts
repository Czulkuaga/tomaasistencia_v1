"use server";

const BASE_URL = process.env.SERVER_URL;

export interface SurveyUpsert {
  id_survey?: number;
  name: string;
  description?: string;
  is_active?: boolean;
  token: string;
  // opcional: id_bp?: string;
}


export const GETEncuesta = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/surveys/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

export const GETSurveys = async ({ token, search, page, page_size, event }: { token: string; search?: string; page?: number; page_size?: number; event?: number; }) => {

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (page) params.append("page", page.toString());
  if (page_size) params.append("page_size", page_size.toString());
  if (event) params.append("event", event.toString());

  try {
    const res = await fetch(
      `${BASE_URL}/api/surveys?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

    // devuélvelo tal cual; el componente lo normaliza
    return await res.json();

  } catch (e) {
    console.log("Error al hacer la peticion", e);
    return [];
  }
};

export const GETSurveyDetail = async (id_survey: number, token: string) => {
  try {
    const res = await fetch(`${BASE_URL}/api/surveys/${id_survey}/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    return data;
  } catch (e) {
    console.error("GETSurveyDetail error:", e);
    return null;
  }
};

export async function POSTattendeeByEmail(email: string, activity_id: number) {
  try {
    const res = await fetch(`${BASE_URL}/api/surveys/attendeebyemail/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        email: (email || "").trim().toLowerCase(),
        activity_id,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json()
    const response = {
      ok:true,
      data:data
    }
    return response
  } catch (err) {
    console.error("POSTattendeeByEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

//backup
// export async function POSTattendeeByEmail(email: string, activity_id: number) {
//   try {
//     const res = await fetch(`${BASE_URL}/api/surveys/attendeebyemail/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       cache: "no-store",
//       body: JSON.stringify({
//         email: (email || "").trim().toLowerCase(),
//         activity_id,
//       }),
//     });

//     if (!res.ok) {
//       const text = await res.text().catch(() => "");
//       throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
//     }

//     return await res.json(); // <- devuelve el JSON del backend
//   } catch (err) {
//     console.error("POSTattendeeByEmail error:", err);
//     return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
//   }
// }


// src/actions/feature/survey-action.ts
export const POSTCreateSurvey = async (payload: SurveyUpsert) => {
  const { token, ...body } = payload;

  try {
    const res = await fetch(`${BASE_URL}/api/surveys/`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { non_json: true, raw };
    }

    if (!res.ok) {
      const msg = data?.detail || data?.message || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: msg, data };
    }

    const id =
      data?.id ??
      data?.id_survey ??
      data?.data?.id ??
      data?.data?.id_survey ??
      null;
    return { ok: true, status: res.status, id, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Error de red" };
  }
};

export const PATCHSurvey = async (
  id_survey: number,
  token: string,
  partial: Partial<Omit<SurveyUpsert, "token">>
) => {
  try {
    const res = await fetch(`${BASE_URL}/api/surveys/${id_survey}/`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(partial),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("PATCHSurvey error:", e);
    return { error: "No se pudo actualizar la encuesta" };
  }
};

export const DELETESurvey = async (id_survey: number, token: string) => {
  try {
    const res = await fetch(`${BASE_URL}/api/surveys/${id_survey}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 204) return { ok: true, status: 204 };

    const raw = await res.text();
    const data = raw
      ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return { message: raw };
        }
      })()
      : null;

    if (!res.ok) {
      const msg = data?.detail || data?.message || `Error ${res.status}`;
      throw new Error(msg);
    }
    return data ?? { ok: true, status: res.status };
  } catch (error: any) {
    console.error("DELETESurvey error:", error);
    return {
      ok: false,
      error: error?.message || "No se pudo eliminar la encuesta",
    };
  }
};
