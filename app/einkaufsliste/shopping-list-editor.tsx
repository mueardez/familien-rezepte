"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeeklyList } from "../lib/shopping-list";

type RecipeOption = { slug: string; title: string; ingredients: string[] };
type Line = { id: string; text: string };
const blank = (): WeeklyList => ({ recipes: [], extras: [], checked: [] });
const shiftWeek = (week: string, count: number) => { const date = new Date(`${week}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + count * 7); return date.toISOString().slice(0, 10); };
const initialWeek = () => { const date = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()) + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); return date.toISOString().slice(0, 10); };

export function ShoppingListEditor({ catalogue }: { catalogue: RecipeOption[] }) {
  const [week, setWeek] = useState(initialWeek);
  const [list, setList] = useState<WeeklyList>(blank);
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [food, setFood] = useState("");
  const [search, setSearch] = useState("");
  const [bring, setBring] = useState("");
  const recipesBySlug = useMemo(() => new Map(catalogue.map((recipe) => [recipe.slug, recipe])), [catalogue]);
  const lines = useMemo(() => list.recipes.flatMap((slug) => (recipesBySlug.get(slug)?.ingredients ?? []).map((text, index) => ({ id: `${slug}:${index}`, text }))).concat(list.extras), [list, recipesBySlug]);
  const available = useMemo(() => catalogue.filter((recipe) => !list.recipes.includes(recipe.slug) && recipe.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a, b) => a.title.localeCompare(b.title, "de")), [catalogue, list.recipes, search]);
  const update = (value: WeeklyList) => { setList(value); setDirty(true); setBring(""); setNotice(""); };
  useEffect(() => {
    let active = true;
    fetch(`/api/shopping-list?week=${week}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json() as { error?: string; list: WeeklyList; version: string; deepLink: string };
      if (!response.ok) throw new Error(data.error ?? "Liste konnte nicht geladen werden.");
      if (active) { setList(data.list); setVersion(data.version); setDirty(false); setError(""); setBring(""); }
    }).catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [week]);
  const selectWeek = (next: string) => { if (dirty && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return; setLoading(true); setWeek(next); setError(""); setNotice(""); };
  const save = async (): Promise<boolean> => {
    setBusy(true); setError(""); setBring("");
    try {
      const response = await fetch("/api/shopping-list", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week, version, list }) });
      const data = await response.json() as { error?: string; list: WeeklyList; version: string; deepLink: string };
      if (!response.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      setList(data.list); setVersion(data.version); setDirty(false); setNotice("Liste gespeichert.");
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen."); return false; }
    finally { setBusy(false); }
  };
  const exportBring = async () => {
    if (dirty && !await save()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/shopping-list/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week }) });
      const data = await response.json() as { error?: string; list: WeeklyList; version: string; deepLink: string };
      if (!response.ok) throw new Error(data.error ?? "Bring!-Export fehlgeschlagen.");
      setBring(data.deepLink);
      setNotice("Der Export ist bereit. Öffne Bring! mit der Schaltfläche unten.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Bring!-Export fehlgeschlagen."); }
    finally { setBusy(false); }
  };
  const addFood = (event: React.FormEvent) => { event.preventDefault(); const text = food.trim(); if (!text) return; update({ ...list, extras: [...list.extras, { id: crypto.randomUUID(), text }] }); setFood(""); };
  const toggle = (id: string) => update({ ...list, checked: list.checked.includes(id) ? list.checked.filter((value) => value !== id) : [...list.checked, id] });
  const weekEnd = shiftWeek(week, 1);
  return <div className="shopping-workspace">
    <div className="week-selector"><button type="button" onClick={() => selectWeek(shiftWeek(week, -1))} aria-label="Vorherige Woche">←</button><strong>Woche {new Date(`${week}T12:00:00Z`).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} – {new Date(`${weekEnd}T12:00:00Z`).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })}</strong><button type="button" onClick={() => selectWeek(weekEnd)} aria-label="Nächste Woche">→</button></div>
    {loading ? <p>Lade Liste …</p> : <>
      <section className="shopping-section"><h2>Rezepte hinzufügen</h2><input className="shopping-input" aria-label="Rezept suchen" placeholder="Rezept suchen …" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="recipe-choices">{available.slice(0, 12).map((recipe) => <button type="button" key={recipe.slug} onClick={() => update({ ...list, recipes: [...list.recipes, recipe.slug] })}>＋ {recipe.title}</button>)}{available.length === 0 && <p>Keine weiteren Rezepte gefunden.</p>}</div>{list.recipes.length > 0 && <div className="selected-recipes"><h3>Ausgewählte Rezepte</h3>{list.recipes.map((slug) => <div key={slug}><span>{recipesBySlug.get(slug)?.title ?? slug}</span><button type="button" aria-label={`${recipesBySlug.get(slug)?.title ?? slug} entfernen`} onClick={() => update({ ...list, recipes: list.recipes.filter((value) => value !== slug), checked: list.checked.filter((id) => !id.startsWith(`${slug}:`)) })}>Entfernen</button></div>)}</div>}</section>
      <section className="shopping-section"><h2>Einzelne Lebensmittel</h2><form onSubmit={addFood} className="food-form"><input className="shopping-input" value={food} onChange={(event) => setFood(event.target.value)} maxLength={180} placeholder="z. B. 1 Liter Milch" aria-label="Lebensmittel" /><button type="submit">Hinzufügen</button></form></section>
      <section className="shopping-section"><h2>Einkaufen <span className="shopping-count">{lines.filter((line) => !list.checked.includes(line.id)).length} offen</span></h2>{lines.length === 0 ? <p>Wähle oben ein Rezept oder ergänze ein Lebensmittel.</p> : <ul className="shopping-lines">{lines.map((line: Line) => <li key={line.id}><label><input type="checkbox" checked={list.checked.includes(line.id)} onChange={() => toggle(line.id)} /><span>{line.text}</span></label>{list.extras.some((extra) => extra.id === line.id) && <button type="button" aria-label={`${line.text} entfernen`} onClick={() => update({ ...list, extras: list.extras.filter((extra) => extra.id !== line.id), checked: list.checked.filter((id) => id !== line.id) })}>×</button>}</li>)}</ul>}</section>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="shopping-notice" role="status">{notice}</p>}
      <div className="shopping-actions"><button type="button" className="import-action" disabled={busy || !dirty} onClick={save}>Änderungen speichern</button><button type="button" className="secondary-action" disabled={busy || lines.every((line) => list.checked.includes(line.id))} onClick={exportBring}>Für Bring! vorbereiten</button>{bring && <a className="bring-button" href={bring} rel="noopener noreferrer">In Bring! öffnen ↗</a>}</div><p className="privacy-note">Für Bring! wird eine sieben Tage gültige, nur über den Link erreichbare Seite mit den offenen Einträgen erstellt. Das Abhaken in Bring! wird nicht mit dieser Liste synchronisiert.</p>
    </>}
  </div>;
}
