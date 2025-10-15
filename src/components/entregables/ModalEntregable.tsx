import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { POSTCreateDeliverables } from "@/actions/feature/deliverables-action"
import { GETEvents } from "@/actions/feature/event-action"
import {GETEncuesta} from "@/actions/survey/survey-action"
import { useRouter } from "next/navigation";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Activity {
    // id_bp?: string;
    name?: string;
    description?: string;
    place?: string
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    event: string
    survey: string
    qr_code: string;
}



const initialData = {
    // id_bp: "",
    name: "",
    description: "",
    place: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    qr_code: "",
    event: "",
    survey: ""
}

interface EventItem {
    id_event: number;
    name: string;
}

interface Survey {
    id_survey: number;
    name: string;
}


interface FormErrors {
    formError?: string,
    [key: string]: string | undefined
}

export default function ModalEntregable({
    isOpen,
    onClose,
}: ModalProps) {

    const router = useRouter();

    const [formData, setFormData] = useState<Activity>(initialData);
    const [errors, setErrors] = useState<FormErrors>({})
    const [events, setEvents] = useState<EventItem[]>([]);
    const [encuesta, setEncuesta] = useState<Survey[]>([]);
    

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

    useEffect(() => {
        if (isOpen) {
            const fetchEncuesta = async () => {
                try {
                    const token = (getCookie("authToken") as string) || "";
                    const res = await GETEncuesta({ token });
                    if (res && Array.isArray(res.results)) {
                        setEncuesta(res.results);
                    }
                } catch (error) {
                    console.error("Error cargando eventos:", error);
                }
            };
            fetchEncuesta();
        }
    }, [isOpen]);


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
          if (formData.event?.length === 0) {
            newErrors.eventError = "Debes seleccionar un evento"
        }
        if (formData.name?.length === 0) {
            newErrors.nameError = "El campo nombre es requerido"
        }
        if (Object.keys(newErrors).length === 0) {
            try {
                const token = (getCookie("authToken") as string) || "";
                const res = await POSTCreateDeliverables({ ...formData, token });

                if (res.error) {
                    return setErrors({ formError: res.error });
                }

                setFormData(initialData);
                onClose();
                router.refresh();

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
                <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-40 z-50">
                    <div className="w-full h-full flex items-start justify-center p-4 pt-20 overflow-y-auto">

                        <div>
                            {errors.formError && (
                                <p className="text-red-300 text-center mb-2">{errors.formError}</p>
                            )}
                        </div>

                        <form onSubmit={onSubmit} className="w-full max-w-3xl">
                            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full border border-purple-200">
                                {/* Título */}
                                <h2 className="text-xl sm:text-2xl font-bold text-purple-600 text-center mb-6 sm:mb-8">
                                    Crear Entregable
                                </h2>

                                {/* Inputs en Grid */}
                                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-4 gap-y-4">
                                    {/* SELECT DE EVENTOS */}
                                    <div className="flex flex-col">
                                        <label className="text-gray-400 font-semibold mb-1">EVENTO</label>
                                        <select
                                            id="event"
                                            name="event"
                                            value={formData.event}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        >
                                            <option value="">Seleccione un evento</option>
                                            {events.map((ev) => (
                                                <option key={ev.id_event} value={ev.id_event}>
                                                    {ev.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div>
                                            <p className="text-violet-500 text-xs">{errors.eventError ?? errors.eventError}</p>
                                        </div>
                                    </div>


                                    {/* SELECT DE ENCUESTA */}
                                    <div className="flex flex-col">
                                        <label className="text-gray-400 font-semibold mb-1">ENCUESTA</label>
                                        <select
                                            id="survey"
                                            name="survey"
                                            value={formData.survey ?? ""}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        >
                                            <option value="">Seleccione una Encuesta</option>
                                            {encuesta.map((en) => (
                                                <option key={en.id_survey} value={en.id_survey}>
                                                    {en.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>


                                    {/* Nombre */}
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-gray-400 font-semibold mb-1">NOMBRE</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            maxLength={60}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                         <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.name?.length ?? 0)}/60
                                        </div>
                                        <p className="text-violet-500 text-xs">{errors.nameError ?? errors.nameError}</p>
                                    </div>

                                    {/* Descripción */}
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-gray-400 font-semibold mb-1">DESCRIPCION</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            maxLength={255}
                                            value={formData.description}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.description?.length ?? 0)}/255
                                        </div>
                                    </div>

                                    {/* Lugar */}
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-gray-400 font-semibold mb-1">LUGAR</label>
                                        <input
                                            type="text"
                                            id="place"
                                            name="place"
                                            value={formData.place}
                                            maxLength={100}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.place?.length ?? 0)}/100
                                        </div>
                                    </div>

                                    {/* Fechas y horas */}
                                    <div className="flex flex-col">
                                        <label className="text-gray-400 font-semibold mb-1">FECHA INICIO</label>
                                        <input
                                            type="date"
                                            id="start_date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                                            className="px-3 py-2 border border-purple-300 rounded-lg text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
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
            )}
        </>


    );
}
