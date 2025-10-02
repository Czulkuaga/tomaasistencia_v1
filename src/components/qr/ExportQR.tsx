"use client"


import React, { useEffect, useMemo, useState } from "react"
import QRCode from "react-qr-code"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { getCookie } from "cookies-next"
import * as ReactDOMServer from "react-dom/server"

// ===== Tipos =====
type EventItem = { id_event: number; name: string }

type Attendee = {
    name: string
    company_name: string
    email: string
    qr_code: string
}

type CompanyGroup = {
    empresa: string
    usuarios: string[]
    attendees: Attendee[]
}

// ===== Utilidades =====
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function sanitizeFilename(name: string) {
    return (name || "")
        .replace(/[\\/:*?"<>|]/g, "-") // caracteres inválidos en archivos
        .replace(/\s+/g, " ")
        .trim()
}

/**
 * Genera PNG desde un <QRCode/> sin tocar el DOM.
 * - Renderiza SOLO el <svg> (sin contenedores).
 * - Asegura xmlns/width/height.
 * - Carga vía data URL (no Blob URL) para evitar onerror en algunos navegadores.
 */
async function renderQrToPng(qrValue: string, size = 1024): Promise<string> {
    const value = (qrValue ?? "").trim() || " " // evitar string vacío

    // Renderizar estrictamente el SVG del QR (sin wrappers)
    let svgMarkup = ReactDOMServer.renderToStaticMarkup(<QRCode value={value} size={size} />)

    // Asegurar xmlns y dimensiones (por si la lib no los incluye)
    if (!/xmlns=/.test(svgMarkup)) {
        svgMarkup = svgMarkup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    if (!/width=/.test(svgMarkup)) {
        svgMarkup = svgMarkup.replace("<svg", `<svg width="${size}"`)
    }
    if (!/height=/.test(svgMarkup)) {
        svgMarkup = svgMarkup.replace("<svg", `<svg height="${size}"`)
    }

    // Data URL segura (evita problemas de CORS/Blob revoke timing)
    const dataUrlSvg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup)

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error("No se pudo cargar el SVG en la imagen"))
        image.width = size
        image.height = size
        image.src = dataUrlSvg
    })

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No se pudo crear el contexto de canvas")
    ctx.drawImage(img, 0, 0, size, size)

    return canvas.toDataURL("image/png")
}

// ===== Mensajes de progreso =====
const mensajesProgreso = [
    "Inicializando generador de códigos QR...",
    "Procesando lista de asistentes...",
    "Generando códigos QR...",
    "Organizando carpetas por empresa...",
    "Comprimiendo en archivo ZIP...",
    "Preparando descarga...",
]
const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "";

