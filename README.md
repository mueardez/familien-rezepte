# Familien-Rezepte – eigener Cloudflare-Account

Vorbereitete Migration vom zuletzt freigegebenen Sites-Stand (1718e9d, Bildimport
und Instagram-Filter), ergänzt um die zehn Petromax-Rezepte aus dem hochgeladenen
GitHub-Archiv. Die alte Website wird durch dieses Projekt nicht verändert.
Kein ChatGPT-Login, keine Übernahme ungeprüfter Identitäts-Header.

## Enthalten und noch offen

- Rezeptübersicht, Detailseiten und Bring!-Import bleiben öffentlich wie bisher.
- Zehn Petromax-Rezepte aus dem GitHub-Stand bleiben einschliesslich Filter erhalten.
- Import aus Textbild und Gerichtsfoto (Deutsch/Englisch), Fotomediathek-Auswahl,
  Instagram-Kennzeichen und kombinierbare Filter sind enthalten.
- Google-Anmeldung mit serverseitiger Prüfung; nur freigegebene Konten.
- Alle freigegebenen Nutzer haben dieselben Rechte und dürfen Rezepte importieren/speichern.
- Auf der Detailseite können freigegebene Nutzer alle Rezepte bearbeiten. Änderungen an
  den mitgelieferten Rezepten liegen als Datenbankfassung mit derselben URL vor.
  Titel, Zutaten, Zubereitung (optional), Zeit, Portionen, Kategorie,
  Instagram-Markierung und Gerichtsfoto lassen sich anpassen.
- Google verlangt nur `openid email`, keinen Gmail-Zugriff.
- Noch nicht enthalten: Einkaufslisten-Erweiterung aus dem zurückgenommenen Stand,
  Umfragen, E-Mail-Versand, automatische Freitags-Aufgaben.
- Bestehende importierte Rezepte/Fotos sind NICHT in diesem Quellcode enthalten.
  Datenmigration vor dem endgültigen Wechsel separat durchführen.
- Ohne Google-Konfiguration bleiben Schreibzugriffe gesperrt. Es gibt keinen
  Demo-Login und keinen Authentifizierungs-Bypass.

## 1. Lokale Prüfung

Node.js >=22.13, empfohlen Node 24. Keine Linux-spezifischen Buildskripte nötig.

```sh
npm ci
npm run typecheck
npm test
npm run db:local
npm run dev
```

`npm ci` benötigt Zugriff auf npm und das im Lockfile festgeschriebene
Vinext-Tarball. Die Vorschau ist noch kein vollständiger Google-OAuth-Test.
Die Anmeldung nutzt Secure-Cookies; dafür wird später die echte HTTPS-Adresse
getestet. Nicht für lokale Tests die Cookie-Sicherheit abschalten.

## 2. Ressourcen im eigenen Cloudflare-Account

1. D1-Datenbank `familien-rezepte-db` erstellen (neue, leere Datenbank).
2. Ihre Database ID in `wrangler.jsonc` statt der Null-Platzhalter-ID eintragen.
3. R2-Bucket `familien-rezepte-bilder` erstellen. Keine öffentliche R2-Freigabe
   nötig; Bilder werden über die Rezept-App ausgeliefert. Eventuell verlangt
   Cloudflare für R2 die Aktivierung inklusive Zahlungsmittel; vorher prüfen.
4. Schema auf der NEUEN Datenbank initialisieren: `npm run db:remote`.
   Alternativ beide SQL-Dateien in `drizzle/` in Reihenfolge in der D1-Konsole
   ausführen. Nicht auf die bisherige Sites-Datenbank anwenden.
5. In GitHub einen separaten Migrationsbranch mit diesem Paket anlegen und prüfen.
   Nicht den alten Code ungeprüft mit `main` zusammenführen. Keine ZIP-Datei als
   Ersatz für entpackten Quellcode hochladen.

## 3. Cloudflare Build

Repository: das bestehende Familien-Rezepte-Repository, neuer Migrationsbranch.

| Feld | Wert |
| --- | --- |
| Project/Worker name | `familien-rezepte` |
| Root directory | Repository-Wurzel |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Build variable | `NODE_VERSION=24` |

Die Projektdateien müssen im Wurzelverzeichnis liegen, nicht eine Ordnerebene
tiefer. Vite erzeugt die Deployment-Konfiguration; `wrangler deploy` verwendet
diese automatisch. Der Deploy-Check stoppt bei der Platzhalter-Datenbank-ID.
`keep_vars=true` erhält die im Dashboard gesetzten Runtime-Variablen bei Updates.
Kein separates Preview-Deployment verwenden, bevor dessen Zugriff eingerichtet
ist; OAuth ist an die feste Produktionsadresse gebunden. `preview_urls=false`.
Die erste Veröffentlichung zeigt Rezepte, aber lässt keine Imports zu, solange
die Runtime-Konfiguration fehlt. Kein Produktivwechsel vor Tests/Datenmigration.

## 4. Google-Anmeldung konfigurieren

Im separaten Admin-Google-Konto ein Google-Cloud-Projekt anlegen. Google Auth
Platform konfigurieren (für private Gmail-Konten External), zunächst die drei
freigegebenen Konten als Testnutzer aufnehmen. OAuth-Client vom Typ Web application.
Die genaue Cloudflare-Adresse steht erst nach der Worker-Erstellung fest.

Authorized redirect URI:

`https://familien-rezepte.DEIN-SUBDOMAIN.workers.dev/auth/callback`

