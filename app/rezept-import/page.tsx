import Link from "next/link";
import { requireUser } from "../auth";
import { isRecipeAdmin } from "../lib/imported-recipes";
import { RecipeImportForm } from "./recipe-import-form";

export const dynamic = "force-dynamic";

export default async function RecipeImportPage() {
  const user = await requireUser("/rezept-import");
  const allowed = isRecipeAdmin(user.email);
  return (
    <main className="import-page">
      <header className="site-header compact">
        <Link className="brand" href="/"><span aria-hidden="true">🥕</span> Familien-Rezepte</Link>
        <Link className="back-link" href="/">← Alle Rezepte</Link>
      </header>
      <section className="import-shell">
        <div className="import-heading">
          <p className="eyebrow">Neues Rezept</p>
          <h1>Aus zwei Bildern wird ein Rezept.</h1>
          <p>Wähle ein Bild mit dem Rezepttext und eines vom fertigen Gericht aus deiner Fotomediathek. Titel, Zutaten und Schritte werden automatisch erkannt und können vor dem Speichern korrigiert werden.</p>
          <form action="/auth/logout" method="post"><button type="submit">Abmelden</button></form>
        </div>
        {allowed ? <RecipeImportForm /> : (
          <div className="access-card">
            <h2>Kein Zugriff</h2>
            <p>Du bist als <strong>{user.email}</strong> angemeldet. Nur der Besitzer dieser Rezeptsammlung darf neue Rezepte hinzufügen.</p>
          </div>
        )}
      </section>
    </main>
  );
}
