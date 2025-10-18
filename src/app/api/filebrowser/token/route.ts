import { NextResponse } from "next/server";

export async function GET() {
  const username = "luppin-manager";
  const password = "1234567";

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const res = await fetch("https://filebrowser.aliatic.app/api/v2/user/token", {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json(
      { status: 500, message: error }
    );
  }
}
