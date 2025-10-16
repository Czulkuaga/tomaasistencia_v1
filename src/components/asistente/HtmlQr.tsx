
export const HtmlQr = () => {
  return (
    <>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%); padding:30px 0;">
        <tr>
          <td align="center">
            <!-- TARJETA -->
            <table cellpadding="0" cellspacing="0" border="0" width="360" style="max-width:360px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.25);">

              <!-- IMAGEN DEL EVENTO -->
              <tr>
                <td style="background:url('https://via.placeholder.com/600x250/1e40af/ffffff?text=VII+Congreso+de+Auditoría') no-repeat center/cover; height:180px;">
                  <div style="height:180px; display:block;"></div>
                </td>
              </tr>

              <!-- CUERPO -->
              <tr>
                <td style="padding:24px 24px 12px 24px; text-align:center; color:#0f172a;">
                  <h2 style="margin:0; font-size:18px; font-weight:600;">Entrada Digital</h2>
                  <p style="margin:6px 0 20px 0; font-size:14px; color:#475569;">Presenta este código QR en el acceso al evento</p>

                  <!-- QR -->
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=Estefania+Alcaraz+-+VII+Congreso+de+Auditoria" alt="Código QR" width="160" height="160" style="display:block; margin:auto; border:0;">
                </td>
              </tr>

              <!-- DATOS -->
              <tr>
                <td style="padding:20px 24px 24px 24px; background:#f9fafb; border-top:1px solid #e2e8f0; text-align:center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px; color:#111827;">
                    <tr>
                      <td style="padding-bottom:8px;">
                        <strong>Nombre:</strong><br>
                          Estefania Alcaraz
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:8px;">
                        <strong>Evento:</strong><br>
                          VII Congreso de Auditoría
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- PIE -->
              <tr>
                <td align="center" style="background:#0f172a; padding:16px;">
                  <p style="margin:0; font-size:12px; color:#94a3b8;">
                    © 2025 Aliatic S.A.S. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </>
  )
}