"use client"

import { PUTActivity } from '@/actions/feature/activity-action';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

interface ActivityEventProps {
    setEditModal: React.Dispatch<React.SetStateAction<boolean>>;
    selectedActivity: Activity | null;
    setSelectedActivity: React.Dispatch<React.SetStateAction<Activity | null>>;
    idevent: EventItem[];
    idencuesta: Survey[];
}

interface Activity {
    id_actividad: number
    name: string;
    description: string
    place: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    event: number
    survey: number;
    qr_code: string;
    is_active: boolean
    is_scoring: boolean
}

interface Survey {
    id_survey: number;
    name: string;
}

interface EventItem {
    id_event: number;
    name: string;
}

type FormState = {
    event: number | "";
    survey: number | "";
    name: string;
    description: string;
    place: string;
    start_date: string; // "YYYY-MM-DD"
    end_date: string;   // "YYYY-MM-DD"
    start_time: string; // "HH:MM"
    end_time: string;   // "HH:MM"
    is_active: boolean;
    is_scoring: boolean;
};

type FormFieldName = keyof FormState;

// Helper: convierte el estado del form al payload esperado por tu API (PATCH)
// - Omite campos vacíos cuando aplique ("" -> no enviar)
// - Convierte event/survey a string si backend los espera así
const mapFormToPayload = (f: FormState): Record<string, unknown> => {
    const p: Record<string, unknown> = {
        name: f.name?.trim(),
        description: f.description?.trim() || "",
        place: f.place?.trim() || "",
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        start_time: f.start_time || null,
        end_time: f.end_time || null,
        is_active: f.is_active,
        is_scoring: f.is_scoring,
    };

    // event / survey: admite vacío
    if (f.event !== "" && typeof f.event === "number") {
        p.event = String(f.event); // si tu backend quiere number, usa Number(f.event)
    }
    if (f.survey !== "" && typeof f.survey === "number") {
        p.survey = String(f.survey); // idem comentario arriba
    }

    // Limpieza: elimina claves con undefined
    Object.keys(p).forEach((k) => {
        if (p[k] === undefined) delete p[k];
    });

    return p;
};

