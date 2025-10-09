"use server";

import { cookies } from "next/headers";

export async function saveEventFilter(eventId: number | null) {
  const jar = await cookies();
  if (eventId && Number.isFinite(eventId) && eventId > 0) {
    jar.set("event", String(eventId), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
  } else {
    // Quitar filtro
    jar.delete("event");
  }
  return { ok: true };
}