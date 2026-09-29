import { env } from "cloudflare:workers";
import type { Recipe } from "../data/recipes";

type ImportedRecipeRow = {
  slug: string;
  title: string;
  time: string;
  method: Recipe["method"];
  instagram_recipe: number;
  servings: string;
  ingredients_json: string;
  steps_json: string;
};

function rowToRecipe(row: ImportedRecipeRow): Recipe {
  return {
    slug: row.slug,
    title: row.title,
    time: row.time,
    method: row.method,
    isInstagram: Boolean(row.instagram_recipe),
    icon: "🍽️",
    ingredients: JSON.parse(row.ingredients_json),
    steps: JSON.parse(row.steps_json),
    tip: "Dieses Rezept wurde aus einem Foto übernommen.",
    servings: row.servings,
    imageUrl: `/api/recipe-images/${encodeURIComponent(row.slug)}`,
  };
}

export async function listImportedRecipes(): Promise<Recipe[]> {
  if (!env.DB) return [];
  const result = await env.DB.prepare(
    `SELECT slug, title, time, method, instagram_recipe, servings, ingredients_json, steps_json
     FROM imported_recipes ORDER BY created_at DESC`,
  ).all<ImportedRecipeRow>();
  return result.results.map(rowToRecipe);
}

export async function getImportedRecipe(slug: string): Promise<Recipe | undefined> {
  if (!env.DB) return undefined;
  const row = await env.DB.prepare(
    `SELECT slug, title, time, method, instagram_recipe, servings, ingredients_json, steps_json
     FROM imported_recipes WHERE slug = ? LIMIT 1`,
  ).bind(slug).first<ImportedRecipeRow>();
  return row ? rowToRecipe(row) : undefined;
}
