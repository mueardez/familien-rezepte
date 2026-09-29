import { env } from "cloudflare:workers";
import { appOrigin } from "../../../lib/auth-core";

export const dynamic = "force-dynamic";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const noStore = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" };

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!env.BUCKET || !/^[0-9a-f-]{36}$/.test(token)) return new Response("Nicht gefunden", { status: 404, headers: noStore });
  const object = await env.BUCKET.get(`shopping/exports/${token}.json`);
  if (!object) return new Response("Nicht gefunden", { status: 404, headers: noStore });
  let snapshot: { week: string; lines: string[]; expiresAt: number };
  try { snapshot = JSON.parse(await object.text()); } catch { return new Response("Nicht gefunden", { status: 404, headers: noStore }); }
  if (snapshot.expiresAt < Date.now() || !Array.isArray(snapshot.lines)) return new Response("Dieser Link ist abgelaufen.", { status: 404, headers: noStore });
  const title = `Wocheneinkaufsliste ab ${snapshot.week}`;
  const recipe = { "@context": "https://schema.org", "@type": "Recipe", name: title, author: { "@type": "Organization", name: "Familien-Rezepte" }, image: [new URL("/og.png", appOrigin(env)).href], recipeYield: "1 Liste", recipeIngredient: snapshot.lines };
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)}</title><script type="application/ld+json">${JSON.stringify(recipe).replace(/</g, "\\u003c")}</script></head><body style="font-family:Arial,sans-serif;max-width:640px;margin:3rem auto;padding:0 1rem;color:#24352d"><h1>${escapeHtml(title)}</h1><p>Offene Einträge für Bring!</p><ul>${snapshot.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul></body></html>`;
  return new Response(html, { headers: { ...noStore, "content-type": "text/html; charset=utf-8" } });
}
