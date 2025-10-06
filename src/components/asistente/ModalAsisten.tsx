"use client";
import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { POSTCreateAsiste } from "@/actions/feature/asistencia-action"
import { GETEvents } from "@/actions/feature/event-action"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTypes: () => void;
}

interface Asistente {
  id_bp?: string;
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


interface FormErrors {
  formError?: string,
  [key: string]: string | undefined
}

const ID_TYPE_OPTIONS = [
  { value: "CC" },
  { value: "NIT" },
  { value: "PAS" },
  { value: "CE" },
];

const ASISTENCIA_OPTIONS = [{ value: "PRESENCIAL" }, { value: "VIRTUAL" }];

export default function ModalAsisten({
  isOpen,
  onClose,
  refreshTypes,
}: ModalProps) {

  const [formData, setFormData] = useState<Asistente>(initialData);
  const [errors, setErrors] = useState<FormErrors>({})
  const [events, setEvents] = useState<EventItem[]>([]);

  // cargar eventos cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      const fetchEvents = async () => {
        try {
          const token = (getCookie("authToken") as string) || "";
          const res = await GETEvents({ token });
          if (res && Array.isArray(res.results)) {
            setEvents(res.results);
          }
        } catch (error) {
          console.error("Error cargando eventos:", error);
        }
      };
      fetchEvents();
    }
  }, [isOpen]);


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
    const newErrors: FormErrors = {}
    if (!formData.event || formData.event === 0) newErrors.event = 'El Evento es obligatorio';
    if (formData.name === "") newErrors.name = 'El Nombre es obligatorio';
    if (formData.company_name === "") newErrors.company_name = 'El Nombre Empresa es obligatorio';
    if (formData.email === "") newErrors.email = 'El Correo es obligatorio';

    if (Object.keys(newErrors).length === 0) {
      
      const newformData = { ...formData, email: formData.email?.toLowerCase()}
      console.log("datos",newformData)
      try {
        const token = (getCookie("authToken") as string) || "";
        // ✅ pasa el payload dentro de "data"
        const res = await POSTCreateAsiste({ token, data: newformData });


        if (res.error) {
          return setErrors({ formError: res.error });
        }

        setFormData(initialData);
        onClose();
        refreshTypes();

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
      {isOpen && (
        <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="w-full flex justify-center p-4 mt-10">
            <div>
              {errors.formError && (
                <p className="text-red-300">{errors.formError}</p>
              )}
            </div>

            <form onSubmit={onSubmit} className="w-full flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl border border-purple-200">

                {/* Título */}
                <h2 className="text-xl sm:text-2xl font-bold text-purple-600 text-center mb-6 sm:mb-8">
                  Crear Asistente
                </h2>

                {/* Inputs en Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {/* SELECT DE EVENTOS */}
                  <div className="flex flex-col">
                    <label className="text-gray-400 font-semibold mb-1">EVENTO</label>
                    <select
                      id="event"
                      name="event"
                      value={formData.event}
                      onChange={inputChangeHandler}
                      className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                    >
                      <option value={0}>Seleccione un evento</option>
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

                  {/* <div className="flex flex-col">
              <label className="text-gray-400 font-semibold mb-1">QR</label>
              <input
                type="text"
                id="qr_code"
                name="qr_code"
                value={formData.qr_code}
                onChange={inputChangeHandler}
                className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div> */}


                </div>

                {/* Botones */}
                <div className="mt-8 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

}

