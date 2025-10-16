"use client"
import { useState, useEffect, useCallback, useTransition } from 'react'
import { getCookie } from "cookies-next";
import { DELETEAsistencia, PUTAsistencia } from "@/actions/feature/asistencia-action"
import { GETEvents } from "@/actions/feature/event-action"
import { MdDelete } from "react-icons/md";
import { IoQrCode } from "react-icons/io5";
import { FaUserEdit } from "react-icons/fa";
import ModalAsisten from './ModalAsisten';
import QRCode from 'react-qr-code';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EventSelector } from '../ui/EventSelector';
import { RiMailSendLine } from "react-icons/ri";
import { ModalSendQrByEmail } from './ModalSendQrByEmail';

interface AsistenteProps {
  initialData?: Asistencia[]
  initialPage?: number
  initialPageSize?: number
  initialSearch?: string
  totalPages?: number
  totalCount?: number
  initialEvent?: number | undefined
  token: string
}

interface Asistencia {
  // id_bp?: string;
  id_asistente?: number
  identification_type?: string
  identification_number?: string
  name?: string;
  country?: string;
  phone?: number;
  company_name?: string;
  email?: string;
  qr_code: string;
  token?: string;
  id_event?: number
  event?: number
  start_time?: string;
  is_active?: boolean;
  asistencia?: string;
}

const ASISTENCIA_OPTIONS = [{ value: "PRESENCIAL" }, { value: "VIRTUAL" }];

