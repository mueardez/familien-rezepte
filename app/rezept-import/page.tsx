import { requireUser } from "../auth";
import { RecipeImportForm } from "./recipe-import-form";
import { SiteHeader } from "../components/site-header";

export const dynamic = "force-dynamic";

export default async function RecipeImportPage() {
  await requireUser("/rezept-import");
  return (
    <main className="import-page">
      <SiteHeader compact backHref="/" backLabel="Alle Rezepte" />
      <section className="import-shell">
        <div className="import-heading">
          <p className="eyebrow">Neues Rezept</p>
          <h1>Aus zwei Bildern wird ein Rezept.</h1>
          <p>Wähle ein Bild mit dem Rezepttext und eines vom fertigen Gericht aus deiner Fotomediathek. Titel, Zutaten und Schritte werden automatisch erkannt und können vor dem Speichern korrigiert werden.</p>
          <form action="/auth/logout" method="post"><button type="submit">Abmelden</button></form>
        </div>
        <RecipeImportForm />
      </section>
    </main>
  );
}
