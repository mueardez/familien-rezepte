# AGENTS.md – Arbeitsregeln für Codex

## Projekt
Familien-Rezepte-App im Repository `mueardez/familien-rezepte`.

## Vor jeder Änderung
- Lies `PROJECT_CONTEXT.md` und `README.md`.
- Prüfe den aktuellen Branch. Der relevante Cloudflare-App-Stand stammt aus `cloudflare-migration`; `main` ist nicht automatisch der aktuelle Stand.
- Verifiziere Annahmen am Code, statt sie aus älteren Beschreibungen abzuleiten.

## Sicherheit und Daten
- Keine Secrets, OAuth-Credentials, API-Keys, privaten E-Mail-Adressen oder Datenexports committen.
- Keine D1/R2-Produktivdaten löschen, überschreiben oder migrieren ohne ausdrücklichen Auftrag.
- Authentifizierungs- und Autorisierungsprüfungen nicht abschwächen.
- Keine Demo-Logins oder Auth-Bypasses einbauen.

## Entwicklung
- Bestehende Funktionen erhalten, sofern die Aufgabe nichts anderes verlangt.
- Änderungen klein und nachvollziehbar halten.
- Vorhandene Tests ausführen; neue Logik mit Tests absichern.
- Typecheck und Build vor Abschluss ausführen, soweit die Umgebung dies zulässt.
- Bei UI-Änderungen Mobile-Nutzung mitdenken.
- Bei E-Mail-Änderungen E-Mail-Client-Kompatibilität und Fallback berücksichtigen.
- Feature-Arbeit über Branch/PR; nicht ungeprüft direkt auf den produktiven Entwicklungsstand schreiben.

## Kommunikation
- Antworte dem Nutzer auf Deutsch.
- Erkläre technische Entscheidungen verständlich und knapp.
- Wenn externe Konfiguration oder manuelle Schritte nötig sind, trenne sie klar von Codeänderungen.
- Bei Unsicherheit zuerst analysieren und benennen, was verifiziert werden muss.

## Aktuelle Prioritäten
1. Pellonium-inspiriertes, eigenständiges Redesign der Website.
2. HTML-Abstimmungs-E-Mail im Stil der Website.
3. Kleine Rezeptbilder bei Abstimmungsvorschlägen, mit sauberem Fallback.
