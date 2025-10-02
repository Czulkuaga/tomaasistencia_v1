// "use server";

// const BASE_URL = "https://aliaticplatformapi.aliatic.app";

// interface Props {
//     token: string|null
// }

// export const verifyToken = async ({token}:Props) => {
//     try {
        
//         if (!token) return false;

//         const response = await fetch(`${BASE_URL}/api/token/verify/`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ token: token }),
//         });

//         const jsonResponse = await response.json();
//         console.log("Response:", jsonResponse);

//         return jsonResponse;
//     } catch (error) {
//         console.error("Error verificando token:", error);
//         return false;
//     }
// };
