"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
type Choice = { slug: string; title: string; imageUrl?: string | null; icon?: string };
function RecipeThumbnail({ recipe }: { recipe: Choice }) {
  const [failed, setFailed] = useState(false);
  return <span className="poll-thumb" aria-hidden="true">{recipe.imageUrl && !failed ? <Image src={recipe.imageUrl} alt="" width={64} height={64} unoptimized onError={() => setFailed(true)} /> : recipe.icon || "🍽"}</span>;
}
type PollView = { week: string; choices: Choice[]; selected: string[]; voted: number; complete: boolean; winners: Choice[] };
export function PollEditor({ requestedWeek }: { requestedWeek?: string }) {
  const [poll, setPoll] = useState<PollView | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch(requestedWeek ? `/api/polls?week=${encodeURIComponent(requestedWeek)}` : "/api/polls", { cache: "no-store" });
      const data = await response.json() as PollView & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Abstimmung konnte nicht geladen werden.");
      setPoll(data); setSelected(data.selected); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Abstimmung konnte nicht geladen werden."); }
    finally { setLoading(false); }
  }, [requestedWeek]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  const submit = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/polls", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selected, week: poll?.week }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Speichern fehlgeschlagen."); }
    finally { setBusy(false); }
  };
  return <div className="shopping-workspace poll-workspace">{loading ? <p>Lade Abstimmung …</p> : <>
    {poll && <><h2>Woche ab {new Date(`${poll.week}T12:00:00Z`).toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })}</h2>
      {!poll.complete ? <><p>{poll.voted === 0 ? "Ihr habt noch nicht abgestimmt." : `${poll.voted} von 2 Stimmen abgegeben.`} Wähle genau sieben Rezepte.</p><div className="poll-options">{poll.choices.map((recipe) => <label key={recipe.slug}><input type="checkbox" checked={selected.includes(recipe.slug)} disabled={busy || (!selected.includes(recipe.slug) && selected.length >= 7)} onChange={() => setSelected((previous) => previous.includes(recipe.slug) ? previous.filter((slug) => slug !== recipe.slug) : [...previous, recipe.slug])} /><RecipeThumbnail recipe={recipe} /><span className="poll-title">{recipe.title}</span></label>)}</div><p className="shopping-count" aria-live="polite">{selected.length} / 7 ausgewählt</p><button type="button" className="import-action" disabled={busy || selected.length !== 7} onClick={submit}>{poll.selected.length ? "Auswahl aktualisieren" : "Auswahl speichern"}</button>{poll.selected.length > 0 && <p className="shopping-notice">Deine Auswahl ist gespeichert. Die zweite Stimme fehlt noch.</p>}</> : <><p>Ihr habt beide abgestimmt. Diese sieben Rezepte wurden auf die Wocheneinkaufsliste gesetzt:</p><ol className="poll-winners">{poll.winners.map((recipe) => <li key={recipe.slug}><Link href={`/rezepte/${recipe.slug}`}><RecipeThumbnail recipe={recipe} /><span className="poll-title">{recipe.title}</span></Link></li>)}</ol><Link className="primary-link" href={`/einkaufsliste?week=${poll.week}`}>Einkaufsliste öffnen →</Link></>}
    </>}{error && <p className="form-error" role="alert">{error}</p>}{poll && <button className="poll-refresh" type="button" onClick={() => void load()}>Stand aktualisieren</button>}
  </>}</div>;
}
