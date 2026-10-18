import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRifaPagamento } from "@/features/raffle/hooks/useRifaPagamento";
import { TICKET_PRICE_BRL } from "@/features/raffle/constants";
import { useUtmParams } from "@/hooks/useUtmParams";
import { formatCurrencyBRL } from "@/lib/utils/format";

const VALOR_BILHETE = formatCurrencyBRL(TICKET_PRICE_BRL);

function tempoRestante(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function AvisoResponsavel() {
  return (
    <p className="mt-4 rounded-2xl bg-creme/70 p-3 text-xs leading-relaxed text-carvao/75">
      <strong>No Pix, o recebedor aparece como Ana Paula de Sousa Farias,</strong> responsável legal pelo Gatil
      Irmã Francisca. Pode seguir tranquilo: o pagamento chega ao Gatil.
    </p>
  );
}

function AvisoModoTeste({ valor }: { valor: string }) {
  return (
    <p className="mb-4 rounded-2xl border-2 border-dashed border-laranja bg-laranja/10 p-3 text-xs font-bold text-carvao" role="note">
      🧪 Modo teste — Pix de {valor}. Só esta aba vê esse valor; pra sair, rode gatilPixTeste(null) no console.
    </p>
  );
}

function OpcaoForma({
  marcada,
  nome,
  selo,
  descricao,
  onClick,
}: {
  marcada: boolean;
  nome: string;
  selo?: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={marcada}
      onClick={onClick}
      className={clsx(
        "flex flex-col gap-1 rounded-2xl border-2 p-3.5 text-left transition",
        marcada ? "border-verde bg-verde/5" : "border-carvao/10 bg-white hover:border-verde/40"
      )}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={clsx(
            "flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 text-[11px] font-bold",
            marcada ? "border-verde bg-verde text-white" : "border-carvao/25 text-transparent"
          )}
        >
          ✓
        </span>
        <span className="font-display text-base font-bold text-verde-escuro">{nome}</span>
        {selo && (
          <span className="rounded-full bg-laranja px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-carvao">
            {selo}
          </span>
        )}
      </span>
      <span className="pl-7 text-xs leading-snug text-carvao/65">{descricao}</span>
    </button>
  );
}

/**
 * Card de pagamento da landing /rifa: escolhe Pix (acompanhado aqui na tela)
 * ou cartão (Mercado Pago). Os dois terminam na escolha do número.
 */
export function PagamentoRifa() {
  const utm = useUtmParams();
  const {
    pixAtivo,
    modoTeste,
    valorPix,
    forma,
    setForma,
    usaPix,
    email,
    setEmail,
    podeEnviar,
    isSubmitting,
    submitError,
    submit,
    pix,
    etapa,
    segundosRestantes,
    limparPix,
  } = useRifaPagamento({ utm });
  const [copiado, setCopiado] = useState(false);
  // No Pix, o valor vem do backend (R$ 0,01 no modo teste); no cartão, é o do bilhete.
  const VALOR = usaPix || pix ? formatCurrencyBRL(valorPix) : VALOR_BILHETE;
  const avisoTeste = modoTeste && <AvisoModoTeste valor={formatCurrencyBRL(valorPix)} />;
  const codigoPix = useRef<HTMLElement>(null);

  useEffect(() => setCopiado(false), [pix?.paymentId]);

  async function copiarCodigo() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopiado(true);
    } catch {
      // Sem acesso à área de transferência: seleciona o código pra pessoa copiar
      const el = codigoPix.current;
      if (el) {
        const faixa = document.createRange();
        faixa.selectNodeContents(el);
        const selecao = window.getSelection();
        selecao?.removeAllRanges();
        selecao?.addRange(faixa);
      }
    }
  }

  const erro = submitError && (
    <p className="mt-3 text-sm text-red-500" role="alert">
      {submitError}
    </p>
  );

  if (pix && etapa === "aprovado") {
    return (
      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-verde text-2xl text-white">
          ✓
        </div>
        <h2 className="mb-2 font-display text-2xl font-bold text-verde-escuro">Pagamento confirmado!</h2>
        <p className="text-sm text-carvao/70" role="status">
          Seu Pix de {VALOR} chegou. Levando você pra escolher seu número da sorte...
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-verde/15" aria-hidden="true">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-verde" />
        </div>
      </Card>
    );
  }

  if (pix && etapa === "expirado") {
    return (
      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-carvao/10 text-2xl">
          ⏱️
        </div>
        <h2 className="mb-2 font-display text-2xl font-bold text-verde-escuro">Esse Pix expirou</h2>
        <p className="mb-4 text-sm text-carvao/70">
          O código tem tempo de validade. Se ainda quiser participar, é só gerar outro, rapidinho.
        </p>
        <Button className="w-full" disabled={isSubmitting} onClick={() => submit()}>
          {isSubmitting ? "Gerando Pix..." : `Gerar novo Pix de ${VALOR}`}
        </Button>
        {erro}
        <button type="button" className="mt-3 text-xs font-bold text-verde underline" onClick={limparPix}>
          Mudar forma de pagamento
        </button>
      </Card>
    );
  }

  if (pix) {
    const qrSrc = pix.qrCodeBase64.startsWith("data:") ? pix.qrCodeBase64 : `data:image/png;base64,${pix.qrCodeBase64}`;
    return (
      <Card>
        {avisoTeste}
        <h2 className="mb-1 font-display text-2xl font-bold text-verde-escuro">Seu Pix de {VALOR} está pronto</h2>
        <p className="mb-4 text-sm text-carvao/70">
          Pague pelo app do seu banco. Assim que o Pix cair, a gente te leva pra escolher seu número.
        </p>

        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-carvao/10 p-4">
          <img src={qrSrc} alt="QR code do Pix" width={188} height={188} className="h-[188px] w-[188px]" />
          <p className="text-xs text-carvao/60">Aponte a câmera do app do banco</p>
        </div>

        <h3 className="mb-1.5 mt-4 text-sm font-bold text-verde-escuro">Pix copia e cola</h3>
        <code
          ref={codigoPix}
          tabIndex={0}
          className="mb-3 block max-h-20 overflow-y-auto break-all rounded-xl bg-neutro p-3 text-xs text-carvao/80"
        >
          {pix.qrCode}
        </code>
        <Button className={clsx("w-full", copiado && "bg-verde-escuro")} onClick={copiarCodigo}>
          {copiado ? "Código copiado ✓" : "Copiar código"}
        </Button>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-laranja/15 px-4 py-3 text-sm" role="status">
          <span className="flex items-center gap-2 font-bold text-carvao">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-laranja" aria-hidden="true" />
            Aguardando seu pagamento
          </span>
          {segundosRestantes !== null && (
            <span className="whitespace-nowrap text-xs text-carvao/70">expira em {tempoRestante(segundosRestantes)}</span>
          )}
        </div>

        <AvisoResponsavel />

        <button type="button" className="mt-4 w-full text-xs font-bold text-verde underline" onClick={limparPix}>
          Mudar forma de pagamento
        </button>
      </Card>
    );
  }

  return (
    <Card>
      {avisoTeste}
      <h2 className="mb-1 font-display text-2xl font-bold text-verde-escuro">Garanta seu número</h2>
      <p className="mb-4 text-sm text-carvao/70">
        Cada número custa <strong>{VALOR}</strong>. Depois do pagamento, você escolhe o seu na hora.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {pixAtivo && (
          <>
            <span id="rotulo-forma-rifa" className="mb-2 block text-sm font-bold text-verde-escuro">
              Como você quer pagar?
            </span>
            <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="rotulo-forma-rifa">
              <OpcaoForma
                marcada={forma === "pix"}
                nome="Pix"
                selo="na hora"
                descricao="QR code ou copia e cola, aqui mesmo no site"
                onClick={() => setForma("pix")}
              />
              <OpcaoForma
                marcada={forma === "cartao"}
                nome="Cartão"
                descricao="Crédito em até 2x, pelo Mercado Pago"
                onClick={() => setForma("cartao")}
              />
            </div>
          </>
        )}

        {usaPix && (
          <div className="mb-4">
            <label htmlFor="email-rifa" className="mb-1.5 block text-sm font-bold text-verde-escuro">
              Seu e-mail
            </label>
            <input
              id="email-rifa"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-carvao/15 px-3.5 py-2.5 text-sm outline-none transition focus:border-verde"
            />
            <p className="mt-1 text-xs text-carvao/55">O Mercado Pago envia o comprovante pra esse e-mail.</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!podeEnviar || isSubmitting}>
          {usaPix
            ? isSubmitting
              ? "Gerando Pix..."
              : `Gerar Pix de ${VALOR}`
            : isSubmitting
              ? "Abrindo pagamento..."
              : "Pagar com cartão"}
        </Button>
        {erro}
      </form>

      <p className="mt-3 text-center text-xs text-carvao/55">
        {usaPix
          ? "🔒 O Pix é gerado pelo Mercado Pago só pro seu número."
          : "🔒 Você será redirecionado ao ambiente seguro do Mercado Pago pra concluir o pagamento."}
      </p>
      {usaPix && <AvisoResponsavel />}
    </Card>
  );
}
