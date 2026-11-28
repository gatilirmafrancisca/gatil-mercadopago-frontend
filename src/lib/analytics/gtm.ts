// Google Tag Manager no site inteiro (carregado pelo RootLayout).
//
// Consent Mode v2 no modo básico: o contêiner só é baixado depois que a pessoa
// aceita estatísticos ou marketing no aviso de cookies. Antes disso nada do
// Google roda. As permissões vão para o GTM como "consent default" (tudo
// negado) seguido de "consent update" com a escolha feita.
//
// GA4 e Meta Pixel são configurados DENTRO do contêiner; o site só publica
// eventos no dataLayer (ver rastreamento.ts e o README). Não carregue gtag.js
// nem fbevents.js direto aqui: tudo contaria em dobro.
//
// O código fica no bundle (e não colado no index.html, como sugere o Google)
// porque a CSP do vercel.json não aceita scripts inline.
import { lerConsentimento, type Consentimento } from "@/lib/analytics/consentimento";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GTM_ID = import.meta.env.VITE_GTM_ID;

let carregado = false;

function dataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** Mesmo gtag() do snippet oficial: os comandos (consent, get) vão pelo dataLayer. */
function garantirGtag() {
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      dataLayer().push(arguments);
    };
  }
  return window.gtag;
}

function permissoes(c: Pick<Consentimento, "stats" | "marketing">) {
  const ads = c.marketing ? "granted" : "denied";
  return {
    analytics_storage: c.stats ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

/** O contêiner já foi carregado nesta visita? */
export function gtmCarregado() {
  return carregado;
}

/**
 * Carrega o GTM (uma vez) se a pessoa autorizou alguma ferramenta e repassa a
 * escolha ao Consent Mode. Pode ser chamada de novo quando a escolha muda.
 */
export function aplicarConsentimentoGTM(consentimento: Consentimento | null) {
  if (!GTM_ID || typeof window === "undefined" || !consentimento) return;
  if (!carregado && !consentimento.stats && !consentimento.marketing) return;

  const gtag = garantirGtag();

  if (!carregado) {
    gtag("consent", "default", { ...permissoes({ stats: false, marketing: false }), wait_for_update: 500 });
    gtag("consent", "update", permissoes(consentimento));
    gtag("js", new Date());
    dataLayer().push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(script);
    carregado = true;
    return;
  }

  gtag("consent", "update", permissoes(consentimento));
}

/**
 * Garante o GTM carregado se a pessoa já autorizou. Eventos podem chegar antes
 * do RootLayout carregá-lo (ex.: loader da rota, na volta do Mercado Pago):
 * assim o consentimento entra no dataLayer antes do evento.
 */
function prontoParaEnviar() {
  if (!carregado) aplicarConsentimentoGTM(lerConsentimento());
  return carregado;
}

/** Publica um evento no dataLayer. Sem aceite, não faz nada. */
export function enviarEventoGTM(evento: string, params: Record<string, unknown> = {}) {
  if (!prontoParaEnviar()) return;
  dataLayer().push({ event: evento, ...params });
}

/**
 * Troca de página no SPA. O GTM só percebe sozinho o primeiro carregamento;
 * no contêiner, a tag de page_view do GA4 dispara com o evento page_view_spa.
 */
export function enviarPageView() {
  enviarEventoGTM("page_view_spa", {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
  });
}

/** Evento de e-commerce do GA4: limpa o objeto anterior, como pede o Google. */
export function enviarEventoEcommerce(
  evento: string,
  ecommerce: Record<string, unknown>,
  extras: Record<string, unknown> = {},
) {
  if (!prontoParaEnviar()) return;
  dataLayer().push({ ecommerce: null });
  dataLayer().push({ event: evento, ...extras, ecommerce });
}
