# PROJ-7: Kommentare

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) — Kommentare sind an User gebunden
- Requires: PROJ-3 (Event-Erstellung) — Events können kommentiert werden
- Requires: PROJ-4 (Community-Posts) — Posts können kommentiert werden

## User Stories
- Als eingeloggter User möchte ich einen Kommentar zu einem Event oder Post schreiben, um Fragen zu stellen oder Feedback zu geben.
- Als User möchte ich alle Kommentare unter einem Event/Post lesen können.
- Als Kommentar-Autor möchte ich meinen eigenen Kommentar löschen können.
- Als Content-Ersteller möchte ich benachrichtigt werden, wenn jemand meinen Inhalt kommentiert.
- Als User möchte ich nicht-eingeloggt Kommentare lesen, aber nicht schreiben können.

## Acceptance Criteria
- [ ] Kommentar-Bereich erscheint in der Detail-Ansicht von Events und Posts
- [ ] Eingeloggte User können Kommentare schreiben (10–500 Zeichen)
- [ ] Kommentare werden chronologisch angezeigt (älteste zuerst)
- [ ] Kommentar-Anzahl wird auf der Karte im Feed angezeigt
- [ ] Eigene Kommentare können gelöscht werden (mit Bestätigungs-Dialog)
- [ ] Content-Ersteller erhält In-App-Benachrichtigung bei neuem Kommentar (Badge)
- [ ] Nicht-eingeloggte User können Kommentare lesen, Eingabefeld wird bei Fokus mit Login-Aufforderung ersetzt
- [ ] Kommentare laden nicht beim ersten Page-Load (erst auf Klick/Scroll)
- [ ] Rate-Limiting: max. 5 Kommentare pro Minute pro User

## Edge Cases
- Kommentar-Text leer oder nur Leerzeichen → Validierung, kein leerer Kommentar
- Item wird gelöscht, während Kommentare vorhanden → Kommentare werden mit gelöscht (CASCADE)
- User löscht Account → Kommentare bleiben als "Gelöschter User" erhalten
- User kommentiert eigenen Inhalt → Erlaubt, keine Benachrichtigung an sich selbst
- Sehr viele Kommentare (>100) → Pagination oder "Mehr laden"-Button

## Technical Requirements
- RLS: Nur Autor kann eigenen Kommentar löschen, alle können lesen
- Kein Edit von Kommentaren (bewusste Entscheidung für Transparenz)
- Benachrichtigungen als simple DB-Tabelle (kein Echtzeit-Push in Phase 1)
- Lazy Loading der Kommentar-Sektion

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
