import ControlAsistente from '@/components/controls/ControlAsistente'
import { cookies } from 'next/headers';
import { GETAsistenciaSearch } from '@/actions/feature/control-action'

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function takeFirst(v: string | string[] | undefined): string | undefined {
    if (Array.isArray(v)) return v[0];
    return v;
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;

    const page = Number(takeFirst(params.page)) || 1;
    const page_size = Number(takeFirst(params.page_size)) || 20;
    const search = takeFirst(params.search) || "";

    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value ?? "";

    const data = await GETAsistenciaSearch({ token, search: search.trim(), page: page, page_size: page_size });

    return <ControlAsistente 
        initialData={data.results}
        initialPage={page}
        initialPageSize={page_size}
        initialSearch={search}
        totalPages={data.total_pages}
        totalCount={data.count}
    />
}
