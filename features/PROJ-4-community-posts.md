# PROJ-4: Community-Posts

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) — nur eingeloggte User können Posts erstellen
- Requires: PROJ-2 (Standort & Radius) — Post-Standort nutzt Geocoding-Infrastruktur

## User Stories
- Als eingeloggter User möchte ich einen Community-Post mit einem Tipp oder einer Empfehlung erstellen, damit andere davon profitieren.
- Als Post-Ersteller möchte ich einen Ort, Text und optional ein Bild posten können.
- Als Post-Ersteller möchte ich meinen eigenen Post bearbeiten können.
- Als Post-Ersteller möchte ich meinen eigenen Post löschen können.
- Als User möchte ich Community-Posts klar von offiziellen Events unterscheiden können.

## Acceptance Criteria
- [ ] Eingeloggte User sehen einen "Post erstellen"-Button
- [ ] Pflichtfelder: Text (10–500 Zeichen), Standort (Adresse oder "aktueller Standort")
- [ ] Optionale Felder: Bild (max. 5 MB), Kategorie, Titel (max. 80 Zeichen)
- [ ] Kategorien: Geheimtipp, Empfehlung, Warnung, Veranstaltungshinweis, Frage, Sonstiges
- [ ] Posts sind im Discovery-Feed klar als "Community" markiert (Badge/Label)
- [ ] Post-Ersteller kann eigenen Post bearbeiten
- [ ] Post-Ersteller kann eigenen Post löschen (mit Bestätigungs-Dialog)
- [ ] Bildupload: max. 5 MB, Formate JPG/PNG/WebP
- [ ] Nach Erstellung erscheint Post sofort im Feed

## Edge Cases
- Kein Standort angegeben → Pflichtfeld, Post kann nicht ohne Standort gespeichert werden
- Bildupload schlägt fehl → Post kann ohne Bild gespeichert werden
- Post enthält nur Leerzeichen → Validierung schlägt fehl
- User postet sehr viele Posts in kurzer Zeit → Rate-Limiting: max. 10 Posts pro Stunde
- User löscht Account → Posts bleiben erhalten, angezeigt als "Gelöschter User"
- Post-Text zu lang → Zeichenzähler mit Echtzeit-Feedback, Submit-Button deaktiviert

## Technical Requirements
- Bilder werden in Supabase Storage gespeichert
- Koordinaten als PostGIS GEOGRAPHY Typ gespeichert
- RLS: Nur Ersteller kann eigenen Post bearbeiten/löschen
- Rate-Limiting über server-side Check (Supabase RLS + API-Route)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
