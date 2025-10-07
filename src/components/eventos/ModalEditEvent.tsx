"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/types/events";
import { PATCHEvent } from "@/actions/feature/event-action";

type ModalEditEventProps = {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  token: string;
};

type EventForm = {
  name: string;
  description: string;
  country: string;
  state: string;
  city: string;
  address: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export default function ModalEditEvent({
  isOpen,
  onClose,
  event,
  token
}: ModalEditEventProps) {

  const [eventState, setEventState] = useState<EventForm>({
    name: "",
    description: "",
    country: "",
    state: "",
    city: "",
    address: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    is_active: false,
  });

  if (!isOpen || !event) return null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;

    let value: string | number | boolean = target.value;

    if (type === "checkbox") {
      value = target.checked;               // ✅ boolean real
    } else if (type === "number") {
      value = target.value === "" ? "" : Number(target.value);
    }

    setEventState((prev) => ({ ...prev, [name]: value as never }));
  }

  useEffect(() => {
    if (!event) return;
    setEventState({
      name: event.name ?? "",
      description: event.description ?? "",
      country: event.country ?? "",
      state: event.state ?? "",
      city: event.city ?? "",
      address: event.address ?? "",
      start_date: event.start_date ?? "",
      end_date: event.end_date ?? "",
      start_time: event.start_time ?? "",
      end_time: event.end_time ?? "",
      is_active: !!event.is_active,
    });
  }, [event, isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Previene que el click en el panel cierre el modal
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event?.id_event) return;

    const payload = eventState

    try {
      const res = await PATCHEvent(event?.id_event, token, payload);
      if (!res.ok) {
        throw new Error(`Error al actualizar el evento: ${res.status} ${res.error}`);
      }
      console.log("Update Event Response", res );
    } catch (error) {
      console.error("Error al actualizar el evento", error);
    }

    // onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onClick={stop}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-violet-600 mb-6 text-center">
          Editar Evento
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Nombre
            </label>
            <input
              name="name"
              value={eventState.name}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
              required
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={eventState.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>

          {/* País */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              País
            </label>
            <input
              name="country"
              value={eventState.country}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Estado
            </label>
            <input
              name="state"
              value={eventState.state}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>

          {/* Ciudad */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Ciudad
            </label>
            <input
              name="city"
              value={eventState.city}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>

          {/* Dirección */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Dirección
            </label>
            <input
              name="address"
              value={eventState.address}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>

          {/* Fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Fecha de inicio
            </label>
            <input
              type="date"
              name="start_date"
              value={eventState.start_date}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Fecha de fin
            </label>
            <input
              type="date"
              name="end_date"
              value={eventState.end_date}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
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
              value={eventState.start_time}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Hora de fin
            </label>
            <input
              type="time"
              name="end_time"
              value={eventState.end_time}
              onChange={handleChange}
              className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2 col-span-2 mt-2">
            <input
              type="checkbox"
              className="w-5 h-5 border rounded"
              checked={eventState.is_active}
              onChange={handleChange}
            />
            <label className="text-sm font-medium text-gray-700">Activo</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}