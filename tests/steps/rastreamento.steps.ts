import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

// URLs do Google pedidas pela página (o GTM de verdade nunca é baixado: responde vazio)
const pedidos = new WeakMap<Page, string[]>();
const pixelDireto = new WeakMap<Page, boolean>();

async function interceptarGoogle(page: Page) {
  const lista: string[] = [];
  pedidos.set(page, lista);
  await page.route("https://www.googletagmanager.com/**", (route) => {
    lista.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
  });
}

// Copia cada push do dataLayer para o sessionStorage: sobrevive ao recarregar
// e às trocas de página, e mostra só o que o site publicou.
async function gravarDataLayer(page: Page) {
  await page.addInitScript(() => {
    const CHAVE = "__datalayer_teste";
    const fila: unknown[] = [];
    fila.push = function (...itens: unknown[]) {
      try {
        const salvos = JSON.parse(sessionStorage.getItem(CHAVE) ?? "[]");
        for (const item of itens) salvos.push(JSON.parse(JSON.stringify(item)));
        sessionStorage.setItem(CHAVE, JSON.stringify(salvos));
      } catch {
        // sem storage: segue só em memória
      }
      return Array.prototype.push.apply(this, itens);
    };
    (window as unknown as { dataLayer: unknown[] }).dataLayer = fila;
  });
}

async function prepararPagina(page: Page) {
  // Só as chamadas ao backend (/api/...), não os módulos do Vite em /src/lib/api.
  // Registrado primeiro: os passos de cada cenário (registrados depois) têm prioridade.
  await page.route((url) => url.pathname.startsWith("/api/"), (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "ok", data: null }) })
  );
  await interceptarGoogle(page);
  await gravarDataLayer(page);
}

const gtm = (page: Page) => (pedidos.get(page) ?? []).filter((u) => u.includes("/gtm.js"));

type Item = Record<string, unknown> | { [i: number]: unknown; length: number };

async function dataLayer(page: Page): Promise<Item[]> {
  // gtag() empurra o objeto "arguments": vira { "0": ..., "1": ... } ao serializar
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("__datalayer_teste") ?? "[]"));
}

async function eventos(page: Page, nome: string) {
  return ((await dataLayer(page)) as Record<string, unknown>[]).filter((i) => i.event === nome);
}

async function ultimoConsentimento(page: Page) {
  const itens = (await dataLayer(page)) as Record<string, unknown>[];
  const updates = itens.filter((i) => i["0"] === "consent" && i["1"] === "update");
  return updates.at(-1)?.["2"] as Record<string, string> | undefined;
}

Given("que ainda não escolhi nada no aviso de cookies", async ({ page }) => {
  // Registrado depois do Before global (que grava "nada autorizado"): apaga a escolha
  await page.addInitScript(() => localStorage.removeItem("gatil_cookie_consent"));
  await prepararPagina(page);
});

Given("que já aceitei os cookies", async ({ page }) => {
  // Registrado depois do Before global (que grava "nada autorizado"): vale o aceite
  await page.addInitScript(() =>
    localStorage.setItem("gatil_cookie_consent", JSON.stringify({ stats: true, marketing: true, timestamp: Date.now() }))
  );
  await page.route("https://connect.facebook.net/**", (route) => {
    pixelDireto.set(page, true);
    return route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
  });
  await prepararPagina(page);
});

When("aceito os cookies", async ({ page }) => {
  await page.getByRole("region", { name: "Aviso de cookies" }).getByRole("button", { name: "Aceitar" }).click();
});

When("aceito só os cookies estatísticos", async ({ page }) => {
  await page.getByRole("region", { name: "Aviso de cookies" }).getByRole("button", { name: "Personalizar" }).click();
  await page.getByLabel("Cookies estatísticos").check();
  await page.getByRole("button", { name: "Salvar preferências" }).click();
});

When("navego pelo link {string}", async ({ page }, texto: string) => {
  await page.getByRole("link", { name: texto }).first().click();
});

Then("devo ver o aviso de cookies", async ({ page }) => {
  await expect(page.getByRole("region", { name: "Aviso de cookies" })).toBeVisible();
});

Then("o GTM não deve ter sido carregado", async ({ page }) => {
  await page.waitForTimeout(300);
  expect(gtm(page)).toHaveLength(0);
  expect(await dataLayer(page)).toHaveLength(0);
});

Then("o GTM deve ter sido carregado uma vez", async ({ page }) => {
  await expect.poll(() => gtm(page).length).toBe(1);
  expect(gtm(page)[0]).toContain("id=GTM-TESTE");
});

Then("o gtag.js do GA4 não deve ser carregado direto", async ({ page }) => {
  expect((pedidos.get(page) ?? []).filter((u) => u.includes("/gtag/js"))).toHaveLength(0);
});

Then("o consentimento enviado ao GTM deve liberar estatísticos e marketing", async ({ page }) => {
  expect(await ultimoConsentimento(page)).toEqual({
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
});

Then("o consentimento enviado ao GTM deve liberar só estatísticos", async ({ page }) => {
  expect(await ultimoConsentimento(page)).toEqual({
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
});

Then(
  "o dataLayer deve ter {int} page_view_spa de {string}",
  async ({ page }, quantidade: number, caminho: string) => {
    await expect
      .poll(async () =>
        ((await dataLayer(page)) as Record<string, unknown>[]).filter(
          (i) => i.event === "page_view_spa" && i.page_path === caminho
        ).length
      )
      .toBe(quantidade);
  }
);

Then("o GTM deve ter sido carregado", async ({ page }) => {
  await expect.poll(() => gtm(page).length).toBeGreaterThan(0);
});

Then("o dataLayer deve ter {int} evento {string}", async ({ page }, quantidade: number, nome: string) => {
  await expect.poll(async () => (await eventos(page, nome)).length).toBe(quantidade);
});

Then("o dataLayer não deve ter nenhum evento {string}", async ({ page }, nome: string) => {
  expect(await eventos(page, nome)).toHaveLength(0);
});

Then(
  "o dataLayer deve ter {int} evento {string} com pagamento {string}",
  async ({ page }, quantidade: number, nome: string, forma: string) => {
    await expect
      .poll(async () =>
        (await eventos(page, nome)).filter((e) => (e.ecommerce as Record<string, unknown>)?.payment_type === forma).length
      )
      .toBe(quantidade);
  }
);

Then(
  "o dataLayer deve ter {int} evento {string} com event_id {string}",
  async ({ page }, quantidade: number, nome: string, eventId: string) => {
    await expect.poll(async () => (await eventos(page, nome)).filter((e) => e.event_id === eventId).length).toBe(quantidade);
  }
);

Then(
  "o dataLayer deve ter {int} compra da rifa {string} de {int} reais com {int} bilhete",
  async ({ page }, quantidade: number, transacao: string, valor: number, bilhetes: number) => {
    await expect.poll(async () => (await eventos(page, "purchase")).length).toBe(quantidade);
    const [compra] = await eventos(page, "purchase");
    expect(compra.event_id).toBe(transacao);
    expect(compra.ecommerce).toMatchObject({
      transaction_id: transacao,
      value: valor,
      currency: "BRL",
      items: [{ item_id: "rifa-natal", quantity: bilhetes }],
    });
  }
);

Then("o Meta Pixel não deve ser carregado direto pelo site", async ({ page }) => {
  expect(pixelDireto.get(page) ?? false).toBe(false);
});
