"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "../../../data/recipes";
import { RecipeEditor, type Draft } from "../../../rezept-import/recipe-import-form";

export function RecipeEditForm({ slug, recipe }: { slug: string; recipe: Recipe }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    title: recipe.title, language: recipe.language ?? "de", time: recipe.time,
    servings: recipe.servings ?? "3 Portionen", method: recipe.method,
    isInstagram: recipe.isInstagram === true,
    ingredients: recipe.ingredients, steps: recipe.steps,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft.title.trim() || !draft.ingredients.some((ingredient) => ingredient.trim())) {
      setError("Titel und Zutaten dürfen nicht leer sein."); return;
    }
    setError(""); setSaving(true);
    try {
      const form = new FormData();
      form.set("recipe", JSON.stringify(draft));
      if (photo) form.set("dishImage", photo);
      const response = await fetch(`/api/recipes/${encodeURIComponent(slug)}`, { method: "PATCH", body: form });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Das Rezept konnte nicht gespeichert werden.");
      router.push(result.url);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Das Rezept konnte nicht gespeichert werden.");
      setSaving(false);
    }
  }

  return <RecipeEditor draft={draft} setDraft={setDraft} error={error} status={saving ? "saving" : "idle"} editing onBack={() => router.push(`/rezepte/${encodeURIComponent(slug)}`)} onSave={save} photoControl={
    <label className="field wide"><span>Gerichtsfoto ersetzen (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />{photo && <small>{photo.name}</small>}</label>
  } />;
}
