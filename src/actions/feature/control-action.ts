"use server";

const BASE_URL = process.env.SERVER_URL;

// interface FormData {
//   id_asistencia?: number;z

//   id_asistente: number;
//   attendee_id?: number;

//   activity_id?: number;
//   id_actividad?: number;

//   event_id?: number;
//   id_event?: number,
//   token?: string;
// }

interface FormData {
  token: string;
  attendee_id: number;
  event_id: number;
  activity_id: number;

  attendee_email: string;
}

export const GETControl = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/controls/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const control = await response.json();
    // console.log("datos",control)
    return control;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

export const GETControlAll = async ({
  token,
  page = 1,
  pageSize = 10,
  ordering,                 // ← NUEVO
}: {
  token: string;
  page?: number;
  pageSize?: number;
  ordering?: string;        // p.ej. "-date,-time" o "date,time"
}) => {
  try {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("page_size", String(pageSize));     // DRF usa page_size
    if (ordering) qs.set("ordering", ordering);

    const response = await fetch(
      `${BASE_URL}/api/controls/?${qs.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


//metodo get de busqueda
export const GETAsistenciaSearch = async ({token,search,page,page_size, event}: {token: string;search?: string;page?: number;page_size?: number; event?: number;}) => {
  try {

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (page) params.append("page", page.toString());
    if (page_size) params.append("page_size", page_size.toString());
    if (event) params.append("event", event.toString());

    const response = await fetch(
      `${BASE_URL}/api/controls?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const control = await response.json();
    return control;
  } catch (error) {
    console.log("Error al hacer la petición", error);
    return { results: [] };
  }
};

// export const POSTCrontol = async ({
//   token,
//   attendee_id,
//   event_id,
//   activity_id,
//   attendee_email,
// }: FormData) => {
//   const response = await fetch(`${BASE_URL}/api/controls/register/`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({
//       attendee_id,
//       event_id,
//       activity_id,
//       attendee_email,
//     }),
//   });

//   if (!response.ok) {
//     const errorResponse = {
//       ok: false,
//       status: response.status,
//       statusText: response.statusText,
//       result: await response.text()
//     }
//     // console.error("Error en POSTControl:", errorResponse);
//     return errorResponse;
//   }

//   const control = await response.json();
//   const successResponse = { 
//     ok: true, 
//     status: response.status,
//     statusText: response.statusText,
//     result: control 
//   };
//   // console.log("Success en POSTControl:", successResponse);
//   return successResponse;
// };

export const POSTCrontol = async ({
  token,
  attendee_id,
  event_id,
  activity_id,
  attendee_email,
}: FormData) => {
  const response = await fetch(`${BASE_URL}/api/controls/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      attendee_id,
      event_id,
      activity_id,
      attendee_email,
    }),
  });

  if (!response.ok) {
    const errorResponse = {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      result: await response.text()
    }
    // console.error("Error en POSTControl:", errorResponse);
    return errorResponse;
  }

  const control = await response.json();
  const successResponse = { 
    ok: true, 
    status: response.status,
    statusText: response.statusText,
    result: control 
  };
  // console.log("Success en POSTControl:", successResponse);
  return successResponse;
};

// export const POSTCrontol = async ({
//   token,
//   attendee_id,
//   event_id,
//   activity_id,
//   attendee_email,
// }: FormData) => {
//   const response = await fetch(`${BASE_URL}/api/controls/register/`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({
//       attendee_id,
//       event_id,
//       activity_id,
//       attendee_email,
//     }),
//   });

//   if (!response.ok) {
//     const errorResponse = {
//       ok: false,
//       status: response.status,
//       statusText: response.statusText,
//       result: await response.text()
//     }
//     // console.error("Error en POSTControl:", errorResponse);
//     return errorResponse;
//   }

//   const control = await response.json();
//   const successResponse = { 
//     ok: true, 
//     status: response.status,
//     statusText: response.statusText,
//     result: control 
//   };
//   // console.log("Success en POSTControl:", successResponse);
//   return successResponse;
// };