"use client"

import { getEventPublic } from "@/actions/feature/event-action";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { POSTCreatePublicAttendee } from "@/actions/feature/asistencia-action";
import SuccessModal from "@/components/ui/SuccessModal";

interface Asistente {
  identification_type?: string
  identification_number?: string
  name?: string;
  country?: string;
  phone?: string;
  company_name?: string;
  email?: string;
  qr_code: string;
  event: number
  asistencia: string
}

const initialData = {
  id_bp: "",
  identification_type: "",
  identification_number: "",
  name: "",
  country: "",
  phone: "",
  company_name: "",
  email: "",
  qr_code: "",
  asistencia: "",
  event: 0
}

interface EventItem {
  id_event: number;
  name: string;
}

type FormErrors = Partial<Record<keyof Asistente | "formError", string>>;

const ID_TYPE_OPTIONS = [
  { value: "CC" },
  { value: "NIT" },
  { value: "PAS" },
  { value: "CE" },
];

const ASISTENCIA_OPTIONS = [{ value: "PRESENCIAL" }, { value: "VIRTUAL" }];

// Helpers para errores
const fieldKeys: (keyof Asistente)[] = [
  "identification_type",
  "identification_number",
  "name",
  "country",
  "phone",
  "company_name",
  "email",
  "qr_code",
  "event",
  "asistencia",
];

function emailIsValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
}

function mapBackendErrors(payload: any): FormErrors {
  const out: FormErrors = {};

  // Errores por campo (si vienen)
  for (const k of fieldKeys) {
    const errVal = payload?.[k];
    if (Array.isArray(errVal) && errVal.length) out[k] = errVal.join(" ");
    else if (typeof errVal === "string" && errVal) out[k] = errVal;
  }

  // Errores generales (non_field_errors / detail)
  const nonField =
    (Array.isArray(payload?.non_field_errors) && payload.non_field_errors[0]) ||
    (typeof payload?.detail === "string" ? payload.detail : undefined);

  if (nonField) {
    // Mensaje más intuitivo cuando es unicidad por (event, email)
    if (/unique/i.test(nonField) && /(event|evento).*(email|correo)/i.test(nonField)) {
      out.formError = "El correo ya está registrado para este evento.";
      // opcional: marca también el campo email
      if (!out.email) out.email = "El correo ya está registrado para este evento.";
    } else {
      out.formError = nonField;
    }
  }

  if (!Object.keys(out).length) {
    out.formError = "No se pudo registrar. Inténtalo nuevamente.";
  }
  return out;
}

