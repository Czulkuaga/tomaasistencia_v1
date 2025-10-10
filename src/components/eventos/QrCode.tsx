"use client"

import { Event } from "@/types/events";
import QRCode from "react-qr-code";

interface Props {
    selectedEvent: Event;
    qrValue: string;
    setQrModalOpen: (open: boolean) => void;
}

export const QrCode = ({selectedEvent,qrValue,setQrModalOpen}:Props) => {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-purple/50 backdrop-blur-sm px-4"
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
                    {selectedEvent?.name}
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
                        className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700"
                    >
                        Descargar
                    </button>

                    <a
                        href={`${qrValue}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700"
                    >
                        Abrir registro
                    </a>
                    <button
                        onClick={() => setQrModalOpen(false)}
                        className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-400 hover:text-white transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
