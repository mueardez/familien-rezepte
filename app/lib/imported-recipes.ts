import { env } from "cloudflare:workers";
import { getRecipe, type Recipe } from "../data/recipes";
import { hydrateRecipe, readCatalog } from "./catalog";
import { ingredientText, normalizeIngredient } from "./ingredients";

type ImportedRecipeRow = {
  slug: string;
  title: string;
  language: "de" | "en";
  time: string;
  method: Recipe["method"];
  instagram_recipe: number;
  servings: string;
  ingredients_json: string;
  steps_json: string;
  image_key: string;
};

function rowToRecipe(row: ImportedRecipeRow): Recipe {
  const original = getRecipe(row.slug);
  const raw = JSON.parse(row.ingredients_json);
  const structured = Array.isArray(raw) && raw.every((item) => typeof item === "object");
  return {
    ...original,
    slug: row.slug,
    title: row.title,
    language: row.language,
    time: row.time,
    method: row.method,
    isInstagram: Boolean(row.instagram_recipe),
    icon: original?.icon ?? "🍽️",
    ingredients: structured ? raw.map(normalizeIngredient).map(ingredientText) : raw,
    ...(structured ? { ingredientItems: raw.map(normalizeIngredient) } : {}),
    steps: JSON.parse(row.steps_json),
    tip: original?.tip ?? "Dieses Rezept wurde aus einem Foto übernommen.",
    servings: row.servings,
    imageUrl: row.image_key ? `/api/recipe-images/${encodeURIComponent(row.slug)}?v=${encodeURIComponent(row.image_key)}` : original?.imageUrl,
  };
}

export async function listImportedRecipes(): Promise<Recipe[]> {
  if (!env.DB) return [];
  const result = await env.DB.prepare(
    `SELECT slug, title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key
     FROM imported_recipes ORDER BY created_at DESC`,
  ).all<ImportedRecipeRow>();
  const { data } = await readCatalog();
  return result.results.map(rowToRecipe).map((recipe) => hydrateRecipe(recipe, data));
}

export async function getImportedRecipe(slug: string): Promise<Recipe | undefined> {
  if (!env.DB) return undefined;
  const row = await env.DB.prepare(
    `SELECT slug, title, language, time, method, instagram_recipe, servings, ingredients_json, steps_json, image_key
     FROM imported_recipes WHERE slug = ? LIMIT 1`,
  ).bind(slug).first<ImportedRecipeRow>();
  return row ? hydrateRecipe(rowToRecipe(row), (await readCatalog()).data) : undefined;
}
