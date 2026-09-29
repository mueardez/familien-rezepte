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
  // Both allowed accounts have equal access; outsiders and removed users do not.
  for (const email of ["admin@example.com", "member@example.com", "stranger@example.com"]) {
    const token = await new SignJWT({ sub: email, email }).setProtectedHeader({ alg: "HS256" })
      .setIssuer(config.APP_ORIGIN).setAudience("session").setIssuedAt().setExpirationTime("5m")
      .sign(new TextEncoder().encode(config.SESSION_SECRET));
    const headers = { origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${token}` };
    const allowed = email !== "stranger@example.com";
    for (const endpoint of ["/api/import/save", "/api/import/analyze"]) {
      const result = await fetchPage(endpoint, { method: "POST", headers });
      // Authorized requests reach dependency validation (test env has no storage/API key).
      assert.equal(result.status, allowed ? 503 : 401, email + endpoint);
    }
    if (allowed) {
      const page = await fetchPage("/rezept-import", { headers: { ...headers, accept: "text/html" } });
      assert.equal(page.status, 200);
      const body = await page.text();
      assert.match(body, /Bild auswählen/);
      assert.doesNotMatch(body, /Kein Zugriff/);
      const crossSite = await fetchPage("/api/import/save", { method: "POST", headers: { ...headers, origin: "https://evil.com" } });
      assert.equal(crossSite.status, 403);
    }
  }

  // A readable ingredient-only extraction must reach the editor, not a photo-quality error.
  const realFetch = globalThis.fetch;
  config.OPENAI_API_KEY = "test-only-no-network";
  const token = await new SignJWT({ sub: "member", email: "member@example.com" }).setProtectedHeader({ alg: "HS256" })
    .setIssuer(config.APP_ORIGIN).setAudience("session").setIssuedAt().setExpirationTime("5m")
    .sign(new TextEncoder().encode(config.SESSION_SECRET));
  const ingredientsOnly = { title: "", language: "de", time: "", servings: "", method: "Andere", ingredients: ["1 Wrap", "3 Eier", "40 g geriebener Käse"], steps: [] };
  try {
    for (const [output, expected] of [[JSON.stringify(ingredientsOnly), 200], [JSON.stringify({ ...ingredientsOnly, ingredients: [] }), 422], ["invalid json", 422]]) {
      globalThis.fetch = async (url) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        return Response.json({ output: [{ content: [{ type: "output_text", text: output }] }] });
      };
      const form = new FormData();
      form.set("textImage", new File(["test-image"], "recipe.png", { type: "image/png" }));
      const result = await fetchPage("/api/import/analyze", { method: "POST", body: form, headers: { origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${token}` } });
      assert.equal(result.status, expected);
      const data = await result.json();
      if (expected === 200) assert.deepEqual(data.recipe, ingredientsOnly);
      else assert.doesNotMatch(data.error, /schärfer/);
    }
  } finally {
    globalThis.fetch = realFetch;
    delete config.OPENAI_API_KEY;
  }

  // Optional preparation: persist an empty array, including omitted/blank steps.
  const savedRows = [];
  config.DB = { prepare: () => ({ bind: (...values) => ({ first: async () => null, run: async () => { savedRows.push(values); } }) }) };
  config.BUCKET = { put: async () => {}, delete: async () => {} };
  try {
    for (const steps of [[], ["  "], undefined, ["Wrap füllen."]]) {
      const form = new FormData();
      form.set("dishImage", new File(["test"], "dish.png", { type: "image/png" }));
      form.set("recipe", JSON.stringify({ ...ingredientsOnly, title: "Ei-Wrap", steps }));
      const result = await fetchPage("/api/import/save", { method: "POST", body: form, headers: { origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${token}` } });
      assert.equal(result.status, 200);
      assert.deepEqual(JSON.parse(savedRows.at(-1)[10]), steps?.filter((item) => item.trim()) ?? []);
    }
    for (const invalid of [{ title: "" }, { ingredients: [] }]) {
      const form = new FormData();
      form.set("dishImage", new File(["test"], "dish.png", { type: "image/png" }));
      form.set("recipe", JSON.stringify({ ...ingredientsOnly, title: "Ei-Wrap", ...invalid }));
      const result = await fetchPage("/api/import/save", { method: "POST", body: form, headers: { origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${token}` } });
      assert.equal(result.status, 400);
    }
    assert.equal(savedRows.length, 4);
  } finally {
    delete config.DB;
    delete config.BUCKET;
  }

  const rows = new Map();
  const files = new Map();
  config.DB = { prepare(sql) {
    return {
      async all() { return { results: [...rows.values()] }; },
      bind(...values) {
        return {
          async first() {
            return rows.get(values[0]) ?? null;
          },
          async all() { return { results: [...rows.values()] }; },
          async run() {
            if (sql.startsWith("INSERT")) {
              const [id, slug, owner_email, title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key] = values;
              rows.set(slug, { id, slug, owner_email, title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key });
            } else if (sql.startsWith("UPDATE")) {
              const [title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key, slug] = values;
              Object.assign(rows.get(slug), { title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key });
            }
          },
        };
      },
    };
  } };
  config.BUCKET = { put: async (key, body) => { files.set(key, body); }, delete: async (key) => { files.delete(key); } };
  try {
    const slug = "kartoffel-zucchini-bauernpfanne";
    const cookie = `__Host-familien-session=${token}`;
    const editPage = await fetchPage(`/rezepte/${slug}/bearbeiten`, { headers: { cookie, accept: "text/html" } });
    assert.equal(editPage.status, 200);
    assert.match(await editPage.text(), /bearbeiten/);
    const draft = { title: "Bauernpfanne angepasst", language: "en", time: "35 Min.", method: "Ofen", servings: "4 Portionen", isInstagram: true, ingredients: ["2 Kartoffeln"], steps: [] };
    const requestEdit = (path, data, headers = {}) => fetchPage(path, { method: "PATCH", body: data, headers: { origin: config.APP_ORIGIN, cookie, ...headers } });
    const form = new FormData(); form.set("recipe", JSON.stringify(draft));
    assert.equal((await requestEdit(`/api/recipes/${slug}`, form, { origin: "https://evil.com" })).status, 403);
    assert.equal((await requestEdit("/api/recipes/does-not-exist", form)).status, 404);
    const outsider = await new SignJWT({ sub: "outsider", email: "outsider@example.com" }).setProtectedHeader({ alg: "HS256" })
      .setIssuer(config.APP_ORIGIN).setAudience("session").setIssuedAt().setExpirationTime("5m")
      .sign(new TextEncoder().encode(config.SESSION_SECRET));
    assert.equal((await fetchPage(`/api/recipes/${slug}`, { method: "PATCH", body: form, headers: { origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${outsider}` } })).status, 401);
    assert.equal((await requestEdit(`/api/recipes/${slug}`, form)).status, 200);
    assert.equal(rows.size, 1);
    assert.equal(rows.get(slug).image_key, "");
    assert.equal(rows.get(slug).language, "en");
    const home = await fetchPage("/", { headers: { accept: "text/html" } });
    const homeText = await home.text();
    assert.match(homeText, /Bauernpfanne angepasst/);
    assert.equal((homeText.match(/href="\/rezepte\/kartoffel-zucchini-bauernpfanne"/g) ?? []).length, 1);
    const detail = await fetchPage(`/rezepte/${slug}`, { headers: { cookie, accept: "text/html" } });
    const detailText = await detail.text();
    assert.match(detailText, /Bauernpfanne angepasst/);
    assert.match(detailText, /Rezept bearbeiten/);
    assert.doesNotMatch(detailText, /<h2>So geht’s<\/h2>/);
    const replacement = new FormData();
    replacement.set("recipe", JSON.stringify({ ...draft, title: "Nochmals angepasst", steps: ["Im Ofen backen."] }));
    replacement.set("dishImage", new File(["picture"], "dish.png", { type: "image/png" }));
    assert.equal((await requestEdit(`/api/recipes/${slug}`, replacement)).status, 200);
    assert.equal(rows.size, 1);
    assert.equal(files.size, 1);
    assert.equal(rows.get(slug).steps_json, '["Im Ofen backen."]');
    const previousKey = rows.get(slug).image_key;
    const anotherPhoto = new FormData();
    anotherPhoto.set("recipe", JSON.stringify(draft));
    anotherPhoto.set("dishImage", new File(["new picture"], "new.png", { type: "image/png" }));
    assert.equal((await requestEdit(`/api/recipes/${slug}`, anotherPhoto)).status, 200);
    assert.equal(files.size, 1);
    assert.equal(files.has(previousKey), false);
    assert.equal(files.has(rows.get(slug).image_key), true);
  } finally {
    delete config.DB;
    delete config.BUCKET;
  }

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

test("weekly list saves recipes and extras, guards mutations and exports only open items", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("shopping", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const objects = new Map();
  let revision = 0;
  config.DB = { prepare: () => ({ all: async () => ({ results: [] }) }) };
  config.BUCKET = {
    get: async (key) => objects.has(key) ? { etag: objects.get(key).etag, text: async () => objects.get(key).text } : null,
    put: async (key, value, options) => {
      const previous = objects.get(key);
      const condition = options?.onlyIf;
      if (condition instanceof Headers && condition.get("If-None-Match") === "*" && previous) return null;
      if (condition?.etagMatches && previous?.etag !== condition.etagMatches) return null;
      const object = { text: value, etag: String(++revision) };
      objects.set(key, object);
      return object;
    },
  };
  const token = await new SignJWT({ sub: "member", email: "member@example.com" }).setProtectedHeader({ alg: "HS256" })
    .setIssuer(config.APP_ORIGIN).setAudience("session").setIssuedAt().setExpirationTime("5m")
    .sign(new TextEncoder().encode(config.SESSION_SECRET));
  const headers = { origin: config.APP_ORIGIN, cookie: `__Host-familien-session=${token}`, "content-type": "application/json" };
  const fetchPage = (path, options = {}) => worker.fetch(new Request(config.APP_ORIGIN + path, options), {}, { waitUntil() {}, passThroughOnException() {} });
  try {
    const privatePage = await fetchPage("/einkaufsliste", { headers: { accept: "text/html" } });
    assert.equal(privatePage.status, 307);
    const page = await fetchPage("/einkaufsliste", { headers: { ...headers, accept: "text/html" } });
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Wocheneinkaufsliste/);
    const week = "2026-09-28";
    const first = await fetchPage(`/api/shopping-list?week=${week}`, { headers });
    assert.equal(first.status, 200);
    assert.equal((await first.json()).version, "");
    const list = { recipes: ["petromax-schinken-kaese-kartoffelrolle"], extras: [{ id: "123e4567-e89b-42d3-a456-426614174000", text: "1 Liter Milch" }], checked: ["123e4567-e89b-42d3-a456-426614174000"] };
    // Use an existing slug from the collection.
    const home = await fetchPage("/", { headers: { accept: "text/html" } });
    const slug = [...(await home.text()).matchAll(/href="\/rezepte\/(petromax-[^"]+)"/g)][0]?.[1];
    assert.ok(slug);
    list.recipes = [slug];
    const save = await fetchPage("/api/shopping-list", { method: "PUT", headers, body: JSON.stringify({ week, version: "", list }) });
    assert.equal(save.status, 200, await save.clone().text());
    const version = (await save.json()).version;
    const conflict = await fetchPage("/api/shopping-list", { method: "PUT", headers, body: JSON.stringify({ week, version: "", list }) });
    assert.equal(conflict.status, 409);
    const crossSite = await fetchPage("/api/shopping-list", { method: "PUT", headers: { ...headers, origin: "https://evil.example" }, body: JSON.stringify({ week, version, list }) });
    assert.equal(crossSite.status, 403);
    const exported = await fetchPage("/api/shopping-list/export", { method: "POST", headers, body: JSON.stringify({ week }) });
    assert.equal(exported.status, 200, await exported.clone().text());
    const { publicUrl, deepLink } = await exported.json();
    assert.match(deepLink, /api\.getbring\.com/);
    const publicPage = await fetchPage(new URL(publicUrl).pathname);
    assert.equal(publicPage.status, 200);
    const html = await publicPage.text();
    assert.match(html, /recipeIngredient/);
    assert.doesNotMatch(html, /1 Liter Milch/);
    assert.match(publicPage.headers.get("x-robots-tag"), /noindex/);
  } finally { delete config.DB; delete config.BUCKET; }
});
