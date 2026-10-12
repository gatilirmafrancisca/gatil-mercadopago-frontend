/** Resposta de POST /doacao/criar-pix e de POST /rifa/criar-pix */
export interface PixCriado {
  paymentId: string | number;
  /** external_reference do pagamento; vai junto na consulta do status (e é o event_id da conversão da doação na Meta) */
  rastreioId: string;
  /** Código "copia e cola" */
  qrCode: string;
  /** Imagem PNG do QR code em base64 (com ou sem o prefixo data:) */
  qrCodeBase64: string;
  /** Data de expiração do Pix (ISO) */
  expiraEm: string;
}

/** Status do Pix no backend (o mapearStatusMP, mais EXPIRADO) */
export type StatusPix = "APROVADO" | "PENDENTE" | "CANCELADO" | "EXPIRADO";
