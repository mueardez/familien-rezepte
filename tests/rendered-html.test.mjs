import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const env = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("renders the recipe overview", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /Familien-Rezepte/);
  assert.match(html, /Was kochen wir heute/);
  assert.match(html, /Kartoffel-Zucchini-Bauernpfanne/);
});

test("renders a Bring-compatible recipe page", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/rezepte/kartoffel-pizza", { headers: { accept: "text/html" } }), env, ctx);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Kartoffel-Pizza/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /schema\.org/);
  assert.match(html, /recipeIngredient/);
  assert.match(html, /Zutaten in Bring! übernehmen/);
});
