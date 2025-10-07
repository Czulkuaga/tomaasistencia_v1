"use server";

const BASE_URL = process.env.SERVER_URL


interface FormData  {
  token: string;
  attendee_id: number;
  event_id: number;
  id_answer: number;
  
};

export const GETControlEncuesta = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/survey-attendance/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const controlstand = await response.json();
     console.log("datos stands",controlstand)
    return controlstand;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


export const GETControEncuestalAll = async ({
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
      `${BASE_URL}/api/survey-attendance/?page=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response)
    const controlstand = await response.json();

    return controlstand;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


// actions/feature/encuesta-search.ts (o donde la tengas)
export const GETEncuestaSearch = async ({ token, search, event, page, page_size }: { token: string; search?: string; event?: number; page?: number; page_size?: number; }) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (event) params.append("event", event.toString());
  if (page) params.append("page", page.toString());
  if (page_size) params.append("page_size", page_size.toString());
  
  try {
    
    // const url = `${BASE_URL}/api/deliverable-controls?${params.toString()}`;
    const url = `${BASE_URL}/api/survey-attendance?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const asistente = await response.json();
    return asistente;
  } catch (error) {
    console.log("Error al hacer la petición", error);
    return { results: [] };
  }
};
