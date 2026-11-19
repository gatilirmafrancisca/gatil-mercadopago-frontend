import { fetchUtmTags, type UtmTagsAtivas } from "@/lib/api/utm";

// As tags de UTM aceitas não ficam mais fixas aqui: vêm do backend
// (GET /utm/tags), que lê a coleção gerenciada na seção "UTM" do painel.
// Qualquer valor fora da lista vai como null: sem isso, um anúncio com
// utm_medium=cpc ou o utm_source=ig que o Instagram coloca no link da bio
// fariam o backend recusar a criação do pagamento.

const CHAVE_CACHE = "gatil:utm-tags";
const CACHE_TTL_MS = 5 * 60_000;
/** No clique em pagar, espera as tags no máximo isso. Nunca trava o pagamento. */
const ESPERA_MAXIMA_MS = 1500;

type Utm = { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null };

let carregando: Promise<UtmTagsAtivas | null> | null = null;

function lerCache(): UtmTagsAtivas | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_CACHE);
    if (!bruto) return null;
    const { salvoEm, tags } = JSON.parse(bruto) as { salvoEm: number; tags: UtmTagsAtivas };
    return Date.now() - salvoEm < CACHE_TTL_MS ? tags : null;
  } catch {
    return null;
  }
}

function salvarCache(tags: UtmTagsAtivas) {
  try {
    sessionStorage.setItem(CHAVE_CACHE, JSON.stringify({ salvoEm: Date.now(), tags }));
  } catch {
    // modo privado / storage bloqueado: segue sem cache
  }
}

/**
 * Começa a buscar as tags (uma vez por página). Chamado ao abrir as telas de
 * pagamento, para que no clique em pagar a lista já esteja pronta.
 */
export function carregarTagsUtm(): Promise<UtmTagsAtivas | null> {
  const emCache = lerCache();
  if (emCache) return Promise.resolve(emCache);
  if (!carregando) {
    carregando = fetchUtmTags()
      .then((tags) => {
        salvarCache(tags);
        return tags;
      })
      .catch(() => {
        carregando = null; // tenta de novo no próximo pagamento
        return null;
      });
  }
  return carregando;
}

function aceito(valor: string | null, permitidos: string[] | undefined): string | null {
  if (!valor || !permitidos) return null;
  return permitidos.includes(valor.trim().toUpperCase()) ? valor : null;
}

/** Função pura: filtra as UTMs do link contra uma lista de tags. */
export function filtrarUtms(utm: Utm, tags: UtmTagsAtivas | null): Utm {
  return {
    utmSource: aceito(utm.utmSource, tags?.source),
    utmMedium: aceito(utm.utmMedium, tags?.medium),
    utmCampaign: aceito(utm.utmCampaign, tags?.campaign),
  };
}

/**
 * UTMs do link que o backend aceita. Se as tags não chegarem a tempo (ou a
 * API falhar), as UTMs vão como null e o pagamento segue normalmente: perde-se
 * só a atribuição daquele pagamento, nunca a doação.
 */
export async function utmsAceitas(utm: Utm): Promise<Utm> {
  if (!utm.utmSource && !utm.utmMedium && !utm.utmCampaign) return filtrarUtms(utm, null);
  const limite = new Promise<null>((resolve) => setTimeout(() => resolve(null), ESPERA_MAXIMA_MS));
  const tags = await Promise.race([carregarTagsUtm(), limite]);
  return filtrarUtms(utm, tags);
}
