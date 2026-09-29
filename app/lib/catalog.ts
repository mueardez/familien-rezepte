import { env } from "cloudflare:workers";
import type { MailSchedule } from "./mail-schedule";
import { recipes, type Recipe } from "../data/recipes";
import { canonicalName, defaultMethods, foodKey, ingredientText, normalizeIngredient, type Ingredient, type Food, type Method } from "./ingredients";
export type Catalog = { mailSchedule?: MailSchedule; methods: Method[]; foods: Food[]; migrated: Record<string, Ingredient[]>; migratedAt?: string; backupKey?: string; redirects?: Record<string, string> };
export const CATALOG_KEY = "catalog/v1.json";
export const emptyCatalog = (): Catalog => ({ methods: structuredClone(defaultMethods), foods: [], migrated: {} });
export async function readCatalog(): Promise<{ data: Catalog; version: string }> {
  if (!env.BUCKET) return { data: emptyCatalog(), version: "" };
  const object = await env.BUCKET.get(CATALOG_KEY);
  return object ? { data: JSON.parse(await object.text()) as Catalog, version: object.etag } : { data: emptyCatalog(), version: "" };
}
export async function changeCatalog<T>(change: (data: Catalog) => T): Promise<T> {
  if (!env.BUCKET) throw new Error("Speicher nicht verfügbar.");
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, version } = await readCatalog(); const result = change(data);
    const saved = await env.BUCKET.put(CATALOG_KEY, JSON.stringify(data), { onlyIf: version ? { etagMatches: version } : new Headers({ "If-None-Match": "*" }), httpMetadata: { contentType: "application/json" } });
    if (saved) return result;
  }
  throw new Error("Gleichzeitige Änderung. Bitte erneut versuchen.");
}
export function methodFor(data: Catalog, value: string): Method | undefined { return data.methods.find((method) => method.id === value || method.aliases.some((alias) => foodKey(alias) === foodKey(value)) || foodKey(method.name) === foodKey(value)); }
export function linkIngredients(data: Catalog, values: unknown[]): Ingredient[] {
  return values.map((value) => {
    const item = normalizeIngredient(value); if (!item.name) throw new Error("Lebensmittel fehlt.");
    const name = canonicalName(item.name); const key = foodKey(name);
    let food = data.foods.find((food) => foodKey(food.name) === key || food.aliases.some((alias) => foodKey(alias) === key));
    if (!food) { food = { id: crypto.randomUUID(), name, aliases: [item.name] }; data.foods.push(food); }
    return { ...item, name: food.name, foodId: food.id };
  });
}
export async function prepareIngredients(values: Ingredient[], method: string): Promise<{ ingredients: Ingredient[]; method: string }> {
  await migrateCatalog();
  return changeCatalog((data) => { const found = methodFor(data, method); if (!found) throw new Error("Bitte eine vorhandene Zubereitungsart auswählen."); return { ingredients: linkIngredients(data, values), method: found.id }; });
}
export function hydrateRecipe(recipe: Recipe, data: Catalog): Recipe {
  const items = recipe.ingredientItems ?? data.migrated[recipe.slug] ?? recipe.ingredients.map(normalizeIngredient);
  const resolved = items.map((item) => { let id = item.foodId; const seen = new Set<string>(); while (id && data.redirects?.[id] && !seen.has(id)) { seen.add(id); id = data.redirects[id]; } return { ...item, foodId: id, name: data.foods.find((food) => food.id === id)?.name ?? item.name }; });
  return { ...recipe, method: methodFor(data, recipe.method)?.name ?? recipe.method, ingredientItems: resolved, ingredients: resolved.map(ingredientText) };
}
export async function migrateCatalog(): Promise<{ recipes: number; foods: number; review: number; migratedAt: string }> {
  if (!env.DB) throw new Error("Rezeptspeicher fehlt.");
  const existing = (await readCatalog()).data;
  const summary = (data: Catalog) => ({ recipes: Object.keys(data.migrated).length, foods: data.foods.length, review: Object.values(data.migrated).flat().filter((item) => item.review).length, migratedAt: data.migratedAt! });
  if (existing.migratedAt) return summary(existing);
  const result = await env.DB.prepare("SELECT slug, title, method, ingredients_json FROM imported_recipes").all<{ slug: string; title: string; method: string; ingredients_json: string }>();
  const imported = result.results; const slugs = new Set(imported.map((recipe) => recipe.slug));
  const all = [...recipes.filter((recipe) => !slugs.has(recipe.slug)).map((recipe) => ({ slug: recipe.slug, method: recipe.method, ingredients: recipe.ingredients })), ...imported.map((recipe) => ({ slug: recipe.slug, method: recipe.method, ingredients: JSON.parse(recipe.ingredients_json) as unknown[] }))];
  const backupKey = `catalog/backups/${crypto.randomUUID()}.json`;
  await env.BUCKET.put(backupKey, JSON.stringify({ recipes: all, catalog: existing }), { httpMetadata: { contentType: "application/json" } });
  return changeCatalog((data) => {
    if (data.migratedAt) return summary(data);
    for (const recipe of all) {
      data.migrated[recipe.slug] = linkIngredients(data, recipe.ingredients);
      if (!methodFor(data, recipe.method)) data.methods.push({ id: crypto.randomUUID(), name: recipe.method, aliases: [recipe.method], inPoll: false });
    }
    data.migratedAt = new Date().toISOString(); data.backupKey = backupKey;
    return summary(data);
  });
}
