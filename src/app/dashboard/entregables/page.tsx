import Entregables from '@/components/entregables/Entregables'
import { cookies } from 'next/headers';

import { GETDeliverablesAll } from "@/actions/feature/deliverables-action"
import { decryptToken } from '@/actions/jwt/jwt-action';

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

export default async function PageEvent({ searchParams }: PageProps) {

    const params = await searchParams;

    const page = Number(takeFirst(params.page)) || 1;
    const page_size = Number(takeFirst(params.page_size)) || 20;
    const search = takeFirst(params.search) || "";

    const cookieStore = await cookies();
    const eventFromUrl = toPositiveInt(takeFirst(params.event));
    const eventFromCookie = toPositiveInt(cookieStore.get("event")?.value);
    const eventId = eventFromUrl ?? eventFromCookie; // URL manda
    const token = cookieStore.get("authToken")?.value ?? "";

      const tokedata = await decryptToken(token)
      const toBool = (v: unknown) => v === true;
      const is_staff = toBool(typeof tokedata !== "string" && (tokedata as any).is_staff);
      const main_user = toBool(typeof tokedata !== "string" && (tokedata as any).main_user);

    const data = await GETDeliverablesAll({ token, search: search.trim(), page: page, page_size: page_size, event: eventId, });

    return (
        <Entregables
            initialData={data.results}
            initialPage={page}
            initialPageSize={page_size}
            initialSearch={search}
            totalPages={data.total_pages}
            totalCount={data.count}
            initialEvent={eventId}
            main_user={main_user}
        />
    )
}
