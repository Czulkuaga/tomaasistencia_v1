"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

export default function ThankYouScreen() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#4A5FD9] via-[#6B5FD9] to-[#8B5FD9] flex items-center justify-center">
            {/* Animated bubbles background */}
            <div className="absolute inset-0 overflow-hidden">
                {mounted && (
                    <>
                        {/* Large bubbles */}
                        <div
                            className="absolute w-64 h-64 rounded-full bg-white/10 backdrop-blur-sm"
                            style={{
                                left: "10%",
                                top: "20%",
                                animation: "float-slow 8s ease-in-out infinite",
                            }}
                        />
                        <div
                            className="absolute w-48 h-48 rounded-full bg-white/15 backdrop-blur-sm"
                            style={{
                                right: "15%",
                                top: "30%",
                                animation: "float 6s ease-in-out infinite 1s",
                            }}
                        />
                        <div
                            className="absolute w-56 h-56 rounded-full bg-white/8 backdrop-blur-sm"
                            style={{
                                left: "60%",
                                bottom: "20%",
                                animation: "float-reverse 7s ease-in-out infinite 2s",
                            }}
                        />

                        {/* Medium bubbles */}
                        <div
                            className="absolute w-32 h-32 rounded-full bg-white/12 backdrop-blur-sm"
                            style={{
                                left: "25%",
                                bottom: "30%",
                                animation: "float 5s ease-in-out infinite 0.5s",
                            }}
                        />
                        <div
                            className="absolute w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm"
                            style={{
                                right: "30%",
                                top: "15%",
                                animation: "float-slow 9s ease-in-out infinite 1.5s",
                            }}
                        />
                        <div
                            className="absolute w-36 h-36 rounded-full bg-white/14 backdrop-blur-sm"
                            style={{
                                left: "45%",
                                top: "40%",
                                animation: "float-reverse 6s ease-in-out infinite 0.8s",
                            }}
                        />

                        {/* Small bubbles */}
                        <div
                            className="absolute w-20 h-20 rounded-full bg-white/18 backdrop-blur-sm"
                            style={{
                                left: "15%",
                                top: "60%",
                                animation: "float 4s ease-in-out infinite",
                            }}
                        />
                        <div
                            className="absolute w-24 h-24 rounded-full bg-white/16 backdrop-blur-sm"
                            style={{
                                right: "20%",
                                bottom: "25%",
                                animation: "float-slow 5s ease-in-out infinite 2s",
                            }}
                        />
                        <div
                            className="absolute w-28 h-28 rounded-full bg-white/12 backdrop-blur-sm"
                            style={{
                                right: "40%",
                                bottom: "40%",
                                animation: "float-reverse 5.5s ease-in-out infinite 1s",
                            }}
                        />
                        <div
                            className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm"
                            style={{
                                left: "35%",
                                top: "25%",
                                animation: "float 4.5s ease-in-out infinite 1.2s",
                            }}
                        />
                    </>
                )}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
                {/* Success icon with animation */}
                <div className={`mb-8 transition-all duration-700 ${mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
                        <CheckCircle2 className="relative w-24 h-24 md:w-32 md:h-32 text-white drop-shadow-2xl" />
                    </div>
                </div>

                {/* Main message */}
                <h1
                    className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 text-balance transition-all duration-700 delay-200 ${
                        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                >
                    ¡Gracias por su respuesta!
                </h1>

                <p
                    className={`text-lg md:text-xl text-white/90 max-w-2xl text-pretty transition-all duration-700 delay-300 ${
                        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                >
                    Su opinión es muy importante para nosotros
                </p>
            </div>

            {/* Copyright footer */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
                <p className="text-xs md:text-sm text-white/40 text-center text-balance">
                    © {new Date().getFullYear()}{" "}
                    <strong className="font-semibold text-white/60">
                        Toma de asistencia
                    </strong>{" "}
                    de{" "}
                    <a
                        href="https://www.aliatic.com.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white transition-colors duration-200 underline decoration-white/40 hover:decoration-white/80"
                    >
                        Aliatic SAS
                    </a>
                    . Todos los derechos reservados.
                </p>
            </div>
        </div>
    )
}
