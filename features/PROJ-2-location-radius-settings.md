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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
