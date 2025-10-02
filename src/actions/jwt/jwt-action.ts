"use server"

import jwt from "jsonwebtoken"

// interface TokenData {
//         token_type: string,
//         exp: number,
//         iat: number,
//         jti: string,
//         user_id: string,
//         username: string,
//         email: string,
//         bp_id: string,
//         main_user: boolean
// }

export const decryptToken = async (token: string) => {
        const tokenData= token ? jwt.decode(token) : null

        if (tokenData) {
                return tokenData
        }else{
                return null
        }


}