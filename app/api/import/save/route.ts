import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { sameOriginMutation } from "../../../lib/auth-core";
import { normalizeDraft, type RecipeDraft } from "../../../lib/recipe-draft";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOriginMutation(request, env)) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Bitte zuerst mit Google anmelden." }, { status: 401 });
  if (!env.DB || !env.BUCKET) return NextResponse.json({ error: "Der Rezeptspeicher ist noch nicht verfügbar." }, { status: 503 });

  const form = await request.formData();
  const image = form.get("dishImage");
  const rawRecipe = form.get("recipe");
  if (!(image instanceof File) || typeof rawRecipe !== "string") {
    return NextResponse.json({ error: "Rezeptdaten oder Gerichtsfoto fehlen." }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type) || image.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Bitte ein Gerichtsfoto bis 8 MB verwenden." }, { status: 400 });
  }

  let draft: RecipeDraft;
  try { draft = normalizeDraft(JSON.parse(rawRecipe)); }
  catch { return NextResponse.json({ error: "Bitte Titel und Zutaten vollständig ausfüllen." }, { status: 400 }); }

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(draft.title, id);
  const imageKey = `recipes/${id}.jpg`;
  await env.BUCKET.put(imageKey, image.stream(), {
    httpMetadata: { contentType: image.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { recipeSlug: slug },
  });

  try {
    await env.DB.prepare(
      `INSERT INTO imported_recipes
       (id, slug, owner_email, title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, slug, user.email, draft.title, draft.language, draft.time, draft.method, draft.isInstagram ? 1 : 0, draft.servings, JSON.stringify(draft.ingredients), JSON.stringify(draft.steps), imageKey).run();
  } catch (error) {
    await env.BUCKET.delete(imageKey);
    console.error("Saving imported recipe failed", error);
    return NextResponse.json({ error: "Das Rezept konnte nicht gespeichert werden." }, { status: 500 });
  }
  return NextResponse.json({ slug, url: `/rezepte/${slug}` });
}

async function uniqueSlug(title: string, id: string): Promise<string> {
  const base = title.toLocaleLowerCase("de-CH").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "rezept";
  const existing = await env.DB.prepare("SELECT 1 FROM imported_recipes WHERE slug = ? LIMIT 1").bind(base).first();
  return existing ? `${base}-${id.slice(0, 6)}` : base;
}
