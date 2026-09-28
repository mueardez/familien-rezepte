import assert from "node:assert/strict";
import test from "node:test";
import { SignJWT } from "jose";

const config = {
  APP_ORIGIN: "https://recipes.example.com", GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-only", SESSION_SECRET: "test-only-not-for-production-0123456789",
  RECIPE_ADMIN_EMAIL: "admin@example.com", ALLOWED_EMAILS: "member@example.com",
};
globalThis.__testEnv = config;

test("renders the recipe collection and import entry point", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Familien-Rezepte/);
  assert.match(html, /href="\/rezept-import"/);

  const fetchPage = (path, options = {}) => worker.fetch(new Request(config.APP_ORIGIN + path, options), {}, { waitUntil() {}, passThroughOnException() {} });
  assert.match(html, /Petromax Schinken/);
  const petromaxLinks = [...html.matchAll(/href="(\/rezepte\/petromax-[^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(petromaxLinks).size, 10);
  for (const path of new Set(petromaxLinks)) {
    const recipePage = await fetchPage(path, { headers: { accept: "text/html" } });
    assert.equal(recipePage.status, 200, path);
    assert.match(await recipePage.text(), /recipeIngredient/);
  }
  const loginPage = await fetchPage("/anmelden", { headers: { accept: "text/html" } });
  assert.equal(loginPage.status, 200);
  assert.match(await loginPage.text(), /Mit Google anmelden/);
  assert.match(loginPage.headers.get("cache-control"), /no-store/);

  // User-supplied headers from the former hosting platform grant NO access.
  for (const endpoint of ["/api/import/analyze", "/api/import/save"]) {
    const response = await fetchPage(endpoint, { method: "POST", headers: {
      origin: config.APP_ORIGIN, "oai-authenticated-user-email": config.RECIPE_ADMIN_EMAIL,
    } });
    assert.equal(response.status, 401);
  }
  const forbiddenOrigin = await fetchPage("/api/import/save", { method: "POST", headers: { origin: "https://evil.com" } });
  assert.equal(forbiddenOrigin.status, 403);
  const memberToken = await new SignJWT({ sub: "member", email: "member@example.com" }).setProtectedHeader({ alg: "HS256" })
    .setIssuer(config.APP_ORIGIN).setAudience("session").setIssuedAt().setExpirationTime("5m")
    .sign(new TextEncoder().encode(config.SESSION_SECRET));
  const memberImport = await fetchPage("/api/import/save", { method: "POST", headers: {
    origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${memberToken}`,
  } });
  assert.equal(memberImport.status, 403);

  const login = await fetchPage("/auth/google?return_to=%2Frezept-import");
  assert.equal(login.status, 302);
  const google = new URL(login.headers.get("location"));
  assert.equal(google.origin, "https://accounts.google.com");
  assert.equal(google.searchParams.get("scope"), "openid email");
  assert.equal(google.searchParams.get("redirect_uri"), config.APP_ORIGIN + "/auth/callback");
  assert.equal(google.searchParams.get("code_challenge_method"), "S256");
  assert.ok(google.searchParams.get("nonce"));
  const flowCookie = login.headers.get("set-cookie").split(";")[0];
  const invalidCallback = await fetchPage("/auth/callback?state=wrong&code=fake", { headers: { cookie: flowCookie } });
  assert.equal(invalidCallback.status, 303);
  assert.match(invalidCallback.headers.get("location"), /error=login/);
  assert.match(invalidCallback.headers.get("set-cookie"), /Max-Age=0/);
  const logout = await fetchPage("/auth/logout", { method: "POST", headers: { origin: config.APP_ORIGIN } });
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
});
