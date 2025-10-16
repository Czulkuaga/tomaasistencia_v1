"use client"

import { Event } from "@/types/events";
import { useEffect, useState } from "react";
import { HtmlQr } from "./HtmlQr";
import { GETEventDetail } from "@/actions/feature/event-action";
import { SENDQrByEmail } from "@/actions/feature/asistencia-action";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    qrValue?: string;
    attendee?: Asistencia;
}

interface FormErrors {
    formError?: string,
    [key: string]: string | undefined
}

type Asistencia = {
    id_asistente?: number;
    identification_type?: string;
    identification_number?: string;
    name?: string;
    country?: string;
    phone?: number;
    company_name?: string;
    email?: string;
    qr_code: string;
    token?: string;
    event?: number;
    start_time?: string;
    is_active?: boolean;
    asistencia?: string;
}

export const ModalSendQrByEmail = ({ onClose, token, qrValue, attendee }: Props) => {

    const [errors, setErrors] = useState<FormErrors>({})
    const [eventData, setEventData] = useState<Event | null>(null)
    const [load,setLoad] = useState(false)

    const htmlToSend = `
        <!doctype html>
    `

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoad(true)

        const formData = {
            attendee_id:attendee?.id_asistente,
            subject: `Evento: ${eventData?.name}`,
            attach_qr_png: true,
            extra_to:null,
            html: htmlToSend
        }

        try {
            await SENDQrByEmail(formData, token)
            onClose()
            setLoad(false)
        } catch (error) {
            console.log(error)
            setErrors({ formError: "Error al enviar el QR" })
            setLoad(false)
        }
    }

    useEffect(() => {
        setErrors({})
        setLoad(true)
        const eventById = async function event(eventId: number, token: string) {
            try {
                const res = await GETEventDetail(eventId, token)
                // console.log(res)
                setEventData(res)
                setLoad(false)
            } catch (error) {
                console.log(error)
                setErrors({ formError: "Hubo un error al traer el evento" })
                setLoad(false)
            }
        }
        if (attendee?.event) {
            eventById(attendee?.event, token)
        }
    }, [attendee?.event, token])

    return (
        <>
            <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">

                <div className="flex justify-center p-4 mt-10">
                    <div>
                        {errors.formError && (
                            <p className="text-red-300">{errors.formError}</p>
                        )}
                    </div>

                    <form onSubmit={onSubmit} className="w-full flex justify-center">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl border border-purple-200">

                            <div className="mt-8 grid grid-cols-1">
                                <div>
                                    {
                                        load && (
                                            <p>Cargando…</p>
                                        )
                                    }
                                </div>
                                <div>
                                    {
                                        eventData && (
                                            <HtmlQr
                                                qrValue={qrValue}
                                                attendee={attendee}
                                                event={eventData}
                                            />
                                        )
                                    }

                                </div>
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
                                    disabled={load}
                                >
                                    Enviar Mail
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        </>
    )
}