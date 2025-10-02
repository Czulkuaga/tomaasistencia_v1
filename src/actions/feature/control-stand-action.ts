"use server";

const BASE_URL = process.env.SERVER_URL


interface FormData  {
  token: string;
  attendee_id: number;
  // event_id: number;
  stand_id: number;
  attendee_email?: string;
};

export const GETControlStand = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/stand-controls/`, {
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


export const GETControStandlAll = async ({
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
      `${BASE_URL}/api/stand-controls/?page=${page}&page_size=${pageSize}`,
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

export const POSTCrontolStand = async ({ token, attendee_id, stand_id, attendee_email }: FormData) => {
  const response = await fetch(`${BASE_URL}/api/stand-controls/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attendee_id, stand_id, attendee_email  }),
  });

  const control = await response.json();
  console.log("datos de stands",control)
  return control;
};