"use client";

import { useEffect, useRef } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseMs?: number; // opcional: autocierra después de X ms
};

export default function SuccessModal({
  isOpen,
  onClose,
  title = "¡Registro completado!",
  message = "Tu registro se ha guardado correctamente.",
  autoCloseMs,
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Enfoca el botón al abrir
  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);

  // Autocerrar si se configura
  useEffect(() => {
    if (!isOpen || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={stop}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 text-center"
      >
        {/* Icono check */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-violet-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-violet-700">{title}</h3>
        <p className="mt-2 text-sm sm:text-base text-gray-600">{message}</p>

        <div className="mt-6 flex justify-center">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}