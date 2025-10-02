import RegisterUser from "@/components/registeruser/RegisterUser";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Cargando…</div>}>
      <RegisterUser />
    </Suspense>
  );
}
