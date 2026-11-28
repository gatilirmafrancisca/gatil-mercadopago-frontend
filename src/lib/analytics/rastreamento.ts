// Ponto único de rastreamento. Tudo vai para o dataLayer do Google Tag Manager,
// que só é carregado depois do aceite de cookies; GA4 e Meta Pixel são tags
// configuradas DENTRO do contêiner (ver a tabela de eventos no README).
//
// Para não contar em dobro:
// - a doação aprovada vira `purchase` no GA4 só pelo backend (Measurement
//   Protocol); aqui ela sai como `doacao_concluida`, para o Donate do Meta;
// - todo evento leva `event_id`. No Donate, ele é o rastreioId, o mesmo
//   event_id que o backend manda à Conversions API: o Meta junta os dois.
import { useEffect } from "react";
import { aoMudarConsentimento, lerConsentimento } from "@/lib/analytics/consentimento";
import {
  aplicarConsentimentoGTM,
  enviarEventoEcommerce,
  enviarEventoGTM,
  enviarPageView,
  gtmCarregado,
} from "@/lib/analytics/gtm";

const MOEDA = "BRL";

function novoEventId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

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

// ---------------------------------------------------------------- Doação

/** Início da doação (GA4 generate_lead · Meta InitiateCheckout). */
export function registrarInicioDoacao(valor: number) {
  enviarEventoGTM("generate_lead", { value: valor, currency: MOEDA, event_id: novoEventId() });
}

/**
 * Doação concluída no site (Pix aprovado na própria janela). Só para o Donate
 * do Meta: o `purchase` do GA4 vem do backend quando o Mercado Pago aprova.
 */
export function registrarDoacaoConcluida(valor: number, rastreioId: string) {
  enviarEventoGTM("doacao_concluida", {
    value: valor,
    currency: MOEDA,
    transaction_id: rastreioId,
    event_id: rastreioId,
  });
}

// ---------------------------------------------------------------- Rifa (Ação de Natal)

export type FormaPagamento = "pix" | "cartao";

const PRECO_BILHETE = 100;

function itensRifa(quantidade: number, valor: number) {
  return [
    {
      item_id: "rifa-natal",
      item_name: "Bilhete Ação Solidária de Natal",
      item_category: "rifa",
      price: quantidade > 0 ? valor / quantidade : PRECO_BILHETE,
      quantity: quantidade,
    },
  ];
}

/** Começou a compra: GA4 begin_checkout · Meta InitiateCheckout. */
export function registrarInicioRifa(quantidade: number, valor = quantidade * PRECO_BILHETE) {
  enviarEventoEcommerce(
    "begin_checkout",
    { value: valor, currency: MOEDA, items: itensRifa(quantidade, valor) },
    { event_id: novoEventId() },
  );
}

/** Escolheu a forma de pagamento e o Pix/cartão foi gerado: GA4 add_payment_info. */
export function registrarPagamentoRifa(forma: FormaPagamento, quantidade: number, valor = quantidade * PRECO_BILHETE) {
  enviarEventoEcommerce(
    "add_payment_info",
    { value: valor, currency: MOEDA, payment_type: forma, items: itensRifa(quantidade, valor) },
    { event_id: novoEventId() },
  );
}

const CHAVE_COMPRAS = "gatil_compras_registradas";

/** Cada compra conta uma vez neste navegador, mesmo recarregando a página de retorno. */
function jaRegistrada(id: string) {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_COMPRAS) ?? "[]") as string[];
    if (lista.includes(id)) return true;
    localStorage.setItem(CHAVE_COMPRAS, JSON.stringify([...lista, id].slice(-50)));
  } catch {
    // sem storage: o GA4 ainda descarta transaction_id repetido
  }
  return false;
}

/**
 * Compra da rifa aprovada: GA4 purchase · Meta Purchase. A rifa não tem
 * conversão pelo backend, então este é o único `purchase` da rifa.
 */
export function registrarCompraRifa(transacaoId: string, quantidade: number, valor = quantidade * PRECO_BILHETE) {
  const consentimento = lerConsentimento();
  if (!transacaoId || !(consentimento?.stats || consentimento?.marketing) || jaRegistrada(transacaoId)) return;
  enviarEventoEcommerce(
    "purchase",
    { transaction_id: transacaoId, value: valor, currency: MOEDA, items: itensRifa(quantidade, valor) },
    { event_id: transacaoId },
  );
}
