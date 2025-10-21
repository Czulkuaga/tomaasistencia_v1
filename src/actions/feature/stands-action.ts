"use server";

const BASE_URL = process.env.SERVER_URL

interface FormData {
  // id_bp?: string;
  id_stand?: number
  name?: string;
  company_name?: string;
  description?: string;
  location?: string;
  qr_code: string;
  token?: string;
  event: string;
  // is_active: boolean;
  is_scoring: boolean;
}

export const GETStands = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/stands/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const stands = await response.json();

    return stands;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

//getpublic

export const GETStandPublic = async (std: number) => {
  try {
    const response = await fetch(`${BASE_URL}/api/stands/public-stand-info/?std=${std}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      }
    });
    // console.log(response)
    const stands = await response.json();
    // console.log("datos", stands)
    return stands;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

//paginacion de get 
export const GETStandsAll = async ({ token, search, page, page_size, event }: { token: string; search?: string; page?: number; page_size?: number; event?: number; }) => {

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (page) params.append("page", page.toString());
  if (page_size) params.append("page_size", page_size.toString());
  if (event) params.append("event", event.toString());

  try {
    const response = await fetch(
      `${BASE_URL}/api/stands?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    // console.log(response)
    const stands = await response.json();

    return stands;
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
      `${BASE_URL}/api/stands/${search ? `?search=${encodeURIComponent(search)}` : ""
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

export const POSTCreateStands = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/stands/`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${formData.token}`,
      },

      body: JSON.stringify(formData),
    });

    // console.log("Respuesta cruda de la API:", response);

    const stands = await response.json();
    console.log("datos", stands);
    return stands;
  } catch (error) {
    console.log(error);
  }
};

// METODO PUT

export const PATCHStands = async (id_stand: number, token: string, updatedData: Record<string, unknown>
) => {
  try {
    const response = await fetch(`${BASE_URL}/api/stands/${id_stand}/`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        "Authorization": `Bearer ${token}`
      },

      body: JSON.stringify(updatedData),
    });


    const stands = await response.json();
    // console.log("update de stand", stands)
    return stands;

  } catch (error) {
    console.error("Error al actualizar el producto:", error);
    return { error: "No se pudo actualizar el producto" };
  }
};

//METODO DELETE

export const DELETEStands = async (id_stand: number, token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/stands/${id_stand}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });


    const stands = await response.json();
    return stands;

  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return { error: "No se pudo eliminar el producto" };
  }
};
