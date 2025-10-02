'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { useRouter } from 'next/navigation';
import { GETActivity } from '@/actions/feature/activity-action';
import { GETEvents } from '@/actions/feature/event-action';
import { getCookie } from 'cookies-next';
import { QrCode } from "lucide-react";

type AttQr = { att: string; evt: string; exp: number; sig: string };
type Activity = { id_actividad?: number; name?: string; event?: number };
type Event = { id_event?: number; name?: string };

function parseAttQr(qr: string): AttQr {
  const parts = (qr || '').split('|');
  if (parts.length !== 5 || parts[0] !== 'ATT') throw new Error('Formato QR inválido');
  const [, att, evt, expStr, sig] = parts;
  return { att, evt, exp: Number(expStr), sig };
}

export default function SearchQR() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Refs para el scanner
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);

  // Estado UI
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [qrText, setQrText] = useState('');
  const [error, setError] = useState('');

  // Catálogos
  const [events, setEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Selecciones
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [actId, setActId] = useState<number | undefined>(undefined);

  // Listar cámaras
  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((list) => {
        setDevices(list);
        const back = list.find((d) => /back|trás|rear|environment/i.test(d.label));
        setDeviceId(back?.deviceId || list[0]?.deviceId || undefined);
      })
      .catch((e) => setError(`No se pudieron listar cámaras: ${String(e)}`));
  }, []);

  // Cargar eventos y actividades
  useEffect(() => {
    (async () => {
      try {
        const token = (getCookie('authToken') as string) ?? '';
        if (!token) { setError('No hay un token válido para cargar catálogos.'); return; }
        const [evResp, actResp] = await Promise.all([GETEvents({ token }), GETActivity({ token })]);
        setEvents(Array.isArray(evResp?.results) ? evResp.results : []);
        setActivities(Array.isArray(actResp?.results) ? actResp.results : []);
      } catch (e) {
        setError('Error al cargar eventos/actividades.');
        console.error(e);
      }
    })();
  }, []);

  // Filtrar actividades por evento seleccionado
  const actsForEvent = activities.filter(a => eventId != null && String(a.event ?? '') === String(eventId));

  // 👇 Cambio: al cambiar de evento, SIEMPRE limpiar la actividad (no autoseleccionar)
  useEffect(() => {
    setActId(undefined);
    setError('');
    setQrText('');
    // Si estaba la cámara corriendo, la detenemos hasta que elijan actividad
    if (running) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Apaga cámara al desmontar
  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  // Enciende automáticamente la cámara cuando hay evento + actividad
  useEffect(() => {
    if (eventId && actId && !running) {
      start().catch((e) => console.warn('No se pudo iniciar la cámara automáticamente:', e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, actId]);

  async function start() {
    setError('');
    setQrText('');
    handledRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (!videoRef.current) return;
    if (!eventId) { setError('Selecciona un evento.'); return; }
    if (!actId) { setError('Selecciona una actividad.'); return; }

    const reader = new BrowserMultiFormatReader();
    setRunning(true);

    const controls = await reader.decodeFromVideoDevice(
      deviceId || undefined,
      videoRef.current,
      (result) => {
        if (!result) return;
        if (handledRef.current) return;

        handledRef.current = true;
        const text = result.getText();
        setQrText(text);

        // detener inmediatamente la lectura
        controlsRef.current?.stop();
        controlsRef.current = null;
        setRunning(false);

        try {
          const { att, evt } = parseAttQr(text);

          // 1) Validar: el QR es del mismo evento seleccionado
          if (String(evt) !== String(eventId)) {
            setError(`El QR pertenece al evento ${evt}, pero seleccionaste el evento ${eventId}. Cambia el evento o usa un QR del mismo evento.`);
            return;
          }

          // 2) Validar: la actividad seleccionada pertenece a ese evento
          const act = actsForEvent.find(a => Number(a.id_actividad) === Number(actId));
          if (!act) {
            setError('La actividad seleccionada no pertenece al evento elegido.');
            return;
          }

          // Navega con att, evt (del QR) y act (seleccionada)
          router.replace(
            `/dashboard/registro?att=${encodeURIComponent(att)}&evt=${encodeURIComponent(evt)}&act=${encodeURIComponent(String(actId))}`
          );
        } catch (e: any) {
          setError(String(e));
        }
      }
    );

    controlsRef.current = controls;
  }

  function stop() {
    handledRef.current = true;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setRunning(false);
  }

  // const selectedEvent = events.find(e => Number(e.id_event) === Number(eventId));
  // const selectedAct = activities.find(a => Number(a.id_actividad) === Number(actId));

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className=" rounded-2xl shadow-2xs p-6 sm:p-8 w-full">

        <div className="space-y-6">

          {/* Título */}
          <h2 className="text-xl sm:text-2xl font-bold text-purple-400 text-center mb-6 sm:mb-8">
            Escanear QR
          </h2>
          
          {/* Selector de Evento */}
          <div className="flex flex-col">
            <label className="text-gray-400 font-semibold mb-1">Evento</label>

            <select
              className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              value={eventId ?? ''}
              onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : undefined)}
              disabled={running}
            >
              <option value="">Selecciona un evento…</option>
              {events.map((ev) => (
                <option key={ev.id_event} value={ev.id_event}>
                  {ev.name}
                </option>
              ))}
            </select>
            {/* {selectedEvent && (
          <div className="text-xs text-gray-500">
            Seleccionado: <strong>{selectedEvent.name}</strong>
          </div>
        )} */}
          </div>

          {/* Selector de Actividad (dependiente del evento) */}
          <div className="flex flex-col">
            <label className="text-gray-400 font-semibold mb-1">Actividad</label>
            <select
              className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              value={actId ?? ''}
              onChange={(e) => setActId(e.target.value ? Number(e.target.value) : undefined)}
              disabled={running || !eventId}
            >
              <option value="">{eventId ? 'Selecciona una actividad…' : 'Primero selecciona un evento'}</option>
              {actsForEvent.map((a) => (
                <option key={a.id_actividad} value={a.id_actividad}>
                  {a.name}
                </option>
              ))}
            </select>
            {/* {selectedAct && (
          <div className="text-xs text-gray-500">
            Seleccionada: <strong>{selectedAct.name}</strong>
          </div>
        )} */}
          </div>

          {/* Selector de cámara + Controles */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              value={deviceId ?? ''}
              onChange={(e) => setDeviceId(e.target.value || undefined)}
              disabled={running}
            >
              {devices.map((d, i) => {
                const value = d.deviceId || `${d.kind || 'videoinput'}-${i}`;
                const label = d.label || `Cámara ${String(value).slice(0, 6)}…`;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>

            {running ? (

              <button onClick={stop} className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-medium shadow hover:bg-red-600 transition">Detener</button>
            ) : (
              <button
                onClick={start}
                disabled={!eventId || !actId}
                className="px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium shadow hover:bg-purple-700 disabled:opacity-50 transition"
              >
                Iniciar cámara
              </button>
            )}
          </div>

          <video ref={videoRef} className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-xl border border-violet-200 shadow-lg object-cover" autoPlay muted playsInline />

          {qrText && (
            <div className="p-4 rounded-lg border border-violet-200 bg-violet-50">
              <div className="text-xs text-violet-600 font-semibold">QR leído</div>
              <div className="font-mono break-all text-sm text-gray-800">{qrText}</div>
            </div>
          )}

          {error && <div className="text-red-600">Error: {error}</div>}
        </div>
      </div>
    </div>
  );
}
