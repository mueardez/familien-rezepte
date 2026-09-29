"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  title: string;
  language: "de" | "en";
  time: string;
  servings: string;
  method: "Pfanne" | "Topf" | "Ofen" | "Waffeleisen" | "Andere";
  isInstagram: boolean;
  ingredients: string[];
  steps: string[];
};

const emptyDraft: Draft = { title: "", language: "de", time: "30 Min.", servings: "3 Portionen", method: "Andere", isInstagram: true, ingredients: [], steps: [] };

export function RecipeImportForm() {
  const router = useRouter();
  const [textImage, setTextImage] = useState<File | null>(null);
  const [dishImage, setDishImage] = useState<File | null>(null);
  const [instagramRecipe, setInstagramRecipe] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "saving">("idle");
  const [error, setError] = useState("");

  async function analyze() {
    if (!textImage || !dishImage) { setError("Bitte beide Bilder auswählen."); return; }
    setError(""); setStatus("reading");
    try {
      const form = new FormData();
      form.set("textImage", await compressImage(textImage, 1800, 0.9));
      const response = await fetch("/api/import/analyze", { method: "POST", body: form });
      const data = await response.json() as { recipe?: Draft; error?: string };
      if (!response.ok || !data.recipe) throw new Error(data.error || "Das Rezept konnte nicht erkannt werden.");
      setDraft({ ...emptyDraft, ...data.recipe, isInstagram: instagramRecipe });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Das Rezept konnte nicht erkannt werden."); }
    finally { setStatus("idle"); }
  }

  async function save() {
    if (!draft || !dishImage) return;
    const ingredients = draft.ingredients.map((item) => item.trim()).filter(Boolean);
    const steps = draft.steps.map((item) => item.trim()).filter(Boolean);
    if (!draft.title.trim() || !ingredients.length) { setError("Titel und Zutaten dürfen nicht leer sein."); return; }
    setError(""); setStatus("saving");
    try {
      const form = new FormData();
      form.set("dishImage", await compressImage(dishImage, 1600, 0.84));
      form.set("recipe", JSON.stringify({ ...draft, ingredients, steps }));
      const response = await fetch("/api/import/save", { method: "POST", body: form });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Das Rezept konnte nicht gespeichert werden.");
      router.push(data.url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Das Rezept konnte nicht gespeichert werden."); setStatus("idle"); }
  }

  return (
    <div className="import-workspace">
      {!draft ? <>
        <div className="upload-grid">
          <ImagePicker number="1" title="Rezepttext" hint="Titel, Zutaten und Zubereitung" file={textImage} onChange={setTextImage} />
          <ImagePicker number="2" title="Gerichtsfoto" hint="So sieht das fertige Essen aus" file={dishImage} onChange={setDishImage} />
        </div>
        <label className="flag-choice"><input type="checkbox" checked={instagramRecipe} onChange={(event) => setInstagramRecipe(event.target.checked)} /><span><strong>Instagram-Rezept</strong><small>Markierung für die spätere Rezeptsuche</small></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="import-action" type="button" disabled={status !== "idle" || !textImage || !dishImage} onClick={analyze}>
          {status === "reading" ? "Rezept wird erkannt …" : "Bilder auslesen"}
        </button>
        <p className="privacy-note">Das Rezepttext-Bild wird nur für die Erkennung verwendet. Gespeichert wird das Gerichtsfoto.</p>
      </> : <RecipeEditor draft={draft} setDraft={setDraft} error={error} status={status} onBack={() => { setDraft(null); setError(""); }} onSave={save} />}
    </div>
  );
}

function ImagePicker({ number, title, hint, file, onChange }: { number: string; title: string; hint: string; file: File | null; onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <label className={file ? "upload-card has-image" : "upload-card"}>
      {preview && <img src={preview} alt="Vorschau" />}
      <span className="upload-number">{number}</span>
      <span className="upload-title">{title}</span>
      <span className="upload-hint">{file ? file.name : hint}</span>
      <span className="upload-button">{file ? "Bild ersetzen" : "Bild auswählen"}</span>
      <input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    </label>
  );
}

function RecipeEditor({ draft, setDraft, error, status, onBack, onSave }: { draft: Draft; setDraft: (draft: Draft) => void; error: string; status: string; onBack: () => void; onSave: () => void }) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });
  const missing = [!draft.title.trim() && "Titel", !draft.ingredients.some((item) => item.trim()) && "Zutaten"].filter(Boolean);
  return (
    <div className="recipe-editor">
      <div className="editor-banner"><span>✓</span><div><strong>{missing.length ? "Rezept teilweise erkannt" : "Rezept erkannt"}</strong><p>{missing.length ? `Noch ergänzen: ${missing.join(", ")}. Diese Angaben wurden nicht erkannt. Die übrigen Angaben wurden übernommen.` : "Bitte Mengen und Schritte kurz kontrollieren."}</p></div></div>
      {!draft.steps.some((item) => item.trim()) && <p className="privacy-note">Zubereitung ist optional. Du kannst das Rezept auch ohne Schritte speichern.</p>}
      <div className="editor-fields">
        <label className="field wide"><span>Titel</span><input value={draft.title} onChange={(event) => set("title", event.target.value)} /></label>
        <label className="field"><span>Zeit</span><input value={draft.time} onChange={(event) => set("time", event.target.value)} /></label>
        <label className="field"><span>Portionen</span><input value={draft.servings} onChange={(event) => set("servings", event.target.value)} /></label>
        <label className="field"><span>Zubereitungsart</span><select value={draft.method} onChange={(event) => set("method", event.target.value as Draft["method"])}>{["Pfanne", "Topf", "Ofen", "Waffeleisen", "Andere"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="flag-choice editor-flag wide"><input type="checkbox" checked={draft.isInstagram} onChange={(event) => set("isInstagram", event.target.checked)} /><span><strong>Instagram-Rezept</strong><small>In der Rezeptsuche als eigene Kategorie auffindbar</small></span></label>
        <div className="field wide"><span>Zutaten</span><div className="editable-list">{draft.ingredients.map((item, index) => <div className="editable-row" key={index}><input aria-label={`Zutat ${index + 1}`} value={item} onChange={(event) => set("ingredients", replaceAt(draft.ingredients, index, event.target.value))} /><button type="button" aria-label={`Zutat ${index + 1} entfernen`} onClick={() => set("ingredients", removeAt(draft.ingredients, index))}>×</button></div>)}</div><button className="add-row" type="button" onClick={() => set("ingredients", [...draft.ingredients, ""])}>+ Zutat</button></div>
        <div className="field wide"><span>Zubereitung</span><div className="editable-list steps-edit">{draft.steps.map((item, index) => <div className="editable-row" key={index}><b>{index + 1}</b><textarea aria-label={`Schritt ${index + 1}`} value={item} onChange={(event) => set("steps", replaceAt(draft.steps, index, event.target.value))} /><button type="button" aria-label={`Schritt ${index + 1} entfernen`} onClick={() => set("steps", removeAt(draft.steps, index))}>×</button></div>)}</div><button className="add-row" type="button" onClick={() => set("steps", [...draft.steps, ""])}>+ Schritt</button></div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-actions"><button className="secondary-action" type="button" onClick={onBack}>Zurück zu den Bildern</button><button className="import-action" type="button" disabled={status === "saving"} onClick={onSave}>{status === "saving" ? "Rezept wird gespeichert …" : "Rezept speichern"}</button></div>
    </div>
  );
}

function replaceAt(items: string[], index: number, value: string) { return items.map((item, itemIndex) => itemIndex === index ? value : item); }
function removeAt(items: string[], index: number) { return items.filter((_, itemIndex) => itemIndex !== index); }

async function compressImage(file: File, maxSide: number, quality: number): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}
