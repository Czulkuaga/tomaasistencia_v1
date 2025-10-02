"use server";

const BASE_URL = process.env.SERVER_URL

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

interface FormData  {
  token: string;
  attendee_id: number;
  event_id: number;
  activity_id: number;

  attendee_email: string
};

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
}: {
  token: string;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/controls/?page=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response)
    const control = await response.json();

    return control;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

export const POSTCrontol = async ({ token, attendee_id, event_id, activity_id, attendee_email }: FormData) => {
  const response = await fetch(`${BASE_URL}/api/controls/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attendee_id, event_id, activity_id, attendee_email }),
  });
console.log("datos enviados:",JSON.stringify({ attendee_id, event_id, activity_id, attendee_email }))
  const control = await response.json();
  console.log("datos",control)
  return control;
};