// Ponto único de rastreamento: respeita o consentimento.
// - GTM (com o GA4 dentro): site inteiro, pelo RootLayout.
// - Meta Pixel: só na campanha de doação, pelo LandingLayout.
import { useEffect } from "react";
import { aoMudarConsentimento, lerConsentimento } from "@/lib/analytics/consentimento";
import { initMetaPixel, trackEvent, trackPageView } from "@/lib/analytics/metaPixel";
import {
  aplicarConsentimentoGTM,
  enviarEventoEcommerce,
  enviarEventoGTM,
  enviarPageView,
  gtmCarregado,
} from "@/lib/analytics/gtm";

/** Site inteiro: carrega o GTM depois do aceite e registra cada troca de página. */
export function useRastreamentoSite(pathname: string) {
  useEffect(() => {
    aplicarConsentimentoGTM(lerConsentimento());
    enviarPageView();
  }, [pathname]);

  // Se a pessoa aceitar durante a visita, a página atual também é registrada
  useEffect(
    () =>
      aoMudarConsentimento(() => {
        const jaCarregado = gtmCarregado();
        aplicarConsentimentoGTM(lerConsentimento());
        if (!jaCarregado) enviarPageView();
      }),
    [],
  );
}

function carregarPixelSeAutorizado() {
  if (lerConsentimento()?.marketing) initMetaPixel();
}

/** Campanha de doação: Meta Pixel, exclusivo destas páginas. */
export function usePixelDoacao(pathname: string) {
  useEffect(() => {
    carregarPixelSeAutorizado();
    trackPageView();
  }, [pathname]);

  useEffect(
    () =>
      aoMudarConsentimento(() => {
        carregarPixelSeAutorizado();
        trackPageView();
      }),
    [],
  );
}

/** Início da doação: só chega às ferramentas que a pessoa autorizou. */
export function registrarInicioDoacao(valor: number) {
  trackEvent("InitiateCheckout", { value: valor, currency: "BRL" });
  enviarEventoGTM("generate_lead", { value: valor, currency: "BRL" });
}

/**
 * Doação concluída no site (Pix aprovado na própria janela). O eventID é o
 * rastreioId, o mesmo event_id que o backend manda pra Meta quando o
 * Mercado Pago confirma o pagamento: assim a Meta conta uma doação só.
 */
export function registrarDoacaoConcluida(valor: number, rastreioId: string) {
  trackEvent("Donate", { value: valor, currency: "BRL" }, { eventID: rastreioId });
  enviarEventoEcommerce("purchase", { transaction_id: rastreioId, value: valor, currency: "BRL" });
}
