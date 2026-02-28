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

**Tested:** 2026-02-28
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** Compiles successfully (Next.js production build passes, 15 routes)

---

### Acceptance Criteria Status

#### AC-1: Browser-Geolocation wird beim ersten Aufruf angefragt (mit erklaerender Meldung)
- [ ] BUG: Geolocation is NOT requested automatically on first visit. User must manually click "Meinen Standort verwenden" button.
- [ ] BUG: There is no explanatory message shown before the browser permission prompt. The spec requires "mit erklaerender Meldung".
- **Status: FAIL** (see BUG-1)

#### AC-2: Bei Ablehnung der GPS-Berechtigung wird automatisch zur manuellen Eingabe gewechselt
- [x] When GPS permission is denied, error message shows: "GPS-Berechtigung verweigert. Bitte Standort manuell eingeben."
- [x] Manual input section is always visible below GPS section, so user can immediately use it
- [x] When `navigator.geolocation` is unavailable, error shows: "GPS ist in diesem Browser nicht verfuegbar."
- **Status: PASS**

#### AC-3: Manuelle Eingabe per Stadt (Autocomplete) oder PLZ funktioniert
- [x] Search field with placeholder "Stadt oder PLZ eingeben..." exists
- [x] Autocomplete queries Nominatim after 500ms debounce
- [x] Results show city name with subtitle context
- [x] Selecting a result sets lat/lng/city
- [x] `encodeURIComponent` used to safely encode query for URL
- [x] `limit=5` constrains results
- **Status: PASS**

#### AC-4: Eingabe wird auf gueltige Orte validiert (kein Freitext-Missbrauch)
- [x] Only results from Nominatim geocoding API can be selected (no arbitrary text accepted as location)
- [x] User cannot type free text and save it directly -- the save button requires lat/lng to be set
- [ ] BUG: No server-side validation of location data. User can save arbitrary lat/lng/city values via Supabase client. (see BUG-5)
- **Status: PARTIAL PASS**

#### AC-5: Radius-Slider von 1-100 km mit Schritten (1, 5, 10, 25, 50, 100 km)
- [x] Radius options 1, 5, 10, 25, 50, 100 km are available
- [ ] BUG: Implementation uses a button grid instead of a Slider component as specified. The spec says "Radius-Slider" and tech design says "shadcn/ui Slider". (see BUG-2)
- [x] Selected radius is visually highlighted with `variant="default"` vs `variant="outline"`
- [x] `aria-pressed` attribute set for accessibility
- **Status: PARTIAL PASS** (functional but deviates from spec)

#### AC-6: Standardradius: 10 km
- [x] `useLocation` hook initializes `radiusKm: 10` as default
- [x] Database column `location_radius_km` falls back to 10 via `data.location_radius_km ?? 10`
- **Status: PASS**

#### AC-7: Einstellungen werden im User-Profil gespeichert (nicht nur Session)
- [x] `saveLocation` updates `profiles` table via Supabase with `location_lat`, `location_lng`, `location_city`, `location_radius_km`
- [x] `fetchLocation` reads from `profiles` table on mount
- [ ] BUG: No error handling on Supabase update response. If save fails, local state is updated anyway, showing incorrect data. (see BUG-3)
- [ ] BUG: No SQL migration files found for location columns. If columns do not exist in Supabase, feature silently fails. (see BUG-4)
- **Status: PARTIAL PASS**

#### AC-8: Standort + Radius werden sichtbar in der UI angezeigt
- [x] `LocationBadge` displays "City . Radius km" format (e.g., "Muenchen . 10 km")
- [x] If no city is set, shows "Standort setzen" as placeholder
- [x] Loading state shows Skeleton component
- [x] MapPin icon and ChevronDown indicator present
- **Status: PASS**

#### AC-9: Einstellungen koennen jederzeit ueber ein Icon/Button geaendert werden
- [x] `LocationBadge` is clickable and opens `LocationPickerSheet`
- [x] Badge is placed in dashboard header, always accessible
- [x] `aria-label="Standort aendern"` for accessibility
- **Status: PASS**

### Acceptance Criteria Summary: 5/9 PASSED, 1 FAILED, 3 PARTIAL PASS

---

### Edge Cases Status

#### EC-1: GPS nicht verfuegbar (Desktop ohne Location-Service)
- [x] `navigator.geolocation` availability is checked before calling
- [x] Error message "GPS ist in diesem Browser nicht verfuegbar" shown
- [x] Manual input section is always visible as fallback
- **Status: PASS**

