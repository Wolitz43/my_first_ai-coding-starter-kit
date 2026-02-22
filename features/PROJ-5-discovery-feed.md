# PROJ-5: Discovery-Feed

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-2 (Standort & Radius) — Feed wird nach Standort + Radius gefiltert
- Requires: PROJ-3 (Event-Erstellung) — Events werden im Feed angezeigt
- Requires: PROJ-4 (Community-Posts) — Posts werden im Feed angezeigt

## User Stories
- Als User möchte ich einen Feed sehen, der Events und Posts in meiner Nähe zeigt, damit ich schnell entdecken kann, was los ist.
- Als User möchte ich den Feed nach Typ filtern können (nur Events / nur Posts / beides), damit ich gezielt suchen kann.
- Als User möchte ich den Feed nach Kategorie filtern können (z.B. nur "Musik").
- Als User möchte ich Events nach Datum sortieren können (bald zuerst).
- Als User möchte ich eine Karten-Ansicht sehen, damit ich die räumliche Verteilung verstehe.
- Als nicht-eingeloggter Besucher möchte ich den Feed auch ohne Account sehen können (read-only).

## Acceptance Criteria
- [ ] Feed zeigt Events und Community-Posts im eingestellten Radius (PROJ-2)
- [ ] Events und Posts sind optisch unterscheidbar (Icon/Badge)
- [ ] Standard-Sortierung: Relevanz (nächstes Datum für Events, neueste Posts)
- [ ] Filter nach Typ: Alle / Nur Events / Nur Posts
- [ ] Filter nach Kategorie (Mehrfachauswahl möglich)
- [ ] Filter nach Datum: Heute / Diese Woche / Dieses Wochenende / Benutzerdefiniert
- [ ] Karten-Ansicht als Alternative zur Listen-Ansicht
- [ ] Jede Karte zeigt: Bild (falls vorhanden), Titel, Entfernung, Datum/Zeit, Kategorie
- [ ] Klick auf Karte öffnet Detail-Ansicht
- [ ] Vergangene Events werden nicht im Feed angezeigt
- [ ] Endloser Scroll / Pagination (20 Einträge pro Seite)
- [ ] Feed für nicht-eingeloggte User sichtbar (Interaktionen erfordern Login)
- [ ] Leerer Feed zeigt hilfreiche Meldung ("Nichts in der Nähe — Radius vergrößern?")

## Edge Cases
- Keine Ergebnisse im Radius → Freundliche Leer-State-Meldung mit Vorschlag, Radius zu erhöhen
- User hat keinen Standort gesetzt → Aufforderung zur Standort-Eingabe (nicht Fehler)
- Sehr viele Ergebnisse (>500) → Pagination, max. 20 Items pro Seite, Performance OK
- Karten-API nicht verfügbar → Graceful Fallback auf Listen-Ansicht
- Event endet während User den Feed betrachtet → Beim nächsten Reload gefiltert
- Mehrere Filter gleichzeitig → AND-Verknüpfung (alle gewählten Filter müssen zutreffen)

## Technical Requirements
- Standortbasierte Abfragen via PostGIS ST_DWithin
- Server-side Pagination mit Cursor-based Approach
- Kartenkomponente: Leaflet.js (OpenStreetMap, kostenlos) oder Mapbox
- Feed-Daten gecacht (unstable_cache, 60s TTL)
- Mobile-first Layout (Cards stapeln sich vertikal)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
