import { Event } from "@/types/events";
import QRCode from "react-qr-code"

interface Props {
  qrValue?: string;
  attendee?: Asistencia;
  event: Event
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

export const HtmlQr = ({ qrValue, attendee, event }: Props) => {
  // console.log(attendee)
  return (
    <>
      <div className="max-w-[360px] rounded-xl bg-gradient-to-b from-[#0f172a] to-[#1e293b] p-1">
        <div className="max-w-[360px] bg-white border-2 overflow-hidden shadow-2xl">
          {/* Image */}
          <div className="h-[180px] bg-center bg-cover bg-no-repeat bg-[url('https://placehold.org/600x250/1e40af/FFFFFF?text=Auditoria-Test')]">
          </div>

          {/* Cuerpo */}
          <div className="text-center py-[12px] px-[24px]">
            <h2 className="text-lg font-semibold">Entrada Digital</h2>
            <p className="m-[6px 0 20px 0] text-sm text-[#475569] pb-[16px]">Presenta este código QR en el acceso al evento</p>
            <QRCode
              value={qrValue || ' '}
              size={240}
              style={{ height: '200px', maxWidth: '200px', margin:"0 auto" }}
            />
            {/* <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=Estefania+Alcaraz+-+VII+Congreso+de+Auditoria" alt="QR test" className="w-[160px] h-[160px] mx-auto" /> */}
          </div>

          {/* Datos */}

          <div className="bg-[#f9fafb] pt-[24px] border-t-2 border-[#e2e8f0] border-solid text-center pb-6">
            <div>
              <span>
                <strong>Nombre:</strong>
                <p>{attendee?.name ?? attendee?.name}</p>
              </span>

              <span>
                <strong>Evento:</strong>
                <p>{event.name ?? event.name}</p>
              </span>
            </div>
          </div>

          {/* Pie */}
          <div className="bg-[#0f172a] p-[16px]">
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }} className="text-center">
              © 2025 Aliatic S.A.S. Todos los derechos reservados.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}