import { env } from "cloudflare:workers";
import { authConfigured, safeReturnPath } from "../lib/auth-core";
import { SiteHeader } from "../components/site-header";

export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return_to?: string; error?: string }> }) {
  const params = await searchParams;
  const ready = authConfigured(env);
  return <main className="import-page">
    <SiteHeader compact backHref="/" backLabel="Alle Rezepte" />
    <section className="import-shell">
      <h1>Anmelden</h1>
      <p>Zum Hinzufügen von Rezepten bitte mit dem freigegebenen Google-Konto anmelden.</p>
      {params.error && <p role="alert">Die Anmeldung wurde abgebrochen oder das Konto ist nicht freigegeben. Bitte erneut versuchen.</p>}
      {ready ? <a className="primary-link" href={`/auth/google?return_to=${encodeURIComponent(safeReturnPath(params.return_to || "/rezept-import"))}`}>Mit Google anmelden</a> :
        <p role="status">Die Google-Anmeldung wird noch eingerichtet. Rezepte kannst du bereits ohne Anmeldung ansehen.</p>}
      <p>Es wird nur deine bestätigte E-Mail-Adresse verwendet. Die Anmeldung erlaubt keinen Zugriff auf dein Gmail-Postfach.</p>
    </section>
  </main>;
}
