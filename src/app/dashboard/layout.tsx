import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { decryptToken } from "@/actions/jwt/jwt-action"

const dToken = async (token: string) => {
  const resolvedToken = token;

  if (typeof resolvedToken === "string") {
    const tokenData = await decryptToken(resolvedToken);
    // console.log(tokenData)

    if (tokenData && typeof tokenData === "object" && "main_user" in tokenData) {
      return tokenData
    }
  }
};


export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    redirect("https://platform.aliatic.app/launchpad");
  }

  const tokedata = await dToken(token)
  const username = tokedata?.username || "Usuario";


  
  //const envUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
  const environment = (process.env.ENVIRONMENT || "").toUpperCase();
  const isQA = environment === "QA";

  // Negro si es QA, violeta si no (cuando ENVIRONMENT está vacío o distinto de QA)
  const fromColor = isQA ? "from-black" : "from-violet-600";
  
  return (
    <main className="flex bg-zinc-50 min-h-screen font-sans overflow-auto">

       <Sidebar username={username} fromColor={fromColor} />
      {/* Contenedor del contenido */}
      <div className="flex-1 md:ml-50 px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </main>
  );
}