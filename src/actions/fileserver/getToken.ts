"use server"

export const getToken = async () => {

    const username = "luppin-manager"
    const password = "1234567"

    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch("https://filebrowser.aliatic.app/api/v2/user/token", {
        method: "GET",
        headers: {
            Authorization: `Basic ${credentials}`,
        },
    });

    const data = await res.json();
    return data;
}