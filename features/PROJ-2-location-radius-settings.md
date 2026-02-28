# PROJ-2: Standort & Radius-Einstellung

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) — Standort-Präferenzen werden pro Account gespeichert

## User Stories
- Als User möchte ich meinen Standort automatisch per GPS ermitteln lassen, damit ich sofort relevante Inhalte in meiner Nähe sehe.
- Als User möchte ich meinen Standort manuell als Stadt oder PLZ eingeben können, falls ich kein GPS erlauben möchte.
- Als User möchte ich den Suchradius (1–100 km) selbst einstellen können, damit ich die Reichweite der Ergebnisse kontrolliere.
- Als User möchte ich meinen zuletzt genutzten Standort gespeichert haben, damit ich ihn beim nächsten Besuch nicht erneut eingeben muss.
- Als User möchte ich den Standort jederzeit ändern können, um auch andere Städte zu erkunden.

## Acceptance Criteria
- [ ] Browser-Geolocation wird beim ersten Aufruf angefragt (mit erklärender Meldung)
- [ ] Bei Ablehnung der GPS-Berechtigung wird automatisch zur manuellen Eingabe gewechselt
- [ ] Manuelle Eingabe per Stadt (Autocomplete) oder PLZ funktioniert
- [ ] Eingabe wird auf gültige Orte validiert (kein Freitext-Missbrauch)
- [ ] Radius-Slider von 1–100 km mit Schritten (1, 5, 10, 25, 50, 100 km)
- [ ] Standardradius: 10 km
- [ ] Einstellungen werden im User-Profil gespeichert (nicht nur Session)
- [ ] Standort + Radius werden sichtbar in der UI angezeigt (z.B. "München • 10 km")
- [ ] Einstellungen können jederzeit über ein Icon/Button geändert werden

## Edge Cases
- GPS nicht verfügbar (z.B. Desktop ohne Location-Service) → Graceful Fallback auf manuelle Eingabe
- Ungültige PLZ / Ort nicht gefunden → Klare Fehlermeldung
- User befindet sich außerhalb Deutschlands → Internationale Orte werden unterstützt
- GPS-Koordinaten sehr ungenau (±500m) → Trotzdem verwendbar, kein Fehler
- User gibt Standort ein, ist aber nicht eingeloggt → Standort wird in Session gespeichert, nach Login übernommen

## Technical Requirements
- Browser Geolocation API (navigator.geolocation)
- Geocoding-API für Stadt/PLZ → Koordinaten (z.B. OpenStreetMap Nominatim, kostenlos)
- Reverse Geocoding für GPS-Koordinaten → Lesbare Ortsbezeichnung
- Haversine-Formel oder PostGIS für Radius-Berechnung in der Datenbank

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
**Erstellt:** 2026-02-28

### Komponenten-Struktur

```
Dashboard / Jede App-Seite (künftig)
+-- LocationBadge (Header-Bereich)
|   Zeigt: "München • 10 km" | Klick öffnet das Sheet
|
+-- LocationPickerSheet (öffnet sich seitlich)
    |
    +-- GPS-Abschnitt
    |   +-- Button "Meinen Standort ermitteln"
    |   +-- Lade-Indikator (während GPS ermittelt)
    |   +-- Fehlermeldung (falls GPS abgelehnt)
    |
    +-- Manuelle Eingabe
    |   +-- Suchfeld (Stadt oder PLZ)
    |   +-- Autocomplete-Liste (Ergebnisse von Nominatim)
    |
    +-- Radius-Abschnitt
    |   +-- Slider (1–100 km, Schritte: 1, 5, 10, 25, 50, 100)
    |   +-- Anzeige "10 km"
    |
    +-- Aktueller Standort (Vorschau: "München, Bayern")
    +-- Speichern-Button
```

### Datenmodell

Erweiterung der bestehenden `profiles`-Tabelle (keine neue Tabelle):

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `location_lat` | Dezimalzahl | Breitengrad (z.B. 48.1374) |
| `location_lng` | Dezimalzahl | Längengrad (z.B. 11.5755) |
| `location_city` | Text | Anzeigename (z.B. "München") |
| `location_radius_km` | Ganzzahl | Suchradius, Standard: 10 |

### Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Geocoding API | OpenStreetMap Nominatim | Kostenlos, kein API-Key, für Hobby-Projekt ideal |
| Nominatim-Aufruf | Direkt vom Browser | Kein Backend-Proxy nötig — Nominatim erlaubt Browser-Requests |
| Debounce bei Suche | 500ms Verzögerung | Hält das Nutzungslimit (1 req/s) ein |
| Datenspeicherung | Supabase direkt vom Client | RLS schützt Daten — kein API-Route-Umweg nötig |
| Slider | shadcn/ui Slider | Passt ins bestehende Design-System |
| Datenbank-Radius | PostGIS Extension | Wird aktiviert für Radius-Suche im Discovery-Feed (PROJ-5) |

### Datenfluss

```
User klickt "GPS ermitteln"
  → Browser fragt Erlaubnis
  → GPS-Koordinaten → Nominatim Reverse Geocoding
  → Stadtname wird angezeigt

User tippt "Mün..." in Suchfeld
  → 500ms warten (Debounce)
  → Nominatim-Suche → 5 Vorschläge
  → User wählt → Koordinaten gespeichert

User klickt "Speichern"
  → Supabase profiles-Tabelle wird aktualisiert
  → LocationBadge zeigt "München • 10 km"
```

### Neue Dateien

```
src/components/location/
  location-picker-sheet.tsx    Das Sheet mit GPS + Suche + Slider
  location-badge.tsx           Anzeige "München • 10 km"
  location-autocomplete.tsx    Suchfeld mit Nominatim-Ergebnissen
```

### Pakete / Abhängigkeiten

| Paket | Zweck |
|-------|-------|
| `shadcn/ui slider` | Radius-Slider-Komponente (via `npx shadcn@latest add slider`) |

Kein weiteres npm-Paket nötig — Nominatim ist REST-API, Browser Geolocation ist nativ.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
