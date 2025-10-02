"use client";
import React, { useRef, useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { POSTCreateAsiste, GETAsistenciall } from "@/actions/feature/asistencia-action"; // 👈 necesario
import { GETEvents } from "@/actions/feature/event-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

/* ===================== Config de robustez ===================== */
const MAX_CONCURRENCY = 6;      // hilos en paralelo
const BATCH_SIZE = 100;         // tamaño de lote
const MAX_RETRIES = 3;          // reintentos por fila
const RETRY_BASE_MS = 600;      // base del backoff

type EventItem = { id_event: number; name: string };

type AsistenciaMode = "VIRTUAL" | "PRESENCIAL";

type SimpleRow = {
  tipo?: string;
  numero?: string;
  nombre?: string;
  celular?: string | number;
  correo?: string;
  empresa?: string;
  asistencia?: AsistenciaMode | null; // 👈 ahora puede ser null
  errores?: string[];
};

type Health = "ok" | "warn" | "err";

type Stats = {
  total: number;
  ok: number;
  fail: number;
  missingHeaders: string[];
  duplicateCount: number;     // duplicados dentro del archivo (correo)
  alreadyInDbCount: number;   // ya registrados en el evento (correo/doc)
};

/* --------------------- helpers --------------------- */
const normalize = (s: unknown) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const EmailIsValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const norm = (v: unknown) =>
  (v ?? "").toString().trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

function normalizeAsistencia(v: unknown): AsistenciaMode | null {
  const t = norm(v);
  if (!t) return null;
  const isVirtual =
    ["virtual", "online", "remoto", "remote", "en linea", "en línea", "streaming", "webinar", "zoom", "teams", "meet"]
      .some(k => t.includes(k));
  if (isVirtual) return "VIRTUAL";
  const isPresencial =
    ["presencial", "presente", "onsite", "on site", "in situ", "fisico", "físico", "salon", "sala", "auditorio"]
      .some(k => t.includes(k));
  if (isPresencial) return "PRESENCIAL";
  return null;
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/** Limpia correos: quita espacios (incl. NBSP/zero-width), <> y pasa a minúsculas */
const cleanEmail = (raw: unknown): string => {
  return (raw ?? "")
    .toString()
    .trim()
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "") // espacios visibles/invisibles
    .replace(/^<|>$/g, "") // si venía como <correo@dominio>
    .toLowerCase();
};
/* --------------------------------------------------- */

export default function ExcelAsistente({
  events: eventsProp,
  onSaved,
  title = "Importar asistentes",
}: {
  events?: EventItem[];
  onSaved?: () => Promise<void> | void;
  title?: string;
}) {
  const [events, setEvents] = useState<EventItem[]>(eventsProp ?? []);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const [previewRows, setPreviewRows] = useState<SimpleRow[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health>("ok");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Ya registrados (por evento)
  const [dbEmails, setDbEmails] = useState<Set<string>>(new Set());
  const [dbDocs, setDbDocs] = useState<Set<string>>(new Set());

  // Confirm y progreso
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    done: 0,
    ok: 0,
    fail: 0,
    batch: 0,
    batches: 0,
  });

  const [toast, setToast] = useState<{ open: boolean; text: string; tone: "ok" | "err" | "info" }>({
    open: false,
    text: "",
    tone: "ok",
  });

  // Drag & Drop
  const [dragOver, setDragOver] = useState(false);
  const showToast = (text: string, tone: "ok" | "err" | "info" = "ok") => {
    setToast({ open: true, text, tone });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 3000);
  };

  // Cargar eventos
  useEffect(() => {
    if (eventsProp?.length) {
      setEvents(eventsProp);
      return;
    }
    (async () => {
      try {
        setLoadingEvents(true);
        const token = (getCookie("authToken") as string) ?? "";
        if (!token) return;
        const resp = await GETEvents({ token });
        setEvents(resp?.results ?? []);
      } catch (err) {
        console.error("Error cargando eventos:", err);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [eventsProp]);

  // Traer asistentes ya registrados para ese evento (paginado)
  async function loadExistingForEvent(eventId: number) {
    const token = (getCookie("authToken") as string) || "";
    if (!token) return;
    const emails = new Set<string>();
    const docs = new Set<string>();
    let page = 1;
    const pageSize = 200;
    while (true) {
      const res: any = await GETAsistenciall({ token, page, pageSize });
      const arr: any[] = res?.results ?? [];
      for (const a of arr) {
        if (Number(a.event) === Number(eventId)) {
          if (a.email) emails.add(normalize(cleanEmail(a.email))); // 👈 usa cleanEmail
          if (a.identification_number) docs.add(normalize(String(a.identification_number)));
        }
      }
      if (!res?.total_pages || page >= res.total_pages) break;
      page++;
    }
    setDbEmails(emails);
    setDbDocs(docs);
  }

  useEffect(() => {
    if (selectedEventId) loadExistingForEvent(selectedEventId);
    setPreviewRows([]);
    setStats(null);
    setUiError(null);
    setUiSuccess(null);
    setFileMeta(null);
  }, [selectedEventId]);

  const isValidType = (file: File) => {
    const validTypes = new Set([
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ]);
    return validTypes.has(file.type) || /\.(xlsx|xls|csv)$/i.test(file.name);
  };

  const openPicker = () => {
    if (!selectedEventId) {
      setUiError("Primero selecciona un evento.");
      return;
    }
    fileInputRef.current?.click();
  };

  function HealthBadge({ value }: { value: Health }) {
    const cfg =
      value === "ok"
        ? { cls: "bg-emerald-100 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500", label: "Archivo listo" }
        : value === "warn"
          ? { cls: "bg-amber-100 text-amber-800 ring-amber-200", dot: "bg-amber-500", label: "Revisar filas" }
          : { cls: "bg-red-100 text-red-800 ring-red-200", dot: "bg-red-500", label: "Corrige columnas/filas" };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ring-1 ${cfg.cls}`}>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }

  // ----------------- Procesamiento central (selección o drag&drop) -----------------
  async function handleFile(file: File) {
    setUiError(null);
    setUiSuccess(null);
    if (!selectedEventId) {
      setUiError("Primero selecciona un evento.");
      return;
    }
    // asegurar cache de existentes
    await loadExistingForEvent(selectedEventId);

    if (!isValidType(file)) {
      setUiError("Por favor selecciona un archivo válido (.xlsx, .xls o .csv).");
      return;
    }

    setFileMeta({ name: file.name, size: file.size });
    setParsing(true);

    try {
      const XLSX: any = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        setUiError("No se encontró la hoja principal del archivo.");
        return;
      }
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
      if (!data.length) {
        setUiError("El archivo está vacío.");
        return;
      }

      // Columnas esperadas
      const rawHeader = (data[0] ?? []).map((h) => h?.toString?.() ?? "");
      const headerRow = rawHeader.map((h) => normalize(h));
      const idx = {
        tipo: headerRow.findIndex((h) =>
          ["tipo id", "tipo de id", "tipo identificacion", "tipo de identificacion", "tipo de identificación", "tipo documento", "tipo de documento"].includes(h)
        ),
        numero: headerRow.findIndex((h) =>
          ["id", "identificacion", "identificación", "numero", "número", "no"].includes(h)
        ),
        nombre: headerRow.findIndex((h) => ["nombre", "nombres", "nombre completo"].includes(h)),
        celular: headerRow.findIndex((h) => ["celular", "telefono", "teléfono", "movil", "móvil"].includes(h)),
        correo: headerRow.findIndex((h) => ["mail", "correo", "email", "e-mail"].includes(h)),
        empresa: headerRow.findIndex((h) => ["empresa", "nombre empresa", "nombre de empresa", "compania", "compañia", "compañía"].includes(h)),
        asistencia: headerRow.findIndex((h) =>
          ["asistencia", "modalidad", "modo", "tipo asistencia", "participacion", "participación", "virtual/presencial", "estado"].includes(h)
        ),
      };

      // 👇 Ya NO exigimos asistencia como columna requerida
      const requiredKeys = ["nombre", "correo", "empresa"] as const;
      const missingHeaders = requiredKeys.filter((k) => (idx as any)[k] < 0);

      const rows: SimpleRow[] = [];
      const seenEmails = new Set<string>();
      let duplicateCount = 0;
      let alreadyInDbCount = 0;

      for (let i = 1; i < data.length; i++) {
        const r = data[i] ?? [];
        const row: SimpleRow = {
          tipo: idx.tipo >= 0 ? r[idx.tipo] : "",
          numero: idx.numero >= 0 ? r[idx.numero] : "",
          nombre: idx.nombre >= 0 ? r[idx.nombre] : "",
          celular: idx.celular >= 0 ? r[idx.celular] : "",
          correo: idx.correo >= 0 ? r[idx.correo] : "",
          empresa: idx.empresa >= 0 ? r[idx.empresa] : "",
          asistencia: idx.asistencia >= 0 ? r[idx.asistencia] : "", // se normaliza abajo (puede quedar null)
          errores: [],
        };

        if (!row.nombre) row.errores!.push("Falta Nombre");
        if (!row.empresa) row.errores!.push("Falta Empresa");
        if (!row.correo) row.errores!.push("Falta Correo");

        // correo (limpiar + validar + duplicados)
        const correoClean = cleanEmail(row.correo);
        if (correoClean && !EmailIsValid(correoClean)) row.errores!.push("Correo inválido");
        const emailKey = normalize(correoClean);

        if (correoClean) {
          if (seenEmails.has(emailKey)) {
            row.errores!.push("Correo repetido en el archivo");
            duplicateCount++;
          } else {
            seenEmails.add(emailKey);
          }
        }

        // reflejar valor limpio en la vista previa
        row.correo = correoClean;

        // repetido en BD (correo/doc)
        const docKey = normalize((row.numero ?? "").toString().trim());
        let flaggedExisting = false;
        if (emailKey && dbEmails.has(emailKey)) {
          row.errores!.push("Correo ya registrado en el evento");
          flaggedExisting = true;
        }
        if (docKey && dbDocs.has(docKey)) {
          row.errores!.push("Documento ya registrado en el evento");
          flaggedExisting = true;
        }
        if (flaggedExisting) alreadyInDbCount++;

        // modalidad (acepta null si no viene o es inválida)
        const mode = normalizeAsistencia(row.asistencia);
        row.asistencia = mode; // 👈 sin errores: puede ser null

        rows.push(row);
      }

      const total = rows.length;
      const fail = rows.filter((r) => (r.errores?.length ?? 0) > 0).length;
      const ok = total - fail;
      const nextStats: Stats = { total, ok, fail, missingHeaders, duplicateCount, alreadyInDbCount };
      const nextHealth: Health = missingHeaders.length > 0 ? "err" : fail > 0 ? "warn" : "ok";

      setStats(nextStats);
      setHealth(nextHealth);
      setPreviewRows(rows);

      if (alreadyInDbCount > 0) {
        setUiError(`${alreadyInDbCount} asistente(s) ya estaban registrados en este evento. Se omitirán al guardar.`);
      }
      if (ok === 0 && alreadyInDbCount === total && missingHeaders.length === 0) {
        setUiError("Todos los asistentes del archivo ya están registrados para este evento.");
      } else {
        setUiSuccess(`Archivo "${file.name}" cargado (${ok}/${total} filas válidas).`);
      }
    } catch (err) {
      console.error("Error leyendo archivo:", err);
      setUiError("No fue posible leer el archivo. Verifica el formato.");
    } finally {
      setParsing(false);
    }
  }

  // Leer archivo (botón/selector)
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUiError(null);
    setUiSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    e.target.value = "";
  }

  // ------------ Drag & Drop handlers ------------
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!selectedEventId) {
      setUiError("Primero selecciona un evento.");
      return;
    }
    if (parsing || saving) return;
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (!isValidType(file)) {
      setUiError("Por favor selecciona un archivo válido (.xlsx, .xls o .csv).");
      return;
    }
    await handleFile(file);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };
  // ---------------------------------------------

  // ------------ Guardado robusto (lotes + concurrencia + retry) ------------
  async function guardarImportados() {
    setUiError(null);
    setUiSuccess(null);

    const token = getCookie("authToken")?.toString() || "";
    if (!token) {
      setUiError("No hay token de sesión.");
      return;
    }
    if (!selectedEventId) {
      setUiError("Selecciona un evento antes de guardar.");
      return;
    }

    const validRows = previewRows.filter((r) => !r.errores || r.errores.length === 0);
    if (validRows.length === 0) {
      setUiError("No hay filas válidas para guardar.");
      return;
    }

    setSaving(true);
    setCancelRequested(false);
    setProgressOpen(true);
    setProgress({
      total: validRows.length,
      done: 0,
      ok: 0,
      fail: 0,
      batch: 0,
      batches: Math.ceil(validRows.length / BATCH_SIZE),
    });

    let globalOK = 0, globalFail = 0;

    // Crear payloads de una vez
    const payloads = validRows.map((r) => {
      const mode = normalizeAsistencia(r.asistencia); // puede ser null
      return {
        event: selectedEventId,
        identification_type: r.tipo || null,
        identification_number: r.numero || null,
        name: ((r.nombre as string) ?? "").trim(),
        company_name: (r.empresa as string) ?? "",
        email: cleanEmail(r.correo), // 👈 usa cleanEmail al guardar
        phone: r.celular || null,
        asistencia: mode ?? null, // 👈 enviar null si no hay modalidad
      };
    });

    // util: ejecuta con backoff
    const withRetry = async <T,>(fn: () => Promise<T>) => {
      let lastErr: any = null;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          const wait = RETRY_BASE_MS * Math.pow(2, attempt) + Math.random() * RETRY_BASE_MS;
          await sleep(wait);
        }
      }
      throw lastErr;
    };

    // util: corre un grupo con concurrencia limitada
    const runPool = async (tasks: Array<() => Promise<void>>) => {
      return new Promise<void>((resolve) => {
        let idx = 0;
        let running = 0;
        const launchNext = () => {
          if (cancelRequested) {
            // Dejar que las que están corriendo terminen; no lanzamos más
            if (running === 0) resolve();
            return;
          }
          while (running < MAX_CONCURRENCY && idx < tasks.length && !cancelRequested) {
            const cur = idx++;
            running++;
            tasks[cur]()
              .catch(() => { }) // ya contamos arriba/abajo
              .finally(() => {
                running--;
                if (idx >= tasks.length && running === 0) resolve();
                else launchNext();
              });
          }
        };
        launchNext();
      });
    };

    // procesar por lotes
    for (let b = 0; b < payloads.length; b += BATCH_SIZE) {
      if (cancelRequested) break;

      const batchPayloads = payloads.slice(b, b + BATCH_SIZE);
      setProgress((p) => ({ ...p, batch: Math.floor(b / BATCH_SIZE) + 1 }));

      const tasks = batchPayloads.map((data) => async () => {
        try {
          await withRetry(async () => {
            const res = await POSTCreateAsiste({ token, data: data as any });
            if (res?.error) {
              // puedes discriminar por códigos/mensajes específicos si tu API los entrega
              throw new Error(res.error);
            }
          });
          globalOK++;
        } catch (err) {
          globalFail++;
        } finally {
          setProgress((p) => ({ ...p, done: p.done + 1, ok: globalOK, fail: globalFail }));
        }
      });

      await runPool(tasks);
    }

    setSaving(false);
    setProgressOpen(false);

    if (cancelRequested) {
      setUiError(`Proceso cancelado. Progreso: ${globalOK} guardados · ${globalFail} fallidos.`);
    } else {
      setUiSuccess(
        globalFail === 0
          ? `Guardados: ${globalOK}`
          : `Guardados: ${globalOK} · Fallidos: ${globalFail}`
      );
      if (onSaved) {
        try { await onSaved(); } catch { }
      }
      // limpiar vista previa si todo ok
      if (globalOK > 0) {
        setPreviewRows([]);
        setStats(null);
        setFileMeta(null);
      }
    }
  }
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!stats && previewRows.length === 0) return;
    const reasons: string[] = [];
    if (saving) reasons.push("saving=true");
    if (!selectedEventId) reasons.push("sin evento");
    if ((stats?.missingHeaders?.length ?? 0) > 0) reasons.push("faltan columnas");
    if (previewRows.every((r) => r.errores && r.errores.length)) reasons.push("todas las filas con errores");
    console.log("Botón Guardar disabled?:", reasons.length > 0, "→", reasons);
  }, [stats, previewRows, saving, selectedEventId]);

  const resetImport = () => {
    setPreviewRows([]);
    setStats(null);
    setFileMeta(null);
    setUiError(null);
    setUiSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedEventName =
    selectedEventId ? events.find((e) => e.id_event === selectedEventId)?.name ?? "" : "";

  const progressPct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 overflow-auto w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">
            Selecciona un evento y sube un Excel/CSV (haz clic o arrastra y suelta).
          </p>
        </div>

        <Link
          href="/plantilla.xlsx"
          download
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Descargar plantilla
        </Link>

        {/* Selector de evento */}
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-1">Eventos</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm
                       ring-offset-background focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedEventId ?? ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedEventId(e.target.value ? Number(e.target.value) : null)
            }
            disabled={loadingEvents || events.length === 0}
          >
            <option value="" disabled>
              {loadingEvents ? "Cargando eventos…" : "Selecciona un evento"}
            </option>
            {events.map((ev) => (
              <option key={ev.id_event} value={ev.id_event}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        {/* Card: Subir Archivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Subir Archivo
            </CardTitle>
            <CardDescription>Formatos soportados: .xlsx, .xls y .csv</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DROPZONE + Click */}
            <div
              role="button"
              tabIndex={0}
              aria-disabled={!selectedEventId || parsing || saving}
              onClick={openPicker}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={[
                "border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-colors select-none",
                dragOver ? "border-emerald-500 bg-emerald-50" : "border-border",
                (!selectedEventId || parsing || saving) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              ].join(" ")}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              {!fileMeta ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedEventId
                      ? "Arrastra y suelta tu archivo aquí o haz clic para seleccionarlo"
                      : "Selecciona un evento para habilitar la carga"}
                  </p>
                  <input
                    ref={fileInputRef}
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/csv"
                    onChange={onFileChange}
                    className="hidden"
                    disabled={!selectedEventId || parsing || saving}
                  />
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); openPicker(); }} disabled={parsing || !selectedEventId}>
                    {parsing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Procesando...
                      </>
                    ) : (
                      "Seleccionar archivo"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{fileMeta.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); resetImport(); }}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={parsing || saving}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              )}
            </div>

            {/* Mensajes */}
            {uiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uiError}</AlertDescription>
              </Alert>
            )}
            {uiSuccess && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{uiSuccess}</AlertDescription>
              </Alert>
            )}

            {/* Resumen */}
            <div className="flex flex-wrap items-center gap-3">
              {stats && (
                <>
                  <HealthBadge value={health} />
                  <span className="text-sm text-foreground">Filas válidas: <b>{stats.ok}</b> / {stats.total}</span>
                  {stats.missingHeaders.length > 0 && (
                    <span className="text-sm text-red-600">Faltan columnas: <b>{stats.missingHeaders.join(", ")}</b></span>
                  )}
                  {stats.duplicateCount > 0 && (
                    <span className="text-sm text-amber-700">Duplicados (correo en archivo): <b>{stats.duplicateCount}</b></span>
                  )}
                  {stats.alreadyInDbCount > 0 && (
                    <span className="text-sm text-amber-700">Ya en el evento: <b>{stats.alreadyInDbCount}</b></span>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card: Vista previa y acciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vista previa</CardTitle>
            <CardDescription>Revisa las filas detectadas y corrige errores antes de guardar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewRows.length > 0 ? (
              <>
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="text-left">
                        <th className="p-2">Estado</th>
                        <th className="p-2">Tipo ID</th>
                        <th className="p-2">ID</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">celular</th>
                        <th className="p-2">mail</th>
                        <th className="p-2">Empresa</th>
                        <th className="p-2">Asistencia</th>
                        <th className="p-2">Errores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, idx) => {
                        const hasErr = (r.errores?.length ?? 0) > 0;
                        return (
                          <tr key={idx} className={`border-t ${hasErr ? "bg-red-50/40" : "bg-emerald-50/30"}`}>
                            <td className="p-2">
                              <span
                                className={`inline-block h-2.5 w-2.5 rounded-full ${hasErr ? "bg-red-500" : "bg-emerald-500"}`}
                                title={hasErr ? "Con errores" : "Válida"}
                              />
                            </td>
                            <td className="p-2">{r.tipo || "—"}</td>
                            <td className="p-2">{r.numero || "—"}</td>
                            <td className="p-2">{r.nombre || "—"}</td>
                            <td className="p-2">{r.celular || "—"}</td>
                            <td className="p-2">{r.correo || "—"}</td>
                            <td className="p-2">{r.empresa || "—"}</td>
                            <td className="p-2">{r.asistencia ?? "—"}</td>
                            <td className="p-2 text-red-700">{(r.errores ?? []).join(" · ")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={resetImport} disabled={saving}>Limpiar</Button>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={
                      saving ||
                      parsing ||
                      !selectedEventId ||
                      (stats?.missingHeaders?.length ?? 0) > 0 ||
                      previewRows.every((r) => r.errores && r.errores.length)
                    }
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Guardando…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Guardar todo
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no has cargado ningún archivo.</p>
            )}
          </CardContent>
        </Card>

        {confirmOpen && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => !confirming && setConfirmOpen(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b">
                <h3 className="text-lg font-semibold">¿Guardar asistentes?</h3>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <p>Evento: <b>{selectedEventName || "—"}</b></p>
                {fileMeta && <p>Archivo: <b>{fileMeta.name}</b></p>}
                {stats && (
                  <ul className="list-disc pl-5">
                    <li>Filas válidas: <b>{stats.ok}</b> de {stats.total}</li>
                    {stats.fail > 0 && <li>Se omitirán <b>{stats.fail}</b> filas con errores.</li>}
                    {stats.duplicateCount > 0 && (
                      <li>Duplicados en el archivo (correo): <b>{stats.duplicateCount}</b></li>
                    )}
                    {stats.alreadyInDbCount > 0 && (
                      <li>Ya en el evento (correo/doc): <b>{stats.alreadyInDbCount}</b></li>
                    )}
                    {stats.missingHeaders.length > 0 && (
                      <li className="text-red-600">
                        Faltan columnas: <b>{stats.missingHeaders.join(", ")}</b>
                      </li>
                    )}
                  </ul>
                )}
                <div className="rounded-md border p-3 bg-amber-50 text-amber-800">
                  Esta acción creará <b>{stats?.ok ?? 0}</b> asistentes nuevos en el evento seleccionado.
                  ¿Deseas continuar?
                </div>
              </div>
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirming}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    setConfirming(true);
                    try {
                      await guardarImportados();
                      setConfirmOpen(false);
                    } finally {
                      setConfirming(false);
                    }
                  }}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Guardando…
                    </>
                  ) : (
                    "Sí, guardar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay de progreso de guardado */}
      {progressOpen && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-2">Guardando asistentes…</h3>
            <p className="text-sm text-gray-600 mb-3">
              Lote {progress.batch} de {progress.batches} · {progress.done}/{progress.total}
            </p>
            <div className="w-full h-3 bg-gray-200 rounded">
              <div
                className="h-3 bg-emerald-500 rounded"
                style={{ width: `${progressPct}%`, transition: "width .2s linear" }}
              />
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span>OK: <b className="text-emerald-600">{progress.ok}</b></span>
              <span>Fallidos: <b className="text-amber-700">{progress.fail}</b></span>
              <span>Avance: <b>{progressPct}%</b></span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelRequested(true)}
                disabled={cancelRequested}
              >
                {cancelRequested ? "Cancelando…" : "Cancelar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast mínimo */}
      {toast.open && (
        <div className={`fixed bottom-4 right-4 z-[90] px-4 py-3 rounded-lg shadow-lg text-white
          ${toast.tone === "ok" ? "bg-emerald-600" : toast.tone === "err" ? "bg-red-600" : "bg-sky-600"}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
