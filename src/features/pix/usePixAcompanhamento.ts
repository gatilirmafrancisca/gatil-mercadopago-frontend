import { useEffect, useRef, useState } from "react";
import type { PixCriado, StatusPix } from "@/features/pix/types";

export type EtapaPix = "aguardando" | "aprovado" | "expirado";

/** Intervalo entre consultas de status enquanto o Pix está pendente. */
export const INTERVALO_CONSULTA_MS = 4000;

interface Opcoes {
  /** Consulta o status no backend (doação ou rifa). */
  consultarStatus: (paymentId: string | number, ref: string) => Promise<StatusPix>;
  /** Chamado uma vez, quando o Pix é aprovado. */
  aoAprovar: (pix: PixCriado) => void;
}

/**
 * Acompanha um Pix gerado no site: consulta o status no backend enquanto a
 * aba está visível (e na hora em que a pessoa volta do app do banco) e conta
 * o tempo até expirar. Usado pela doação (usePixDoacao) e pela rifa.
 */
export function usePixAcompanhamento(pix: PixCriado | null, { consultarStatus, aoAprovar }: Opcoes) {
  const [etapa, setEtapa] = useState<EtapaPix>("aguardando");
  const [agora, setAgora] = useState(() => Date.now());
  const concluiu = useRef(false);

  // As funções podem mudar a cada render; só o Pix reinicia a consulta
  const callbacks = useRef({ consultarStatus, aoAprovar });
  callbacks.current = { consultarStatus, aoAprovar };

  // Um Pix novo recomeça do zero
  useEffect(() => {
    setEtapa("aguardando");
    setAgora(Date.now());
    concluiu.current = false;
  }, [pix?.paymentId]);

  // Relógio da expiração
  const fim = pix ? Date.parse(pix.expiraEm) : NaN;
  const segundosRestantes = Number.isFinite(fim) ? Math.max(0, Math.floor((fim - agora) / 1000)) : null;

  useEffect(() => {
    if (!pix || etapa !== "aguardando") return;
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pix, etapa]);

  useEffect(() => {
    if (pix && etapa === "aguardando" && segundosRestantes === 0) setEtapa("expirado");
  }, [pix, etapa, segundosRestantes]);

  // Consulta do status
  useEffect(() => {
    if (!pix || etapa !== "aguardando") return;
    let ativo = true;

    async function consultar() {
      if (!pix || document.visibilityState !== "visible") return;
      try {
        const status = await callbacks.current.consultarStatus(pix.paymentId, pix.rastreioId);
        if (!ativo || concluiu.current) return;
        if (status === "APROVADO") {
          concluiu.current = true;
          setEtapa("aprovado");
          callbacks.current.aoAprovar(pix);
        } else if (status === "EXPIRADO" || status === "CANCELADO") {
          setEtapa("expirado");
        }
      } catch {
        // Falha pontual de rede: a próxima consulta tenta de novo
      }
    }

    consultar();
    const id = window.setInterval(consultar, INTERVALO_CONSULTA_MS);
    const aoVoltarParaAba = () => {
      if (document.visibilityState === "visible") consultar();
    };
    document.addEventListener("visibilitychange", aoVoltarParaAba);

    return () => {
      ativo = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltarParaAba);
    };
  }, [pix, etapa]);

  return { etapa, segundosRestantes };
}
