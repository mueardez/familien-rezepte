import Link from "next/link";
import { requireUser } from "../auth";
import { allRecipes } from "../lib/shopping-list";
import { ShoppingListEditor } from "./shopping-list-editor";

export const dynamic = "force-dynamic";

export default async function ShoppingListPage() {
  await requireUser("/einkaufsliste");
  const catalogue = await allRecipes();
  return <main className="import-page"><header className="site-header compact"><Link className="brand" href="/">🥕 Familien-Rezepte</Link><Link className="back-link" href="/">← Rezepte</Link></header><div className="import-shell shopping-shell"><div className="import-heading"><p className="eyebrow">Für die kommende Woche</p><h1>Wocheneinkaufsliste</h1><p>Wähle Rezepte und ergänze Lebensmittel. Danach kannst du die offenen Einträge an Bring! übergeben.</p></div><ShoppingListEditor catalogue={catalogue.map(({ slug, title, ingredients }) => ({ slug, title, ingredients }))} /></div></main>;
}
