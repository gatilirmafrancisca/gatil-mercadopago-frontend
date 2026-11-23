// Identificadores que permitem ao backend avisar Meta e GA4 quando o pagamento
// for aprovado no Mercado Pago (onde o Pixel não roda). Cada identificador só
// é coletado se a pessoa autorizou aquela ferramenta no aviso de cookies.
import { lerConsentimento } from "@/lib/analytics/consentimento";

export interface RastreioDoacao {
  consentimento: { marketing: boolean; stats: boolean };
  fbp?: string;
  fbc?: string;
  gaClientId?: string;
  gaSessionId?: string;
}

const GA4_ID = import.meta.env.VITE_GA4_ID;

function lerCookie(nome: string): string | undefined {
  const par = document.cookie.split("; ").find((c) => c.startsWith(`${nome}=`));
  return par ? decodeURIComponent(par.slice(nome.length + 1)) : undefined;
}

/** _fbc é criado pelo Pixel quando a pessoa chega por um anúncio (?fbclid=). */
function lerFbc(): string | undefined {
  const cookie = lerCookie("_fbc");
  if (cookie) return cookie;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

/**
 * O GA4 roda dentro do GTM. Primeiro pergunta ao Google tag; se ele não
 * responder a tempo, lê os cookies que o GA4 grava (_ga e _ga_<ID>).
 */
function lerGtag(campo: "client_id" | "session_id"): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!GA4_ID || !window.gtag) return resolve(undefined);
    const desistir = setTimeout(() => resolve(undefined), 800);
    window.gtag("get", GA4_ID, campo, (valor: unknown) => {
      clearTimeout(desistir);
      resolve(valor ? String(valor) : undefined);
    });
  });
}

/** _ga = "GA1.1.<client_id>": o client_id são os dois últimos blocos. */
function clientIdDoCookie(): string | undefined {
  const partes = lerCookie("_ga")?.split(".");
  return partes && partes.length >= 4 ? partes.slice(-2).join(".") : undefined;
}

/** _ga_<ID> = "GS1.1.<session_id>.…" ou, no formato novo, "GS2.1.s<session_id>$o…". */
function sessionIdDoCookie(): string | undefined {
  if (!GA4_ID) return undefined;
  const valor = lerCookie(`_ga_${GA4_ID.replace(/^G-/, "")}`);
  const id = valor?.match(/^GS\d\.\d\.s?(\d+)/)?.[1];
  return id || undefined;
}

export async function coletarRastreio(): Promise<RastreioDoacao> {
  const consentimento = lerConsentimento();
  const marketing = Boolean(consentimento?.marketing);
  const stats = Boolean(consentimento?.stats);

  const [gaClientId, gaSessionId] = stats
    ? await Promise.all([
        lerGtag("client_id").then((v) => v ?? clientIdDoCookie()),
        lerGtag("session_id").then((v) => v ?? sessionIdDoCookie()),
      ])
    : [undefined, undefined];

  return {
    consentimento: { marketing, stats },
    ...(marketing ? { fbp: lerCookie("_fbp"), fbc: lerFbc() } : {}),
    ...(gaClientId ? { gaClientId } : {}),
    ...(gaSessionId ? { gaSessionId } : {}),
  };
}
