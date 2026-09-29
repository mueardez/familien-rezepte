import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../auth";
import { getRecipe } from "../../../data/recipes";
import { getImportedRecipe } from "../../../lib/imported-recipes";
import { RecipeEditForm } from "./recipe-edit-form";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser(`/rezepte/${encodeURIComponent(slug)}/bearbeiten`);
  const recipe = await getImportedRecipe(slug) ?? getRecipe(slug);
  if (!recipe) notFound();
  return (
    <main className="import-page">
      <header className="site-header compact"><Link className="brand" href="/">🥕 Familien-Rezepte</Link><Link className="back-link" href={`/rezepte/${encodeURIComponent(slug)}`}>← Zum Rezept</Link></header>
      <section className="import-shell">
        <div className="import-heading"><p className="eyebrow">Rezept anpassen</p><h1>{recipe.title} bearbeiten</h1></div>
        <RecipeEditForm slug={slug} recipe={recipe} />
      </section>
    </main>
  );
}
