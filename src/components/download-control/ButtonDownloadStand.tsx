"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx"; // ⬅️ import estático

// Fila que pintas en tu tabla
type Control_Stand = {
  event_name: string;
  stand_name: string | null;
  attendee_name: string;
  date: string; 
  time: string; 
};

export default function ButtonDownloadStand({
  rows,
  getRows, // si viene, se usa para traer TODO antes de exportar
  filenamePrefix = "Control Stand",
}: {
  rows?: Control_Stand[];
  getRows?: () => Promise<Control_Stand[]>;
  filenamePrefix?: string;
}) {


 const [loading, setLoading] = useState(false);

  // now uses the static XLSX import above
  const downloadData = async (
    history: Record<string, any>[],
    fnamePrefix: string
  ) => {
    const worksheet = XLSX.utils.json_to_sheet(history);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Control De Stand");
    XLSX.writeFile(workbook, `${fnamePrefix}.xlsx`);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const data = (getRows ? await getRows() : (rows ?? [])) as Control_Stand[];

      const shaped = data.map((r) => ({
        Evento: r.event_name,
        Stand: r.stand_name ?? "",
        Nombre: r.attendee_name,
        Fecha: r.date,
        Hora: r.time,
      }));

      await downloadData(shaped, filenamePrefix);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="bg-violet-600 text-white px-3 py-2 rounded hover:bg-violet-700 disabled:opacity-60"
    >
      {loading ? "Exportando…" : "Descargar Excel"}
    </button>
  );
}

