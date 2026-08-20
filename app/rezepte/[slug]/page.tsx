import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BringImport } from "../../components/bring-import";
import { getRecipe, recipes } from "../../data/recipes";

export function generateStaticParams() { return recipes.map((recipe) => ({ slug: recipe.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) return {};
  const description = `${recipe.title}: ${recipe.time}, kindertauglich und weizenfrei. Zutaten direkt in Bring! übernehmen.`;
  return { title: `${recipe.title} | Familien-Rezepte`, description, openGraph: { title: recipe.title, description, images: [] }, twitter: { card: "summary", title: recipe.title, description, images: [] } };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) notFound();
  const minutes = recipe.time.match(/\d+/)?.[0] ?? "20";
  const structuredRecipe = {
    "@context": "https://schema.org", "@type": "Recipe", name: recipe.title,
    author: { "@type": "Person", name: "Familien-Rezepte" },
    description: `Schnelles, kindertaugliches und weizenfreies Familienrezept: ${recipe.title}.`,
    prepTime: `PT${minutes}M`, totalTime: `PT${minutes}M`, recipeYield: "3 Portionen",
    recipeCategory: "Familien-Z’Nacht", recipeCuisine: "Familienküche",
    keywords: "weizenfrei, kindertauglich, Familienrezept", recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step) => ({ "@type": "HowToStep", text: step })),
  };
  return (
    <main className="recipe-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredRecipe).replace(/</g, "\\u003c") }} />
      <header className="site-header compact"><Link className="brand" href="/"><span aria-hidden="true">🥕</span> Familien-Rezepte</Link><Link className="back-link" href="/">← Alle Rezepte</Link></header>
      <article itemScope itemType="https://schema.org/Recipe">
        <section className="recipe-hero"><div><p className="eyebrow">{recipe.time} · {recipe.method} · weizenfrei</p><h1 itemProp="name">{recipe.title}</h1><p className="recipe-intro">Ein mildes Familien-Z’Nacht für 2 Erwachsene und 1 Kind.</p><div className="facts"><span>⏱ {recipe.time}</span><span>🍽 3 Portionen</span><span>🌾 Weizenfrei</span></div></div><div className="recipe-icon" aria-hidden="true">{recipe.icon}</div></section>
        <section className="recipe-content">
          <div className="ingredients"><p className="eyebrow">Für 2 Erwachsene + 1 Kind</p><h2>Zutaten</h2><ul>{recipe.ingredients.map((ingredient) => <li itemProp="recipeIngredient" key={ingredient}>{ingredient}</li>)}</ul></div>
          <div className="instructions"><p className="eyebrow">Schritt für Schritt</p><h2>So geht’s</h2><ol>{recipe.steps.map((step, index) => <li itemProp="recipeInstructions" key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div>
        </section>
        <div className="kid-tip"><span aria-hidden="true">💡</span><div><strong>Kindertipp</strong><p>{recipe.tip}</p></div></div>
        <BringImport />
      </article>
      <footer><Link href="/">← Zur Rezeptübersicht</Link><span>Familien-Rezepte</span></footer>
    </main>
  );
}
