# Familien-Rezepte – Projektkontext für Codex

Stand: 1. Oktober 2026

## Zweck dieses Dokuments

Dieses Dokument ist die Übergabe aus der bisherigen ChatGPT-Entwicklung an Codex. Es ergänzt den Quellcode und die Git-Historie um Produktentscheidungen, Betriebsannahmen und offene Wünsche. Bei Widersprüchen gilt: zuerst den aktuellen Code und die README auf dem aktiven Branch prüfen; nichts aufgrund dieses Dokuments blind umbauen.

## Source of Truth

- Repository: `mueardez/familien-rezepte`
- Aktueller Entwicklungsstand für die Cloudflare-App: Branch `cloudflare-migration`
- `main` ist nicht der aktuelle App-Stand und darf nicht als Ausgangspunkt für neue Features angenommen werden.
- Deployment, Datenbank und Bildspeicher nicht ohne ausdrücklichen Auftrag migrieren, löschen oder ersetzen.
- Keine Secrets oder privaten Daten in GitHub committen.

## Produktziel

Private Familien-Rezept-App mit öffentlicher Rezeptansicht und geschützten Schreibfunktionen. Sie soll Rezepte erfassen, Bilder verwalten, Rezepte filtern, wöchentliche Essensplanung/Abstimmung unterstützen und daraus eine Einkaufsliste inklusive Bring!-Übergabe erzeugen.

## Bestehender technischer Stand

Details und Setup stehen in `README.md`. Aktuell relevant:

- Cloudflare Workers / workers.dev, keine eigene Domain erforderlich.
- D1: `familien-rezepte-db`.
- R2: `familien-rezepte-bilder`.
- Google OAuth; nur freigegebene Konten, keine separate App-Adminrolle.
- OpenAI API für Bilderkennung/OCR-Import.
- React/Next/Vinext/Vite/TypeScript; genaue Versionen aus `package.json`.
- Rezeptübersicht, Detailseiten und Bring!-Import.
- Import aus Rezept-Textbild plus Gerichtsfoto; Deutsch/Englisch.
- Fotoauswahl aus der Mediathek statt erzwungener Kamera.
- Instagram-Kennzeichen und kombinierbare Filter, z. B. Instagram + Ofen.
- Rezeptbearbeitung für angemeldete freigegebene Nutzer.
- Petromax-Rezepte sind vorhanden.
- Wocheneinkaufsliste mit Rezepten, eigenen Lebensmitteln, Abhaken und gemeinsamem Speichern.
- Wöchentliche Rezeptabstimmung für zwei Personen; je sieben Stimmen, gemeinsame Treffer plus definierte Ergänzungslogik bis sieben.
- Gmail-Versand über Google Apps Script; Versandplan in der App administrierbar.
- Adminbereich für Zubereitungsarten und Umfrage-Einschluss/-Ausschluss.
- Petromax ist standardmässig für neue Umfragen ausgeschlossen.
- Strukturierter Lebensmittelstamm: Menge, Einheit, Lebensmittel und Hinweise getrennt; Aliase/Wiederverwendung und Bestandsmigration.

## Wichtige Produktentscheidungen

1. Kein ChatGPT-Login. Google-Login verwenden.
2. Freigegebene Familiennutzer haben in der App grundsätzlich dieselben Rechte.
3. Öffentliche Lesefunktionen und Bring!-Import sollen erhalten bleiben.
4. Bestehende Daten und Bilder sind wertvoll. Keine destruktiven Migrationen.
5. Mengen nicht als Teil des Lebensmittelnamens modellieren.
6. Ein gemeinsamer Lebensmittelstamm soll bekannte Lebensmittel wiederverwenden und neue bei Bedarf automatisch anlegen.
7. Unklare Bestandsdaten bei Migration nicht stillschweigend „korrigieren“; Originaltext/Rückfallquelle erhalten.
8. Umfrage-Ausschluss wird über die Verwaltung der Zubereitungsarten gesteuert.
9. Zeitzone für Wochen-/Versandlogik: Europe/Zurich.
10. Secrets gehören in Cloudflare/Google-Konfiguration, nie ins Repository.

