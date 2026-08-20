import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Familien-Rezepte",
  description: "19 schnelle, kindertaugliche und weizenfreie Z’Nacht-Rezepte für die ganze Familie.",
  openGraph: { title: "Familien-Rezepte", description: "Schnell · kindertauglich · weizenfrei", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Familien-Rezepte" }] },
  twitter: { card: "summary_large_image", title: "Familien-Rezepte", description: "Schnell · kindertauglich · weizenfrei", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de-CH"><body>{children}</body></html>;
}
