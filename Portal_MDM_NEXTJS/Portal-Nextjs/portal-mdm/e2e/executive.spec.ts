import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Módulo Ejecutivo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "executive", "Luis Quispe");
  });

  test("el home del ejecutivo es /overview", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/overview/);
  });

  test("muestra score global y KPIs estratégicos", async ({ page }) => {
    await page.goto("/overview");
    await expect(page.getByText(/Resumen estratégico/i)).toBeVisible();
    await expect(page.getByText(/Iniciativas activas/i)).toBeVisible();
    await expect(page.getByText(/Ahorro estimado anual/i)).toBeVisible();
  });

  test("ejecutivo no puede acceder a /entities (redirige a /overview)", async ({ page }) => {
    await page.goto("/entities");
    await expect(page).toHaveURL(/\/overview/);
  });

  test("ejecutivo no puede acceder a /models (redirige a /overview)", async ({ page }) => {
    await page.goto("/models");
    await expect(page).toHaveURL(/\/overview/);
  });
});
