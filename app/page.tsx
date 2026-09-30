import { RecipeGrid } from "./components/recipe-grid";
import { allRecipes as loadRecipes } from "./lib/shopping-list";
import { readCatalog } from "./lib/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allRecipes = await loadRecipes();
  const { data: catalog } = await readCatalog();
  return (
    <main>
      <header className="site-header"><a className="brand" href="#top"><span aria-hidden="true">🥕</span> Familien-Rezepte</a><div className="header-actions"><a className="add-recipe-link" href="/admin">Verwaltung</a><a className="add-recipe-link" href="/abstimmung">🍽 Abstimmung</a><a className="add-recipe-link" href="/einkaufsliste">🛒 Einkaufsliste</a><a className="add-recipe-link" href="/rezept-import">＋ Rezept hinzufügen</a></div></header>
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow">Schnell · kindertauglich · weizenfrei</p><h1>Z’Nacht, das allen schmeckt.</h1><p className="hero-text">Unkomplizierte Familienrezepte mit viel Gemüse, milden Aromen und Zutaten, die direkt in Bring! übernommen werden können.</p><a className="primary-link" href="#rezepte">Rezepte auswählen <span aria-hidden="true">↓</span></a></div>
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
