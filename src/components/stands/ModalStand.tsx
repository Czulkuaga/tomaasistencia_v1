import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { POSTCreateStands } from "@/actions/feature/stands-action"
import { GETEvents } from "@/actions/feature/event-action"
import { GETEncuesta } from "@/actions/survey/survey-action"
import { useRouter } from "next/navigation";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Stands {
    // id_bp?: string;
    name?: string;
    description?: string;
    company_name?: string
    location: string
    event: string
    survey: string
    qr_code: string;
    is_scoring: boolean;
    // is_active: boolean;
}



const initialData = {
    // id_bp: "",
    name: "",
    description: "",
    company_name: "",
    location: "",
    qr_code: "",
    event: "",
    survey: "",
    is_scoring: false,
    // is_active: false
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

export default function ModalStand({
    isOpen,
    onClose
}: ModalProps) {
    const route = useRouter();

    const [formData, setFormData] = useState<Stands>(initialData);
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
        const target = e.target as HTMLInputElement;
        const { name, type } = target;

        const value =
            type === "checkbox"
                ? target.checked
                : target.value;

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
                const res = await POSTCreateStands({ ...formData, token });


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
            {isOpen && (
                <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-full h-full flex items-start justify-center p-4 pt-20 overflow-y-auto">

                        <div>
                            {errors.formError && (
                                <p className="text-red-300 text-center mb-2">{errors.formError}</p>
                            )}
                        </div>

                        <form onSubmit={onSubmit} className="w-full max-w-3xl">
                            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full">
                                {/* Título */}
                                <h2 className="text-xl sm:text-2xl font-bold text-violet-600 text-center mb-6 sm:mb-8">
                                    Crear Stands
                                </h2>

                                {/* Inputs en Grid */}
                                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-4 gap-y-4">
                                    {/* SELECT DE EVENTOS */}
                                    <div className="flex flex-col">
                                        <label className="text-gray-400 font-semibold mb-1">EVENTO</label>
                                        <select
                                            id="event"
                                            name="event"
                                            value={formData.event ?? ""}
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
                                            value={formData.survey}
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
                                            className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.name?.length ?? 0)}/60
                                        </div>
                                        <p className="text-violet-500 text-xs">{errors.nameError ?? errors.nameError}</p>
                                    </div>

                                    {/* Descripción */}
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-gray-400 font-semibold mb-1">NOMBRE DE EMPRESA</label>
                                        <input
                                            type="text"
                                            id="company_name"
                                            name="company_name"
                                            value={formData.company_name}
                                            maxLength={100}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.company_name?.length ?? 0)}/100
                                        </div>
                                    </div>

                                    {/* Descripcion */}
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-gray-400 font-semibold mb-1">DESCRIPCIÓN</label>
                                        <textarea

                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={inputChangeHandler}
                                            maxLength={255}
                                            className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                            placeholder="Máximo 255 caracteres"
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.description?.length ?? 0)}/255
                                        </div>

                                    </div>
                                    <div className="flex flex-col sm:col-span-2">
                                        <label className="text-gray-400 font-semibold mb-1">LUGAR</label>
                                        <input
                                            type="text"
                                            id="location"
                                            name="location"
                                            maxLength={100}
                                            value={formData.location}
                                            onChange={inputChangeHandler}
                                            className="px-3 py-2 border border-violet-100 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {(formData.location?.length ?? 0)}/100
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:col-span-2">
                                        <input
                                            id="is_scoring"
                                            name="is_scoring"
                                            type="checkbox"
                                            className="w-5 h-5 border rounded"
                                            checked={formData.is_scoring}        
                                            onChange={inputChangeHandler}        
                                        />
                                        <label htmlFor="is_scoring" className="block text-sm font-bold text-gray-900">
                                            Ponderable
                                        </label>
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
            )}
        </>


    );
}
