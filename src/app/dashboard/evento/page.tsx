import React from "react";
import { cookies } from "next/headers";
import { GETEventsAll } from "@/actions/feature/event-action";
import type { EventResponse } from "@/types/events";
import Eventos from "@/components/eventos/Eventos";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function takeFirst(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function PageEvent({ searchParams }: PageProps) {
  // 👇 Obligatorio en Next 15
  const params = await searchParams;

  const page = Number(takeFirst(params.page)) || 1;
  const pageSize = Number(takeFirst(params.pageSize)) || 20;

  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value ?? "";

  const data: EventResponse = await GETEventsAll({ token, page, pageSize });

  return (
    <div className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] pt-0 px-2 sm:px-4 lg:px-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Evento</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Aquí puedes crear tu evento y añadir toda la información necesaria
        </p>
      </div>

      {/* Client-only interacciones (modales, editar/eliminar, UI optimista) */}
      <Eventos token={token} initialData={data} />
    </div>
  );
}