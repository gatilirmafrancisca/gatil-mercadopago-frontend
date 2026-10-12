/**
 * Pix dentro do site (Checkout Transparente só pro Pix), na doação (/doar) e
 * na rifa (/rifa).
 *
 * O Checkout Pro do backend aceita só cartão: com isso DESLIGADO, nem a doação
 * nem a rifa oferecem Pix. Pra ligar em produção: VITE_PIX_NO_SITE=true na Vercel.
 *
 * Pra testar sem mexer no ambiente (testes E2E, homologação), também liga com
 * localStorage.setItem("gatil_pix_no_site", "1").
 */
export function pixNoSiteAtivo(): boolean {
  if (import.meta.env.VITE_PIX_NO_SITE === "true") return true;
  try {
    return localStorage.getItem("gatil_pix_no_site") === "1";
  } catch {
    return false;
  }
}
