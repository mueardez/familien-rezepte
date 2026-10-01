import { requireUser } from "../auth";
import { AdminEditor } from "./admin-editor";
import { SiteHeader } from "../components/site-header";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await requireUser("/admin");
  return <main className="import-page"><SiteHeader compact backHref="/" backLabel="Rezepte" /><section className="import-shell"><div className="import-heading"><p className="eyebrow">Gemeinsame Verwaltung</p><h1>Zubereitungsarten & Lebensmittel</h1><p>Pflegt eure Zubereitungsarten und entscheidet, welche in neuen Umfragen vorkommen. Gleiche Lebensmittel werden gemeinsam verwendet.</p></div><AdminEditor /></section></main>;
}
