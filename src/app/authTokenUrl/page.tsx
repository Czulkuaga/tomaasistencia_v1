"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";

const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const refresh = urlParams.get("refresh");

    if (token && token !== "__next_hmr_refresh_hash__") {
      // Guardar el token en una cookie
      setCookie("authToken", token, { path: "/", maxAge: 60 * 60 * 24 }); 
      setCookie("authRefresh", refresh, { path: "/", maxAge: 60 * 60 * 24 });

      // console.log("Token guardado:", token);
      // console.log("Refresh guardado:", refresh);

      // Redirigir al usuario a la pantalla principal
      router.replace("/dashboard/evento/");
    } else {
      console.warn("No se encontró un token válido en la URL.");
    }
  }, [router]);

  return <p>Autenticando...</p>;
};

export default AuthPage;
