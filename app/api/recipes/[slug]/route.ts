import { prepareIngredients } from "../../../lib/catalog";
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getUser } from "../../../auth";
import { getRecipe } from "../../../data/recipes";
import { sameOriginMutation } from "../../../lib/auth-core";
import { normalizeDraft } from "../../../lib/recipe-draft";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!sameOriginMutation(request, env)) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Bitte zuerst mit Google anmelden." }, { status: 401 });
  if (!env.DB || !env.BUCKET) return NextResponse.json({ error: "Der Rezeptspeicher ist noch nicht verfügbar." }, { status: 503 });

  const { slug } = await params;
  const existing = await env.DB.prepare("SELECT id, image_key FROM imported_recipes WHERE slug = ? LIMIT 1")
    .bind(slug).first<{ id: string; image_key: string }>();
  if (!existing && !getRecipe(slug)) return NextResponse.json({ error: "Rezept nicht gefunden." }, { status: 404 });

  const form = await request.formData();
  const raw = form.get("recipe");
  let draft;
  try { draft = normalizeDraft(JSON.parse(String(raw))); }
  catch { return NextResponse.json({ error: "Bitte Titel und Zutaten ausfüllen." }, { status: 400 }); }
  try { const linked = await prepareIngredients(draft.ingredients, draft.method); draft = { ...draft, ...linked }; }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Zutaten konnten nicht zugeordnet werden." }, { status: 400 }); }

  const photo = form.get("dishImage");
  if (photo !== null && (!(photo instanceof File) || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(photo.type) || photo.size > 8 * 1024 * 1024)) {
    return NextResponse.json({ error: "Bitte ein Gerichtsfoto bis 8 MB verwenden." }, { status: 400 });
  }

  const id = existing?.id ?? crypto.randomUUID();
  const oldImageKey = existing?.image_key;
  const newImageKey = photo instanceof File ? `recipes/${crypto.randomUUID()}` : null;
  const imageKey = newImageKey ?? existing?.image_key ?? "";
  if (newImageKey && photo instanceof File) {
    await env.BUCKET.put(newImageKey, photo.stream(), { httpMetadata: { contentType: photo.type, cacheControl: "public, max-age=31536000, immutable" } });
  }
  try {
    if (existing) {
      await env.DB.prepare(`UPDATE imported_recipes SET title = ?, language = ?, time = ?, method = ?, instagram_recipe = ?, servings = ?, ingredients_json = ?, steps_json = ?, image_key = ? WHERE slug = ?`)
        .bind(draft.title, draft.language, draft.time, draft.method, draft.isInstagram ? 1 : 0, draft.servings, JSON.stringify(draft.ingredients), JSON.stringify(draft.steps), imageKey, slug).run();
    } else {
      await env.DB.prepare(`INSERT INTO imported_recipes (id, slug, owner_email, title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, slug, user.email, draft.title, draft.language, draft.time, draft.method, draft.isInstagram ? 1 : 0, draft.servings, JSON.stringify(draft.ingredients), JSON.stringify(draft.steps), imageKey).run();
    }
  } catch (error) {
    if (newImageKey) await env.BUCKET.delete(newImageKey);
    console.error("Updating recipe failed", error);
    return NextResponse.json({ error: "Das Rezept konnte nicht gespeichert werden." }, { status: 500 });
  }
  if (newImageKey && oldImageKey) {
    try { await env.BUCKET.delete(oldImageKey); } catch (error) { console.error("Old recipe photo cleanup failed", error); }
  }
  return NextResponse.json({ url: `/rezepte/${encodeURIComponent(slug)}` });
}
