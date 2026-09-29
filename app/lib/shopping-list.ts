import { env } from "cloudflare:workers";
import { recipes, type Recipe } from "../data/recipes";
import { listImportedRecipes } from "./imported-recipes";
import { hydrateRecipe, readCatalog } from "./catalog";

export type WeeklyList = {
  recipes: string[];
  extras: { id: string; text: string }[];
  checked: string[];
};
export const emptyList = (): WeeklyList => ({ recipes: [], extras: [], checked: [] });

export function currentWeek(): string {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const day = new Date(`${local}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}

export function validWeek(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && date.getUTCDay() === 1;
}

export function listKey(week: string) { return `shopping/weeks/${week}.json`; }

export function normalizeList(value: unknown, knownSlugs: Set<string>): WeeklyList {
  if (!value || typeof value !== "object") throw new Error("Ungültige Liste");
  const list = value as Partial<WeeklyList>;
  if (!Array.isArray(list.recipes) || !Array.isArray(list.extras) || !Array.isArray(list.checked) ||
      list.recipes.length > 50 || list.extras.length > 150 || list.checked.length > 500) throw new Error("Zu viele Einträge");
  const slugs = list.recipes.filter((slug): slug is string => typeof slug === "string" && knownSlugs.has(slug));
  if (slugs.length !== list.recipes.length) throw new Error("Unbekanntes Rezept");
  const extras = list.extras.map((item) => {
    if (!item || typeof item.id !== "string" || !/^[0-9a-f-]{36}$/.test(item.id) || typeof item.text !== "string") throw new Error("Ungültiger Eintrag");
    return { id: item.id, text: item.text.trim().slice(0, 180) };
  }).filter((item) => item.text);
  if (list.checked.some((id) => typeof id !== "string" || id.length > 220)) throw new Error("Ungültige Markierung");
  return { recipes: [...new Set(slugs)], extras, checked: [...new Set(list.checked)] };
}

export async function allRecipes(): Promise<Recipe[]> {
  const saved = await listImportedRecipes();
  const overridden = new Set(saved.map((recipe) => recipe.slug));
  const { data } = await readCatalog();
  return [...saved, ...recipes.filter((recipe) => !overridden.has(recipe.slug)).map((recipe) => hydrateRecipe(recipe, data))];
}

export async function readWeek(week: string): Promise<{ list: WeeklyList; version: string }> {
  const object = await env.BUCKET.get(listKey(week));
  return object ? { list: JSON.parse(await object.text()) as WeeklyList, version: object.etag } : { list: emptyList(), version: "" };
}

export function shoppingLines(list: WeeklyList, catalogue: Recipe[]): string[] {
  const recipesBySlug = new Map(catalogue.map((recipe) => [recipe.slug, recipe]));
  const checked = new Set(list.checked);
  const fromRecipes = list.recipes.flatMap((slug) => recipesBySlug.get(slug)?.ingredients.map((item, index) => ({ id: `${slug}:${index}`, text: item })) ?? []);
  return [...fromRecipes, ...list.extras].filter((item) => !checked.has(item.id)).map((item) => item.text);
}