export default function Page() {

  const route = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const eventIdNum = Number(eventId) || 0;

  const [formData, setFormData] = useState<Asistente>(initialData);
  const [errors, setErrors] = useState<FormErrors>({})
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const inputChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setErrors({});
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normaliza según tu interface Asistente
    const normalized: Asistente = {
      identification_type: formData.identification_type?.trim() || undefined,
      identification_number: formData.identification_number?.trim() || undefined,
      name: (formData.name ?? "").trim().toLocaleUpperCase("es-CO"),
      country: formData.country?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      company_name: (formData.company_name ?? "").trim().toLocaleUpperCase("es-CO"),
      email: (formData.email ?? "").trim().toLowerCase(),
      qr_code: (formData.qr_code ?? "").trim(),
      event: Number(formData.event) || 0,
      asistencia: (formData.asistencia ?? "").trim(),
    };

    // Validaciones mínimas front
    const errors: FormErrors = {};
    if (!normalized.event) errors.event = "El Evento es obligatorio";
    if (!normalized.name) errors.name = "El Nombre es obligatorio";
    if (!normalized.company_name) errors.company_name = "El Nombre Empresa es obligatorio";
    if (!normalized.email) errors.email = "El Correo es obligatorio";
    else if (!emailIsValid(normalized.email)) errors.email = "El Correo no tiene un formato válido";

    if (Object.keys(errors).length) {
      setErrors(errors);
      return;
    }

    try {
      const response = await POSTCreatePublicAttendee({ data: normalized });

      // Error de red / acción (tu action devuelve { error } en el catch)
      if ("error" in response) {
        setErrors({ formError: response.error || "Error de red. Inténtalo nuevamente." });
        return;
      }

      // Respuesta HTTP no exitosa (400/409…)
      if (response.status !== 201) {
        const payload = response.data ?? {};
        setErrors(mapBackendErrors(payload));
        return;
      }

      // Éxito
      setErrors({});
      setFormData(initialData);
      setFormData((p) => ({ ...p, event: eventIdNum }));
      route.refresh();
      setOpenSuccess(true);

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo registrar. Inténtalo de nuevo.";
      setErrors({ formError: message });
    }
  };

  useEffect(() => {
    if (!eventId) return;            // sin eventId, no dispares
    let cancel = false;
    setLoading(true);

    (async () => {
      try {
        // Llama tu API/endpoint (no server action desde client)
        const res = await getEventPublic(eventIdNum);

        if (!res.ok) {
          if (!cancel) setErrors({ formError: `No se pudo cargar el evento (No autorizado).` });
          setLoading(false);
          return;
        }
        if (!res.event) {
          if (!cancel) setErrors({ formError: "No se encontró el evento." });
          setLoading(false);
          return;
        }
        setFormData((p) => ({ ...p, event: eventIdNum }));
        const event = res.event;
        const newEvent = [
          {
            id_event: eventIdNum,
            name: event.name
          }
        ]
        setLoading(false);
        if (!cancel) setEvents(newEvent);
      } catch (err) {
        if (!cancel) console.error("Error cargando eventos:", err);
        setErrors({ formError: "Hubo un error con el evento" });
        setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [eventIdNum, eventId]);

  return (
    <div className="min-h-screen inset-0 bg-purple/50 backdrop-blur-sm flex items-start justify-center z-50">

      <div className="w-full flex justify-center p-4 mt-10 mb-10">

        <form onSubmit={onSubmit} className="w-full flex justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl border border-purple-200">

            {/* Título */}
            <h2 className="text-xl sm:text-2xl font-bold text-purple-600 text-center mb-6 sm:mb-8">
              Crear Asistente
            </h2>
            {/* Errores */}
            <div>
              {errors.formError && (
                <p className="text-red-400 text-center">{errors.formError}</p>
              )}
            </div>

            <div>
              {loading && (
                <p className="text-gray-500 text-center">Cargando evento...</p>
              )}
              {!loading && events.length === 0 && (
                <p className="text-gray-500 text-center">No hay eventos disponibles.</p>
              )}
            </div>

            {
              events.length > 0 && (
                <>
                  {/* Inputs en Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {/* SELECT DE EVENTOS */}
                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">EVENTO</label>
                      <select
                        id="event"
                        name="event"
                        value={eventIdNum}
                        onChange={inputChangeHandler}
                        disabled={true}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 bg-gray-200 cursor-not-allowed"
                      >
                        {events.map((ev) => (
                          <option key={ev.id_event} value={ev.id_event}>
                            {ev.name}
                          </option>
                        ))}
                      </select>
                      {errors.event && (
                        <span className="text-red-400 text-sm mt-1">
                          {errors.event}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">
                        TIPO DE IDENTIFICACION
                      </label>
                      <select
                        id="identification_type"
                        name="identification_type"
                        value={formData.identification_type}
                        onChange={inputChangeHandler}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      >
                        <option value="">Seleccione...</option>
                        {ID_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </select>
                    </div>


                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">NÚMERO DE IDENTIFICACION</label>
                      <input
                        type="tel"
                        id="identification_number"
                        name="identification_number"
                        inputMode="numeric"
                        value={formData.identification_number}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, identification_number: e.target.value.replace(/\D/g, '').slice(0, 20) }))
                        }
                        maxLength={20}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {(formData.identification_number?.length ?? 0)}/20
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">NOMBRE</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        autoComplete="off"
                        maxLength={200}
                        value={formData.name}
                        onChange={inputChangeHandler}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      />
                      {
                        errors.name && <span className="text-red-300">{errors.name}</span>
                      }
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {(formData.name?.length ?? 0)}/200
                      </div>
                    </div>


                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">CELULAR</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        inputMode="numeric"
                        maxLength={20}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 20) }))
                        }
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      />
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {(formData.phone?.length ?? 0)}/20
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">NOMBRE EMPRESA</label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={inputChangeHandler}
                        maxLength={60}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      />
                      {
                        errors.company_name && <span className="text-red-300">{errors.company_name}</span>
                      }
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {(formData.company_name?.length ?? 0)}/60
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">CORREO</label>
                      <input
                        type="text"
                        id="email"
                        name="email"
                        maxLength={60}
                        value={formData.email}
                        onChange={inputChangeHandler}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      />
                      {
                        errors.email && <span className="text-red-300">{errors.email}</span>
                      }
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {(formData.email?.length ?? 0)}/60
                      </div>
                    </div>

                    {/* 👇 Select de Asistencia: VIRTUAL / PRESENCIAL */}
                    <div className="flex flex-col">
                      <label className="text-gray-400 font-semibold mb-1">
                        ASISTENCIA
                      </label>
                      <select
                        id="asistencia"
                        name="asistencia"
                        value={formData.asistencia}
                        onChange={inputChangeHandler}
                        className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                      >
                        <option value="">Seleccione Asistencia</option>
                        {ASISTENCIA_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Botones */}
                  <div className="mt-8 flex justify-center gap-4">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Registrar Asistente
                    </button>
                  </div>
                </>
              )
            }

          </div>
        </form>
      </div>

      {/* Success register Modal */}
      <SuccessModal
        isOpen={openSuccess}
        onClose={() => setOpenSuccess(false)}
        title="Registro Exitoso"
        message="El asistente se ha registrado correctamente."
        autoCloseMs={5000}
      />
    </div>
  )
}