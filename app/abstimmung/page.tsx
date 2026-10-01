import { requireUser } from "../auth";
import { PollEditor } from "./poll-editor";
import { SiteHeader } from "../components/site-header";
export const dynamic = "force-dynamic";
export default async function PollPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  await requireUser(week ? `/abstimmung?week=${encodeURIComponent(week)}` : "/abstimmung");
  return <main className="import-page"><SiteHeader compact backHref="/" backLabel="Alle Rezepte" /><div className="import-shell shopping-shell"><div className="import-heading"><p className="eyebrow">Unsere nächste Woche</p><h1>Was kochen wir?</h1><p>Wähle sieben von zehn Rezepten. Wenn ihr beide abgestimmt habt, kommen alle gemeinsamen Treffer und weitere zufällig ausgewählte Stimmen auf die Wocheneinkaufsliste.</p></div><PollEditor requestedWeek={week} /></div></main>;
}