export default function EventQRManager() {
    const [eventos, setEventos] = useState<EventItem[]>([])
    const [eventoSeleccionado, setEventoSeleccionado] = useState<string>("")
    const [eventName, setEventName] = useState<string>("")
    const [empresasExpandidas, setEmpresasExpandidas] = useState<Set<string>>(new Set())
    const [attendees, setAttendees] = useState<Attendee[]>([])

    const [generandoQR, setGenerandoQR] = useState(false)
    const [progreso, setProgreso] = useState(0)
    const [mensajeActual, setMensajeActual] = useState("")
    const [archivoListo, setArchivoListo] = useState(false)
    

    // Cargar eventos
    useEffect(() => {
        ;(async () => {
            try {
                const token = (getCookie("authToken") as string) ?? ""
                if (!token) return
                const resp = await fetch(`${BASE_URL}/api/events/`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                })
                if (!resp.ok) throw new Error("Error cargando eventos")
                const data = await resp.json()
                const list: EventItem[] = Array.isArray(data?.results)
                    ? data.results.map((e: any) => ({ id_event: e.id_event, name: e.name }))
                    : []
                setEventos(list)
            } catch (e) {
                console.error(e)
            }
        })()
    }, [])

    // Cargar asistentes del evento seleccionado
    useEffect(() => {
        ;(async () => {
            if (!eventoSeleccionado) {
                setAttendees([])
                setEventName("")
                return
            }
            try {
                const token = (getCookie("authToken") as string) ?? ""
                const evId = Number(eventoSeleccionado)
                const ev = eventos.find((e) => e.id_event === evId)
                setEventName(ev?.name || "evento")

                const url = `${BASE_URL}/api/events/${evId}/attendees-with-qr/`
                const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                if (!resp.ok) throw new Error("Error cargando asistentes del evento")
                const data = (await resp.json()) as Attendee[]
                setAttendees(Array.isArray(data) ? data : [])
                setEmpresasExpandidas(new Set())
            } catch (e) {
                console.error(e)
            }
        })()
    }, [eventoSeleccionado, eventos])

    // Agrupar por empresa
    const empresas: CompanyGroup[] = useMemo(() => {
        const byCompany = new Map<string, CompanyGroup>()
        for (const a of attendees) {
            const key = a.company_name || "(Sin empresa)"
            if (!byCompany.has(key)) {
                byCompany.set(key, { empresa: key, usuarios: [], attendees: [] })
            }
            const group = byCompany.get(key)!
            group.attendees.push(a)
            if (a.email) group.usuarios.push(a.email)
        }
        return Array.from(byCompany.values()).sort((a, b) => a.empresa.localeCompare(b.empresa))
    }, [attendees])

    const totalAsistentes = attendees.length

    const toggleEmpresa = (nombreEmpresa: string) => {
        const nuevas = new Set(empresasExpandidas)
        nuevas.has(nombreEmpresa) ? nuevas.delete(nombreEmpresa) : nuevas.add(nombreEmpresa)
        setEmpresasExpandidas(nuevas)
    }

    const dividirEnColumnas = (lista: any[], numColumnas: number) => {
        const cols: any[][] = Array.from({ length: numColumnas }, () => [])
        lista.forEach((item, i) => cols[i % numColumnas].push(item))
        return cols
    }
    const columnasEmpresas = empresas.length > 0 ? dividirEnColumnas(empresas, 4) : []

    // Generar ZIP con QRs
    const generarQRCodes = async () => {
        if (!eventoSeleccionado || attendees.length === 0) return

        setGenerandoQR(true)
        setArchivoListo(false)
        setMensajeActual(mensajesProgreso[0])
        setProgreso(0)

        try {
            setMensajeActual(mensajesProgreso[1])
            await sleep(200)

            const zip = new JSZip()
            const rootFolder = zip.folder(sanitizeFilename(eventName || "Evento"))!

            setMensajeActual(mensajesProgreso[2])

            const total = attendees.length
            let done = 0

            for (const group of empresas) {
                const folder = rootFolder.folder(sanitizeFilename(group.empresa))!

                for (const a of group.attendees) {
                    try {
                        const pngDataUrl = await renderQrToPng(a.qr_code, 1024)
                        const base64 = pngDataUrl.split(",")[1]
                        const safeName = sanitizeFilename(a.name || "Sin nombre")
                        const safeCompany = sanitizeFilename(a.company_name || "Sin empresa")
                        const fileName = `${safeName} - ${safeCompany}.png`
                        folder.file(fileName, base64, { base64: true })
                    } catch (err) {
                        console.warn("Saltando asistente por error al generar QR:", a?.email || a?.name, err)
                    } finally {
                        done += 1
                        const pct = Math.min(95, Math.round((done / total) * 95)) // dejar margen para el zip
                        setProgreso(pct)
                        if (done % 5 === 0) await sleep(10) // ceder UI
                    }
                }
            }

            setMensajeActual(mensajesProgreso[3])
            await sleep(200)

            setMensajeActual(mensajesProgreso[4])
            const blob = await zip.generateAsync({ type: "blob" })
            setProgreso(100)

            setMensajeActual(mensajesProgreso[5])
            const zipName = `${sanitizeFilename(eventName || "Evento")}.zip`
            saveAs(blob, zipName)

            setArchivoListo(true)
        } catch (e) {
            console.error(e)
            alert("Error generando ZIP con códigos QR. Revisa la consola.")
        } finally {
            setGenerandoQR(false)
            setTimeout(() => setMensajeActual(""), 800)
        }
    }

    const descargarZIP = () => {
        setArchivoListo(false)
        setProgreso(0)
        setMensajeActual("")
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Gestor de Eventos y Códigos QR</h1>
                    <p className="text-gray-600">Selecciona un evento y genera códigos QR para todos los asistentes</p>
                </div>

                <div className="bg-white border border-gray-200 shadow-lg rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V2m0 2h2m0 0h2m0 0v2M4 20h4m0 0v-2m0 2h2m0 0h2" />
                            </svg>
                            Selección de Evento
                        </h3>
                    </div>
                    <div className="p-6">
                        <select
                            value={eventoSeleccionado}
                            onChange={(e) => setEventoSeleccionado(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        >
                            <option value="">Selecciona un evento...</option>
                            {eventos.map((ev) => (
                                <option key={ev.id_event} value={ev.id_event}>
                                    {ev.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {eventoSeleccionado && (
                    <div className="bg-white border border-gray-200 shadow-lg rounded-lg">
                        <div className="p-6 border-b border-gray-200 flex flex-row items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Empresas Participantes - {eventName}
                            </h3>
                            <div className="text-sm text-gray-600">
                                {empresas.length} empresas • {totalAsistentes} asistentes
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {empresas.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {columnasEmpresas.map((columna, colIndex) => (
                                        <div key={colIndex} className="space-y-2">
                                            {columna.map((empresa: CompanyGroup, index: number) => (
                                                <div key={`${empresa.empresa}-${index}`} className="border border-gray-200 rounded-md overflow-hidden">
                                                    <div
                                                        onClick={() => toggleEmpresa(empresa.empresa)}
                                                        className="p-3 bg-gray-100 hover:bg-violet-100 cursor-pointer transition-colors duration-200 flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{empresa.empresa}</div>
                                                            <div className="text-xs text-gray-600">{empresa.usuarios.length} usuarios</div>
                                                        </div>
                                                        <svg
                                                            className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                                                                empresasExpandidas.has(empresa.empresa) ? "rotate-180" : ""
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>

                                                    {empresasExpandidas.has(empresa.empresa) && (
                                                        <div className="bg-white">
                                                            {empresa.usuarios.map((email, emailIndex) => (
                                                                <div
                                                                    key={`${empresa.empresa}-email-${emailIndex}`}
                                                                    className="p-2 text-sm font-mono text-gray-700 hover:bg-yellow-200 hover:text-gray-900 transition-all duration-200 cursor-pointer border-t border-gray-100"
                                                                >
                                                                    {email}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                {!generandoQR && !archivoListo && (
                                    <button
                                        onClick={generarQRCodes}
                                        disabled={totalAsistentes === 0}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md shadow-lg transition-colors duration-200"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V2m0 2h2m0 0h2m0 0v2M4 20h4m0 0v-2m0 2h2m0 0h2" />
                                        </svg>
                                        Exportar Códigos QR
                                    </button>
                                )}

                                {generandoQR && (
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-800 mb-2">{mensajeActual}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-100 ease-out rounded-full"
                                                    style={{ width: `${progreso}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{Math.round(progreso)}% completado</p>
                                        </div>
                                    </div>
                                )}

                                {archivoListo && (
                                    <div className="text-center space-y-4">
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-green-800 font-medium">¡Códigos QR generados exitosamente!</p>
                                            <p className="text-green-600 text-sm mt-1">{totalAsistentes} códigos QR listos para descargar</p>
                                        </div>
                                        <button
                                            onClick={descargarZIP}
                                            className="w-full flex items-center justify-center gap-2 p-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md shadow-lg transition-colors duration-200"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Descargar ZIP con Códigos QR
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

