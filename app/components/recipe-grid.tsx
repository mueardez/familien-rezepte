"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Recipe } from "../data/recipes";

const methods = ["Alle", "Pfanne", "Topf", "Ofen", "Waffeleisen"] as const;

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<(typeof methods)[number]>("Alle");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-CH");
    return recipes.filter((recipe) => {
      const methodMatches = method === "Alle" || recipe.method === method;
      const textMatches = !needle || [recipe.title, ...recipe.ingredients].join(" ").toLocaleLowerCase("de-CH").includes(needle);
      return methodMatches && textMatches;
    });
  }, [method, query, recipes]);

  return (
    <section className="recipe-browser" aria-labelledby="recipe-heading">
      <div className="browser-heading">
        <div><p className="eyebrow">19 Familienfavoriten</p><h2 id="recipe-heading">Was kochen wir heute?</h2></div>
        <label className="search-box">
          <span className="sr-only">Rezepte oder Zutaten suchen</span><span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rezept oder Zutat suchen" />
        </label>
      </div>
      <div className="filter-row" aria-label="Nach Zubereitungsart filtern">
        {methods.map((item) => <button key={item} className={method === item ? "filter active" : "filter"} onClick={() => setMethod(item)} type="button">{item}</button>)}
      </div>
      <p className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? "Rezept" : "Rezepte"}</p>
      <div className="recipe-grid">
        {filtered.map((recipe, index) => (
          <Link className="recipe-card" href={`/rezepte/${recipe.slug}`} key={recipe.slug}>
            <div className={`card-visual tone-${(index % 4) + 1}`}><span aria-hidden="true">{recipe.icon}</span><span className="wheatfree">weizenfrei</span></div>
            <div className="card-copy"><p>{recipe.time} · {recipe.method}</p><h3>{recipe.title}</h3><span className="card-link">Rezept öffnen <span aria-hidden="true">→</span></span></div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty">Kein passendes Rezept gefunden. Probiere einen anderen Suchbegriff.</p>}
    </section>
  );
}