#### EC-2: Ungueltige PLZ / Ort nicht gefunden
- [x] If Nominatim returns no results, dropdown simply does not appear
- [ ] BUG: No explicit error message shown to user when no results found. User types "xyzabc123" and gets no feedback. (see BUG-6)
- **Status: FAIL**

#### EC-3: User befindet sich ausserhalb Deutschlands
- [x] Nominatim search is not restricted to Germany (`countrycodes` parameter not set)
- [x] `Accept-Language: de` is set but does not limit results to Germany
- **Status: PASS**

#### EC-4: GPS-Koordinaten sehr ungenau (+/-500m)
- [x] No accuracy check on `pos.coords` -- coordinates are used as-is regardless of accuracy
- [x] This means inaccurate GPS still works without error
- **Status: PASS**

#### EC-5: User gibt Standort ein, ist aber nicht eingeloggt
- [ ] BUG: Spec requires "Standort wird in Session gespeichert, nach Login uebernommen". The implementation simply returns early (`if (!user) return;`) in `saveLocation`. No session/localStorage fallback exists. Non-logged-in users cannot save their location at all. (see BUG-7)
- **Status: FAIL**

### Edge Cases Summary: 3/5 PASSED, 2 FAILED

---

### Security Audit Results (Red Team Perspective)

#### Authentication
- [x] LocationBadge only renders on authenticated dashboard page (protected by middleware + server component)
- [x] `useLocation` hook checks `supabase.auth.getUser()` before reading/writing profile data
- [x] If no user, `saveLocation` returns early without writing

#### Authorization (IDOR / Data Access)
- [x] Profile read uses `.eq("id", user.id)` -- cannot read other users' location
- [x] Profile update uses `.eq("id", user.id)` -- cannot update other users' location
- [ ] BUG: Relies solely on client-side filtering. RLS policies must be verified in Supabase dashboard. No SQL migration files exist in the repo to verify RLS is correctly configured for the new columns. (see BUG-8)

#### Input Validation (Server-Side)
- [ ] BUG: No server-side validation. Location data goes directly from client to Supabase. An attacker with browser DevTools could craft arbitrary Supabase client calls to set `location_lat` to any value (e.g., 999999), `location_city` to a very long string, or `location_radius_km` to a negative number or extremely large value. (see BUG-5)

#### XSS
- [x] `location_city` is rendered via React JSX (auto-escaped), no `dangerouslySetInnerHTML`
- [x] Nominatim response `display_name` is rendered safely via React

#### External API Abuse (Nominatim)
- [x] 500ms debounce implemented to respect Nominatim rate limit (1 req/s)
- [ ] BUG: No request-level rate limiting beyond debounce. A malicious user could bypass the UI debounce and call Nominatim directly from DevTools rapidly, potentially getting the app's IP banned from Nominatim. However, since calls go directly from browser, this affects only the individual user's IP. (see BUG-9 -- Low severity)

#### Secrets Management
- [x] No new secrets introduced. Nominatim requires no API key.
- [x] Supabase credentials already managed via environment variables

#### Data Exposure
- [x] Location data in API responses only includes current user's profile
- [x] No endpoint leaks other users' location data

---

### Cross-Browser Testing (Code Review)

- [x] `navigator.geolocation` is a standard Web API supported in Chrome, Firefox, Safari
- [x] `fetch` API used for Nominatim calls -- universally supported
- [x] shadcn/ui components (Sheet, Button, Input, Alert) are cross-browser compatible
- [x] No browser-specific CSS or APIs used
- Note: Full manual testing in all three browsers requires running app in each. Code review shows no compatibility concerns.

### Responsive Testing (Code Review)

- [x] Sheet uses `w-full sm:max-w-md` -- full width on mobile, max 448px on tablet/desktop
- [x] LocationBadge uses compact `size="sm"` and `h-8` -- fits in mobile headers
- [x] Radius buttons use `grid grid-cols-3` -- 3 columns work well at 375px+
- [x] All inputs are `w-full` -- fills container width
- [x] `overflow-y-auto` on sheet content handles small viewports
- Note: Layout should work at 375px, 768px, and 1440px based on Tailwind responsive utilities.

---

### Bugs Found

#### BUG-1: GPS nicht automatisch beim ersten Aufruf angefragt
- **Severity:** Medium
- **Files:** `src/components/location/location-picker-sheet.tsx`, `src/components/location/location-badge.tsx`
- **Steps to Reproduce:**
  1. Log in and visit the dashboard for the first time
  2. Expected: Browser geolocation permission is requested automatically with an explanatory message
  3. Actual: Nothing happens. User must click the LocationBadge, then click "Meinen Standort verwenden"
