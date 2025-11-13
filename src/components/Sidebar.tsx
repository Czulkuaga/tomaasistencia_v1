"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Iconos
import { IoIosReturnLeft } from "react-icons/io";
import { IoCreate } from "react-icons/io5";
import { MdEventNote } from "react-icons/md";
import { GrWorkshop } from "react-icons/gr";
import { MdRecordVoiceOver } from "react-icons/md";
import { FiChevronDown, FiMenu, FiX } from "react-icons/fi";
import { MdOutlinePlace } from "react-icons/md";
import { FaIdCardClip } from "react-icons/fa6";
import { SiLimesurvey } from "react-icons/si";
import { usePathname } from "next/navigation";
import { MdAssessment } from "react-icons/md";
import { JwtPayload } from "jsonwebtoken";

export default function Sidebar({ username, fromColor = "from-violet-600", tokendata }: { username: string, fromColor?: string; tokendata: JwtPayload | undefined; }) {

  // console.log(tokendata)
  const restrictionData = {
    main_user:tokendata?.main_user,
    is_staff:tokendata?.is_staff
  }

  // Estados de apertura de submenús
  const [openEvento, setOpenEvento] = useState(false);
  const [openActividad, setOpenActividad] = useState(false);
  const [openAsistente, setOpenAsistente] = useState(false);
  const [openAsistencia, setOpenAsistencia] = useState(false);
  const [openQR, setOpenQR] = useState(false);
  const [openControl, setOpenControl] = useState(false);
  const [openStands, setOpenStands] = useState(false);
  const [openEntregables, setOpenEntregables] = useState(false);
  const [openEncuestas, setOpenEncuestas] = useState(false);
  const [openReporte, setOpenReporte] = useState(false);


  // Estado del menú móvil
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
    setOpenEvento(false);
    setOpenActividad(false);
    setOpenAsistente(false);
    setOpenAsistencia(false);
    setOpenQR(false);
    setOpenControl(false);
    setOpenStands(false);
    setOpenEntregables(false);
    setOpenEncuestas(false);
  }, [pathname]);

  // Simulamos el ambiente, lo ideal es leerlo de process.env.NODE_ENV o una var de entorno

  return (
    <>
      {/* Sidebar en pantallas grandes */}

      {/* <aside className="hidden md:fixed md:flex flex-col w-72 bg-gradient-to-b from-violet-600 to-teal-400 text-gray-50 h-screen shadow-lg"> */}
      <aside className={`hidden md:fixed md:flex flex-col w-50 bg-gradient-to-b ${fromColor} to-teal-400 text-gray-50 h-screen shadow-lg`}>

        {/* Header usuario */}
        <div className="flex justify-center items-center py-6 px-6 border-b border-violet-400/40">
          <p className="text-center text-sm text-gray-50 font-medium">
            Bienvenido, {username}
          </p>
        </div>

        {/* Navegación */}
        <nav className="flex-grow flex flex-col mt-4 space-y-1 px-2 text-sm">

          {/* Evento */}
          <div>
            <button
              onClick={() => setOpenEvento(!openEvento)}
              aria-expanded={openEvento}
              className="flex items-center py-2 px-3 rounded hover:bg-purple-400 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <MdEventNote size={22} className="mr-2" /> Evento
              <FiChevronDown
                className={`ml-auto transition-transform ${openEvento ? "rotate-180" : ""
                  }`}
              />
            </button>

            {openEvento && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/evento" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver eventos
                </Link>
                {/* <Link href="/dashboard/evento/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Registro
                </Link> */}
              </div>
            )}
          </div>

          {/* Actividad */}
          <div>
            <button
              onClick={() => setOpenActividad(!openActividad)}
              className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
            >
              <GrWorkshop size={22} className="mr-2" /> Actividad
              <FiChevronDown
                className={`ml-auto transition-transform ${openActividad ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openActividad && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/actividades" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver actividades
                </Link>
                {/* <Link href="/dashboard/actividades/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Registro
                </Link> */}
              </div>
            )}
          </div>


          {/* Stands */}
          <div>
            <button
              onClick={() => setOpenStands(!openStands)}
              className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
            >
              <MdOutlinePlace size={22} className="mr-2" /> Stands
              <FiChevronDown
                className={`ml-auto transition-transform ${openStands ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openStands && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/stands" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver Stands
                </Link>
                {/* <Link href="/dashboard/stands/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Registro
                </Link> */}
              </div>
            )}
          </div>

          {/* Entregables */}
          <div>
            <button
              onClick={() => setOpenEntregables(!openEntregables)}
              aria-expanded={openEntregables}
              className="flex items-center py-2 px-3 rounded hover:bg-purple-400 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <FaIdCardClip size={22} className="mr-2" /> Entregables
              <FiChevronDown
                className={`ml-auto transition-transform ${openEntregables ? "rotate-180" : ""
                  }`}
              />
            </button>

            {openEntregables && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/entregables" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver Entregables
                </Link>
              </div>
            )}
          </div>

          {/* Asistente */}
          <div>
            <button
              onClick={() => setOpenAsistente(!openAsistente)}
              className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
            >
              <IoCreate size={22} className="mr-2" /> Asistente
              <FiChevronDown
                className={`ml-auto transition-transform ${openAsistente ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openAsistente && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/asistente" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver asistentes
                </Link>
                {
                  restrictionData.main_user === true && (
                    <>
                      <Link href="/dashboard/asistente/import" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                        Importar Excel
                      </Link>
                      <Link href="/dashboard/qr/exportar" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                        Exportar QR
                      </Link>
                    </>
                  )
                }

                {
                  restrictionData.main_user === false && restrictionData.is_staff === true && (
                    <>
                      <Link href="/dashboard/asistente/import" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                        Importar Excel
                      </Link>
                      <Link href="/dashboard/qr/exportar" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                        Exportar QR
                      </Link>
                    </>
                  )
                }

              </div>
            )}
          </div>

          {/* Encuestas */}
          <div>
            <button
              onClick={() => setOpenEncuestas(!openEncuestas)}
              aria-expanded={openEncuestas}
              className="flex items-center py-2 px-3 rounded hover:bg-purple-400 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <SiLimesurvey size={22} className="mr-2" /> Encuestas
              <FiChevronDown
                className={`ml-auto transition-transform ${openEncuestas ? "rotate-180" : ""
                  }`}
              />
            </button>

            {openEncuestas && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/surveys" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver Encuestas
                </Link>
                <Link href="/dashboard/surveys/review" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Reportes Encuestas
                </Link>

              </div>
            )}
          </div>

          {/* Asistencia */}

          {/* <div>
            <button
              onClick={() => setOpenAsistencia(!openAsistencia)}
              className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
            >
              <IoMdPeople size={22} className="mr-2" /> Asistencia
              <FiChevronDown
                className={`ml-auto transition-transform ${openAsistencia ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openAsistencia && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Ver asistencia
                </Link>
                {/* <Link href="/dashboard/registro/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Registro
                </Link> 
              </div>
            )}
          </div> */}

          {/* Reporte */}

          <div>
            <button
              onClick={() => setOpenReporte(!openReporte)}
              className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
            >
              <MdAssessment size={22} className="mr-2" />Reporte
              <FiChevronDown
                className={`ml-auto transition-transform ${openReporte ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openReporte && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/reporteasistencia" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Reporte Asistencia
                </Link>
                <Link href="/dashboard/reports" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Mas Reportes
                </Link>
              </div>
            )}
          </div>





          {/* Control */}
          <div>
            <button
              onClick={() => setOpenControl(!openControl)}
              className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
            >
              <MdRecordVoiceOver size={22} className="mr-2" /> Panel Control
              <FiChevronDown
                className={`ml-auto transition-transform ${openControl ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openControl && (
              <div className="ml-8 flex flex-col gap-1">
                <Link href="/dashboard/control" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Control Actividad
                </Link>
                <Link href="/dashboard/controlstand" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Control Stand
                </Link>
                <Link href="/dashboard/controlentregable" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Control Entregables
                </Link>
                <Link href="/dashboard/controlsurveys" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Control Encuesta
                </Link>
                {/* <Link href="/dashboard/control/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Registro
                </Link> */}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <nav className="mt-auto flex flex-col items-center pb-4 px-2">
          <a
            href="https://platform.aliatic.app/launchpad"
            className="flex items-center py-2 px-4 rounded hover:bg-teal-500 text-violet-50 w-full"
          >
            <IoIosReturnLeft size={20} className="mr-2" /> Aliatic Platform
          </a>
        </nav>
      </aside>


      {/* Barra superior en móviles */}
      {/* className={`hidden md:fixed md:flex flex-col w-72 bg-gradient-to-b ${fromColor} to-teal-400 text-gray-50 h-screen shadow-lg`} */}
      <div className={`fixed top-0 left-0 w-full h-14 bg-gradient-to-r ${fromColor} to-teal-400 text-white z-50 flex md:hidden items-center justify-between px-4`}>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <FiX size={26} /> : <FiMenu size={26} />}
        </button>
        <span className="text-sm">Bienvenido, {username}</span>
      </div>

      {/* Menú desplegable en móviles */}
      {mobileOpen && (
        <div className={`fixed top-14 left-0 w-full h-full bg-gradient-to-b ${fromColor} text-white z-40 p-4 overflow-y-auto md:hidden`}>
          <nav className="flex flex-col space-y-4">
            <div>
              <button
                onClick={() => setOpenEvento(!openEvento)}
                aria-expanded={openEvento}
                className="flex items-center py-2 px-3 rounded hover:bg-purple-500/70 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <MdEventNote size={22} className="mr-2" /> Evento
                <FiChevronDown
                  className={`ml-auto transition-transform ${openEvento ? "rotate-180" : ""
                    }`}
                />
              </button>

              {openEvento && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/evento" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Ver eventos
                  </Link>
                  {/* <Link href="/dashboard/evento/registro" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Registro
                  </Link> */}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setOpenActividad(!openActividad)}
                className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
              >
                <GrWorkshop size={22} className="mr-2" /> Actividad
                <FiChevronDown
                  className={`ml-auto transition-transform ${openActividad ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openActividad && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/actividades" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Ver actividades
                  </Link>
                  {/* <Link href="/dashboard/actividades/registro" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Registro
                  </Link> */}
                </div>
              )}
            </div>

            {/* Stands */}
            <div>
              <button
                onClick={() => setOpenStands(!openStands)}
                className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
              >
                <MdOutlinePlace size={22} className="mr-2" /> Stands
                <FiChevronDown
                  className={`ml-auto transition-transform ${openStands ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openStands && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/stands" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Ver Stands
                  </Link>
                  {/* <Link href="/dashboard/stands/registro" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                  Registro
                </Link> */}
                </div>
              )}
            </div>

            {/* Entregables */}
            <div>
              <button
                onClick={() => setOpenEntregables(!openEntregables)}
                aria-expanded={openEntregables}
                className="flex items-center py-2 px-3 rounded hover:bg-purple-400 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <FaIdCardClip size={22} className="mr-2" /> Entregables
                <FiChevronDown
                  className={`ml-auto transition-transform ${openEntregables ? "rotate-180" : ""
                    }`}
                />
              </button>

              {openEntregables && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/entregables" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Ver Entregables
                  </Link>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setOpenAsistente(!openAsistente)}
                className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
              >
                <IoCreate size={22} className="mr-2" /> Asistente
                <FiChevronDown
                  className={`ml-auto transition-transform ${openAsistente ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openAsistente && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/asistente" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Ver asistentes
                  </Link>
                  <Link href="/dashboard/qr/exportar" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Exportar
                  </Link>
                  {/* <Link href="/dashboard/asistente/registro" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Registro
                  </Link> */}
                </div>
              )}
            </div>

            {/* Encuestas */}
            <div>
              <button
                onClick={() => setOpenEncuestas(!openEncuestas)}
                aria-expanded={openEncuestas}
                className="flex items-center py-2 px-3 rounded hover:bg-purple-400 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <SiLimesurvey size={22} className="mr-2" /> Encuestas
                <FiChevronDown
                  className={`ml-auto transition-transform ${openEncuestas ? "rotate-180" : ""
                    }`}
                />
              </button>

              {openEncuestas && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/surveys" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Ver Encuestas
                  </Link>
                  <Link href="/dashboard/surveys/review" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Reportes Encuestas
                  </Link>

                </div>
              )}
            </div>


            {/* 
            <div>
              <button
                onClick={() => setOpenAsistencia(!openAsistencia)}
                className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
              >
                <IoMdPeople size={22} className="mr-2" /> Asistencia
                <FiChevronDown
                  className={`ml-auto transition-transform ${openAsistencia ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openAsistencia && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/registro" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Ver asistencia
                  </Link>
                  {/* <Link href="/dashboard/registro/registro" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Registro
                  </Link> 
                </div>
              )}
            </div>
                  */}

            {/* Reporte */}

            <div>
              <button
                onClick={() => setOpenReporte(!openReporte)}
                className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
              >
                <MdAssessment size={22} className="mr-2" />Reporte
                <FiChevronDown
                  className={`ml-auto transition-transform ${openReporte ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openReporte && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/reporteasistencia" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Reporte Asistencia
                  </Link>
                  <Link href="/dashboard/reports" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Mas Reporte
                  </Link>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setOpenControl(!openControl)}
                className="flex items-center py-2 px-4 rounded hover:bg-purple-400 w-full text-left"
              >
                <MdRecordVoiceOver size={22} className="mr-2" /> Panel Control
                <FiChevronDown
                  className={`ml-auto transition-transform ${openControl ? "rotate-180" : ""
                    }`}
                />
              </button>
              {openControl && (
                <div className="ml-8 flex flex-col gap-1">
                  <Link href="/dashboard/control" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Control Actividad
                  </Link>
                  <Link href="/dashboard/controlstand" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Control Stand
                  </Link>
                  <Link href="/dashboard/controlentregable" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Control Entregables
                  </Link>
                  <Link href="/dashboard/controlsurveys" className="py-1 px-2 rounded hover:bg-purple-400 text-sm">
                    Control Encuesta
                  </Link>
                  {/* <Link href="/dashboard/control/registro" className="py-1 px-2 rounded hover:bg-purple-300 text-sm">
                    Registro
                  </Link> */}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <nav className="mt-auto flex flex-col items-center pb-4 px-2">
            <a
              href="https://platform.aliatic.app/launchpad"
              className="flex items-center py-2 px-4 rounded hover:bg-teal-400 text-violet-50 w-full"
            >
              <IoIosReturnLeft size={20} className="mr-2" /> Aliatic Platform
            </a>
          </nav>
        </div>
      )}
    </>
  );
}