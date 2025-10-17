"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { POSTCreateEvent } from "@/actions/feature/event-action";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

interface Events {
  name?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  total_scoring_stands?: string,
  total_scoring_activities?: string,
  is_active: boolean;
  is_public_event?: boolean;
}

const initialData = {
  // id_bp: "",
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
  total_scoring_stands: "",
  total_scoring_activities: "",
  is_active: true,
  is_public_event: false,
}

interface FormErrors {
  formError?: string,
  [key: string]: string | undefined
}


export default function ModalCreate({
  isOpen,
  onClose,
  token
}: ModalProps) {
  const route = useRouter()

  const [formData, setFormData] = useState<Events>(initialData);
  const [errors, setErrors] = useState<FormErrors>({})

  const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setErrors({})
    const target = e.target;
    const value: string = target.value;
    const name = target.name;
    setFormData(form => {
      return {
        ...form,
        [name]: value
      }
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {}
    if (formData.name === "") newErrors.name = 'El nombre es obligatorio';
    if (Object.keys(newErrors).length === 0) {
      try {
        if (!token) throw new Error("Token no proporcionado");
        const res = await POSTCreateEvent(token, formData);

        if (res.error) {
          return setErrors({ formError: res.error });
        }

        setFormData(initialData);
        onClose();
        route.refresh();

      } catch (error: unknown) {
        console.error("Error en la solicitud:", error);
        if (error instanceof Error) {
          console.error("Error Message:", error.message);
          setErrors({ formError: error.message });
        } else {
          console.log("Unknown Error:", error);
        }
      }
    } else {
      setErrors(newErrors);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-full h-full flex items-start justify-center p-4 pt-20 overflow-y-auto">

          <div>
            {errors.formError && (
              <p className="text-red-300 text-center mb-2">{errors.formError}</p>
            )}
          </div>

          <form onSubmit={onSubmit} className="w-full max-w-3xl">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full border border-purple-200">
              {/* Título */}
              <h2 className="text-xl sm:text-2xl font-bold text-violet-600 text-center mb-6 sm:mb-8">
                Crear Evento
              </h2>

              {/* Inputs en Grid */}
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-4 gap-y-4">
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-gray-400 font-semibold mb-1">NOMBRE</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    maxLength={60}
                    value={formData.name}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.name?.length ?? 0)}/60
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[13px] font-semibold text-gray-400 mb-1">DESCRIPCIÓN</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={inputChangeHandler}
                    maxLength={255}
                    rows={4}
                    className="w-full px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Máximo 255 caracteres"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.description?.length ?? 0)}/255
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">PAIS</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    maxLength={30}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.country?.length ?? 0)}/30
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">ESTADO</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    maxLength={30}
                    value={formData.state}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.state?.length ?? 0)}/30
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">CIUDAD</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    maxLength={20}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.city?.length ?? 0)}/20
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">DIRECCION</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    maxLength={45}
                    value={formData.address}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.address?.length ?? 0)}/45
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">FECHA INICIO</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">FECHA FIN</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">HORA INICIO</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">HORA FIN</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">TOTAL ACTIVIDADES</label>
                  <input
                    type="number"
                    id="total_scoring_activities"
                    name="total_scoring_activities"
                    maxLength={10}
                    value={formData.total_scoring_activities}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.address?.length ?? 0)}/45
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-gray-400 font-semibold mb-1">TOTAL STANDS</label>
                  <input
                    type="number"
                    id="total_scoring_stands"
                    name="total_scoring_stands"
                    maxLength={10}
                    value={formData.total_scoring_stands}
                    onChange={inputChangeHandler}
                    className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {(formData.address?.length ?? 0)}/45
                  </div>
                </div>

                {/* Activo */}
                <div className="flex items-center gap-2 col-span-2 mt-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    className="w-5 h-5 border rounded"
                    checked={formData.is_active}
                    onChange={inputChangeHandler}
                  />
                  <label className="text-sm font-medium text-gray-700">Activo</label>
                </div>

                {/* Público */}
                <div className="flex items-center gap-2 col-span-2 mt-2">
                  <input
                    type="checkbox"
                    name="is_public_event"
                    className="w-5 h-5 border rounded"
                    checked={formData.is_public_event}
                    onChange={inputChangeHandler}
                  />
                  <label className="text-sm font-medium text-gray-700">Público</label>
                </div>
              </div>

              {/* Botones */}
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </>
  )

}
