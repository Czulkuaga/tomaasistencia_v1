// "use server";

// import { cookies } from "next/headers";

// const BASE_URL = "https://aliaticplatformapi.aliatic.app";

// export const refreshToken = async () => {
//     try {
//         console.log("Refreshing token...");

//         const cookieStore = await cookies();
//         const refreshToken = cookieStore.get("authRefresh")?.value;

//         console.log("Refreshing token is: " + refreshToken);

//         if (!refreshToken) return false;

//         const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ refresh: refreshToken }),
//         });

//        // console.log("Refresco de token:", response.json());

//         if (response.ok) {
//             const data = await response.json();
//             const newAccessToken = data.access;

//             // Actualizar cookies en el servidor
//             (await cookies()).set("authToken", newAccessToken);

//             return true;
//         }
//     } catch (error) {
//         console.error("Error refrescando token:", error);
//     }

//     return false;
// };
