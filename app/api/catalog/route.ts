import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getUser } from "../../auth";
import { sameOriginMutation } from "../../lib/auth-core";
import { changeCatalog, migrateCatalog, readCatalog } from "../../lib/catalog";
import { allRecipes } from "../../lib/shopping-list";
import { canonicalName, foodKey } from "../../lib/ingredients";
import { defaultMailSchedule, normalizeMailSchedule } from "../../lib/mail-schedule";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!await getUser()) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  const { data } = await readCatalog();
  return NextResponse.json({ mailSchedule: data.mailSchedule ?? defaultMailSchedule, methods: data.methods, foods: data.foods, migratedAt: data.migratedAt, review: (await allRecipes()).flatMap((recipe) => (recipe.ingredientItems ?? []).filter((item) => item.review).map((item) => ({ slug: recipe.slug, original: item.original, name: item.name }))) }, { headers: { "cache-control": "private, no-store" } });
}
export async function POST(request: Request) {
  if (!sameOriginMutation(request, env)) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  if (!await getUser()) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!env.BUCKET || !env.DB) return NextResponse.json({ error: "Speicher fehlt." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); if (!body || typeof body !== "object") throw new Error(); } catch { return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 }); }
  try {
    if (body.action === "migrate") return NextResponse.json(await migrateCatalog());
    await changeCatalog((data) => {
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
      if (body.action === "mail-schedule") {
        data.mailSchedule = normalizeMailSchedule(body.schedule);
      } else if (body.action === "method-create" || body.action === "method-update") {
        if (!name || typeof body.inPoll !== "boolean") throw new Error("Name und Umfragefreigabe sind erforderlich.");
        if (data.methods.some((method) => method.id !== body.id && [method.name, ...method.aliases].some((alias) => foodKey(alias) === foodKey(name)))) throw new Error("Diese Zubereitungsart existiert bereits.");
        if (body.action === "method-create") data.methods.push({ id: crypto.randomUUID(), name, aliases: [name], inPoll: body.inPoll });
        else { const method = data.methods.find((method) => method.id === body.id); if (!method) throw new Error("Zubereitungsart nicht gefunden."); method.aliases = [...new Set([...method.aliases, method.name])]; method.name = name; method.inPoll = body.inPoll; }
      } else if (body.action === "method-delete") {
        const source = data.methods.find((method) => method.id === body.id); const target = data.methods.find((method) => method.id === body.replacementId && method.id !== body.id);
        if (!source || !target) throw new Error("Bitte eine andere Zubereitungsart als Ersatz wählen.");
        target.aliases = [...new Set([...target.aliases, source.id, source.name, ...source.aliases])];
        data.methods = data.methods.filter((method) => method.id !== source.id);
      } else if (body.action === "food-update") {
        const food = data.foods.find((food) => food.id === body.id); const canonical = canonicalName(name);
        if (!food || !name) throw new Error("Lebensmittel oder Name fehlt.");
        if (data.foods.some((item) => item.id !== food.id && [item.name, ...item.aliases].some((alias) => foodKey(alias) === foodKey(canonical)))) throw new Error("Dieses Lebensmittel existiert bereits. Bitte zusammenführen.");
        food.aliases = [...new Set([...food.aliases, food.name])]; food.name = canonical;
      } else if (body.action === "food-merge") {
        const source = data.foods.find((food) => food.id === body.id); const target = data.foods.find((food) => food.id === body.targetId && food.id !== body.id);
        if (!source || !target) throw new Error("Bitte ein anderes Ziel-Lebensmittel auswählen.");
        target.aliases = [...new Set([...target.aliases, source.name, ...source.aliases])];
        data.redirects = { ...data.redirects, [source.id]: target.id };
        data.foods = data.foods.filter((food) => food.id !== source.id);
        Object.values(data.migrated).forEach((items) => items.forEach((item) => { if (item.foodId === source.id) { item.foodId = target.id; item.name = target.name; } }));
      } else throw new Error("Unbekannte Aktion.");
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Speichern fehlgeschlagen." }, { status: 400 }); }
}
