import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Rodape } from "@/features/landing-doacao/secoes/Rodape";
import "@/features/landing-doacao/landing.css";

/** Layout da landing de doação, das páginas de retorno do pagamento e dos documentos (política e termos). */
export function LandingLayout() {
  // GTM (com GA4 e Meta Pixel dentro) e aviso de cookies ficam no RootLayout

  // Ao voltar do Mercado Pago pelo "voltar", o Safari do iPhone restaura a página
  // do cache (bfcache) do jeito que ela estava ao sair: com a janela de doação
  // aberta e as medidas da tela erradas, o que desloca a janela e a barra fixa.
  // Recarregar devolve a página limpa.
  useEffect(() => {
    function aoRestaurar(evento: PageTransitionEvent) {
      if (evento.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", aoRestaurar);
    return () => window.removeEventListener("pageshow", aoRestaurar);
  }, []);

  return (
    <div className="lp">
      <Outlet />
      <Rodape />
      {/* Ao abrir outra página (ex.: links do rodapé), começa do topo; no "voltar", volta onde estava */}
      <ScrollRestoration />
    </div>
  );
}
