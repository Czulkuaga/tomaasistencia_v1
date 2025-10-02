"use server";

const BASE_URL = process.env.SERVER_URL

export const GETReporte = async ({
  token,
  event_id,
}: {
  token: string;
  event_id: number | string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reports/events/${event_id}/attendance-per-attendee/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const reporte = await response.json();

    return reporte;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};

export const GETAsistenciaActividad = async ({
  token,
  event_id,
}: {
  token: string;
  event_id: number | string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reports/events/${event_id}/activity-attendance/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const reporte = await response.json();

    return reporte;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};
export const GETAsistenciaStand = async ({
  token,
  event_id,
}: {
  token: string;
  event_id: number | string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reports/events/${event_id}/stand-attendance/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const reporte = await response.json();

    return reporte;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};
export const GETAsistenciaEntregable = async ({
  token,
  event_id,
}: {
  token: string;
  event_id: number | string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reports/events/${event_id}/deliverable-attendance/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const reporte = await response.json();

    return reporte;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};


export const GETReporteCompany = async ({
  token,
  event_id,
}: {
  token: string;
  event_id: number | string;
}) => {
  try {
    const response = await fetch(`${BASE_URL}/api/reports/events/${event_id}/top-companies/`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log(response)
    const reporte = await response.json();

    return reporte;
  } catch (error) {
    console.log("Error al hacer la peticion", error);
    return [];
  }
};
