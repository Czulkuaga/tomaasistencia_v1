'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GETAsistenciAll } from '@/actions/feature/asistencia-action'
import { GETActivity } from '@/actions/feature/activity-action'
import { GETEvents } from '@/actions/feature/event-action'
import { POSTCrontol } from '@/actions/feature/control-action'
import { getCookie } from 'cookies-next'

interface RegistroData {
  nombre: string; empresa?: string; correo?: string;
  fecha: string; hora: string; actividad?: string; evento?: string;
  att?: string; evt?: string; act?: string;
}
interface Asistencia {
  id_asistente?: number; name?: string;
  company_name?: string; email?: string;
  start_time?: string; id_event?: number; event?: number;
}
interface Activity { id_actividad?: number; name?: string; event?: number }
interface Event { id_event?: number; name?: string }

// key incluye act para evitar reutilización por actividad


export default function Registro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [registro, setRegistro] = useState<RegistroData | null>(null) //datos listos para confirmar
  const [mensaje, setMensaje] = useState('') // texto para indicar el error 
  const [loading, setLoading] = useState(false)

  const [saving, setSaving] = useState(false) // esto lo envia en el POST
  const [saveMsg, setSaveMsg] = useState<string>('')
  const [saved, setSaved] = useState(false) // bandera de exito ya confirmado
  const [savedAt, setSavedAt] = useState<{ date: string; time: string } | null>(null) // que mostramos al guardar 

  async function AsistentePage(
    token: string,
    att: string, // aqui llamamos el id_asistente o el correo para identificar
    evt?: string // id_event para asegurar si el asistente pertenece al evento 
  ): Promise<Asistencia | null> {

    const page_size = 100; // cuantos registros traes por pagina
    let page = 1; // empezamos en la pagina 1

    // normalizamos att a minúsculas por si es un correo
    const attLower = String(att).toLowerCase();

    // llamamos el endpoint de asistentes paginado 
    while (true) {
      const respuesta = await GETAsistenciAll({ token, page, page_size });

      const items: Asistencia[] =
        respuesta?.results ??
        (Array.isArray(respuesta) ? respuesta : []) ?? // por si el endpoint devuelve array directo
        [];

      
      const found = items.find(a => {
        const att_asistente = String(a.id_asistente ?? '') === String(att); // esto compara si att coincide con el id_asistente
        const att_email = String(a.email ?? '').toLowerCase() === attLower; // compara si el correo coincide con el id_asistente 
        const confirmar_evento = evt ? (String(a.id_event ?? a.event ?? '') === String(evt)) : true; // verifica si el asistente esta asociado al evento 
        return (att_asistente || att_email) && confirmar_evento;
      });
      if (found) return found;

      // ¿Hay siguiente página?
      const siguiente_pagina = Boolean(respuesta?.next); // indica si hay mas paginas 
      const total_paginas = respuesta?.total_pages && respuesta?.page ? Number(respuesta.page) < Number(respuesta.total_pages) : false; // aqui devuelve page y total_pages
      const contar_registro = typeof respuesta?.count === 'number' ? page * page_size < Number(respuesta.count) : false; // mira el total de registros 

      const Next =
        siguiente_pagina || total_paginas || contar_registro || items.length === page_size;

      if (!Next) break;
      page += 1;
    }

    return null;
  }


  useEffect(() => {
    let cancelled = false

    const verificar_informacion = async () => {
      const att = searchParams.get('att') || undefined // att es el asistente aqui miramos el id_asistente o el correo 
      let evt = searchParams.get('evt') || undefined  // evt es el id_event para mirar el eventp que pertenece 
      const act = searchParams.get('act') || undefined  // act es el activity_id para mirar la actividad 

      if (!att) {
        setMensaje('Abra el lector y escanee un QR para ver el registro.')
        setRegistro(null)
        return
      }

      try {
        setLoading(true)

        // Aqui verificamos si el token este funcionando 

        const token = (getCookie('authToken') as string) ?? ''
        if (!token) {
          if (!cancelled) { setMensaje('No hay un token válido'); setRegistro(null) }
          return
        }

        // Si no vino evt pero sí act, infiérelo desde la actividad si no lo coge por el evento lo puede coger por la actividad para mirar el evento 
        let actividadName = '—'
        if (!evt && act) {
          try {
            const data_actividad = await GETActivity({ token })
            const acts: Activity[] = data_actividad?.results || []
            const datos_actividad = acts.find(a => String(a.id_actividad) === String(act))
            if (datos_actividad?.event) evt = String(datos_actividad.event)
            if (datos_actividad?.name) actividadName = datos_actividad.name
          } catch { }
        }

        // 1) Buscar Asistente (por id o correo), preferiblemente del evento indicado
        const asistente = await AsistentePage(token, att, evt);

        if (!asistente) {
          if (!cancelled) { setMensaje('Asistente no encontrado.'); setRegistro(null) }
          return;
        }

        // 2) Nombres de Evento y Actividad para mostrar
        let eventoName = '—'
        const eventId = String(evt || (asistente.id_event ?? asistente.event ?? '')) // prioridad al evt del lector
        if (eventId) {
          try {
            const evsResp = await GETEvents({ token })
            const evs: Event[] = evsResp?.results || []
            const ev = evs.find(e => String(e.id_event) === String(eventId))
            if (ev?.name) eventoName = ev.name
          } catch { }

          ///

          if (act) {
            try {
              const actsResp = await GETActivity({ token })
              const acts: Activity[] = actsResp?.results || []
              const one = acts.find(a => String(a.id_actividad) === String(act))
              if (one?.name) actividadName = one.name
              // Validar consistencia: actividad debe pertenecer al mismo evento
              if (one?.event && String(one.event) !== String(eventId)) {
                setMensaje(`La actividad seleccionada (event ${one.event}) no coincide con el evento del QR (${eventId}). Vuelva al lector y seleccione correctamente.`)
                setRegistro(null)
                return
              }
            } catch { }
          }
        }

        // 3) Fecha/hora a mostrar (si tu API tiene campos de control, puedes cambiarlos aquí)
        const fecha = asistente.start_time?.split('T')[0] || ''
        const hora = asistente.start_time?.split('T')[1]?.split('.')[0] || ''

        if (!cancelled) {
          setRegistro({
            nombre: `${asistente.name ?? ''}`.trim(),
            empresa: asistente.company_name,
            correo: `${asistente.email ?? ''}`,
            fecha, hora, actividad: actividadName, evento: eventoName,
            att: String(asistente.id_asistente ?? ''), // ✅ guarda el ID numérico del asistente
            evt: eventId || undefined,
            act,
          })

          setMensaje('')
          setSaved(false)
          setSaveMsg('')
          setSavedAt(null)
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) { setMensaje('Error al consultar el asistente'); setRegistro(null) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verificar_informacion()
    return () => { cancelled = true }
  }, [searchParams])


  async function handleConfirm() {
    try {
      setSaveMsg('')
      setSaving(true)

      if (!registro?.att) { setSaveMsg('Falta ATT del asistente'); return }
      const token = (getCookie('authToken') as string) ?? ''
      if (!token) { setSaveMsg('No hay un token válido'); return }

      // Deben venir del lector; si no, no se envía control
      if (!registro.evt) { setSaveMsg('Falta el evento. Vuelva al lector y seleccione evento + actividad.'); return }
      if (!registro.act) { setSaveMsg('Falta la actividad. Vuelva al lector y seleccione evento + actividad.'); return }


      const res = await POSTCrontol({
        token,
        attendee_id: Number(registro.att),
        event_id: Number(registro.evt),
        activity_id: Number(registro.act),
        attendee_email: String()
      })


      const ok = res?.id_asistencia || res?.success || res?.message
      if (ok) {
        const dateFromApi = res?.date || res?.creation_date
        const timeFromApi = res?.time || res?.creation_time
        if (dateFromApi && timeFromApi) {
          setSavedAt({ date: String(dateFromApi), time: String(timeFromApi) })
        } else {
        }

        // marcar como usado este QR para esta actividad
        try {

        } catch { }

        setSaveMsg(res?.message || 'Asistencia registrada con éxito.')
        setSaved(true)
        setRegistro(null)
      } else {
        setSaveMsg('El Asistente ya quedo registrado.')
      }
    } catch (err) {
      console.error(err)
      setSaveMsg('Error al registrar el control.')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="min-h-screen p-6 flex flex-col items-center bg-gradient-to-b from-white to-purple-50">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-purple-900">Registro de asistencia</h1>
          <button
            onClick={() => router.back()}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 transition"
          >
            Volver
          </button>
        </div>

        {loading && (
          <div className="p-5 border rounded-xl bg-white shadow-sm flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z" />
            </svg>
            Cargando…
          </div>
        )}

        {!loading && !saved && mensaje && !registro && (
          <div className="p-5 border rounded-xl bg-white shadow-sm text-gray-700">
            {mensaje}
          </div>
        )}

        {!loading && saved && (
          <div className="p-6 rounded-2xl bg-white shadow-md border border-green-200">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 rounded-full bg-green-100 grid place-items-center">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-green-700">¡Asistencia registrada!</h2>
                <p className="text-sm text-gray-600 mt-1">{saveMsg || 'Se guardó correctamente el control.'}</p>

                {savedAt && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Fecha de registro</div>
                      <div className="font-medium">{savedAt.date}</div>
                    </div>
                    <div className="rounded-lg border bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Hora de registro</div>
                      <div className="font-medium">{savedAt.time}</div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.replace('/dashboard/qr')}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                  >
                    Escanear otro QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !saved && registro && (
          <div className="p-6 rounded-2xl bg-white shadow-md border border-purple-200">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Confirmación de asistencia</h2>
              <p className="text-sm text-gray-500">Verifica los datos y confirma para guardar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Evento', registro.evento || '—'],
                ['Actividad', registro.actividad || '—'],
                ['Nombre', registro.nombre],
                ['Correo', registro.correo],
                ['Empresa', registro.empresa || '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-gray-50 px-3 py-2">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="font-medium">{value as string}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition inline-flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z" />
                  </svg>
                )}
                {saving ? 'Guardando…' : 'Confirmar'}
              </button>
              {saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
