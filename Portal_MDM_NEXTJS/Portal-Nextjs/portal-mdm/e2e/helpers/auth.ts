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
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url")
      .replace(/=/g, "");

  const header = encode({ alg: "HS256", typ: "JWT" });
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600;
  const payload = encode({ sub: "test-user", role, name, exp });
  
  const secret = process.env.ACP_JWT_SECRETO || "CAMBIAME_POR_UNA_CLAVE_SUPER_SECRETA_DE_32_CHARS";
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
