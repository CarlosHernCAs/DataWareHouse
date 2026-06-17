import type { Page } from "@playwright/test";

/**
 * Inject a fake JWT cookie so Playwright tests don't need a real FastAPI.
 * The cookie bypasses the login page; proxy.ts does an optimistic decode.
 *
 * Payload: { sub, role, exp: now + 8h }
 * Signed with an empty secret (HS256) — only valid for tests.
 */
import * as crypto from "crypto";

function buildFakeJwt(role: "analyst" | "admin" | "executive", name: string): string {
  const secret = process.env.ACP_JWT_SECRETO || "";

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url")
      .replace(/=/g, "");

  const header = encode({ alg: "HS256", typ: "JWT" });
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600;
  // Usamos 'admin' porque FastAPI verifica que el sub exista en la BD (SQL Server).
  // Aunque sea 'admin', FastAPI confía en el 'role' que viene en el JWT para el RBAC.
  const payload = encode({ sub: "admin", role, name, exp });

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url")
    .replace(/=/g, "");

  return `${header}.${payload}.${signature}`;
}


export async function loginAs(
  page: Page,
  role: "analyst" | "admin" | "executive",
  name = "Test User",
) {
  await page.context().addCookies([
    {
      name: process.env.JWT_COOKIE_NAME ?? "mdm_session",
      value: buildFakeJwt(role, name),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
