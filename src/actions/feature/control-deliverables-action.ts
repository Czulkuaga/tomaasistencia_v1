"use server";

const BASE_URL = process.env.SERVER_URL


interface FormData  {
  token: string;
  attendee_id: number;
  // event_id: number;
  deliverable_id: number;
  attendee_email?: string;
};

export const GETControlDeliverables = async ({ token }: { token: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/deliverable-controls/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const controlentregable = await response.json();
     console.log("datos stands",controlentregable)
    return controlentregable;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


export const GETControDeliverablesAll = async ({
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
      `${BASE_URL}/api/deliverable-controls/?page=${page}&page_size=${pageSize}`,
      {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response)
    const controlentregable = await response.json();

    return controlentregable;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

export const POSTCrontolDeliverables = async ({ token, attendee_id, deliverable_id, attendee_email }: FormData) => {
  const response = await fetch(`${BASE_URL}/api/deliverable-controls/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attendee_id, deliverable_id, attendee_email  }),
  });

  const controlentregable = await response.json();
  console.log("datos de stands",controlentregable)
  return controlentregable;
};