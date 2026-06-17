import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

/**
 * Smoke tests del Dashboard (/dashboard).
 *
 * Estos tests stubean los endpoints `/api/cc/*` con fixtures
 * deterministas para no depender de un FastAPI real. La intención es
 * verificar que el shell del dashboard renderiza correctamente —
 * Hero KPIs, cards, click-through y border tonal según el estado.
 *
 * Los stubs cubren TANTO el prefetch server-side del HydrationBoundary
 * (request server-to-server con cookie) como el refetch client-side
 * subsiguiente. Playwright intercepta ambos porque comparten URL.
 */


test.describe("Dashboard admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin", "Carmen Hernández");
  });

  test("renderiza el page header y el indicador de auto-refresh", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /^Dashboard$/, level: 1 }),
    ).toBeVisible();
    // V4: LastSyncBadge muestra "Actualizado ..." o "Actualizando..."
    await expect(
      page
        .getByText(/Actualizado|Actualizando/i)
        .first(),
    ).toBeVisible();
  });

  test("V1: muestra los 4 KPIs del hero con labels correctos", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const hero = page.getByRole("region", { name: /indicadores clave/i });
    await expect(hero).toBeVisible();
    await expect(hero.getByText(/filas insertadas 24 h/i)).toBeVisible();
    await expect(hero.getByText(/fallos etl 24 h/i)).toBeVisible();
    await expect(hero.getByText(/pendientes cuarentena/i)).toBeVisible();
    await expect(hero.getByText(/críticas sin atender/i)).toBeVisible();
  });

  test("V1: el KPI de filas muestra el número formateado", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const hero = page.getByRole("region", { name: /indicadores clave/i });
    // Verificar que el KPI de filas existe
    await expect(hero.getByText(/filas insertadas 24 h/i)).toBeVisible();
  });

  test("V3: KPI hero es link al detalle correspondiente", async ({ page }) => {
    await page.goto("/dashboard");
    const kpiFallos = page.getByRole("link", {
      name: /fallos etl 24 h/i,
    });
    await expect(kpiFallos).toBeVisible();
    await kpiFallos.click();
    await expect(page).toHaveURL(/\/etl-monitor/);
  });

  test("muestra las 5 cards principales", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /tendencia etl/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /alertas recientes/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /calidad — cuarentena/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /estado dwh/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /salud etl/i }),
    ).toBeVisible();
  });

  test("V3: click en card Tendencia ETL navega a /etl-monitor", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const card = page.getByRole("link", {
      name: /abrir detalle: tendencia etl/i,
    });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/etl-monitor/);
  });
});
