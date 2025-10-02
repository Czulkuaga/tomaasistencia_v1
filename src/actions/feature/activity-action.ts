"use server";

const BASE_URL = process.env.SERVER_URL

interface FormData {
  id_bp?: string;
  id_actividad?: string;
  name?: string;
  description?: string;
  price?: string;
  country?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  token?: string;
  event: string;
  qr_code: string;
  // is_active?: boolean;
  is_scoring: boolean;
}

export const GETActivity = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/activities/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const actividad = await response.json();

    return actividad;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

export const GETActivityPublic = async (atv: number) => {
  try {
    const response = await fetch(`${BASE_URL}/api/activities/public-activity-info/?atv=${encodeURIComponent(atv)}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    });
    // console.log(response)
    const actividad = await response.json();
    console.log("datos",actividad)
    return actividad;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


//paginacion de get
export const GETActivityAll = async ({
  token,
  page = 1,
  pageSize = 10,
}: {
  token: string;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/activities/?page=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response)
    const actividad = await response.json();

    return actividad;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

//metodo get de busqueda
export const GETAsistenciaSearch = async ({
  token,
  search = "",
}: {
  token: string;
  search?: string;
}) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/activities/${
        search ? `?search=${encodeURIComponent(search)}` : ""
      }`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const asistente = await response.json();
    return asistente;
  } catch (error) {
    console.log("Error al hacer la petición", error);
    return { results: [] };
  }
};

//METODO POST

export const POSTCreateActivity = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/activities/`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${formData.token}`,
      },

      body: JSON.stringify(formData),
    });

    // console.log("Respuesta cruda de la API:", response);

    const actividad = await response.json();
    console.log("datos", actividad);
    return actividad;
  } catch (error) {
    console.log(error);
  }
};

// METODO PUT

export const PUTActivity = async (id_actividad: number,token: string,updatedData: Record<string, unknown>) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/activities/${id_actividad}/`,
      {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          "Authorization": `Bearer ${token}`,
        },

        body: JSON.stringify(updatedData),
      }
    );

    const actividad = await response.json();
    console.log("update activity",actividad)
    return actividad;
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return { error: "No se pudo actualizar el producto" };
  }
};

//METODO DELETE

// export const DELETEActivity = async (id_actividad: number, token: string) => {
//   try {
//     const response = await fetch(
//       `${BASE_URL}/api/activities/${id_actividad}/`,
//       {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const actividad = await response.json();
//     return actividad;
//   } catch (error) {
//     console.error("Error al eliminar el producto:", error);
//     return { error: "No se pudo eliminar el producto" };
//   }
// };


export const DELETEActivity = async (id_actividad: number, token: string) => {
  try {
    const res = await fetch(`${BASE_URL}/api/activities/${id_actividad}/`, {
      method: "DELETE",
      headers: {
        // No necesitas Content-Type si no envías body
        Authorization: `Bearer ${token}`,
      },
    });

    // Caso típico DRF: 204 sin contenido
    if (res.status === 204) {
      return { ok: true, status: 204 };
    }

    // Lee el body como texto (puede venir vacío o no ser JSON)
    const raw = await res.text();
    const data = raw ? (() => { try { return JSON.parse(raw); } catch { return { message: raw }; } })() : null;

    if (!res.ok) {
      const msg = data?.detail || data?.message || `Error ${res.status}`;
      throw new Error(msg);
    }

    // Si el backend devolvió algo (200/202 con JSON)
    return data ?? { ok: true, status: res.status };
  } catch (error: any) {
    console.error("Error al eliminar la actividad:", error);
    return { ok: false, error: error?.message || "No se pudo eliminar la actividad" };
  }
};
