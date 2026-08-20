# Familien-Rezepte

Eine mobile Rezeptwebsite mit 19 schnellen, kindertauglichen und weizenfreien Z’Nacht-Rezepten für 2 Erwachsene und 1 Kind.

## Funktionen

- Rezeptübersicht mit Suche und Filtern
- eigene Detailseite pro Rezept
- Schema.org-`Recipe`-Daten für den Bring!-Import
- Bring!-Schaltfläche und dynamischer QR-Code pro Rezept
- responsive Darstellung für Smartphone, Tablet und Desktop

Die veröffentlichte Website ist unter <https://familien-rezepte.mueggler347304.chatgpt.site> erreichbar.

## Lokale Entwicklung

Voraussetzungen: Node.js `>=22.13.0` sowie Linux mit `flock`, `curl` und GNU `timeout`.

```bash
npm ci
npm run dev
```

Produktionsprüfung:

```bash
npm run lint
npm test
```

## Bring!-Integration

Jede Rezeptseite enthält strukturierte Daten nach `schema.org/Recipe`. Der Import-Link verwendet den von Bring! dokumentierten Deeplink-Endpunkt. Der QR-Code wird im Browser aus der jeweils aktuellen Rezept-URL erzeugt und öffnet denselben Import.

Wichtig: Die Website muss öffentlich erreichbar bleiben, damit Bring! die Rezeptseite und deren Zutaten auslesen kann.
