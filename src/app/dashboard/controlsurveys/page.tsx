import ControlEncuesta from '@/components/controlencuesta/ControlEncuesta'
import { cookies } from 'next/headers';
import { GETEncuestaSearch } from '@/actions/feature/control-encuesta'

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

export default async function Page({ searchParams }: PageProps) {

    const params = await searchParams;

    const page = Number(takeFirst(params.page)) || 1;
    const page_size = Number(takeFirst(params.page_size)) || 20;
    const search = takeFirst(params.search) || "";
    const event = Number(takeFirst(params.pageSize)) || undefined;

    const cookieStore = await cookies();
    const eventFromUrl = toPositiveInt(takeFirst(params.event));
    const eventFromCookie = toPositiveInt(cookieStore.get("event")?.value);
    const eventId = eventFromUrl ?? eventFromCookie; // URL manda
    const token = cookieStore.get("authToken")?.value ?? "";

    const data = await GETEncuestaSearch({ token, search: search.trim(), event: event, page: page, page_size: page_size });

    return <ControlEncuesta
        initialData={data.results}
        initialPage={page}
        initialPageSize={page_size}
        initialSearch={search}
        totalPages={data.total_pages}
        totalCount={data.count}
        initialEvent={eventId}
    />
}