export const ModalEditActivity = ({ setEditModal, selectedActivity, setSelectedActivity, idevent, idencuesta }: ActivityEventProps) => {
    const route = useRouter()
    
    //States
    const [contador, setContador] = useState(0);
    const [contadorname, setContadorName] = useState(0);
    const [contadorlugar, setContadorLugar] = useState(0);
    // Estado local del formulario
    const [form, setForm] = useState<FormState>({
        event: selectedActivity?.event ?? "",
        survey: selectedActivity?.survey ?? "",
        name: selectedActivity?.name ?? "",
        description: selectedActivity?.description ?? "",
        place: selectedActivity?.place ?? "",
        start_date: selectedActivity?.start_date ?? "",
        end_date: selectedActivity?.end_date ?? "",
        start_time: selectedActivity?.start_time ?? "",
        end_time: selectedActivity?.end_time ?? "",
        is_active: Boolean(selectedActivity?.is_active),
        is_scoring: Boolean(selectedActivity?.is_scoring),
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitOk, setSubmitOk] = useState(false);

    //Functions
    const onClose = () => {
        setEditModal(false);
        setSelectedActivity(null);
    }

    // onChange único para todos los campos
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, type } = e.target;
        const key = name as FormFieldName;

        // 1) Checkboxes
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm(prev => ({ ...prev, [key]: checked }));
            return;
        }

        // 2) Selects numéricos (event, survey) — permiten "" (vacío)
        if (key === "event" || key === "survey") {
            const raw = e.target.value;
            const asNumberOrEmpty = raw === "" ? "" : Number(raw);
            setForm(prev => ({ ...prev, [key]: asNumberOrEmpty }));
            return;
        }

        // 3) Textos / fechas / horas
        const value = e.target.value;

        setForm(prev => ({ ...prev, [key]: value }));

        // Actualizamos contadores donde aplique
        if (key === "name") setContadorName(value.length);
        if (key === "description") setContador(value.length);
        if (key === "place") setContadorLugar(value.length);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        setSubmitOk(false);

        try {
            // 1) token
            const token = (getCookie("authToken") as string) || "";
            if (!token) {
                throw new Error("No hay token de autenticación (authToken).");
            }

            // 2) id_actividad (de selectedActivity)
            const idActividad = selectedActivity?.id_actividad;
            if (!idActividad) {
                throw new Error("No se encontró el id_actividad de la actividad a actualizar.");
            }

            // 3) payload
            const updatedData = mapFormToPayload(form);

            // 4) PUT/PATCH
            const res = await PUTActivity(idActividad, token, updatedData);

            // 5) Manejo de respuesta
            // Ajusta estas condiciones a tu backend (DRF normalmente envía el objeto actualizado o {detail: ...} en error)
            if (!res || res.error || res.detail) {
                const msg =
                    res?.error ||
                    res?.detail ||
                    res?.message ||
                    "No se pudo actualizar la actividad.";
                throw new Error(msg);
            }

            // Si el backend devuelve la actividad actualizada, sincronizamos el estado del padre
            // (usa res tal cual o mergea con lo que mantienes en selectedActivity)
            setSelectedActivity((prev) => (prev ? { ...prev, ...res } : prev));

            setSubmitOk(true);

            // Opcional: cerrar modal tras éxito
            onClose();
            route.refresh(); // Refrescamos la página para ver los cambios reflejados
        } catch (err: any) {
            setSubmitError(
                typeof err?.message === "string"
                    ? err.message
                    : "Error al enviar el formulario. Intenta nuevamente."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Si cambia la actividad seleccionada, refrescamos el form
    useEffect(() => {
        setForm({
            event: selectedActivity?.event ?? "",
            survey: selectedActivity?.survey ?? "",
            name: selectedActivity?.name ?? "",
            description: selectedActivity?.description ?? "",
            place: selectedActivity?.place ?? "",
            start_date: selectedActivity?.start_date ?? "",
            end_date: selectedActivity?.end_date ?? "",
            start_time: selectedActivity?.start_time ?? "",
            end_time: selectedActivity?.end_time ?? "",
            is_active: Boolean(selectedActivity?.is_active),
            is_scoring: Boolean(selectedActivity?.is_scoring),
        });

        setContadorName(selectedActivity?.name?.length ?? 0);
        setContador(selectedActivity?.description?.length ?? 0);
        setContadorLugar(selectedActivity?.place?.length ?? 0);
    }, [selectedActivity]);

    return (
        <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
            <form
                onSubmit={(e) => { handleUpdate(e) }}
                className="
        bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8 relative
        max-h-[90vh] overflow-y-auto
      "
            >
                <h2 className="text-2xl font-bold text-violet-600 mb-6 text-center">
                    Editar Actividad
                </h2>

                {/* Grid de Inputs */}
                <div className="grid grid-cols-2 gap-4">

                    {/* Evento */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Evento
                        </label>
                        <select
                            name="event"
                            value={form.event === "" ? "" : Number(form.event)}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        >
                            {idevent.map((eve) => (
                                <option key={eve.id_event} value={eve.id_event}>
                                    {eve.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/*Encuestas*/}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Encuesta
                        </label>
                        <select
                            name="survey"
                            value={form.survey === "" ? "" : Number(form.survey)}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        >
                            <option value="">-- Selecciona una encuesta --</option> {/* 👈 opción por defecto */}
                            {idencuesta.map((eve) => (
                                <option key={eve.id_survey} value={eve.id_survey}>
                                    {eve.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Nombre */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Nombre
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            maxLength={100}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {contadorname}/100
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            rows={3}
                            maxLength={255}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {contador}/255
                        </div>
                    </div>

                    {/* Lugar */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Lugar
                        </label>
                        <input
                            name="place"
                            value={form.place}
                            maxLength={100}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {contadorlugar}/100
                        </div>
                    </div>

                    {/* Fechas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Fecha de inicio
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            value={form.start_date}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Fecha de fin
                        </label>
                        <input
                            type="date"
                            name="end_date"
                            value={form.end_date}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        />
                    </div>

                    {/* Horas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Hora de inicio
                        </label>
                        <input
                            type="time"
                            name="start_time"
                            value={form.start_time}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Hora de fin
                        </label>
                        <input
                            type="time"
                            name="end_time"
                            value={form.end_time}
                            onChange={handleChange}
                            className="w-full border border-purple-100 rounded-lg p-2 focus:ring-2 focus:ring-violet-400 text-gray-800"
                        />
                    </div>



                    {/* Activo */}
                    <div className="flex items-center gap-2 col-span-2 mt-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleChange}
                            className="w-5 h-5 border rounded"

                        />
                        <label className="text-sm font-medium text-gray-400">Activo</label>
                    </div>

                    {/*is_scoring  */}
                    <div className="flex items-center gap-2 col-span-2 mt-2">
                        <input
                            type="checkbox"
                            name="is_scoring"
                            checked={form.is_scoring}
                            onChange={handleChange}
                            className="w-5 h-5 border rounded"
                        />
                        <label className="text-sm font-medium text-gray-400">Ponderable</label>
                    </div>
                </div>

                {/* Mensajes de envío */}
                {submitError && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                        {submitError}
                    </div>
                )}
                {submitOk && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm px-3 py-2">
                        Actividad actualizada correctamente.
                    </div>
                )}

                {/* Botones */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg border border-purple-300 text-purple-400 hover:bg-purple-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </div>
    )
}