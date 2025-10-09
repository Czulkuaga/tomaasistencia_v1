"use server";

const BASE_URL = process.env.SERVER_URL

interface AttendeeCreate {
  id_asistente?: number;
  identification_type?: string | null;
  identification_number?: string | null;
  name?: string;
  country?: string | null;
  phone?: string | number | null;
  company_name?: string;
  email?: string;
  qr_code?: string | null;
  start_time?: string | null;
  is_active?: boolean;
  event: number;
  asistencia: string;
}


export const GETAsistencia = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendees/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const asistente = await response.json();
    return asistente;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

//metodo de paginacion get

export const GETAsistenciAll = async ({ token, search, page, page_size, event }: { token: string; search?: string; page?: number; page_size?: number; event?: number; }) => {

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (page) params.append("page", page.toString());
  if (page_size) params.append("page_size", page_size.toString());
  if (event) params.append("event", event.toString());

  try {
    const response = await fetch(
      `${BASE_URL}/api/attendees?${params.toString()}`,
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
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


export const GETAsistenciaSearch = async ({
  token,
  search = "",
}: {
  token: string;
  search?: string;
}) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/attendees/${
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

export const POSTCreateAsiste = async ({
  token,
  data,
}: {
  token: string;
  data: AttendeeCreate;
}) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/attendees/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    console.log("datos del asistente",response)
    return await response.json();
  } catch (error) {
    console.error(error);
    return { error: "No se pudo crear el asistente" };
  }
};

// METODO PUT

export const PUTAsistencia = async (
  id_asistente: number,
  token: string,
  updatedData: Record<string, unknown>
) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendees/${id_asistente}/`, {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(updatedData),
    });

    const asistente = await response.json();
    return asistente;
  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return { error: "No se pudo actualizar el producto" };
  }
};

//METODO DELETE

export const DELETEAsistencia = async (id_asistente: number, token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/attendees/${id_asistente}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const asistente = await response.json();
    return asistente;
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return { error: "No se pudo eliminar el producto" };
  }
};
