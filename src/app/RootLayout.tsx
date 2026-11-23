import { Outlet, useLocation } from "react-router-dom";
import { CookieConsent } from "@/features/landing-doacao/CookieConsent";
import { useRastreamentoSite } from "@/lib/analytics/rastreamento";
import "@/features/landing-doacao/landing.css";

/**
 * Pai de todas as rotas: aviso de cookies e Google Tag Manager valem para o
 * site inteiro (Home, Ação de Natal, rifa, doação e documentos).
 */
export function RootLayout() {
  const { pathname } = useLocation();
  useRastreamentoSite(pathname);

  return (
    <>
      <Outlet />
      {/* .lp: o aviso usa o visual da landing também nas páginas da rifa */}
      <div className="lp lp-avisos">
        <CookieConsent />
      </div>
    </>
  );
}
