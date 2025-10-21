"use server";

const BASE_URL = process.env.SERVER_URL


interface FormData {
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
    console.log("datos stands", controlentregable)
    return controlentregable;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


export const GETControDeliverablesAll = async ({ token, search, page, pageSize, event }: { token: string; search?: string; page?: number; pageSize?: number; event?: number; }) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (page) params.append("page", page.toString());
  if (pageSize) params.append("pageSize", pageSize.toString());
  if (event) params.append("event", event.toString());

  try {
    const response = await fetch(
      `${BASE_URL}/api/deliverable-controls?${params.toString()}`,
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
    body: JSON.stringify({ attendee_id, deliverable_id, attendee_email }),
  });

  if (!response.ok) {
    const errorResponse = {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      result: await response.text()
    }
    console.error("Error en POSTControl:", errorResponse);
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