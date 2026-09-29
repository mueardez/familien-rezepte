import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getUser } from "../../auth";
import { sameOriginMutation } from "../../lib/auth-core";
import { allRecipes, currentWeek, listKey, normalizeList, readWeek, validWeek } from "../../lib/shopping-list";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await getUser()) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!env.BUCKET || !env.DB) return NextResponse.json({ error: "Speicher nicht verfügbar." }, { status: 503 });
  const week = new URL(request.url).searchParams.get("week") ?? currentWeek();
  if (!validWeek(week)) return NextResponse.json({ error: "Ungültige Kalenderwoche." }, { status: 400 });
  return NextResponse.json(await readWeek(week), { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  if (!sameOriginMutation(request, env)) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  if (!await getUser()) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!env.BUCKET || !env.DB) return NextResponse.json({ error: "Speicher nicht verfügbar." }, { status: 503 });
  let body: { week: string; version: string; list: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Ungültige Liste." }, { status: 400 }); }
  if (!validWeek(body.week) || typeof body.version !== "string") return NextResponse.json({ error: "Ungültige Kalenderwoche." }, { status: 400 });
  let list;
  try { list = normalizeList(body.list, new Set((await allRecipes()).map((recipe) => recipe.slug))); }
  catch { return NextResponse.json({ error: "Bitte die Einträge prüfen." }, { status: 400 }); }
  const condition = body.version ? { etagMatches: body.version } : new Headers({ "If-None-Match": "*" });
  const saved = await env.BUCKET.put(listKey(body.week), JSON.stringify(list), { onlyIf: condition, httpMetadata: { contentType: "application/json" } });
  if (!saved) return NextResponse.json({ error: "Die Liste wurde inzwischen auf einem anderen Gerät geändert. Bitte neu laden." }, { status: 409 });
  return NextResponse.json({ list, version: saved.etag });
}