export default function Asisten({ initialData, initialPage, initialPageSize, initialSearch, totalPages, totalCount, initialEvent, token }: AsistenteProps) {

  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [term, setTerm] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();

  // const [asistente, setAsistente] = useState<Asistencia[]>([]);
  const [idevent, setIdEvent] = useState<{ id_event: number; name: string }[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [isCreateProdu, setIsCreateProdu] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [openModalSendEmailQR, setOpenModalSendEmailQR] = useState(false)
  const [selectedAsistente, setSelectedAsistente] = useState<Asistencia | null>(null);
  const [qrValue, setQrValue] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});

  // para contar el numero de caracteres de la descripcion
  const PHONE_MAX = 10;  // ajusta si quieres
  const ID_MAX = 20;
  const [contadorname, setContadorName] = useState<number>(selectedAsistente?.name?.length ?? 0);
  const [contadorPhone, setContadorPhone] = useState<number>(selectedAsistente?.phone?.toString().length ?? 0);
  const [contadorId, setContadorId] = useState<number>((selectedAsistente?.identification_number ?? "").toString().length ?? 0);

  // Util para construir/actualizar la querystring
  const setQuery = useCallback(
    (next: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(urlSearchParams?.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === undefined || v === "") params.delete(k);
        else params.set(k, String(v));
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, urlSearchParams]
  );

  // Buscar
  const handleSearch = useCallback(() => {
    setQuery({
      search: term.trim() || undefined,
      page: 1,
      pageSize: initialPageSize,
      event: initialEvent || undefined,  // 👈 aquí va
    });
  }, [term, initialEvent, setQuery, initialPageSize]);

  // Limpiar: quita search, conserva (o resetea) event
  const handleClear = useCallback(() => {
    setTerm("");
    setQuery({
      search: undefined,
      page: 1,
      pageSize: initialPageSize,
      event: initialEvent || undefined,  // 👈 mantiene filtro de evento
    });
  }, [initialEvent, setQuery, initialPageSize]);

  // Paginación
  const handlePreviousPage = useCallback(() => {
    if (initialPage && initialPage > 1) {
      setQuery({
        page: initialPage - 1,
        pageSize: initialPageSize,
        search: term.trim() || undefined,
        event: initialEvent || undefined, // 👈
      });
    }
  }, [initialPage, initialPageSize, term, initialEvent, setQuery]);

  const handleNextPage = useCallback(() => {
    if (initialPage && totalPages && initialPage < totalPages) {
      setQuery({
        page: initialPage + 1,
        pageSize: initialPageSize,
        search: term.trim() || undefined,
        event: initialEvent || undefined, // 👈
      });
    }
  }, [initialPage, totalPages, initialPageSize, term, initialEvent, setQuery]);

  const isFirst = initialPage ? initialPage <= 1 : true;
  const isLast = initialPage && totalPages ? initialPage >= totalPages : true;

  const GetEventosList = async () => {
    try {
      const token = getCookie("authToken") as string ?? "";
      if (!token) return;
      const response = await GETEvents({ token });
      setIdEvent(response.results);
    } catch (error) {
      console.error("Error fetching eventos:", error);
    }
  };
  useEffect(() => {
    GetEventosList();
  }, [])

  useEffect(() => {
    setContadorName(selectedAsistente?.name?.length ?? 0);
    setContadorPhone(selectedAsistente?.phone?.toString().length ?? 0);
    setContadorId((selectedAsistente?.identification_number ?? "").toString().length ?? 0);
  }, [selectedAsistente, editModal]);

  // metodo de eliminar
  const handledelete = async (id_asistente: number) => {
    try {
      const token = getCookie("authToken") as string || "";
      await DELETEAsistencia(id_asistente, token);
    } catch (error) {
      console.error("Error al eliminar el bp", error);
    }
  };
  // metodo de actulizar
  const handleUpdate = async (id_asistente: number, updatedData: FormData) => {
    try {
      const token = getCookie("authToken") as string || "";
      const jsonData = Object.fromEntries(updatedData.entries());
      // Llamamos al PUT
      const res = await PUTAsistencia(id_asistente, token, jsonData);
      if (res.message) {
        console.log("No se pudo actualizar la actividad.");
      }
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar la actividad", error);
    }
  };

  function handleQR(asistente: Asistencia) {
    setQrValue(asistente.qr_code || '');
    setSelectedAsistente(asistente);
    setQrModalOpen(true);
  }

  function openSendQrByEmail(asistente: Asistencia) {
    setQrValue(asistente.qr_code || '');
    setSelectedAsistente(asistente);
    setOpenModalSendEmailQR(true)
  }

  return (
    <section className="w-[90vw] md:w-[70vw] lg:w-[78vw] xl:w-[82vw] space-y-6 overflow-auto">
      <div className="flex flex-col gap-3">

        <h1 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">Asistente</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          ¡Inscríbete y participa en los eventos!
        </p>

        <div className='w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-400 text-md font-bold"
            onClick={() => setIsCreateProdu(true)}
          >
            + Crear Asistente
          </button>

          <div className="flex items-center flex-col md:flex-row gap-2 mb-4">
            <EventSelector
              options={idevent.map(e => ({ id: e.id_event, name: e.name }))}
              initialValue={initialEvent}
            />

            <div>
              <input
                type="text"
                placeholder="Buscar"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-64 border border-violet-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
              />
              <button
                onClick={handleSearch}
                disabled={isPending}
                className="px-3 py-2 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? "Buscando…" : "Buscar"}
              </button>

              {!!term && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
                >
                  Limpiar
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      <div className="w-full overflow-x-auto rounded-lg shadow">
        <table className="w-full min-w-[1100px] border border-gray-200 rounded-lg text-xs sm:text-sm shadow-sm">
          <thead className="bg-violet-100 text-violet-50 uppercase text-[10px] sm:text-xs font-semibold">
            <tr className="bg-violet-500">
              <th className="border p-1 text-center sm:p-2">Evento</th>
              <th className="border p-1 text-center sm:p-2">Tipo Identificación</th>
              <th className="border p-1 text-center sm:p-2">Número Identificación</th>
              <th className="border p-1 text-center sm:p-2">Nombre</th>
              {/* <th className="border p-2 min-w-[80px]">País</th> */}
              <th className="border p-1 text-center sm:p-2">Celular</th>
              <th className="border p-1 text-center sm:p-2">Nombre Empresa</th>
              <th className="border p-1 text-center sm:p-2">Correo</th>
              <th className="border p-1 text-center sm:p-2">Asistencia</th>
              <th className="border p-1 text-center sm:p-2">ACTIVO</th>
              <th className="border p-1 text-center sm:p-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="">
            {initialData && initialData.length > 0 ? (
              initialData.map((asis, idx) => (
                <tr key={asis.id_asistente} className={idx % 2 === 0 ? "odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400" : "odd:bg-white even:bg-gray-50 hover:bg-purple-100 transition border border-gray-400"}>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{idevent.find(e => Number(e.id_event) === Number(asis.event))?.name || "-"}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.identification_type}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.identification_number}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.name}</td>
                  {/* <td className="border p-2 whitespace-nowrap">{asis.country}</td> */}
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.phone}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.company_name}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.email}</td>
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.asistencia}</td>
                  {/* <td className="border p-2 whitespace-nowrap">{asis.qr_code}</td> */}
                  <td className="border border-gray-300 p-1 text-left max-w-[150px] truncate">{asis.is_active ? "Sí" : "No"}</td>
                  <td className="border border-gray-300 p-1 text-center max-w-[150px] truncate">
                    <div className="flex justify-center items-center gap-2 sm:gap-4">

                      <button onClick={() => openSendQrByEmail(asis)}>
                        <RiMailSendLine size={20} className='text-violet-400 hover:text-violet-500 transition' />
                      </button>

                      <button onClick={() => handleQR(asis)}>
                        <IoQrCode size={20} className="text-gray-950 hover:text-gray-500 transition block" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAsistente(asis);
                          setEditModal(true);
                        }}
                      >
                        <FaUserEdit size={20} className="text-violet-400 hover:text-violet-500 transition" />
                      </button>

                      <button onClick={() => handledelete(asis.id_asistente!)}>
                        <MdDelete size={20} className="text-gray-400 hover:text-red-800 transition" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="text-center text-red-500 p-4">
                  No se encontraron datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔽 Paginador */}
      {/* Paginador (usar props del SSR) */}
      {totalPages && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-gray-600">
            Página {initialPage} de {totalPages}
            {typeof totalCount === "number" ? <> · {totalCount} registros</> : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={isFirst && isPending}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isFirst ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-violet-100 text-violet-600 hover:bg-violet-200"}`}
            >
              {isPending ? "Cargando…" : "Anterior"}
            </button>

            <button
              onClick={handleNextPage}
              disabled={isLast && isPending}
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isLast ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                }`}
            >
              {isPending ? "Cargando…" : "Siguiente"}
            </button>
          </div>
        </div>
      )}

      {editModal && selectedAsistente && (
        <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl relative">
            <h2 className="text-xl font-bold mb-4 text-center text-purple-400">Editar Asistente</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const fd = new FormData(e.currentTarget);

                const rawEmail = (fd.get("email")?.toString() ?? "");

                // ② normalizar: quitar TODOS los espacios (incluye los del medio) y pasar a minúsculas
                const emailClean = rawEmail.replace(/\s+/g, "").toLowerCase();

                // ③ sobreescribir en el FormData
                fd.set("email", emailClean);
                setFormErrors({});
                handleUpdate(selectedAsistente!.id_asistente!, fd);
                setEditModal(false);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Evento - ocupa todo el ancho */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-400 mb-1">Evento</label>
                <select
                  name="event"
                  defaultValue={selectedAsistente.event}

                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                >
                  {idevent.map((eve) => (
                    <option key={eve.id_event} value={eve.id_event}>
                      {eve.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Nombre */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  name="name"
                  defaultValue={selectedAsistente.name}
                  placeholder="Nombre"
                  maxLength={100}
                  onChange={(e) => setContadorName(e.target.value.length)}
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                  aria-readonly="true"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {contadorname}/100
                </div>
              </div>


              {/* Tipo identificación */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-400 mb-1">Tipo Identificación</label>
                <select
                  name="identification_type"
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                  value={selectedAsistente?.identification_type || ""}
                  onChange={(e) =>
                    setSelectedAsistente((prev) =>
                      prev ? { ...prev, identification_type: e.target.value } : prev
                    )
                  }
                >
                  <option value="">Seleccione tipo</option>
                  <option value="CC">CC</option>
                  <option value="TI">TI</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </div>
              {/* Número identificación */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-400 mb-1">Número Identificación</label>
                <div className="relative">
                  <input
                    name="identification_number"
                    defaultValue={selectedAsistente?.identification_number}
                    placeholder="Ej: 12345678"
                    maxLength={ID_MAX}
                    onChange={(e) => setContadorId(e.target.value.replace(/\D/g, "").length)} // opcional: solo dígitos
                    className="w-full border border-violet-100 rounded-lg p-2 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                  />
                  <span className="absolute right-2 bottom-1.5 text-xs text-gray-500">
                    {contadorId}/{ID_MAX}
                  </span>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-400 mb-1">Celular</label>
                <div className="relative">
                  <input
                    name="phone"
                    defaultValue={selectedAsistente?.phone?.toString()}
                    placeholder="Teléfono"
                    maxLength={PHONE_MAX}
                    onChange={(e) => setContadorPhone(e.target.value.replace(/\D/g, "").length)} // opcional
                    className="w-full border border-violet-100 rounded-lg p-2 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                  />
                  <span className="absolute right-2 bottom-1.5 text-xs text-gray-500">
                    {contadorPhone}/{PHONE_MAX}
                  </span>
                </div>
              </div>

              {/* Empresa */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-400 mb-1">Empresa</label>
                <input
                  name="company_name"
                  defaultValue={selectedAsistente.company_name}
                  placeholder="Nombre Empresa"
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"

                />
              </div>
              {/* Asistencia */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-400 mb-1">Tipo Asistencia</label>
                <select
                  name="asistencia"
                  value={selectedAsistente?.asistencia ?? ""}
                  onChange={(e) =>
                    setSelectedAsistente(prev =>
                      prev ? { ...prev, asistencia: e.target.value } : prev
                    )
                  }
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                >
                  <option value="">Seleccione Asistencia</option>
                  {ASISTENCIA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.value}</option>
                  ))}
                </select>
              </div>

              {/* Email - ocupa todo el ancho */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-400 mb-1">Correo</label>
                <input
                  name="email"
                  defaultValue={selectedAsistente.email}
                  placeholder="Correo"
                  type="text"
                  className="w-full border border-violet-100 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
                />

                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}

              </div>
              {/* Activo */}
              <div className="flex items-center gap-2 col-span-2 mt-2">
                <input
                  type="checkbox"
                  checked={selectedAsistente?.is_active || false}
                  className="w-5 h-5 border rounded"
                  onChange={(e) =>
                    setSelectedAsistente((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev
                    )
                  }
                />
                <label className="text-sm font-medium text-gray-700">Activo</label>
              </div>
              {/* Botones */}
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
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
        </div>
      )}

      {qrModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute right-3 top-3 rounded-full px-2 py-1 text-gray-600 hover:bg-gray-100"
              aria-label="Cerrar"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-4 text-center">
              {selectedAsistente?.name}
            </h3>

            <div className="flex items-center justify-center p-4 border rounded-lg">
              {/* Referencia para luego exportar el QR */}
              <div id="qr-download">
                <QRCode
                  value={qrValue || ' '}
                  size={240}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  const svg = document.querySelector("#qr-download svg") as SVGElement;
                  if (!svg) return;
                  // Convertir el SVG a PNG usando canvas
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement("canvas");
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                      ctx.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.href = pngFile;
                      downloadLink.download = "qr_code.png";
                      downloadLink.click();
                    }
                  };
                  img.src = "data:image/svg+xml;base64," + btoa(svgData);
                }}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                Descargar QR
              </button>

              <button
                onClick={() => setQrModalOpen(false)}
                className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalAsisten
        isOpen={isCreateProdu}
        onClose={() => setIsCreateProdu(false)}
        token={token}
      />

      {
        openModalSendEmailQR && selectedAsistente && (
          <ModalSendQrByEmail
            isOpen={isCreateProdu}
            onClose={() => setOpenModalSendEmailQR(false)}
            token={token}
            qrValue={qrValue}
          />
        )
      }
    </section>
  )
}

