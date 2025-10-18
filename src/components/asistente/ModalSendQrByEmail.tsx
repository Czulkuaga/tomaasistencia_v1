"use client"

import { Event, EventImage } from "@/types/events";
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

// const minifyHtml = (s: string) =>
//   s.replace(/>\s+</g, '><')      // quita espacios entre tags
//     .replace(/\s{2,}/g, ' ')      // colapsa espacios múltiples
//     .trim();

function makeTicketHtml({ nombre, evento, qrUrl, bannerUrl }: {
  nombre: string; evento: string; qrUrl: string; bannerUrl: EventImage;
}) {
  return `<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Entrada digital</title><!-- Fuente Poppins (compatible con Gmail, Apple Mail, etc.) --><link href=\"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap\" rel=\"stylesheet\"></head><body style=\"margin:0; padding:0; background-color:#0f172a; font-family:'Poppins', Arial, sans-serif;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%); padding:30px 0;\"><tr><td align=\"center\"><table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"360\" style=\"max-width:360px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.25);\"><tr><td style=\"background:url('${bannerUrl}') no-repeat center/cover; height:180px;\"><div style=\"height:180px; display:block;\"></div></td></tr><tr><td style=\"padding:24px 24px 12px 24px; text-align:center; color:#0f172a;\"><h2 style=\"margin:0; font-size:18px; font-weight:600;\">Entrada Digital</h2><p style=\"margin:6px 0 20px 0; font-size:14px; color:#475569;\">Presenta este código QR en el acceso al evento</p>QRField</td></tr><tr><td style=\"padding:20px 24px 24px 24px; background:#f9fafb; border-top:1px solid #e2e8f0; text-align:center;\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-size:14px; color:#111827;\"><tr><td style=\"padding-bottom:8px;\"><strong>Nombre:</strong><br>${nombre}</td></tr><tr><td style=\"padding-bottom:8px;\"><strong>Evento:</strong><br>${evento}</td></tr></table></td></tr><tr><td align=\"center\" style=\"background:#0f172a; padding:16px;\"><p style=\"margin:0; font-size:12px; color:#94a3b8;\">©️ 2025 Aliatic S.A.S. Todos los derechos reservados.</p></td></tr></table></td></tr></table></body></html>`;
}

export const ModalSendQrByEmail = ({ onClose, token, qrValue, attendee }: Props) => {

  const [errors, setErrors] = useState<FormErrors>({})
  const [eventData, setEventData] = useState<Event | null>(null)
  const [load, setLoad] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string|null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoad(true)
    setErrors({})

    const html = makeTicketHtml({
      nombre: attendee?.name || "",
      evento: eventData?.name ?? '',
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=Estefania+Alcaraz+-+VII+Congreso+de+Auditoria",
      bannerUrl: eventData?.event_image ?? 'https://placehold.org/600x250/1e40af/FFFFFF?text=Auditoria-Test'
    });

    const formData = {
      attendee_id: attendee?.id_asistente,
      subject: `Evento: ${eventData?.name}`,
      attach_qr_png: true,
      generate_pdf:false,
      extra_to: null,
      html: html
    }

    try {
      const res = await SENDQrByEmail(formData, token)
      if (res.ok === false && res.status === 400) {
        setErrors({ formError: `Error al enviar QR al mail. Estado:${res.status} Mensaje:${res.message}` })
        setLoad(false)
      }
      if (res.ok === true && res.status === 200) {
        setLoad(false)
        setSuccessMessage(res.message)
        setTimeout(() => {
          onClose()
        },4000)
      }
      if(res.ok === false && res.status === 500){
        throw Error("Internal Server Error")
      }
      // console.log(res)
      // onClose()
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

          <form onSubmit={onSubmit} className="w-full flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl border border-purple-200">

              <div className="mt-8 grid grid-cols-1">
                <div className="mb-2">
                  {errors.formError && (
                    <p className="text-red-300">{errors.formError}</p>
                  )}
                </div>
                
                <div className="mb-2">
                  {successMessage && (
                    <p className="text-blue-600">{successMessage}</p>
                  )}
                </div>

                <div>
                  {
                    load && (
                      <p>Cargando…</p>
                    )
                  }
                </div>
                <div className="flex justify-center">
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