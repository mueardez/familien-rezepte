import type { Recipe } from "../data/recipes";
import { normalizeIngredient, type Ingredient } from "./ingredients";

export type RecipeDraft = {
  title: string;
  language: "de" | "en";
  time: string;
  servings: string;
  method: Recipe["method"];
  isInstagram: boolean;
  ingredients: Ingredient[];
  steps: string[];
};

export function normalizeDraft(value: unknown): RecipeDraft {
  if (!value || typeof value !== "object") throw new Error("Invalid draft");
  const draft = value as Partial<RecipeDraft>;
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const rawSteps = draft.steps ?? [];
  if (!Array.isArray(draft.ingredients) || !Array.isArray(rawSteps) ||
      !rawSteps.every((item) => typeof item === "string")) throw new Error("Invalid lists");
  const ingredients = draft.ingredients.map(normalizeIngredient).filter((item) => item.name);
  const steps = rawSteps.map((item) => item.trim()).filter(Boolean);
  if (!title || !ingredients.length) throw new Error("Incomplete draft");
  return {
    title: title.slice(0, 180),
    language: draft.language === "en" ? "en" : "de",
    time: String(draft.time || "30 Min.").trim().slice(0, 40),
    servings: String(draft.servings || "3 Portionen").trim().slice(0, 60),
    method: typeof draft.method === "string" ? draft.method.slice(0, 80) : "Andere",
    isInstagram: draft.isInstagram === true,
    ingredients: ingredients.slice(0, 80),
    steps: steps.slice(0, 40).map((item) => item.slice(0, 1500)),
  };
}
