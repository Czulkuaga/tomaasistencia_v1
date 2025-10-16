"use client"

import { useState } from "react";
import { HtmlQr } from "./HtmlQr";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    qrValue?: string;
}

interface FormErrors {
    formError?: string,
    [key: string]: string | undefined
}

export const ModalSendQrByEmail = ({ onClose, token, qrValue }: Props) => {

    const [errors, setErrors] = useState<FormErrors>({})

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    }

    return (
        <>
            <div className="fixed inset-0 bg-purple/50 backdrop-blur-sm flex items-center justify-center z-50">

                <div className="w-full flex justify-center p-4 mt-10">
                    <div>
                        {errors.formError && (
                            <p className="text-red-300">{errors.formError}</p>
                        )}
                    </div>

                    <form onSubmit={onSubmit} className="w-full flex justify-center">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl border border-purple-200">

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2">
                                <div></div>
                                <div>
                                    <HtmlQr/>
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
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        </>
    )
}