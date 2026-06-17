# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: analyst-portal.spec.ts >> Portal Analista — smoke tests >> página de notificaciones carga sin errores
- Location: e2e\analyst-portal.spec.ts:92:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Notificaciones')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Notificaciones')

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - navigation [ref=e6]:
            - button "previous" [disabled] [ref=e7]:
              - img "previous" [ref=e8]
            - generic [ref=e10]:
              - generic [ref=e11]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e12]:
              - img "next" [ref=e13]
          - img
        - generic [ref=e15]:
          - link "Next.js 16.2.4 (stale) Turbopack" [ref=e16] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e17]
            - generic "There is a newer version (16.2.9) available, upgrade recommended!" [ref=e19]: Next.js 16.2.4 (stale)
            - generic [ref=e20]: Turbopack
          - img
      - dialog "Build Error" [ref=e22]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e29]: Build Error
              - generic [ref=e30]:
                - button "Copy Error Info" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - link "Go to related documentation" [ref=e34] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/messages/module-not-found
                  - img [ref=e35]
                - button "Attach Node.js inspector" [ref=e37] [cursor=pointer]:
                  - img [ref=e38]
            - generic [ref=e47]: "Module not found: Can't resolve 'undici'"
          - generic [ref=e49]:
            - generic [ref=e51]:
              - img [ref=e53]
              - generic [ref=e57]: ./lib/api/server-fetch.ts (1:1)
              - button "Open in editor" [ref=e58] [cursor=pointer]:
                - img [ref=e60]
            - generic [ref=e63]:
              - generic [ref=e64]: Module not found
              - generic [ref=e65]: ": Can't resolve"
              - text: "'undici' >"
              - generic [ref=e66]: 1 |
              - text: import
              - generic [ref=e67]: "{"
              - text: Agent as UndiciAgent
              - generic [ref=e68]: "}"
              - text: from "undici"
              - generic [ref=e69]: ;
              - generic [ref=e70]: "|"
              - text: ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              - generic [ref=e71]: 2 |
              - text: import
              - generic [ref=e72]: "{ cookies }"
              - text: from "next/headers"
              - generic [ref=e73]: ;
              - generic [ref=e74]: 3 |
              - text: import
              - generic [ref=e75]: "{"
              - text: JWT_COOKIE_NAME
              - generic [ref=e76]: "}"
              - text: from "@/lib/auth/session"
              - generic [ref=e77]: ;
              - generic [ref=e78]: 4 |
              - generic [ref=e79]:
                - text: "Import trace: App Route: ./lib/api/server-fetch.ts ./app/api/cc/health/route.ts"
                - link "https://nextjs.org/docs/messages/module-not-found" [ref=e80] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/messages/module-not-found
        - generic [ref=e81]: "1"
        - generic [ref=e82]: "2"
    - generic [ref=e87] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e88]:
        - img [ref=e89]
      - button "Open issues overlay" [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]: "0"
          - generic [ref=e96]: "1"
        - generic [ref=e97]: Issue
  - alert [ref=e98]
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import { loginAs } from "./helpers/auth";
  3   | 
  4   | const EMPTY_VIEWS: Array<{
  5   |   nombre: string;
  6   |   label: string;
  7   |   descripcion: string;
  8   |   columnas: string[];
  9   |   tipos: Record<string, string>;
  10  | }> = [
  11  |   {
  12  |     nombre: "vw_cosecha_mensual",
  13  |     label: "Cosecha mensual",
  14  |     descripcion: "Producción mensual",
  15  |     columnas: ["fecha", "variedad", "toneladas"],
  16  |     tipos: { fecha: "fecha", variedad: "texto", toneladas: "numero" },
  17  |   },
  18  | ];
  19  | 
  20  | const EMPTY_HOME = { widgets: [], savedAt: null };
  21  | const EMPTY_NOTIFICATIONS = { items: [], total: 0, no_leidas: 0 };
  22  | 
  23  | async function stubAnalystRoutes(page: Page) {
  24  |   await page.route("**/api/analyst/home", (route) => {
  25  |     if (route.request().method() === "GET") {
  26  |       route.fulfill({ json: EMPTY_HOME });
  27  |     } else {
  28  |       route.fulfill({ json: { ok: true } });
  29  |     }
  30  |   });
  31  |   await page.route("**/api/analyst/views", (route) =>
  32  |     route.fulfill({ json: EMPTY_VIEWS }),
  33  |   );
  34  |   await page.route("**/api/analyst/notifications**", (route) =>
  35  |     route.fulfill({ json: EMPTY_NOTIFICATIONS }),
  36  |   );
  37  |   await page.route("**/api/analyst/widget", (route) =>
  38  |     route.fulfill({
  39  |       json: {
  40  |         data: [{ type: "bar", x: ["A", "B"], y: [10, 20] }],
  41  |         layout: {},
  42  |         meta: { filas: 2 },
  43  |       },
  44  |     }),
  45  |   );
  46  |   // Suprimir rutas del control-center que podrían cargar en el shell
  47  |   await page.route("**/api/cc/**", (route) =>
  48  |     route.fulfill({ status: 200, json: {} }),
  49  |   );
  50  | }
  51  | 
  52  | test.describe("Portal Analista — smoke tests", () => {
  53  |   test.beforeEach(async ({ page }) => {
  54  |     await loginAs(page, "analyst", "Analista Test");
  55  |     await stubAnalystRoutes(page);
  56  |   });
  57  | 
  58  |   test("analyst accede a /home y ve el workspace", async ({ page }) => {
  59  |     await page.goto("/home");
  60  |     await expect(page).toHaveURL("/home");
  61  |     await expect(page.getByText("Mi Workspace")).toBeVisible();
  62  |     // Workspace vacío — ver empty state o toolbar
  63  |     await expect(page.getByRole("button", { name: /editar layout/i })).toBeVisible();
  64  |   });
  65  | 
  66  |   test("sidebar del analista muestra rutas correctas", async ({ page }) => {
  67  |     await page.goto("/home");
  68  |     // Debe tener enlace al workspace
  69  |     await expect(page.getByRole("link", { name: /workspace/i })).toBeVisible();
  70  |     // NO debe mostrar rutas exclusivas del admin
  71  |     await expect(page.getByRole("link", { name: /^dashboard$/i })).not.toBeVisible();
  72  |     await expect(page.getByRole("link", { name: /etl.monitor/i })).not.toBeVisible();
  73  |   });
  74  | 
  75  |   test("analista puede abrir el modal de nuevo widget", async ({ page }) => {
  76  |     await page.goto("/home");
  77  |     await page.getByRole("button", { name: /editar layout/i }).click();
  78  |     await page.getByRole("button", { name: /widget/i }).first().click();
  79  |     await expect(page.getByRole("dialog")).toBeVisible();
  80  |     await expect(page.getByText("Nuevo widget")).toBeVisible();
  81  |   });
  82  | 
  83  |   test("analista NO puede acceder a /dashboard", async ({ page }) => {
  84  |     await page.goto("/dashboard");
  85  |     // Debe redirigir a /home (rol analyst, ROLE_HOME = /home)
  86  |     await expect(page).not.toHaveURL("/dashboard");
  87  |     // Debe terminar en /home o /login
  88  |     const url = page.url();
  89  |     expect(url.includes("/home") || url.includes("/login")).toBeTruthy();
  90  |   });
  91  | 
  92  |   test("página de notificaciones carga sin errores", async ({ page }) => {
  93  |     await page.goto("/notifications");
  94  |     await expect(page).toHaveURL("/notifications");
> 95  |     await expect(page.getByText("Notificaciones")).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  96  |     // Verificar que no hay error 403 ni 500
  97  |     await expect(page.getByText(/no autorizado/i)).not.toBeVisible();
  98  |     await expect(page.getByText(/error interno/i)).not.toBeVisible();
  99  |     // Estado vacío — sin notificaciones
  100 |     await expect(page.getByText("Sin notificaciones")).toBeVisible();
  101 |   });
  102 | 
  103 |   test("analista con JWT admin no puede pasar como analyst", async ({ page }) => {
  104 |     // Sobreescribir cookie con rol admin — NO debe acceder a /home sin redirección
  105 |     // (este test verifica que el RBAC en el layout sí aplica)
  106 |     await loginAs(page, "admin", "Admin Test");
  107 |     await page.goto("/home");
  108 |     // El admin debería ser redirigido a /dashboard (su ROLE_HOME)
  109 |     await expect(page).not.toHaveURL("/home");
  110 |   });
  111 | });
  112 | 
```