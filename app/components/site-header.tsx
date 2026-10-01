import Link from "next/link";

type SiteHeaderProps = {
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
};

const navigation = [
  { href: "/#rezepte", label: "Rezepte" },
  { href: "/abstimmung", label: "Abstimmung" },
  { href: "/einkaufsliste", label: "Einkaufsliste" },
  { href: "/admin", label: "Verwaltung" },
];

export function SiteHeader({ backHref, backLabel = "Zurück", compact = false }: SiteHeaderProps) {
  return (
    <header className={`site-header${compact ? " compact" : ""}`}>
      <Link className="brand" href="/" aria-label="Familien-Rezepte – Startseite">
        <span className="brand-mark" aria-hidden="true"><i /></span>
        <span className="brand-name">Familien<span>Rezepte</span></span>
      </Link>
      {backHref ? (
        <Link className="back-link" href={backHref}><span aria-hidden="true">←</span> {backLabel}</Link>
      ) : (
        <nav className="main-nav" aria-label="Hauptnavigation">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          <Link className="nav-cta" href="/rezept-import"><span aria-hidden="true">＋</span> Rezept</Link>
        </nav>
      )}
    </header>
  );
}
