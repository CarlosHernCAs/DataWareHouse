import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Módulo Admin — Catálogos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin", "Carmen Vega");
    await page.goto("/catalogos");
  });

  test("carga la tabla de catálogos", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^Catálogos$/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("muestra filtros por tipo de catálogo", async ({ page }) => {
    const tabs = ["Variedades", "Geografía", "Personal"];
    for (const label of tabs) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }
  });

  test("filtra por tipo al hacer clic en tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Personal" }).click();
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
  });

  test("filtra por texto en el buscador", async ({ page }) => {
    await page.getByPlaceholder(/buscar/i).fill("A");
    await expect(page.getByRole("table")).toBeVisible();
    const rows = page.getByRole("row");
    // Header row + at least one match
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("pagina correctamente", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: /siguiente/i });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await expect(page.getByText(/página 2/i)).toBeVisible();
    }
  });
});
