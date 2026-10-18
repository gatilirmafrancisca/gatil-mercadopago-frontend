import { apiClient } from "@/lib/api/client";
import type {
  ConfirmNumberPayload,
  ConfirmNumberResponse,
} from "@/features/raffle/types";
import type { PixCriado, StatusPix } from "@/features/pix/types";
import { chavePixTeste } from "@/features/pix/pixTeste";

/**
 * Camada de acesso à API da rifa. As páginas/hooks nunca chamam
 * apiClient diretamente — sempre passam por aqui.
 */

export async function fetchTakenNumbers(): Promise<number[]> {
  const response = await apiClient.get<{ message: string; data: number[] }>(
    "/rifa/numeros-ocupados"
  );
  return response.data;
}

export async function confirmNumber(
  token: string,
  payload: ConfirmNumberPayload
): Promise<ConfirmNumberResponse> {
  // O token (não o paymentId) é quem autoriza a confirmação — o backend
  // extrai o paymentId de dentro dele, nunca do corpo da requisição.
  const response = await apiClient.post<{ message: string; data: ConfirmNumberResponse }>(
    "/rifa/confirmar-numero",
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
interface OrigemRifa {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/** Pagamento com cartão: cria a preferência (Checkout Pro) e devolve o link do Mercado Pago. */
export async function criarPagamentoRifa(origem: OrigemRifa): Promise<{ initPoint: string }> {
  const params = new URLSearchParams({
    utmSource: origem.utmSource ?? "",
    utmMedium: origem.utmMedium ?? "",
    utmCampaign: origem.utmCampaign ?? "",
  });
  return apiClient.get<{ initPoint: string }>(`/rifa/criar-pagamento?${params}`);
}

/** Pix dentro do site: o backend cria o Pix do bilhete no Mercado Pago e devolve o QR code. */
export async function criarPixRifa(payload: { email: string } & OrigemRifa): Promise<PixCriado> {
  // Com o modo teste ligado (pixTeste.ts), o backend gera o Pix de R$ 0,01.
  const chave = chavePixTeste();
  const response = await apiClient.post<{ message: string; data: PixCriado }>(
    "/rifa/criar-pix",
    payload,
    chave ? { headers: { "x-pix-teste": chave } } : undefined
  );
  return response.data;
}

/** Status do Pix da rifa. O ref (rastreioId) vai junto pra não dar pra consultar Pix de outra pessoa. */
export async function consultarStatusPixRifa(paymentId: string | number, ref: string): Promise<StatusPix> {
  const response = await apiClient.get<{ message: string; data: { status: StatusPix } }>(
    `/rifa/status-pix/${encodeURIComponent(String(paymentId))}?ref=${encodeURIComponent(ref)}`
  );
  return response.data.status;
}
