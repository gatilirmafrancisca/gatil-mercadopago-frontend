import type { RastreioDoacao } from "@/lib/analytics/identificadores";

export interface DonationPayload {
  valor: number;
  rastreio?: RastreioDoacao;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export interface CreateDonationPaymentResponse {
  initPoint: string;
}

/** Pix dentro do site: o mesmo payload da doação, mais o e-mail (o Mercado Pago exige). */
export interface PixPayload extends DonationPayload {
  email: string;
}

// Mesmo formato no Pix da rifa (features/pix/types.ts)
export type { PixCriado, StatusPix } from "@/features/pix/types";
