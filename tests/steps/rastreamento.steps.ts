import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

// URLs do Google pedidas pela página (o GTM de verdade nunca é baixado: responde vazio)
const pedidos = new WeakMap<Page, string[]>();

async function interceptarGoogle(page: Page) {
  const lista: string[] = [];
  pedidos.set(page, lista);
  await page.route("https://www.googletagmanager.com/**", (route) => {
    lista.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
  });
}

const gtm = (page: Page) => (pedidos.get(page) ?? []).filter((u) => u.includes("/gtm.js"));

type Item = Record<string, unknown> | { [i: number]: unknown; length: number };

async function dataLayer(page: Page): Promise<Item[]> {
  // gtag() empurra o objeto "arguments": vira { "0": ..., "1": ... } ao serializar
  return page.evaluate(() => JSON.parse(JSON.stringify(window.dataLayer ?? [])));
}

async function ultimoConsentimento(page: Page) {
  const itens = (await dataLayer(page)) as Record<string, unknown>[];
  const updates = itens.filter((i) => i["0"] === "consent" && i["1"] === "update");
  return updates.at(-1)?.["2"] as Record<string, string> | undefined;
}

Given("que ainda não escolhi nada no aviso de cookies", async ({ page }) => {
  // Registrado depois do Before global (que grava "nada autorizado"): apaga a escolha
  await page.addInitScript(() => localStorage.removeItem("gatil_cookie_consent"));
  // Só as chamadas ao backend (/api/...), não os módulos do Vite em /src/lib/api
  await page.route((url) => url.pathname.startsWith("/api/"), (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "ok", data: null }) })
  );
  await interceptarGoogle(page);
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
