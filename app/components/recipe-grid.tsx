"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Recipe } from "../data/recipes";



export function RecipeGrid({ recipes, methods: configured }: { recipes: Recipe[]; methods: string[] }) {
  const methods = ["Alle", ...configured];
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<string>("Alle");
  const [instagramOnly, setInstagramOnly] = useState(false);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("de-CH");
    return recipes.filter((recipe) => {
      const methodMatches = method === "Alle" || recipe.method === method;
      const instagramMatches = !instagramOnly || recipe.isInstagram;
      const textMatches = !needle || [recipe.title, ...recipe.ingredients].join(" ").toLocaleLowerCase("de-CH").includes(needle);
      return methodMatches && instagramMatches && textMatches;
    });
  }, [instagramOnly, method, query, recipes]);

  return (
    <section className="recipe-browser" aria-labelledby="recipe-heading">
      <div className="browser-heading">
        <div><p className="eyebrow">{recipes.length} Familienfavoriten</p><h2 id="recipe-heading">Was kochen wir heute?</h2></div>
        <label className="search-box">
          <span className="sr-only">Rezepte oder Zutaten suchen</span><span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rezept oder Zutat suchen" />
        </label>
      </div>
      <div className="filter-row" aria-label="Nach Zubereitungsart filtern">
        {methods.map((item) => <button key={item} aria-pressed={method === item} className={method === item ? "filter active" : "filter"} onClick={() => setMethod(item)} type="button">{item}</button>)}
        <button aria-pressed={instagramOnly} className={instagramOnly ? "filter instagram-filter active" : "filter instagram-filter"} onClick={() => setInstagramOnly((active) => !active)} type="button">Instagram-Rezept</button>
      </div>
      <p className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? "Rezept" : "Rezepte"}</p>
      <div className="recipe-grid">
        {filtered.map((recipe, index) => (
          <Link className="recipe-card" href={`/rezepte/${recipe.slug}`} key={recipe.slug}>
            <div className={`card-visual tone-${(index % 4) + 1}`}>{recipe.imageUrl ? <Image className="card-photo" src={recipe.imageUrl} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 850px) 50vw, 33vw" unoptimized /> : <span aria-hidden="true">{recipe.icon}</span>}<span className="wheatfree">{recipe.isInstagram ? "Instagram-Rezept" : recipe.imageUrl ? "neu importiert" : "weizenfrei"}</span></div>
            <div className="card-copy"><p>{recipe.time} · {recipe.method}</p><h3>{recipe.title}</h3><span className="card-link">Rezept öffnen <span aria-hidden="true">→</span></span></div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty">Kein passendes Rezept gefunden. Probiere einen anderen Suchbegriff.</p>}
    </section>
  );
}
