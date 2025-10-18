import { NextResponse } from "next/server";
import { v4 as uuid } from 'uuid';
import { getToken } from "@/actions/fileserver/getToken";

const FILESERVER_URL = "https://filebrowser.aliatic.app/files/luppin"

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    let file = formData.get("filenames") as File;

    let extension = file.name.split(".")[1]
    let newFilename = `${uuid()}.${extension}`

    const {access_token} = await getToken()

    if (!file) {
      return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });

    const uploadForm = new FormData();
    uploadForm.append("filenames", blob, newFilename);
    uploadForm.append("path", "/luppin/"); // ✅ carpeta destino

    const uploadRes = await fetch("https://filebrowser.aliatic.app/api/v2/user/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      body: uploadForm,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      return NextResponse.json({ error: uploadData }, { status: uploadRes.status });
    }

    const newImageData = {
      filename: newFilename,
      image_url: `${FILESERVER_URL}/${newFilename}`,
      path: formData.get("path")
    }

    return NextResponse.json(newImageData);
  } catch (error) {
    return NextResponse.json({ error: "Error al subir imagen", details: `${error}` }, { status: 500 });
  }
}
