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