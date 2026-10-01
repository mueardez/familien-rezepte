import { RecipeGrid } from "./components/recipe-grid";
import { allRecipes as loadRecipes } from "./lib/shopping-list";
import { readCatalog } from "./lib/catalog";
import { SiteHeader } from "./components/site-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allRecipes = await loadRecipes();
  const { data: catalog } = await readCatalog();
  return (
    <main>
      <SiteHeader />
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow">Unsere Familienküche</p><h1>Gutes Essen.<br/><em>Ganz entspannt.</em></h1><p className="hero-text">Lieblingsrezepte sammeln, gemeinsam die Woche planen und mit einer fertigen Einkaufsliste losziehen.</p><a className="primary-link" href="#rezepte">Rezepte entdecken <span aria-hidden="true">↓</span></a></div>
        <nav className="hero-path" aria-label="Gemeinsam die Woche planen">
          <a href="#rezepte"><small>[01] ENTDECKEN</small><h2>Lieblingsrezepte finden ↗</h2><p>Bewährte Familiengerichte und neue Ideen für euren Tisch.</p></a>
          <a href="/abstimmung"><small>[02] ABSTIMMEN</small><h2>Gemeinsam auswählen ↗</h2><p>Zehn Vorschläge. Eure sieben Favoriten für die nächste Woche.</p></a>
          <a href="/einkaufsliste"><small>[03] EINKAUFEN</small><h2>Alles auf einer Liste ↗</h2><p>Die Woche planen, Zutaten ergänzen und an Bring! senden.</p></a>
        </nav>
      </section>
      <div id="rezepte"><RecipeGrid recipes={allRecipes} methods={catalog.methods.map((method) => method.name)} /></div>
      <footer><span>Familien-Rezepte</span><span>Schnell · kindertauglich · weizenfrei</span></footer>
    </main>
  );
}