- **Spec Requirement:** "Browser-Geolocation wird beim ersten Aufruf angefragt (mit erklaerender Meldung)"
- **Priority:** Fix before deployment

#### BUG-2: Radius uses button grid instead of Slider component
- **Severity:** Low
- **Files:** `src/components/location/location-picker-sheet.tsx` (lines 169-185)
- **Steps to Reproduce:**
  1. Open the location picker sheet
  2. Expected: A slider component for radius selection (as specified in AC-5 and tech design)
  3. Actual: A 3x2 grid of buttons with predefined values
- **Note:** Functionally equivalent since the spec defines fixed steps (1, 5, 10, 25, 50, 100 km). The slider component (`shadcn/ui slider`) is listed in tech design but was never installed (not in `src/components/ui/`). Button grid is arguably better UX for discrete steps.
- **Priority:** Nice to have (discuss with product whether spec should be updated)

#### BUG-3: saveLocation hat kein Error-Handling
- **Severity:** High
- **File:** `src/hooks/use-location.ts` (lines 55-75)
- **Steps to Reproduce:**
  1. Open location picker and select a location
  2. Simulate network error or Supabase outage (e.g., disable network in DevTools)
  3. Click "Standort speichern"
  4. Expected: Error message shown, location not updated in UI
  5. Actual: `setLocation(newLocation)` on line 74 runs regardless of whether Supabase update succeeded. UI shows the new location even though it was never saved to the database. On next page load, the old (or no) location reappears.
- **Additional issue:** `handleSave` in `location-picker-sheet.tsx` (line 95-106) also has no try/catch. If `onSave` throws, `isSaving` stays `true` forever and the sheet never closes.
- **Priority:** Fix before deployment

#### BUG-4: Keine SQL-Migrationsdateien fuer location-Spalten
- **Severity:** High
- **Steps to Reproduce:**
  1. Search project for SQL migration files: none found (`**/*.sql` returns 0 results)
  2. Expected: Migration file adding `location_lat`, `location_lng`, `location_city`, `location_radius_km` columns to `profiles` table
  3. Actual: No migration files exist. Developer must have added columns manually in Supabase dashboard.
- **Impact:** Feature cannot be reproduced in a fresh environment. New developers or CI/CD pipelines cannot set up the database schema. If columns do not exist in Supabase, all location operations silently fail (Supabase returns error but `saveLocation` does not check it -- see BUG-3).
- **Priority:** Fix before deployment

#### BUG-5: Keine serverseitige Validierung der Standortdaten
- **Severity:** Medium
- **File:** `src/hooks/use-location.ts` (lines 55-75)
- **Steps to Reproduce:**
  1. Open browser DevTools console on the dashboard page
  2. Create a Supabase client and call `profiles.update()` directly with:
     - `location_lat: 999999` (invalid latitude)
     - `location_city: "<script>alert('xss')</script>"` (XSS attempt)
     - `location_radius_km: -500` (negative radius)
  3. Expected: Server rejects invalid values
  4. Actual: Data is saved as-is to the profiles table (only RLS user-id check applies, not value validation)
- **Note:** XSS via `location_city` is mitigated by React's auto-escaping, but invalid coordinates and radius could break downstream features (PROJ-5 Discovery-Feed).
- **Priority:** Fix before deployment

#### BUG-6: Keine Fehlermeldung bei Suche ohne Ergebnisse
- **Severity:** Low
- **File:** `src/components/location/location-autocomplete.tsx`
- **Steps to Reproduce:**
  1. Open location picker and type "xyzabc123" in the search field
  2. Expected: Message like "Kein Ort gefunden" after search completes
  3. Actual: Search spinner appears, then disappears. No dropdown, no message. User gets no feedback.
- **Priority:** Fix in next sprint

#### BUG-7: Kein Session-Speicher fuer nicht eingeloggte User
- **Severity:** Medium
- **File:** `src/hooks/use-location.ts` (lines 29-31, 61-62)
- **Steps to Reproduce:**
  1. As specified edge case: User enters a location while not logged in
  2. Expected per spec: "Standort wird in Session gespeichert, nach Login uebernommen"
  3. Actual: `saveLocation` returns early with `if (!user) return;`. No localStorage or sessionStorage fallback exists. Location input is completely lost.
