import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";



test.describe("Analyst Phase 2 — shared pages read-only", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "analyst");
  });

  // TODO: /quality usa Server Components que no pueden ser mockeados por page.route. Requiere setup de BD en E2E.
  test.skip("analyst can reach /quality and sees no bulk action bar", async ({ page }) => {
    await page.goto("/quality");
    await expect(page).not.toHaveURL("/home");
    await expect(
      page.getByRole("heading", { name: /calidad/i }),
    ).toBeVisible();
    // QuarantineBulkBar only renders when selected.length > 0 — with empty
    // data the region never mounts, so no bulk buttons are visible.
    await expect(
      page.getByRole("button", { name: /guardar seleccionados/i }),
    ).not.toBeVisible();
  });

  // TODO: /workflows fue migrado a /quality. Test bloqueado hasta reescribir contra la nueva ruta.
  test.skip("analyst can reach /workflows and sees no save/reject buttons", async ({ page }) => {
    await page.goto("/workflows");
    await expect(page).not.toHaveURL("/home");
    await expect(
      page.getByRole("heading", { name: /homolog/i }),
    ).toBeVisible();
    // isReadOnly=true hides the action toolbar in HomologationClient
    await expect(
      page.getByRole("button", { name: /guardar seleccionados/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /ejecutar reprocesamiento/i }),
    ).not.toBeVisible();
  });

  test("analyst can reach /catalogos and sees no nueva variedad button", async ({ page }) => {
    await page.goto("/catalogos");
    await expect(page).not.toHaveURL("/home");
    await expect(
      page.getByRole("heading", { name: /catálogos/i }),
    ).toBeVisible();
    // NuevaVariedadDialog only renders when !isReadOnly
    await expect(
      page.getByRole("button", { name: /nueva variedad/i }),
    ).not.toBeVisible();
  });

  // TODO: /workflows migrado a /quality. Reescribir contra ruta vigente.
  test.skip("analyst sees analyst sidebar nav on /workflows (not admin nav)", async ({ page }) => {
    await page.goto("/workflows");
    // Analyst nav has "Mi Workspace" (home route label)
    await expect(
      page.getByRole("link", { name: /mi workspace/i }),
    ).toBeVisible();
    // Admin-only "Dashboard" link must not appear
    await expect(
      page.getByRole("link", { name: /^dashboard$/i }),
    ).not.toBeVisible();
  });

  test("analyst cannot reach admin-only /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL("/dashboard");
  });
});

test.describe("Admin still has full write access on shared pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  // TODO: /workflows migrado a /quality. Reescribir contra ruta vigente.
  test.skip("admin sees save/reject buttons on /workflows", async ({ page }) => {
    await page.goto("/workflows");
    await expect(
      page.getByRole("button", { name: /guardar seleccionados/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /rechazar/i }),
    ).toBeVisible();
  });

  test("admin sees nueva variedad button on /catalogos", async ({ page }) => {
    await page.goto("/catalogos");
    await expect(
      page.getByRole("button", { name: /nueva variedad/i }),
    ).toBeVisible();
  });
});
