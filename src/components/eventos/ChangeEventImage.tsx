"use client";

import { Event, EventImage } from "@/types/events";
import React from "react";
import Cropper from "react-easy-crop";

// Helper: load an HTMLImageElement from a data URL or URL
async function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (e) => reject(e));
        image.crossOrigin = "anonymous"; // to avoid CORS issues on drawImage
        image.src = url;
    });
}

// Helper: convert a canvas to a Blob
function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.9): Promise<Blob> {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), type, quality));
}

// Compute the cropped image: always export at desired outputWidth x outputHeight
async function getCroppedBlob(
    imageSrc: string,
    cropPixels: { x: number; y: number; width: number; height: number },
    rotation = 0,
    outputWidth = 600,
    outputHeight = 250,
    mime: "image/jpeg" | "image/png" = "image/jpeg",
    quality = 0.9
): Promise<Blob> {
    const image = await createImage(imageSrc);

    // Create an offscreen canvas for the final output size
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Fill with white for JPEG to avoid black transparent background
    if (mime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Create a temporary canvas to extract the crop before scaling
    const tempCanvas = document.createElement("canvas");
    const tctx = tempCanvas.getContext("2d");
    if (!tctx) throw new Error("No 2D context (temp)");

    // Account for rotation: draw the full image onto a rotated canvas, then read the crop area
    const radians = (rotation * Math.PI) / 180;
    // Compute bounding box after rotation
    const cw = image.width;
    const ch = image.height;

    // Temp canvas large enough to hold rotated image
    const bboxW = Math.abs(Math.cos(radians) * cw) + Math.abs(Math.sin(radians) * ch);
    const bboxH = Math.abs(Math.cos(radians) * ch) + Math.abs(Math.sin(radians) * cw);

    tempCanvas.width = Math.ceil(bboxW);
    tempCanvas.height = Math.ceil(bboxH);

    // Move to center, rotate, draw, move back
    tctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tctx.rotate(radians);
    tctx.drawImage(image, -cw / 2, -ch / 2);
    tctx.setTransform(1, 0, 0, 1, 0, 0); // reset

    // Now extract the cropPixels from the tempCanvas and scale to output
    const { x, y, width, height } = cropPixels;
    const cropData = tctx.getImageData(Math.max(0, x), Math.max(0, y), Math.min(width, tempCanvas.width - x), Math.min(height, tempCanvas.height - y));

    // Draw scaled into final canvas
    // Put the cropped data into another small temp then drawImage scaled for best quality
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cctx = cropCanvas.getContext("2d");
    if (!cctx) throw new Error("No 2D context (crop)");
    cctx.putImageData(cropData, 0, 0);

    // Draw scaled to the final output size
    (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = true;
    (ctx as CanvasRenderingContext2D).imageSmoothingQuality = "high";
    ctx.drawImage(cropCanvas, 0, 0, outputWidth, outputHeight);

    return canvasToBlob(canvas, mime, quality);
}

interface Props {
    selectedEvent: Event;
    setOpenModalEventImage: (open: boolean) => void;
    onSaved: (event:Event, urlImage:string) => void;
}

export function ChangeEventImage({ selectedEvent, setOpenModalEventImage, onSaved }: Props) {

    const [imageSrc, setImageSrc] = React.useState<string | null>(null);
    const [dragOver, setDragOver] = React.useState(false);

    const [crop, setCrop] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [rotation, setRotation] = React.useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const [aspect, setAspect] = React.useState<number>(12 / 5); // 600x250 = 12:5
    const [outW, setOutW] = React.useState(600);
    const [outH, setOutH] = React.useState(250);
    const [mime, setMime] = React.useState<"image/jpeg" | "image/png">("image/jpeg");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<EventImage | null>(selectedEvent?.event_image ?? null);

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const onCropComplete = React.useCallback((_area: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    function handleFile(file: File) {
        setError(null);
        if (!file.type.startsWith("image/")) {
            setError("Por favor selecciona un archivo de imagen válido.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setImageSrc(reader.result as string);
        reader.readAsDataURL(file);
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    }

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    }

    async function buildCroppedFile(): Promise<File> {
        if (!imageSrc || !croppedAreaPixels) throw new Error("No hay imagen o recorte");
        const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation, outW, outH, mime, 0.92);
        const ext = mime === "image/png" ? "png" : "jpg";
        const name = `event_${selectedEvent?.id_event}_${Date.now()}.${ext}`;
        return new File([blob], name, { type: mime });
    }

    async function handleUpload() {
        try {
            setLoading(true);
            setError(null);
            const file = await buildCroppedFile();

            const fd = new FormData();
            fd.append("filenames", file);
            fd.append("path", "/luppin/");

            const res = await fetch("/api/filebrowser/upload", {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Error de carga: ${res.status} ${txt}`);
            }
            const data = await res.json().catch(() => ({} as any));

            // console.log(data)

            const url = data?.image_url || data?.location || data?.secure_url;
            if (!url) throw new Error("El fileserver no devolvió la URL.");

            console.log("Image Url", url)

            setPreviewUrl(url);
            onSaved(selectedEvent,url);
            // Opcional: cierra modal automáticamente
            setOpenModalEventImage(false);
        } catch (e: any) {
            setError(e?.message || "No se pudo subir la imagen");
        } finally {
            setLoading(false);
        }
    }

    function resetAll() {
        setImageSrc(null);
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);
        setError(null);
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-purple/50 backdrop-blur-sm px-4 py-6 overflow-y-scroll pt-16"
            onClick={() => setOpenModalEventImage(false)}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-2xl px-6 relative shadow-xl py-8"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setOpenModalEventImage(false)}
                    className="absolute right-3 top-3 rounded-full px-2 py-1 text-gray-600 hover:bg-gray-100"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <h3 className="text-xl font-semibold mb-1 text-center">{selectedEvent?.name}</h3>
                <p className="text-center text-sm text-gray-500 mb-4">
                    Subir y recortar imagen para correo (por defecto 600 × 250).
                </p>

                {/* Body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: dropzone / cropper */}
                    <div className="border rounded-xl overflow-hidden">
                        {imageSrc ? (
                            <div className="relative h-64 sm:h-72">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={aspect}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    onCropComplete={onCropComplete}
                                    showGrid
                                    cropShape="rect"
                                    restrictPosition={false}
                                />
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                className={`flex flex-col items-center justify-center h-64 sm:h-72 text-center p-4 ${dragOver ? "bg-purple-50 border-2 border-dashed border-purple-400" : "bg-gray-50 border"
                                    }`}
                            >
                                <div className="text-4xl mb-2">📸</div>
                                <p className="text-sm text-gray-600">
                                    Arrastra y suelta una imagen aquí o
                                </p>
                                <button
                                    onClick={() => inputRef.current?.click()}
                                    className="mt-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                                >
                                    Seleccionar archivo
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={onInputChange}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: controls + preview */}
                    <div className="flex flex-col gap-3">
                        <div className="rounded-xl border p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-sm w-20">Zoom</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.01}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-sm w-20">Rotación</label>
                                <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    step={1}
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm w-20">Aspecto</label>
                                <select
                                    value={aspect}
                                    onChange={(e) => setAspect(Number(e.target.value))}
                                    className="border rounded-lg px-2 py-1"
                                >
                                    <option value={12 / 5}>12:5 (600×250)</option>
                                    <option value={16 / 9}>16:9</option>
                                    <option value={4 / 3}>4:3</option>
                                    <option value={1}>1:1</option>
                                </select>
                            </div>
                        </div>

                        <div className="rounded-xl border p-3">
                            <p className="text-sm font-medium mb-2">Salida</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <label className="text-sm flex items-center gap-2">
                                    W
                                    <input
                                        type="number"
                                        className="border rounded-lg px-2 py-1 w-full"
                                        value={outW}
                                        onChange={(e) => setOutW(Number(e.target.value) || 1)}
                                    />
                                </label>
                                <label className="text-sm flex items-center gap-2">
                                    H
                                    <input
                                        type="number"
                                        className="border rounded-lg px-2 py-1 w-full"
                                        value={outH}
                                        onChange={(e) => setOutH(Number(e.target.value) || 1)}
                                    />
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    className="border rounded-lg px-2 py-1"
                                    value={mime}
                                    onChange={(e) => setMime(e.target.value as any)}
                                >
                                    <option value="image/jpeg">JPEG</option>
                                    <option value="image/png">PNG</option>
                                </select>
                                <button
                                    onClick={resetAll}
                                    className="ml-auto px-3 py-2 rounded-lg border hover:bg-gray-50"
                                >
                                    Reiniciar
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border p-3 flex-1">
                            <p className="text-sm font-medium mb-2">Vista previa</p>
                            <div className="aspect-[12/5] w-full bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                                {previewUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-500">Sube y guarda para ver la vista previa…</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => setOpenModalEventImage(false)}
                        className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-100"
                    >
                        Cerrar
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                const f = await buildCroppedFile();
                                // Local preview of the exact export
                                const objectUrl = URL.createObjectURL(f);
                                setPreviewUrl(objectUrl);
                            } catch (e: any) {
                                setError(e?.message || "No se pudo generar la vista previa");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={!imageSrc || !croppedAreaPixels || loading}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Previsualizar exportación
                    </button>

                    <button
                        onClick={handleUpload}
                        disabled={!imageSrc || !croppedAreaPixels || loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading ? "Subiendo…" : "Guardar en Fileserver"}
                    </button>
                </div>
            </div>
        </div>
    );
}