- **Note:** Currently the LocationBadge is only rendered on the authenticated dashboard, so non-logged-in users cannot reach it. But the spec explicitly requires this behavior, and future pages may show the LocationBadge before login.
- **Priority:** Fix before deployment (if non-auth pages will use LocationBadge) or update spec to remove this requirement

#### BUG-8: RLS-Policies fuer location-Spalten nicht verifizierbar
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Search project for RLS policy definitions: no SQL files found
  2. Expected: RLS policies documented or in migration files ensuring users can only read/write their own location data
  3. Actual: No SQL files exist in the repo. RLS policies may or may not be configured in Supabase dashboard.
- **Note:** The code uses `.eq("id", user.id)` which provides client-side filtering, but without RLS a malicious user could bypass this by crafting direct Supabase queries.
- **Priority:** Verify in Supabase dashboard and document in migration files

#### BUG-9: Nominatim-Aufrufe ohne serverseitiges Rate-Limiting
- **Severity:** Low
- **File:** `src/components/location/location-autocomplete.tsx`
- **Steps to Reproduce:**
  1. A malicious user could call Nominatim API directly from browser DevTools without the 500ms debounce
  2. Since calls go from the user's browser directly to Nominatim (not through backend), this only affects that user's IP
- **Impact:** Low -- only the individual abuser gets blocked by Nominatim
- **Priority:** Nice to have

#### BUG-10: Latitude/Longitude 0 wird faelschlicherweise als falsy abgelehnt
- **Severity:** Low
- **File:** `src/components/location/location-picker-sheet.tsx` (lines 96, 201)
- **Steps to Reproduce:**
  1. Set location to latitude 0, longitude 0 (Gulf of Guinea, valid coordinates)
  2. `handleSave` checks `if (!selectedLat || !selectedLng) return;`
  3. Expected: Location (0, 0) can be saved
  4. Actual: Falsy check rejects `0` values. Save button is disabled.
- **Impact:** Very unlikely real-world scenario but indicates a code quality issue with falsy vs null checks.
- **Priority:** Nice to have

#### BUG-11: Keine Keyboard-Navigation in Autocomplete-Dropdown
- **Severity:** Low
- **File:** `src/components/location/location-autocomplete.tsx`
- **Steps to Reproduce:**
  1. Type a city name in the search field
  2. Try to navigate results with arrow keys or select with Enter
  3. Expected: Keyboard navigation works (standard autocomplete behavior, WCAG requirement)
  4. Actual: No keyboard event handlers. Only mouse click/tap works.
- **Note:** `role="listbox"` and `role="option"` are set but without keyboard handlers they are incomplete ARIA implementations.
- **Priority:** Fix in next sprint (accessibility)

---

### Regression Testing (PROJ-1: User Authentication)

- [x] Dashboard page still loads with user email and display name
- [x] LocationBadge added to header does not break existing layout
- [x] Logout button still functional
- [x] Delete account dialog still present
- [x] Build compiles without errors (all 15 routes)
- **Status: No regressions found**

---

### Summary

| Category | Result |
|----------|--------|
| **Acceptance Criteria** | 5/9 PASSED, 1 FAILED, 3 PARTIAL |
| **Edge Cases** | 3/5 PASSED, 2 FAILED |
| **Bugs Found** | 11 total (0 Critical, 2 High, 4 Medium, 5 Low) |
| **Security Audit** | 2 issues (no server-side validation, RLS unverifiable) |
| **Regression (PROJ-1)** | No regressions |
| **Build** | Compiles successfully |

### Production Ready: NO

**Reason:** 2 High-severity and 4 Medium-severity bugs must be addressed:
- BUG-3 (High): No error handling in saveLocation -- UI shows unsaved data
- BUG-4 (High): No SQL migration files -- feature not reproducible
- BUG-1 (Medium): GPS not requested automatically on first visit (spec violation)
- BUG-5 (Medium): No server-side validation of location data
- BUG-7 (Medium): No session storage for non-logged-in users (spec violation)
- BUG-8 (Medium): RLS policies not verifiable from repo

### Recommended Fix Priority:
1. BUG-3 + BUG-4 (High) -- Fix first
2. BUG-5 + BUG-8 (Medium/Security) -- Fix second
3. BUG-1 + BUG-7 (Medium/Spec) -- Discuss with product whether spec should be updated or code should be changed
4. BUG-6 + BUG-11 (Low/UX) -- Fix in next sprint
5. BUG-2 + BUG-9 + BUG-10 (Low) -- Nice to have

## Deployment
_To be added by /deploy_
