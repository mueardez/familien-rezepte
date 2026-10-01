import { hydrateRecipe, readCatalog } from "../../../lib/catalog";
import { notFound } from "next/navigation";
import { requireUser } from "../../../auth";
import { getRecipe } from "../../../data/recipes";
import { getImportedRecipe } from "../../../lib/imported-recipes";
import { RecipeEditForm } from "./recipe-edit-form";
import { SiteHeader } from "../../../components/site-header";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser(`/rezepte/${encodeURIComponent(slug)}/bearbeiten`);
  const original = await getImportedRecipe(slug) ?? getRecipe(slug);
  const recipe = original ? hydrateRecipe(original, (await readCatalog()).data) : undefined;
  if (!recipe) notFound();
  return (
    <main className="import-page">
      <SiteHeader compact backHref={`/rezepte/${encodeURIComponent(slug)}`} backLabel="Zum Rezept" />
      <section className="import-shell">
        <div className="import-heading"><p className="eyebrow">Rezept anpassen</p><h1>{recipe.title} bearbeiten</h1></div>
        <RecipeEditForm slug={slug} recipe={recipe} />
      </section>
    </main>
  );
}
