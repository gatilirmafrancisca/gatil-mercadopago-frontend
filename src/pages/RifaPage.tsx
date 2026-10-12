import { useEffect } from "react";
import { Pill } from "@/components/ui/Pill";
import { PagamentoRifa } from "@/features/raffle/components/PagamentoRifa";
import {
  INSTAGRAM_URL,
  PRIZE_VALUE_BRL,
  RAFFLE_DATE_LABEL,
  TICKET_PRICE_BRL,
  TOTAL_NUMBERS,
} from "@/features/raffle/constants";
import { formatCurrencyBRL } from "@/lib/utils/format";
import imgCatFami from "@/assets/doacao/cat-fami.webp";

const PASSOS = [
  {
    titulo: "Pague o seu número",
    texto: `${formatCurrencyBRL(TICKET_PRICE_BRL)} no Pix, aqui mesmo no site, ou no cartão pelo Mercado Pago.`,
  },
  {
    titulo: "Escolha seu número da sorte",
    texto: `Com o pagamento confirmado, você escolhe entre os ${TOTAL_NUMBERS} números e recebe a confirmação por e-mail.`,
  },
  {
    titulo: "Acompanhe o sorteio",
    texto: `Ao vivo no Instagram do Gatil, no dia ${RAFFLE_DATE_LABEL}.`,
  },
];

/**
 * Landing da rifa (/rifa). Antes ia direto pro Mercado Pago; agora a pessoa
 * escolhe Pix (acompanhado aqui) ou cartão. Os dois terminam em
 * /rifa/pagamento-aprovado, a escolha do número.
 */
export function RifaPage() {
  useEffect(() => {
    document.title = "Rifa Solidária - Gatil Irmã Francisca";
  }, []);

  return (
    <div className="pb-16">
      <section className="bg-verde-escuro px-4 pb-24 pt-10 text-creme sm:pt-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <p className="mb-3 inline-block rounded-full bg-creme px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-verde-escuro">
              Rifa Solidária · 10 anos do Gatil
            </p>
            <h1 className="mb-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Concorra a {formatCurrencyBRL(PRIZE_VALUE_BRL)} e cuide de 300&nbsp;gatos
            </h1>
            <p className="mx-auto mb-5 max-w-md text-base text-creme/85 md:mx-0">
              Todo o valor da rifa ajuda a manter o Gatil Irmã Francisca: ração, veterinário e um lar seguro
              enquanto cada gato espera a sua família.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <Pill>🎟️ {TOTAL_NUMBERS} números</Pill>
              <Pill>💰 {formatCurrencyBRL(TICKET_PRICE_BRL)} cada</Pill>
              <Pill tone="laranja">🏆 Prêmio {formatCurrencyBRL(PRIZE_VALUE_BRL)}</Pill>
              <Pill>📅 Sorteio {RAFFLE_DATE_LABEL}</Pill>
            </div>
          </div>
          <img
            src={imgCatFami}
            alt="Fami, um dos gatos do Gatil"
            className="w-28 rounded-full border-4 border-laranja object-cover sm:w-48 md:w-60"
          />
        </div>
      </section>

      <div className="mx-auto -mt-14 grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-[1fr_400px] md:items-start">
        <div className="order-2 md:order-1 md:pt-20">
          <h2 className="mb-4 font-display text-2xl font-bold text-verde-escuro">Como funciona</h2>
          <ol className="flex flex-col gap-4">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="flex gap-3.5">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-laranja font-display text-base font-bold text-carvao">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-verde-escuro">{passo.titulo}</h3>
                  <p className="text-sm text-carvao/70">{passo.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-carvao/60">
            Dúvidas? Fale com a gente pelo{" "}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="font-bold text-verde underline">
              Instagram do Gatil
            </a>
            .
          </p>
        </div>

        <div className="order-1 md:sticky md:top-4 md:order-2">
          <PagamentoRifa />
        </div>
      </div>
    </div>
  );
}
