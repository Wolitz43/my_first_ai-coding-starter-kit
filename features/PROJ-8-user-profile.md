# PROJ-8: Nutzerprofil

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) — Profil gehört zum Account
- Requires: PROJ-3 (Event-Erstellung) — Eigene Events erscheinen im Profil
- Requires: PROJ-4 (Community-Posts) — Eigene Posts erscheinen im Profil
- Requires: PROJ-6 (Likes & Favoriten) — Gespeicherte Items erscheinen im Profil

## User Stories
- Als User möchte ich mein Profil mit Anzeigename, Bio und Profilbild anpassen können.
- Als User möchte ich eine Übersicht meiner erstellten Events und Posts sehen können.
- Als User möchte ich meine gespeicherten Favoriten auf einer Seite sehen können.
- Als User möchte ich das Profil anderer User sehen können, um ihre öffentlichen Beiträge zu entdecken.
- Als User möchte ich meinen Account löschen können.

## Acceptance Criteria
- [ ] Eigenes Profil zeigt: Anzeigename, Profilbild, Bio, Beitrittsdatum
- [ ] Profil-Tabs: "Meine Events", "Meine Posts", "Gespeichert"
- [ ] Anzeigename kann geändert werden (3–30 Zeichen)
- [ ] Bio kann hinzugefügt/geändert werden (max. 200 Zeichen)
- [ ] Profilbild hochladen (max. 2 MB, JPG/PNG)
- [ ] "Gespeichert"-Tab zeigt alle Favoriten (PROJ-6)
- [ ] Öffentliche Profil-URL: /profil/[username]
- [ ] Andere User können öffentliche Profile sehen (nur öffentliche Daten)
- [ ] Account-Löschung löscht alle persönlichen Daten (DSGVO-konform)
- [ ] Eigene vergangene Events bleiben sichtbar im Profil (als Archiv)

## Edge Cases
- Profilbild-Upload schlägt fehl → Fehlermeldung, Standard-Avatar bleibt erhalten
- Anzeigename bereits vergeben → Fehlermeldung mit Alternativ-Vorschlag
- User versucht Account zu löschen → Zweistufige Bestätigung (Passwort-Eingabe erforderlich)
- Öffentliches Profil eines gelöschten Users → 404-Seite
- User hat noch keine Inhalte erstellt → Freundliche Leer-State-Meldung

## Technical Requirements
- RLS: User kann nur eigene Profildaten bearbeiten
- Profilbilder in Supabase Storage (separater Bucket)
- DSGVO: Account-Löschung löscht oder anonymisiert alle personenbezogenen Daten
- Öffentliche Profile sind ohne Login lesbar

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
