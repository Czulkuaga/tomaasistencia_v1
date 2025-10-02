// "use server";

// import { verifyToken } from "./verifyToken-action";
// import { refreshToken } from "./refreshToken-action";

// interface Props {
//     token: string|null
// }

// export const checkAuth = async ({token}:Props) => {

//     try {
//         const response = await verifyToken({ token });
//         // console.log(response)
//         // console.log("Checking token");

//         if (response && Object.keys(response).length === 0) {
//             // return true
//         }

//         if (response?.code === "token_not_valid") {
//             // console.log("Refreshing");
//             const refreshUpdate = await refreshToken();
//             // console.log("respuesta del token de refresco en checkAuth: ",refreshUpdate);
//             return refreshUpdate;
//         }

//         return false;
//     } catch (error) {
//         console.error("Error en checkAuth:", error);
//         return false;
//     }
// };
