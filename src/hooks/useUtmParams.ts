import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { carregarTagsUtm } from "@/features/donation/utm";

export function useUtmParams() {
  const [searchParams] = useSearchParams();
  const utm = {
    utmSource: searchParams.get("utm_source"),
    utmMedium: searchParams.get("utm_medium"),
    utmCampaign: searchParams.get("utm_campaign"),
  };
  const temUtm = Boolean(utm.utmSource || utm.utmMedium || utm.utmCampaign);

  // Já busca as tags aceitas ao abrir a tela, para o clique em pagar não esperar.
  useEffect(() => {
    if (temUtm) void carregarTagsUtm();
  }, [temUtm]);

  return utm;
}
