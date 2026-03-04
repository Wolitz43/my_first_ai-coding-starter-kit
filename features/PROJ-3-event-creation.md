# PROJ-3: Event-Erstellung & Verwaltung

## Status: In Progress
**Created:** 2026-02-22
**Last Updated:** 2026-03-04

## Dependencies
- Requires: PROJ-1 (User Authentication) — nur eingeloggte User können Events erstellen
- Requires: PROJ-2 (Standort & Radius) — Event-Standort nutzt Geocoding-Infrastruktur

## User Stories
- Als eingeloggter User möchte ich ein neues Event erstellen können, damit andere es entdecken können.
- Als Event-Ersteller möchte ich Titel, Beschreibung, Datum, Uhrzeit, Ort und Kategorie angeben, damit das Event vollständig beschrieben ist.
- Als Event-Ersteller möchte ich ein Bild hochladen können, damit das Event ansprechender wirkt.
- Als Event-Ersteller möchte ich mein eigenes Event bearbeiten können, um Änderungen (z.B. Zeitänderung) mitzuteilen.
- Als Event-Ersteller möchte ich mein Event löschen können, falls es abgesagt wird.

## Acceptance Criteria
- [ ] Eingeloggte User sehen einen "Event erstellen"-Button
- [ ] Pflichtfelder: Titel (5–100 Zeichen), Datum, Uhrzeit, Adresse/Ort
- [ ] Optionale Felder: Beschreibung (max. 1000 Zeichen), Bild, URL/Link, Kategorie
- [ ] Kategorien: Musik, Sport, Kunst & Kultur, Essen & Trinken, Community, Sonstiges
- [ ] Adresse wird per Geocoding in Koordinaten umgewandelt und auf Karte bestätigt
- [ ] Bildupload: max. 5 MB, Formate JPG/PNG/WebP
- [ ] Event kann nur in der Zukunft liegen (kein Datum in der Vergangenheit)
- [ ] Event-Ersteller kann eigenes Event jederzeit bearbeiten
- [ ] Event-Ersteller kann eigenes Event löschen (mit Bestätigungs-Dialog)
- [ ] Nach Erstellung wird User auf das neu erstellte Event weitergeleitet

## Edge Cases
- Adresse nicht gefunden beim Geocoding → User muss Adresse korrigieren oder Koordinaten manuell setzen
- Bild-Upload schlägt fehl (Netzwerk) → Fehlermeldung, Event kann trotzdem ohne Bild gespeichert werden
- User versucht Event in der Vergangenheit zu erstellen → Validierungsfehler
- Titel bereits sehr ähnlich zu einem anderen Event (gleicher Tag, gleicher Ort) → Warnung, kein harter Block
- Event wird bearbeitet während andere User es bereits gesehen haben → Bearbeitung erlaubt, kein Versionierungskonflikt
- User löscht Account → Alle Events des Users bleiben erhalten (anonymisiert als "Gelöschter User")

## Technical Requirements
- Bilder werden in Supabase Storage gespeichert
- Koordinaten als PostGIS GEOGRAPHY Typ gespeichert
- RLS: Nur Ersteller kann eigenes Event bearbeiten/löschen
- Soft-Delete für Events (deleted_at Timestamp, nicht physisch löschen)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Database
- Table: `public.events` with RLS enabled
- Coordinates: `double precision` lat/lng (consistent with profiles)
- Soft delete: `deleted_at timestamptz` — no physical DELETE
- `creator_id` → `auth.users(id) ON DELETE SET NULL` (events survive account deletion, shown as "Gelöschter User")

### RLS Policies
- **SELECT**: All authenticated users can read events where `deleted_at IS NULL`
- **INSERT**: `auth.uid() = creator_id`
- **UPDATE**: `auth.uid() = creator_id AND deleted_at IS NULL`
- No DELETE policy — soft delete via UPDATE

### API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | List events; optional `?lat=&lng=&radius=` filter |
| POST | `/api/events` | Create event |
| GET | `/api/events/[id]` | Get single event |
| PATCH | `/api/events/[id]` | Update event (creator only) |
| DELETE | `/api/events/[id]` | Soft delete (creator only) |

### Validation (Zod — `src/lib/events.ts`)
- `createEventSchema` — all required fields
- `updateEventSchema` — all fields partial, at least one required
- Radius filter: bounding-box pre-filter (SQL index) + Haversine post-filter (JS)

### Deferred
- Image upload (Supabase Storage) — next iteration

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
