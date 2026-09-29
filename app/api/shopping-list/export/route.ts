import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { appOrigin, sameOriginMutation } from "../../../lib/auth-core";
import { allRecipes, readWeek, shoppingLines, validWeek } from "../../../lib/shopping-list";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOriginMutation(request, env)) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  if (!await getUser()) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!env.BUCKET || !env.DB) return NextResponse.json({ error: "Speicher nicht verfügbar." }, { status: 503 });
  let body: { week?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 }); }
  if (!validWeek(body.week ?? null)) return NextResponse.json({ error: "Ungültige Woche." }, { status: 400 });
  const week = body.week as string;
  const { list } = await readWeek(week);
  const lines = shoppingLines(list, await allRecipes());
  if (!lines.length || lines.length > 300) return NextResponse.json({ error: "Die Liste enthält keine offenen Einträge oder ist zu lang." }, { status: 400 });
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await env.BUCKET.put(`shopping/exports/${token}.json`, JSON.stringify({ week, lines, expiresAt }), { httpMetadata: { contentType: "application/json" } });
  const publicUrl = new URL(`/einkaufsliste/bring/${token}`, appOrigin(env)).href;
  const deepLink = `https://api.getbring.com/rest/bringrecipes/deeplink?url=${encodeURIComponent(publicUrl)}&source=web&baseQuantity=1&requestedQuantity=1`;
  return NextResponse.json({ deepLink, publicUrl }, { headers: { "cache-control": "private, no-store" } });
}
