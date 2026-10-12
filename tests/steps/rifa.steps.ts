import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, Then } = createBdd();

// PNG 1x1: o QR code de verdade vem do Mercado Pago
const QR_TESTE =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
// O mesmo código do Pix da doação: o passo "devo ver o QR code..." confere esse texto
const CODIGO_PIX_TESTE = "00020126580014br.gov.bcb.pix0136TESTE-gatil-irma-francisca";
const PAYMENT_ID_TESTE = 123456789;
const RASTREIO_TESTE = "rastreio-rifa-teste";

const pedidosPixRifa = new WeakMap<Page, Record<string, unknown>>();
const origensCartao = new WeakMap<Page, URLSearchParams>();

// ---------- mocks de rede ----------

Given("que a rifa devolve um link de pagamento válido", async ({ page }) => {
  await page.route("**/api/rifa/criar-pagamento**", (route) => {
    origensCartao.set(page, new URL(route.request().url()).searchParams);
    return route.fulfill({ json: { initPoint: "https://www.mercadopago.com.br/checkout/fake" } });
  });
  await page.route("**/checkout/fake**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html><body>Checkout fake</body></html>" })
  );
});

Given("que a rifa devolve um Pix válido", async ({ page }) => {
  await page.route("**/api/rifa/criar-pix**", (route) => {
    pedidosPixRifa.set(page, route.request().postDataJSON());
    return route.fulfill({
      status: 201,
      json: {
        message: "Pix criado com sucesso.",
        data: {
          paymentId: PAYMENT_ID_TESTE,
          rastreioId: RASTREIO_TESTE,
          qrCode: CODIGO_PIX_TESTE,
          qrCodeBase64: QR_TESTE,
          expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      },
    });
  });
});

Given("que o status do Pix da rifa fica {string}", async ({ page }, status: string) => {
  await page.route("**/api/rifa/status-pix/**", (route) =>
    route.fulfill({ json: { message: "ok", data: { status } } })
  );
});

Given(
  "que o status do Pix da rifa fica {string} e depois {string}",
  async ({ page }, primeiro: string, depois: string) => {
    let consultas = 0;
    await page.route("**/api/rifa/status-pix/**", (route) => {
      consultas += 1;
      const url = new URL(route.request().url());
      // O front manda o rastreioId junto, pra não dar pra consultar Pix de outra pessoa
      expect(url.pathname).toMatch(new RegExp(`/rifa/status-pix/${PAYMENT_ID_TESTE}$`));
      expect(url.searchParams.get("ref")).toBe(RASTREIO_TESTE);
      return route.fulfill({ json: { message: "ok", data: { status: consultas === 1 ? primeiro : depois } } });
    });
  }
);

Given("que a confirmação do número é aceita", async ({ page }) => {
  await page.route("**/api/rifa/confirmar-numero**", (route) => {
    // A confirmação usa o token devolvido pelo verificar-pagamento
    expect(route.request().headers()["authorization"]).toBe("Bearer token-de-teste");
    const body = route.request().postDataJSON();
    return route.fulfill({
      json: { message: "Número confirmado.", data: { id: "id-de-teste", claimedNumber: body?.claimedNumber } },
    });
  });
});

// ---------- asserts ----------

Then(
  "a origem enviada no pagamento da rifa deve ser {string} e {string}",
  async ({ page }, utmSource: string, utmMedium: string) => {
    const origem = origensCartao.get(page);
    expect(origem?.get("utmSource")).toBe(utmSource);
    expect(origem?.get("utmMedium")).toBe(utmMedium);
  }
);

Then(
  "o Pix da rifa deve ter sido pedido com o e-mail {string} e a origem {string}",
  async ({ page }, email: string, origem: string) => {
    const pedido = pedidosPixRifa.get(page);
    expect(pedido?.email).toBe(email);
    expect(pedido?.utmSource).toBe(origem);
    // O valor do bilhete é definido no backend, nunca pelo navegador
    expect(pedido).not.toHaveProperty("valor");
  }
);

Then("devo ser levado para a escolha do número quando o Pix for aprovado", async ({ page }) => {
  // 1ª consulta: pendente; a seguinte (~4s depois): aprovado; e ~2s mostrando "confirmado"
  await expect(page.getByRole("heading", { name: "Pagamento confirmado!" })).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(new RegExp(`/rifa/pagamento-aprovado\\?payment_id=${PAYMENT_ID_TESTE}$`), {
    timeout: 10_000,
  });
  await expect(page.getByRole("heading", { name: "Escolha seu número da sorte" })).toBeVisible();
});
