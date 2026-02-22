# PROJ-6: Likes & Favoriten

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) — Likes sind an User gebunden
- Requires: PROJ-3 (Event-Erstellung) — Events können geliked werden
- Requires: PROJ-4 (Community-Posts) — Posts können geliked werden
- Requires: PROJ-5 (Discovery-Feed) — Like-Button erscheint im Feed

## User Stories
- Als eingeloggter User möchte ich ein Event oder einen Post liken können, um Interesse zu signalisieren.
- Als User möchte ich mein Like widerrufen können, falls ich meine Meinung ändere.
- Als User möchte ich die Anzahl der Likes auf einem Event/Post sehen können.
- Als User möchte ich Events und Posts als Favoriten speichern, damit ich sie später wiederfinden kann.
- Als User möchte ich eine Liste meiner gespeicherten Favoriten sehen können.

## Acceptance Criteria
- [ ] Like-Button erscheint auf jeder Event- und Post-Karte
- [ ] Eingeloggte User können liken (ein Like pro User pro Item)
- [ ] Like kann durch erneutes Klicken zurückgenommen werden (Toggle)
- [ ] Like-Anzahl wird sofort aktualistisch nach dem Klick (Optimistic UI)
- [ ] Nicht-eingeloggte User werden bei Like-Versuch zum Login weitergeleitet
- [ ] Favoriten-Button (Lesezeichen-Icon) separat vom Like-Button
- [ ] Favorisierte Items erscheinen in einer eigenen "Gespeichert"-Liste (PROJ-8 Profil)
- [ ] Like- und Favoriten-Status bleibt nach Seiten-Reload erhalten

## Edge Cases
- User versucht doppelt zu liken (schnelles Doppelklick) → Debouncing, nur ein Like wird gespeichert
- User ist offline → Like-Aktion schlägt fehl, Toast-Fehlermeldung
- Item wird gelöscht, während User es geliked hat → Likes werden mit gelöscht (CASCADE)
- User löscht Account → Alle Likes des Users werden gelöscht

## Technical Requirements
- RLS: Jeder User kann nur seine eigenen Likes erstellen/löschen
- Likes-Tabelle mit eindeutigem Constraint (user_id + item_id + item_type)
- Optimistic UI Update im Frontend
- Like-Anzahl als aggregierter Counter (nicht per Query zählen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
