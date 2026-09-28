import { RecipeGrid } from "./components/recipe-grid";
import { recipes } from "./data/recipes";
import { listImportedRecipes } from "./lib/imported-recipes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allRecipes = [...await listImportedRecipes(), ...recipes];
  return (
    <main>
      <header className="site-header"><a className="brand" href="#top"><span aria-hidden="true">🥕</span> Familien-Rezepte</a><div className="header-actions"><span className="header-note">2 Erwachsene + 1 Kind</span><a className="add-recipe-link" href="/rezept-import">＋ Rezept hinzufügen</a></div></header>
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow">Schnell · kindertauglich · weizenfrei</p><h1>Z’Nacht, das allen schmeckt.</h1><p className="hero-text">Unkomplizierte Familienrezepte mit viel Gemüse, milden Aromen und Zutaten, die direkt in Bring! übernommen werden können.</p><a className="primary-link" href="#rezepte">Rezepte auswählen <span aria-hidden="true">↓</span></a></div>
        <div className="hero-plate" aria-hidden="true"><span className="plate-icon">🍝</span><span className="orbit orbit-one">🥦</span><span className="orbit orbit-two">🥕</span><span className="orbit orbit-three">🥔</span></div>
      </section>
      <div id="rezepte"><RecipeGrid recipes={allRecipes} /></div>
      <footer><span>Familien-Rezepte</span><span>Schnell · kindertauglich · weizenfrei</span></footer>
    </main>
  );
}
