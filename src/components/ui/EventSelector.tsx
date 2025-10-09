"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { saveEventFilter } from "@/actions/shared/save-event-filter";

type Option = { id: number; name: string };

export function EventSelector({
  options,
  initialValue = 0,      // viene de SSR: cookie o URL
  syncUrlOnMount = false, // si quieres que al montar escriba ?event= desde cookie
}: {
  options: Option[];
  initialValue?: number;
  syncUrlOnMount?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [selected, setSelected] = useState<number>(initialValue);

  // Mantén el select sincronizado con la URL (y con initialValue como fallback)
  useEffect(() => {
    const fromUrl = Number(sp.get("event") || 0);
    if (fromUrl > 0) {
      if (fromUrl !== selected) setSelected(fromUrl);
    } else {
      // si no hay ?event= en URL, usa el valor SSR (cookie) como fallback
      if ((initialValue || 0) !== selected) setSelected(initialValue || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, initialValue]);

  // (Opcional) si quieres forzar que la URL refleje la cookie al cargar
  useEffect(() => {
    if (!syncUrlOnMount) return;
    const hasUrl = sp.has("event");
    if (!hasUrl && initialValue > 0) {
      const params = new URLSearchParams(sp.toString());
      params.set("event", String(initialValue));
      params.set("page", "1");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value || 0);

    // 1) actualiza UI al instante
    setSelected(id);

    // 2) persiste en cookie (server action)
    await saveEventFilter(id > 0 ? id : null);

    // 3) refleja en URL (resetea page=1)
    const params = new URLSearchParams(sp?.toString());
    if (id > 0) params.set("event", String(id));
    else params.delete("event");
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <select
      className="border border-violet-200 rounded-lg p-2"
      value={selected}
      onChange={onChange}
      disabled={pending}
      title="Filtrar por evento"
    >
      <option value={0}>Todos los eventos</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}