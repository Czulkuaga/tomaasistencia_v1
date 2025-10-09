import Asisten from "@/components/asistente/Asisten"
import { cookies } from 'next/headers';
import { GETAsistenciAll } from "@/actions/feature/asistencia-action"

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function takeFirst(v: string | string[] | undefined): string | undefined {
    if (Array.isArray(v)) return v[0];
    return v;
}

function toPositiveInt(v?: string) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function pageAsistente({ searchParams }: PageProps) {

    const params = await searchParams;

    const page = Number(takeFirst(params.page)) || 1;
    const page_size = Number(takeFirst(params.page_size)) || 20;
    const search = takeFirst(params.search) || "";

    const cookieStore = await cookies();
    const eventFromUrl = toPositiveInt(takeFirst(params.event));
    const eventFromCookie = toPositiveInt(cookieStore.get("event")?.value);
    const eventId = eventFromUrl ?? eventFromCookie; // URL manda
    const token = cookieStore.get("authToken")?.value ?? "";

    const data = await GETAsistenciAll({ token, search: search.trim(), page: page, page_size: page_size, event: eventId, });

    return (
        <Asisten 
            initialData={data.results}
            initialPage={page}
            initialPageSize={page_size}
            initialSearch={search}
            totalPages={data.total_pages}
            totalCount={data.count}
            initialEvent={eventId}
        />
    )
}