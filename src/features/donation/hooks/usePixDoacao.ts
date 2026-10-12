import { useNavigate } from "react-router-dom";
import { consultarStatusPix } from "@/lib/api/doacao";
import { registrarDoacaoConcluida } from "@/lib/analytics/rastreamento";
import { usePixAcompanhamento } from "@/features/pix/usePixAcompanhamento";
import type { PixCriado } from "@/features/donation/types";

/** Tempo mostrando "Sua doação chegou!" antes de ir pro agradecimento. */
const PAUSA_APROVADO_MS = 1800;

/**
 * Acompanha um Pix gerado na janela de doação e, quando aprova, registra a
 * doação e leva pra página de agradecimento.
 */
export function usePixDoacao(pix: PixCriado | null, valor: number | null) {
  const navigate = useNavigate();

  return usePixAcompanhamento(pix, {
    consultarStatus: consultarStatusPix,
    aoAprovar: (aprovado) => {
      if (valor) registrarDoacaoConcluida(valor, aprovado.rastreioId);
      window.setTimeout(() => navigate("/doar/pagamento-aprovado"), PAUSA_APROVADO_MS);
    },
  });
}
