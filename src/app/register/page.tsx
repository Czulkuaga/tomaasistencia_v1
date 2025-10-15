import RegisterUser from "@/components/registeruser/RegisterUser";
import { Suspense } from "react";

// import { GETActivityPublic } from "@/actions/feature/activity-action";
// import { GETStandPublic } from "@/actions/feature/stands-action";
// import { GETDeliverablesPublic } from "@/actions/feature/deliverables-action";

// type PageProps = {
//   searchParams: Promise<Record<string, string | string[] | undefined>>;
// };

// function takeFirst(v: string | string[] | undefined): string | undefined {
//   if (Array.isArray(v)) return v[0];
//   return v;
// }

// export default async function Page({ searchParams }: PageProps) {
export default async function Page() {

  // const params = await searchParams;

  // const atv = Number(takeFirst(params.atv)) || null;
  // const std = Number(takeFirst(params.std)) || null;
  // const deliv = Number(takeFirst(params.deliv)) || null;

  // const activity = atv ? await GETActivityPublic(atv) : null;
  // const stand = std ? await GETStandPublic(std) : null;
  // const deliverable = deliv ? await GETDeliverablesPublic(deliv) : null;

  // console.log({ atv, std, deliv });
  // console.log({ activity, stand, deliverable });

  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Cargando…</div>}>
      <RegisterUser />
    </Suspense>
  );
}
