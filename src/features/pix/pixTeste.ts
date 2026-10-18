/**
 * Pix de teste da rifa (R$ 0,01), pra validar o fluxo em produção.
 *
 * Na página /rifa, cole no console do navegador:
 *   gatilPixTeste("<PIX_TESTE_CHAVE do backend>")
 * A chave fica só nesta aba (sessionStorage) e vai no header x-pix-teste do
 * criar-pix. O backend confere a chave: errada, o Pix não é gerado.
 * Pra desligar: gatilPixTeste(null) ou fechar a aba.
 */

const CHAVE_STORAGE = "gatil_pix_teste";

declare global {
  interface Window {
    gatilPixTeste?: (chave: string | null) => void;
  }
}

export function chavePixTeste(): string | null {
  try {
    return sessionStorage.getItem(CHAVE_STORAGE) || null;
  } catch {
    return null;
  }
}

/** Expõe o comando gatilPixTeste no console. */
export function instalarComandoPixTeste() {
  window.gatilPixTeste = (chave) => {
    try {
      if (chave) sessionStorage.setItem(CHAVE_STORAGE, chave.trim());
      else sessionStorage.removeItem(CHAVE_STORAGE);
    } catch {
      console.warn("Não foi possível guardar a chave do Pix de teste neste navegador.");
      return;
    }
    console.info(chave ? "Modo teste ligado: o Pix desta aba será de R$ 0,01." : "Modo teste desligado.");
    window.location.reload();
  };
}
