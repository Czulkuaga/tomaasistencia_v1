"use client";

import ExcelImportAsistente from "@/components/asistente/ExcelAsistente";

export default function ImportAsistentesPage() {
  return (
    <main className="p-6">
      {/* <h1 className="text-xl font-bold mb-4">Importar asistentes</h1> */}
      <ExcelImportAsistente
        // Si quieres refrescar un listado global al terminar, pásale onSaved
        onSaved={() => {}}
      />
    </main>
  );
}