Nur die Scopes `openid` und `email`. Kein Gmail-Scope und kein Offline-Token.
Keine Google-Zugangsdaten, API-Schlüssel oder Session-Secrets in GitHub speichern
oder per Chat teilen. Direkt im Cloudflare-Dashboard unter Worker Settings →
Variables and Secrets hinterlegen:

| Name | Inhalt |
| --- | --- |
| `APP_ORIGIN` | echte HTTPS-Adresse ohne Pfad, z.B. `https://familien-rezepte.DEIN-SUBDOMAIN.workers.dev` |
| `GOOGLE_CLIENT_ID` | Web-OAuth-Client-ID |
| `GOOGLE_CLIENT_SECRET` | **Secret**: Google-Client-Secret |
| `SESSION_SECRET` | **Secret**: mindestens 32 zufällige Bytes, z.B. lokal mit `openssl rand -hex 32` erzeugen |
| `RECIPE_ADMIN_EMAIL` | Optionaler Altbestand: zusätzliche freigegebene Adresse, ohne Sonderrechte |
| `ALLOWED_EMAILS` | **Secret** empfohlen: freigegebene Nutzeradressen, durch Komma getrennt; alle haben gleiche Rechte |
| `OPENAI_API_KEY` | **Secret**: API-Schlüssel für die Bilderkennung |

Die echten Adressen werden absichtlich nicht in diesem öffentlichen Quellcode
festgeschrieben. Alle freigegebenen Konten dürfen Rezepte importieren und speichern.
Es gibt keine separate App-Adminrolle. GitHub-/Cloudflare-Zugänge sind davon unabhängig. Login-Sessions gelten 7 Tage. Entfernte Konten werden bei jeder
Anfrage abgewiesen. Änderung des SESSION_SECRET beendet alle bestehenden Sessions.
Logout entfernt die Sitzung aus dem Browser (keine individuelle serverseitige
Token-Sperrliste). Ohne eigene Domain bleibt die workers.dev-Adresse ausreichend
für dieses technische Setup; die konkrete Google-Client-Einrichtung muss live
bestätigt werden.

## 5. Abnahmetest vor Umschaltung

- Öffentliche Übersicht und bestehende Rezeptdetails; Bring!-Import.
- Google-Login als freigegebener Nutzer; anderes nicht freigegebenes Konto wird abgewiesen.
- Jedes freigegebene Mitglied kann den Import öffnen und Rezepte anlegen.
- Bildupload auf iPhone: vorhandene Bilder auswählen, keine erzwungene Kamera.
- Deutsches und englisches Rezept: erkennen, korrigieren, speichern, wieder öffnen.
- Instagram-Filter zusammen mit Ofen; Gerichtsfoto auf neuer Adresse.
- Abmelden und Import erneut aufrufen: Anmeldung erforderlich.
- Alte Datenbank und R2-Bilder separat sichern, übertragen, Anzahl/Details prüfen.
  Quellcode-Upload überträgt keine Daten. Niemals Datenexporte in das öffentliche
  GitHub-Repository aufnehmen. Alte Website erst nach erfolgreicher Abnahme ablösen.

Echte Google-Anmeldung, AI-Abrechnung und Cloudflare-Limits können erst im eigenen
Account abschliessend getestet werden. Kostenloser Betrieb wird nicht garantiert;
CPU-Limits, Speicher, API-Aufrufe und mögliche Tarifänderungen beachten.

## Offizielle Referenzen

- https://developers.cloudflare.com/workers/vite-plugin/get-started/
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.google.com/identity/openid-connect/openid-connect
- https://github.com/panva/jose

## Prüfstand dieses Pakets (28.09.2026)

- TypeScript-Prüfung, Produktionsbuild und acht Authentifizierungs-Tests bestanden.
- Gebauten Worker lokal geprüft: Übersicht, Google-Anmeldeseite, Start des OAuth-
  Flows, Rückweisung falscher OAuth-State-Werte, Logout und Import-Zugriffsschutz.
- Gefälschte frühere Hosting-Identitäts-Header gewähren keinen Zugang.
- D1-Migrationen erfolgreich auf einer lokalen leeren Testdatenbank angewendet.
- Cloudflare Deployment-Dry-Run bestanden, nichts veröffentlicht.
- Echte Google-Anmeldung, KI-Erkennung, bestehende Datenübernahme und iPhone-Test
  stehen noch aus; dafür werden die eigenen Accounts/Ressourcen benötigt.

### Wocheneinkaufsliste

Angemeldete Personen können unter `/einkaufsliste` pro Kalenderwoche Rezepte auswählen, eigene Lebensmittel ergänzen, Artikel abhaken und die Liste gemeinsam speichern. Die Wochen beginnen montags in der Zeitzone Europe/Zurich. Die Daten liegen im konfigurierten R2-Bucket; keine neue D1-Migration ist erforderlich. Gleichzeitige Änderungen werden über R2-ETags erkannt und nicht still überschrieben.

„Für Bring! vorbereiten“ erzeugt einen sieben Tage gültigen, zufällig adressierten Export der noch offenen Artikel. Die öffentliche Exportseite enthält strukturierte Schema.org-Rezeptdaten und wird über den Bring!-Rezept-Deep-Link importiert. Jede Person mit dem Exportlink kann die Artikel während dieser Zeit sehen; es werden keine Kontodaten exportiert. Die Übernahme muss in Bring! bestätigt werden, und Änderungen werden nicht zurücksynchronisiert.