## Neueste offene Wünsche

### 1. Redesign der Website

Die visuelle Richtung soll sich an der Ästhetik von Pellonium Solutions orientieren (`pellonium.com/solutions`): modern, hochwertig, ruhig und klar. Nicht einfach die Seite kopieren. Bestehende Funktionen, Mobile-Nutzung und Lesbarkeit der Rezepte erhalten.

Vor Implementierung:
- bestehende UI-Komponenten und Styles inventarisieren;
- einen konsistenten Designansatz für Übersicht, Detail, Import, Einkaufsliste, Abstimmung und Admin definieren;
- keine Funktionslogik während des reinen Redesigns unnötig verändern.

### 2. Abstimmungs-E-Mail als HTML

Die Abstimmungs-E-Mail soll deutlich schöner werden und visuell zur neuen Website passen.

Anforderungen:
- HTML-E-Mail mit robustem E-Mail-Markup;
- klarer CTA zur Abstimmung;
- mobile Darstellung berücksichtigen;
- bestehende Versand-/Dedup-Logik beibehalten;
- Plain-Text/Fallback nicht leichtfertig entfernen.

### 3. Rezeptbilder in der Abstimmung

Bei den vorgeschlagenen Rezepten soll jeweils ein kleines Rezept-/Gerichtsfoto erscheinen, sofern vorhanden.

Dabei:
- sowohl Abstimmungsseite als auch E-Mail-Konzept prüfen;
- fehlende Bilder sauber behandeln;
- keine privaten R2-Objekte versehentlich öffentlich machen;
- Performance und E-Mail-Kompatibilität beachten.

## Bekannte Betriebs-/Migrationspunkte

- Die README enthält teilweise historische Abschnitte („noch offen“) und spätere Ergänzungen. Vor Schlussfolgerungen immer das gesamte Dokument und den aktuellen Code prüfen.
- Frühere importierte Rezepte/Fotos sind nicht automatisch Bestandteil des Git-Repositories.
- D1/R2-Datenmigration ist getrennt vom Code-Deployment zu behandeln.
- Google OAuth, Gmail Apps Script, Cloudflare-Variablen/Secrets und OpenAI API sind externe Laufzeitabhängigkeiten.
- Bestehende Sicherheitsregeln (serverseitig geprüfte Authentifizierung, keine gefälschten Identitätsheader, keine Secrets im Code) beibehalten.

## Vorgehen für Codex

Bei Beginn einer neuen Codex-Session:

1. `README.md`, `PROJECT_CONTEXT.md`, `AGENTS.md`, `package.json`, Cloudflare-Konfiguration und relevante Tests lesen.
2. Repository-Struktur und aktuellen Branch prüfen.
3. Vor Änderungen kurz zusammenfassen, wie die betroffene Funktion aktuell implementiert ist.
4. Kleine, nachvollziehbare Änderungen bevorzugen.
5. Bestehende Tests ausführen und für neue Logik passende Tests ergänzen.
6. Keine Produktionsressourcen, Daten oder Secrets verändern, sofern das nicht ausdrücklich beauftragt wurde.
7. Änderungen über einen Feature-Branch/PR bereitstellen; nicht ungeprüft direkt in den produktiven Entwicklungsbranch schreiben.

## Nächste empfohlene Aufgabe

Zuerst nur analysieren, noch nichts ändern:

> Analysiere die bestehende Familien-Rezepte-App vollständig. Lies README.md, PROJECT_CONTEXT.md und AGENTS.md sowie die relevanten Quell- und Testdateien. Erkläre mir danach in verständlichem Deutsch die aktuelle Architektur, welche Funktionen tatsächlich implementiert sind, welche externen Abhängigkeiten bestehen und wie du die drei offenen Wünsche (Pellonium-inspiriertes Redesign, HTML-Abstimmungs-E-Mail, Rezeptbilder in der Abstimmung) technisch angehen würdest. Nimm noch keine Codeänderungen vor.
