import type { Recipe } from "../data/recipes";

export type RecipeDraft = {
  title: string;
  language: "de" | "en";
  time: string;
  servings: string;
  method: Recipe["method"];
  isInstagram: boolean;
  ingredients: string[];
  steps: string[];
};

export function normalizeDraft(value: unknown): RecipeDraft {
  if (!value || typeof value !== "object") throw new Error("Invalid draft");
  const draft = value as Partial<RecipeDraft>;
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const rawSteps = draft.steps ?? [];
  if (!Array.isArray(draft.ingredients) || !Array.isArray(rawSteps) ||
      !draft.ingredients.every((item) => typeof item === "string") ||
      !rawSteps.every((item) => typeof item === "string")) throw new Error("Invalid lists");
  const ingredients = draft.ingredients.map((item) => item.trim()).filter(Boolean);
  const steps = rawSteps.map((item) => item.trim()).filter(Boolean);
  if (!title || !ingredients.length) throw new Error("Incomplete draft");
  const methods: RecipeDraft["method"][] = ["Pfanne", "Topf", "Ofen", "Waffeleisen", "Petromax", "Andere"];
  return {
    title: title.slice(0, 180),
    language: draft.language === "en" ? "en" : "de",
    time: String(draft.time || "30 Min.").trim().slice(0, 40),
    servings: String(draft.servings || "3 Portionen").trim().slice(0, 60),
    method: methods.includes(draft.method as RecipeDraft["method"]) ? draft.method as RecipeDraft["method"] : "Andere",
    isInstagram: draft.isInstagram === true,
    ingredients: ingredients.slice(0, 80).map((item) => item.slice(0, 300)),
    steps: steps.slice(0, 40).map((item) => item.slice(0, 1500)),
  };
}
