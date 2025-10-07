"use server"

const BASE_URL = process.env.SERVER_URL

import { revalidatePath } from "next/cache";
import { EventResponse } from "@/types/events";

export async function GETEventsAll({
  token,
  page,
  pageSize,
}: { token: string; page?: number; pageSize?: number }): Promise<EventResponse> {
  const res = await fetch(`${BASE_URL}/api/events?page=${page}&pageSize=${pageSize}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store", // SSR fresco
  });

  if (!res.ok) {
    throw new Error(`GETEventsAll failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // console.log("GETEventsAll data:", data);
  // Asegura las claves esperadas
  return {
    events: Array.isArray(data?.results) ? data.results : [],
    count: Number(data?.count ?? 0),
    page: Number(data?.page ?? page),
    page_size: Number(data?.page_size ?? pageSize),
    total_pages: Number(data?.total_pages ?? 0),
  };
}

export async function PATCHEvent(
  id_event: number,
  token: string,
  body: EventResponse | Record<string, unknown>
) {

  const res = await fetch(`${BASE_URL}/api/events/${id_event}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") ?? "";

  // ❌ Si falla, lee SOLO aquí y sal del flujo (throw/return)
  if (!res.ok) {
    // lee como texto para log; no intentes luego res.json() sobre la misma res
    return  { ok: false, status: res.status, error: res.statusText };
  }

  // ✅ Éxito: revalida (ajusta a tu ruta real)
  // Si tu página es /dashboard/evento, usa esa ruta:
  revalidatePath("/dashboard/evento");

  // 204 No Content o sin JSON
  if (res.status === 204 || !contentType.includes("application/json")) {
    return { ok: true };
  }

  // Éxito con JSON: lee SOLO aquí
  return await res.json();
}

export async function DELETEvent(id_event: number, token: string) {
  const res = await fetch(`${BASE_URL}/api/events/${id_event}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  // Revalida la lista SSR
  revalidatePath("/eventos");
  return json;
}


// interface FormData {
// //   id_bp?: string;
//   id_event?: number
//   name?: string;
//   description?: string;
//   country?: string;
//   state?: string;
//   city?: string;
//   address?: string;
//   start_date: string; 
//   end_date: string;    
//   start_time: string;  
//   end_time: string;  
//   is_active?: boolean  
//   token?: string;
// }


export const GETEvents = async ({  token}: { token: string }) => {
    try {
        const response = await fetch(`${BASE_URL}/api/events/`,{
            method: "GET",
            headers:{
                 "Content-type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const event = await response.json();
        // console.log("respuesta",event)


        return event;
    } catch (error) {
        console.log("Error al hacer la peticion",error);
        return [];
    }
}

// // buscar por id metodo get
export const GETEventDetail = async (id_event: number, token: string) => {
  try {
    const res = await fetch(`${BASE_URL}/api/events/${id_event}/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const event = await res.json();
    return event;
  } catch (e) {
    console.error("GETSurveyDetail error:", e);
    return null;
  }
};

// //metodo get con paginacion

// export const GETEventsAll = async ({  token, page = 1, pageSize = 10}: { token: string, page?: number, pageSize?: number }) => {
//     try {
//         const response = await fetch(`${BASE_URL}/api/events/?page=${page}&page_size=${pageSize}`,{
//             method: "GET",
//             headers:{
//                  "Content-type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             }
//         });
//         const event = await response.json();
//         // console.log("respuesta",response)


//         return event;
//     } catch (error) {
//         console.log("Error al hacer la peticion",error);
//         return [];
//     }
// }


// //METODO POST

// export const POSTCreateEvent = async(formData: FormData) =>{
//     try {
//         const response = await fetch(`${BASE_URL}/api/events/`,{
//             method: "POST",
//             headers:{
//                 "Content-type":"application/json",
//                 "Authorization": `Bearer ${formData.token}`,
//             },
            
//             body:JSON.stringify(formData)
//         })

//         // console.log("Respuesta cruda de la API:", response);

//         const event = await response.json()
//         console.log("datos",event)
//         return event

//     } catch (error) {
//         console.log(error)
//     }
// }


// // METODO PUT

// export const PUTEvent = async (
//     id_event: number,
//     token: string,
//     updatedData: Record<string, unknown>
// ) => {
//     try {
//         const response = await fetch(`${BASE_URL}/api/events/${id_event}/`, {
//             method: "PUT",
//             headers: {
//                 "Content-type":"application/json",
//                 "Authorization": `Bearer ${token}`
//             },
            
//             body: JSON.stringify(updatedData),
//         });


//         const event = await response.json();
//         // console.log("ss",event)
//         return event;

//     } catch (error) {
//         console.error("Error al actualizar el producto:", error);
//         return { error: "No se pudo actualizar el producto" };
//     }
// };

// //METODO DELETE

// export const DELETEvent = async (id_event: number, token: string) => {
//   try {
//     const res = await fetch(`${BASE_URL}/api/events/${id_event}/`, {
//       method: "DELETE",
//       headers: {
//         // No necesitas Content-Type si no envías body
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (res.status === 204) {
//       return { ok: true, status: 204 };
//     }

//     // Puede venir 200/202 con body o sin body
//     const raw = await res.text();
//     const data = raw ? (() => { try { return JSON.parse(raw); } catch { return { message: raw }; } })() : null;

//     if (!res.ok) {
//       const msg = data?.detail || data?.message || `Error ${res.status}`;
//       throw new Error(msg);
//     }

//     return data ?? { ok: true, status: res.status };
//   } catch (error: any) {
//     console.error("Error al eliminar el evento:", error);
//     return { ok: false, error: error?.message || "No se pudo eliminar el evento" };
//   }
// };
