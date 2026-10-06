import { useEffect, useState } from "react";
import { criarPagamentoDoacao } from "@/lib/api/doacao";
import { MIN_DONATION_AMOUNT } from "@/features/donation/constants";
import { registrarInicioDoacao } from "@/lib/analytics/rastreamento";
import { coletarRastreio } from "@/lib/analytics/identificadores";
import { utmsAceitas } from "@/features/donation/utm";

interface UseDonationFormArgs {
  utm: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
}

export function useDonationForm({ utm }: UseDonationFormArgs) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ao voltar do Mercado Pago pelo botão "voltar", o navegador restaura a
  // página do cache (bfcache) com o estado de quando saiu: botão travado em
  // "Abrindo pagamento...". Destrava para a pessoa poder doar de novo.
  useEffect(() => {
    function aoVoltar(evento: PageTransitionEvent) {
      if (evento.persisted) setIsSubmitting(false);
    }
    window.addEventListener("pageshow", aoVoltar);
    return () => window.removeEventListener("pageshow", aoVoltar);
  }, []);

  // O valor do preset também aparece no campo; editar o campo desmarca o preset.
  function selectPreset(value: number) {
    setSelectedAmount(value);
    setCustomAmount(String(value));
  }

  function updateCustomAmount(value: string) {
    // Aceita só dígitos e um separador decimal — evita que o usuário digite
    // texto e o valor chegue quebrado no backend.
    const sanitized = value.replace(/[^\d.,]/g, "");
    setCustomAmount(sanitized);
    setSelectedAmount(null);
  }

  const numericAmount =
    customAmount !== ""
      ? Number(customAmount.replace(",", "."))
      : selectedAmount;

  const isAmountValid =
    typeof numericAmount === "number" &&
    !Number.isNaN(numericAmount) &&
    numericAmount >= MIN_DONATION_AMOUNT;

  async function submit() {
    if (!isAmountValid || numericAmount === null) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { initPoint } = await criarPagamentoDoacao({
        valor: numericAmount,
        ...utmsAceitas(utm),
        rastreio: await coletarRastreio(),
      });
      registrarInicioDoacao(numericAmount);
      window.location.href = initPoint;
    } catch {
      setSubmitError(
        "Não conseguimos abrir o pagamento agora. Tenta de novo em instantes."
      );
      setIsSubmitting(false);
    }
  }

  return {
    selectedAmount,
    customAmount,
    isAmountValid,
    isSubmitting,
    submitError,
    selectPreset,
    updateCustomAmount,
    submit,
  };
}