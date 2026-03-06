# PROJ-2: Standort & Radius-Einstellung

## Status: In Review
**Created:** 2026-02-22
**Last Updated:** 2026-03-01

## Dependencies
- Requires: PROJ-1 (User Authentication) — Standort-Präferenzen werden pro Account gespeichert

## User Stories
- Als User möchte ich meinen Standort automatisch per GPS ermitteln lassen, damit ich sofort relevante Inhalte in meiner Nähe sehe.
- Als User möchte ich meinen Standort manuell als Stadt oder PLZ eingeben können, falls ich kein GPS erlauben möchte.
- Als User möchte ich den Suchradius (100m–100km) selbst einstellen können, damit ich die Reichweite der Ergebnisse kontrolliere.
- Als User möchte ich meinen zuletzt genutzten Standort gespeichert haben, damit ich ihn beim nächsten Besuch nicht erneut eingeben muss.
- Als User möchte ich den Standort jederzeit ändern können, um auch andere Städte zu erkunden.

## Acceptance Criteria
- [ ] Browser-Geolocation wird beim ersten Aufruf angefragt (mit erklärender Meldung)
- [ ] Bei Ablehnung der GPS-Berechtigung wird automatisch zur manuellen Eingabe gewechselt
- [ ] Manuelle Eingabe per Stadt (Autocomplete) oder PLZ funktioniert
- [ ] Eingabe wird auf gültige Orte validiert (kein Freitext-Missbrauch)
- [ ] Radius-Auswahl mit Schritten: 100m, 250m, 500m, 1 km, 5 km, 20 km, 100 km
- [ ] Standardradius: 1 km
- [ ] Einstellungen werden im User-Profil gespeichert (nicht nur Session)
- [ ] Standort + Radius werden sichtbar in der UI angezeigt (z.B. "München • 1 km" oder "München • 250m")
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

## QA Test Results (Re-Test Round 2)

**Tested:** 2026-03-01
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** Compiles successfully (Next.js production build passes, 16 routes)
**Previous QA Round:** 2026-02-28 (11 bugs found, 2 High / 4 Medium / 5 Low)

---

### Bugs Fixed Since Last QA Round

| Bug | Status | Verification |
|-----|--------|-------------|
| BUG-3 (High): saveLocation no error handling | FIXED | `saveLocation` now throws on Supabase error (line 74-76 in use-location.ts). `handleSave` in location-picker-sheet.tsx has try/catch/finally (lines 110-127). Error message shown to user. |
| BUG-4 (High): No SQL migration files | FIXED | Two migration files now exist: `20260228000001_add_location_to_profiles.sql` and `20260301000001_change_location_radius_to_numeric.sql`. |
| BUG-10 (Low): Lat/Lng 0 rejected as falsy | FIXED | `handleSave` now uses `selectedLat === null || selectedLng === null` instead of `!selectedLat || !selectedLng` (line 111). Save button disabled check also uses `=== null` (line 231). |

---

### New Issues Introduced Since Last QA Round

The following changes introduced new deviations from the spec:

#### NEW-BUG-1: Radius-Optionen weichen stark von Spec ab
- **Severity:** Medium
- **Files:** `src/components/location/location-picker-sheet.tsx` (line 27), `src/components/auth/dashboard-content.tsx` (line 36)
- **Steps to Reproduce:**
  1. Open the location picker sheet or look at the radius toolbar on the dashboard
  2. Expected per spec (AC-5): Radius steps of 1, 5, 10, 25, 50, 100 km
  3. Actual: Radius options are `[0.1, 0.25, 0.5, 1, 5, 20, 100]` (100m, 250m, 500m, 1km, 5km, 20km, 100km)
  4. Steps 10, 25, 50 km are missing. Steps 0.1, 0.25, 0.5, 20 km were added without spec update.
- **Note:** Sub-km options are a nice feature addition, but the spec was not updated to reflect this. Missing 10/25/50 km options limit usability for broader searches.
- **Priority:** Update spec to match implementation, or restore missing values

#### NEW-BUG-2: Standardradius ist 1 km statt 10 km (AC-6 Verletzung)
- **Severity:** Medium
- **Files:** `src/hooks/use-location.ts` (line 18, line 45), `supabase/migrations/20260301000001_change_location_radius_to_numeric.sql` (line 8)
- **Steps to Reproduce:**
  1. Log in as a new user who has never set a location
  2. Expected per spec (AC-6): Default radius is 10 km
  3. Actual: Default radius is 1 km. The `useLocation` hook initializes `radiusKm: 1` (line 18). The fallback is `data.location_radius_km ?? 1` (line 45). The SQL migration changes the DB default to 1 (line 8).
- **Spec Requirement:** "Standardradius: 10 km"
- **Priority:** Fix before deployment or update spec

#### NEW-BUG-3: Leaflet Marker-Icons von externem CDN (unpkg.com)
- **Severity:** Medium (Security/Reliability)
- **File:** `src/components/location/location-map.tsx` (lines 9-16)
- **Steps to Reproduce:**
  1. Open the dashboard with a location set
  2. Map loads and marker icon is fetched from `https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png`
  3. If unpkg.com is down or blocked (e.g., corporate firewall), the marker icon fails to load
- **Security concern:** Loading assets from third-party CDN (unpkg.com) introduces a supply-chain risk. If unpkg.com were compromised, arbitrary content could be served. The Leaflet CSS (`leaflet/dist/leaflet.css`) is correctly bundled locally, but marker images are not.
- **Recommendation:** Bundle marker icon images locally in `/public/` directory
- **Priority:** Fix before deployment

#### NEW-BUG-4: Duplikation von RADIUS_OPTIONS und formatRadius
- **Severity:** Low (Code quality)
- **Files:** `src/components/location/location-picker-sheet.tsx` (lines 27-32), `src/components/auth/dashboard-content.tsx` (lines 36-41)
- **Description:** `RADIUS_OPTIONS` array and `formatRadius` function are defined identically in two files. If one is updated without the other, the picker sheet and dashboard toolbar will show different radius options.
- **Priority:** Fix in next sprint (extract to shared constant)

#### NEW-BUG-5: Radius-Toolbar speichert direkt ohne Bestaetigung
- **Severity:** Low (UX)
- **File:** `src/components/auth/dashboard-content.tsx` (lines 85-93)
- **Description:** Clicking a radius button in the dashboard toolbar immediately calls `saveLocation` to Supabase. No confirmation, no undo. Accidental clicks save immediately. The picker sheet at least requires clicking "Standort speichern".
- **Priority:** Nice to have (consider debounce or undo)

#### NEW-BUG-6: Impressum-Seite nicht in Middleware Public Routes
- **Severity:** Medium (Regression on PROJ-1 area)
- **File:** `src/lib/supabase/middleware.ts` (line 41)
- **Steps to Reproduce:**
  1. Log out of the application
  2. Navigate directly to `/impressum`
  3. Expected: Impressum page loads (legal requirement -- Impressum must be publicly accessible under German TMG law)
  4. Actual: Middleware redirects to `/login` because `/impressum` is not in `publicRoutes` array
- **Legal concern:** Under German TMG Section 5, the Impressum must be easily accessible from every page, including for non-authenticated users
- **Priority:** Fix before deployment (legal requirement)

---

### Acceptance Criteria Status (Re-Test)

#### AC-1: Browser-Geolocation wird beim ersten Aufruf angefragt (mit erklaerender Meldung)
- [ ] BUG: Still NOT fixed. Geolocation is NOT requested automatically on first visit. User must manually click LocationBadge, then click "Meinen Standort verwenden".
- [ ] BUG: Still no explanatory message before the browser permission prompt.
- **Status: FAIL** (same as previous round -- BUG-1 still open)

#### AC-2: Bei Ablehnung der GPS-Berechtigung wird automatisch zur manuellen Eingabe gewechselt
- [x] GPS denial shows: "GPS-Berechtigung verweigert. Bitte Standort manuell eingeben."
- [x] Manual input always visible below GPS section
- [x] `navigator.geolocation` unavailable shows: "GPS ist in diesem Browser nicht verfuegbar."
- **Status: PASS**

#### AC-3: Manuelle Eingabe per Stadt (Autocomplete) oder PLZ funktioniert
- [x] Search field with placeholder "Stadt oder PLZ eingeben..."
- [x] 500ms debounce before Nominatim query
- [x] Results show city name with subtitle context
- [x] Selecting a result sets lat/lng/city
- [x] `encodeURIComponent` used for safe URL encoding
- [x] `limit=5` constrains results
- **Status: PASS**

#### AC-4: Eingabe wird auf gueltige Orte validiert (kein Freitext-Missbrauch)
- [x] Only Nominatim results can be selected as locations
- [x] Save button requires lat/lng to be set (cannot save arbitrary text)
- [ ] BUG: Still no server-side validation. (BUG-5 still open)
- **Status: PARTIAL PASS**

#### AC-5: Radius-Slider von 1-100 km mit Schritten (1, 5, 10, 25, 50, 100 km)
- [ ] BUG: Radius options changed to [0.1, 0.25, 0.5, 1, 5, 20, 100] -- missing 10, 25, 50 km from spec. (see NEW-BUG-1)
- [ ] BUG: Still uses button grid instead of slider component. (BUG-2 still open)
- [x] Selected radius visually highlighted
- [x] `aria-pressed` set for accessibility
- **Status: FAIL** (spec deviation worsened since last round)

#### AC-6: Standardradius: 10 km
- [ ] BUG: Default radius changed from 10 km to 1 km. Hook initializes `radiusKm: 1`, DB default is 1. (see NEW-BUG-2)
- **Status: FAIL** (was PASS in previous round -- regression)

#### AC-7: Einstellungen werden im User-Profil gespeichert (nicht nur Session)
- [x] `saveLocation` updates profiles table with all location fields
- [x] `fetchLocation` reads from profiles table on mount
- [x] FIXED: Error handling now works -- `saveLocation` throws on Supabase error, `handleSave` catches and shows error message (BUG-3 fixed)
- [x] FIXED: SQL migration files now exist (BUG-4 fixed)
- **Status: PASS** (improved from PARTIAL PASS)

#### AC-8: Standort + Radius werden sichtbar in der UI angezeigt
- [x] LocationBadge displays "City . Radius" format with sub-km support (e.g., "100m" for 0.1 km)
- [x] "Standort setzen" placeholder when no city set
- [x] Loading state shows Skeleton
- [x] MapPin icon and ChevronDown present
- [x] NEW: Interactive map preview in picker sheet shows location and radius circle
- [x] NEW: Full-page map on dashboard when location is set
- **Status: PASS**

#### AC-9: Einstellungen koennen jederzeit ueber ein Icon/Button geaendert werden
- [x] LocationBadge clickable, opens LocationPickerSheet
- [x] Badge in dashboard header, always accessible
- [x] `aria-label="Standort aendern"` set
- [x] NEW: Radius toolbar on dashboard allows quick radius changes without opening sheet
- **Status: PASS**

### Acceptance Criteria Summary: 5/9 PASSED, 2 FAILED, 2 PARTIAL PASS

Note: AC-6 regressed from PASS to FAIL. AC-5 worsened from PARTIAL PASS to FAIL.

---

### Edge Cases Status (Re-Test)

#### EC-1: GPS nicht verfuegbar (Desktop ohne Location-Service)
- [x] `navigator.geolocation` check present
- [x] Error message shown
- [x] Manual input as fallback
- **Status: PASS**

#### EC-2: Ungueltige PLZ / Ort nicht gefunden
- [ ] BUG: Still no "Kein Ort gefunden" message. (BUG-6 still open)
- **Status: FAIL**

#### EC-3: User befindet sich ausserhalb Deutschlands
- [x] No country restriction on Nominatim search
- **Status: PASS**

#### EC-4: GPS-Koordinaten sehr ungenau (+/-500m)
- [x] No accuracy check -- coordinates used as-is
- **Status: PASS**

#### EC-5: User gibt Standort ein, ist aber nicht eingeloggt
- [ ] BUG: Still no session/localStorage fallback. (BUG-7 still open)
- **Status: FAIL**

### Edge Cases Summary: 3/5 PASSED, 2 FAILED

---

### Security Audit Results (Red Team Perspective)

#### Authentication
- [x] Dashboard protected by server component auth check + middleware redirect
- [x] `useLocation` checks `supabase.auth.getUser()` before DB operations
- [x] `saveLocation` returns early without writing if no user

#### Authorization (IDOR / Data Access)
- [x] Profile read uses `.eq("id", user.id)`
- [x] Profile update uses `.eq("id", user.id)`
- [ ] BUG: RLS policies still not documented in migration files. (BUG-8 still open)

#### Input Validation (Server-Side)
- [ ] BUG: Still no server-side validation of location data. (BUG-5 still open)
- [ ] BUG: New `numeric(6,3)` column type for radius provides some implicit validation (max 999.999), but no CHECK constraint for valid range. Negative values still accepted by DB.

#### XSS
- [x] All user data rendered via React JSX (auto-escaped)
- [x] No `dangerouslySetInnerHTML` usage

#### Supply Chain / Third-Party Dependencies
- [ ] BUG: Marker icons loaded from external CDN (unpkg.com). (see NEW-BUG-3)
- [x] Leaflet CSS bundled locally (correct)
- [x] OpenStreetMap tiles loaded over HTTPS

#### Secrets Management
- [x] No new secrets introduced
- [x] Nominatim requires no API key

#### Data Exposure
- [x] Location data only accessible for current user's profile
- [x] No endpoint leaks other users' locations

---

### Cross-Browser Testing (Code Review)

- [x] `navigator.geolocation` supported in Chrome, Firefox, Safari
- [x] `fetch` API universally supported
- [x] shadcn/ui components cross-browser compatible
- [x] Leaflet/react-leaflet cross-browser compatible (uses standard DOM APIs)
- [x] `dynamic(() => import(...), { ssr: false })` correctly prevents Leaflet SSR issues
- [x] No browser-specific CSS or APIs used

### Responsive Testing (Code Review)

- [x] Sheet uses `w-full sm:max-w-md` -- full width on mobile
- [x] LocationBadge compact `size="sm"` and `h-8`
- [x] Radius buttons in sheet use `grid grid-cols-4` -- 4 columns may be tight at 375px with 7 options
- [x] Dashboard radius toolbar uses `overflow-x-auto` -- scrollable on small screens
- [x] Map uses `h-full w-full` -- fills available viewport
- [ ] BUG: Dashboard header uses `bg-white` hardcoded instead of `bg-background`. In dark mode (if added later), header would remain white. (cosmetic, noted for future)
- [x] LocationMap with `h-48` in sheet is reasonable for small viewports

---

### All Open Bugs (Consolidated)

#### From Previous Round (Still Open)

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| BUG-1 | GPS nicht automatisch beim ersten Aufruf angefragt | Medium | Still open |
| BUG-2 | Radius uses button grid instead of Slider | Low | Still open (spec deviation) |
| BUG-5 | Keine serverseitige Validierung der Standortdaten | Medium | Still open |
| BUG-6 | Keine Fehlermeldung bei Suche ohne Ergebnisse | Low | Still open |
| BUG-7 | Kein Session-Speicher fuer nicht eingeloggte User | Medium | Still open |
| BUG-8 | RLS-Policies nicht verifizierbar | Medium | Still open |
| BUG-9 | Nominatim-Aufrufe ohne serverseitiges Rate-Limiting | Low | Still open |
| BUG-11 | Keine Keyboard-Navigation in Autocomplete | Low | Still open |

#### New Bugs Found This Round

| ID | Title | Severity | Priority |
|----|-------|----------|----------|
| NEW-BUG-1 | Radius-Optionen weichen stark von Spec ab (missing 10/25/50 km) | Medium | Fix before deployment or update spec |
| NEW-BUG-2 | Standardradius 1 km statt 10 km (AC-6 regression) | Medium | Fix before deployment |
| NEW-BUG-3 | Leaflet Marker-Icons von externem CDN (unpkg.com) | Medium | Fix before deployment |
| NEW-BUG-4 | Duplikation von RADIUS_OPTIONS und formatRadius | Low | Fix in next sprint |
| NEW-BUG-5 | Radius-Toolbar speichert direkt ohne Bestaetigung | Low | Nice to have |
| NEW-BUG-6 | Impressum-Seite nicht in Middleware Public Routes | Medium | Fix before deployment (legal) |

#### Fixed Bugs (Verified)

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| BUG-3 | saveLocation kein Error-Handling | High | FIXED and verified |
| BUG-4 | Keine SQL-Migrationsdateien | High | FIXED and verified |
| BUG-10 | Lat/Lng 0 falsy-Ablehnung | Low | FIXED and verified |

---

### Regression Testing (PROJ-1: User Authentication)

- [x] Dashboard page loads with user email and display name
- [x] LocationBadge in header does not break existing layout
- [x] Logout button functional (via dropdown menu)
- [x] Delete account dialog present and functional
- [x] Build compiles without errors (16 routes, up from 15)
- [ ] BUG: `/impressum` not accessible without authentication (NEW-BUG-6)
- **Status: 1 regression found (Impressum route)**

---

### Summary

| Category | Result | Change vs Previous |
|----------|--------|-------------------|
| **Acceptance Criteria** | 5/9 PASSED, 2 FAILED, 2 PARTIAL | Worse (AC-5 and AC-6 regressed) |
| **Edge Cases** | 3/5 PASSED, 2 FAILED | Same |
| **Bugs Fixed** | 3 (2 High, 1 Low) | Improvement |
| **Bugs Still Open** | 8 from previous round | Still open |
| **New Bugs Found** | 6 (4 Medium, 2 Low) | New issues introduced |
| **Total Open Bugs** | 14 (0 Critical, 0 High, 8 Medium, 6 Low) | Was 11, now 14 |
| **Security Audit** | 3 issues (no validation, RLS unverifiable, CDN dependency) | Worse (+1) |
| **Regression (PROJ-1)** | 1 regression (Impressum) | Worse |
| **Build** | Compiles successfully | Same |

### Production Ready: NO

**Reason:** 8 Medium-severity bugs remain, including spec regressions and a legal issue:

**Must fix before deployment:**
1. NEW-BUG-2 (Medium): Default radius changed to 1 km -- AC-6 regression
2. NEW-BUG-6 (Medium): Impressum not publicly accessible -- German TMG legal requirement
3. NEW-BUG-3 (Medium): External CDN dependency for marker icons -- security/reliability risk
4. BUG-5 (Medium): No server-side validation of location data
5. BUG-8 (Medium): RLS policies not verifiable from repo

**Discuss with product (spec vs implementation):**
6. NEW-BUG-1 (Medium): Radius options deviate from spec (missing 10/25/50 km)
7. BUG-1 (Medium): GPS not requested automatically on first visit
8. BUG-7 (Medium): No session storage for non-logged-in users

**Fix in next sprint:**
9. BUG-6 (Low): No feedback when search returns no results
10. BUG-11 (Low): No keyboard navigation in autocomplete
11. NEW-BUG-4 (Low): Duplicated RADIUS_OPTIONS and formatRadius

**Nice to have:**
12. BUG-2 (Low): Button grid vs slider (spec deviation)
13. BUG-9 (Low): Nominatim rate limiting bypass
14. NEW-BUG-5 (Low): Radius toolbar saves without confirmation

## QA Test Results (Re-Test Round 3 -- Mobile Layout & Dashboard Overhaul)

**Tested:** 2026-03-06
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** Compiles successfully (Next.js production build passes, 18 routes)
**Previous QA Round:** 2026-03-01 (Round 2, 14 open bugs)
**Scope:** Last commit `dd8fe28` ("mobile setup implemented") and related recent commits that overhauled the dashboard layout (event list panel, location side panel, mobile responsive stacking)

---

### Changes Since Last QA Round (Summary)

The dashboard underwent a major redesign across the last ~5 commits:

1. **Layout overhaul:** Replaced full-screen map + header LocationBadge + radius toolbar with a two-panel layout: left panel (event list) + right panel (LocationSidePanel with map, GPS, search, radius).
2. **Event list integration:** Dashboard now fetches and displays nearby events via `/api/events` with location-based filtering.
3. **Event selection:** Clicking an EventCard highlights it and shows a red cross marker on the map.
4. **Mobile responsive (last commit):** Panels stack vertically on mobile (`flex-col`), go side-by-side on `md+` (`md:flex-row`).
5. **Code cleanup:** Removed `LocationBadge` import, removed radius toolbar, extracted `RADIUS_OPTIONS`/`formatRadius` to shared `src/lib/location.ts`.
6. **Marker icons bundled locally** in `/public/leaflet/` (no longer from unpkg.com CDN).
7. **Impressum added to middleware public routes.**

---

### Bugs Fixed Since Last QA Round

| Bug | Status | Verification |
|-----|--------|-------------|
| NEW-BUG-3 (Medium): Leaflet Marker-Icons von externem CDN | FIXED | `location-map.tsx` now uses `/leaflet/marker-icon.png` etc. from `/public/leaflet/`. Three icon files verified present in repo. |
| NEW-BUG-4 (Low): Duplikation RADIUS_OPTIONS / formatRadius | FIXED | Both `location-picker-sheet.tsx` and `location-side-panel.tsx` now import from `@/lib/location`. Dashboard no longer has its own copy. |
| NEW-BUG-5 (Low): Radius-Toolbar speichert direkt ohne Bestaetigung | FIXED (removed) | The radius toolbar was removed entirely from the dashboard. Radius changes are now only possible in the LocationSidePanel, which has a "Standort speichern" button. |
| NEW-BUG-6 (Medium): Impressum nicht in Public Routes | FIXED | `middleware.ts` line 41: `publicRoutes` array now includes `"/impressum"`. |

---

### New Issues Found This Round

#### R3-BUG-1: "Lege rechts deinen Standort fest" text incorrect on mobile
- **Severity:** Low (UX)
- **File:** `src/components/auth/dashboard-content.tsx` (line 206)
- **Steps to Reproduce:**
  1. Open the dashboard on a mobile viewport (375px) without a location set
  2. The empty state message says "Lege rechts deinen Standort fest"
  3. On mobile the location panel is below (not to the right), making this instruction misleading
  4. Expected: Contextual text like "Lege unten deinen Standort fest" on mobile, or a viewport-agnostic instruction
- **Priority:** Fix in next sprint

#### R3-BUG-2: LocationBadge component is now dead code
- **Severity:** Low (Code quality)
- **File:** `src/components/location/location-badge.tsx`
- **Description:** The `LocationBadge` component is no longer imported or used anywhere in the codebase. The only reference is the file itself. This is dead code that should be removed to avoid confusion.
- **Priority:** Nice to have (cleanup)

#### R3-BUG-3: Mobile panel height distribution not explicitly controlled
- **Severity:** Medium (UX / Responsive)
- **File:** `src/components/auth/dashboard-content.tsx` (lines 166-272)
- **Steps to Reproduce:**
  1. Open dashboard on mobile (375px) with a location set and events loaded
  2. The layout uses `flex-col` with the event list panel having `flex-1` and the location panel having `shrink-0`
  3. The location side panel has no explicit height constraint on mobile. With `shrink-0` + `flex flex-col`, the side panel will take its natural content height (GPS section + search + map + radius buttons + save button = approximately 600-700px)
  4. This can push the event list to a very small area, or the location panel may extend beyond the viewport requiring the user to scroll the entire page
  5. On a 667px viewport (iPhone SE minus header), the events panel gets very little space
- **Expected:** On mobile, either: (a) the location panel is collapsible/in a sheet, (b) explicit height split (e.g., 50/50), or (c) the side panel scrolls within a constrained area
- **Priority:** Fix before deployment -- core mobile usability issue

#### R3-BUG-4: Events not re-fetched after saving new location in side panel
- **Severity:** Medium (Functional)
- **File:** `src/components/auth/dashboard-content.tsx`
- **Steps to Reproduce:**
  1. Open dashboard with location "Berlin" set, showing Berlin events
  2. In the LocationSidePanel, search for "Munich", click save
  3. The `useLocation` hook updates `location` state, which triggers the `useEffect` -> `fetchEvents` via the `useCallback` dependency on `location.lat, location.lng, location.radiusKm`
  4. This should work correctly due to React reactivity. HOWEVER: the `saveLocation` function in `useLocation` updates local state optimistically, but the Supabase write is async. If there is a network delay or error, the events list may briefly show events for the new location then revert.
  5. Verified: The `saveLocation` in `useLocation` does `setLocation(newData)` before the Supabase call, then the side panel catches errors. But the dashboard's `fetchEvents` fires on the optimistic state, not the confirmed state.
- **Actual risk:** Low in practice since the optimistic update is reasonable UX. But if the save fails, the dashboard shows events for a location that was not actually saved.
- **Priority:** Fix in next sprint (add rollback on save failure)

#### R3-BUG-5: No loading indicator when events are re-fetching after location change
- **Severity:** Low (UX)
- **File:** `src/components/auth/dashboard-content.tsx`
- **Description:** When the user changes radius or location, the events list shows the old events until the new fetch completes. There is no visual indicator that events are being refreshed (no spinner overlay, no fade). The `eventsLoading` skeleton only shows on initial load, because the skeleton replaces the entire list. During a re-fetch, the old list remains visible.
- **Priority:** Nice to have

#### R3-BUG-6: Events API has no Zod validation on query parameters
- **Severity:** Medium (Security)
- **File:** `src/app/api/events/route.ts` (lines 13-18)
- **Steps to Reproduce:**
  1. Call `GET /api/events?lat=abc&lng=xyz&radius=-999&limit=999999`
  2. `parseFloat("abc")` returns `NaN`, `parseInt("999999")` is clamped to 100 by `Math.min`. But `radius=-999` passes the `!isNaN(radius)` check and `radius > 0` filters it out. No error returned to client for invalid inputs.
  3. The `limit` is clamped but the `offset` has no upper bound -- `offset=999999999` would skip all rows (no error, just empty result)
  4. Per backend rules: "Validate all inputs using Zod schemas before processing"
- **Priority:** Fix before deployment (backend rule violation)

---

### Acceptance Criteria Status (Re-Test Round 3)

#### AC-1: Browser-Geolocation wird beim ersten Aufruf angefragt (mit erklaerender Meldung)
- [ ] BUG: Still NOT fixed. User must manually click "Meinen Standort verwenden" in the side panel.
- [ ] BUG: Still no explanatory message before the browser permission prompt.
- **Status: FAIL** (unchanged since Round 1 -- BUG-1 still open)

#### AC-2: Bei Ablehnung der GPS-Berechtigung wird automatisch zur manuellen Eingabe gewechselt
- [x] GPS denial shows appropriate error message
- [x] Manual input always visible in the side panel
- **Status: PASS**

#### AC-3: Manuelle Eingabe per Stadt (Autocomplete) oder PLZ funktioniert
- [x] Search field present in LocationSidePanel
- [x] 500ms debounce, Nominatim integration, result selection all functional
- **Status: PASS**

#### AC-4: Eingabe wird auf gueltige Orte validiert (kein Freitext-Missbrauch)
- [x] Only Nominatim results can be selected
- [ ] BUG: Still no server-side validation (BUG-5 still open)
- **Status: PARTIAL PASS**

#### AC-5: Radius-Auswahl mit definierten Schritten
- [ ] BUG: Radius options still [0.1, 0.25, 0.5, 1, 5, 20, 100] -- missing 10, 25, 50 km (NEW-BUG-1 still open)
- [ ] BUG: Still uses button grid instead of slider (BUG-2 still open)
- [x] Selected radius visually highlighted with aria-pressed
- **Status: FAIL** (unchanged)

#### AC-6: Standardradius: 10 km
- [ ] BUG: Default radius still 1 km (NEW-BUG-2 still open)
- **Status: FAIL** (unchanged)

#### AC-7: Einstellungen werden im User-Profil gespeichert (nicht nur Session)
- [x] LocationSidePanel saves via onSave -> saveLocation -> Supabase profiles table
- [x] Error handling with try/catch and user-facing error message
- **Status: PASS**

#### AC-8: Standort + Radius werden sichtbar in der UI angezeigt
- [x] Event list header shows "City . Radius" (line 175-179)
- [x] LocationSidePanel header shows "Standort & Radius"
- [x] Map shows pin and radius circle
- [x] Sub-km display works (e.g., "100m", "250m")
- **Status: PASS**

#### AC-9: Einstellungen koennen jederzeit ueber ein Icon/Button geaendert werden
- [x] LocationSidePanel is always visible on desktop (right panel)
- [x] LocationSidePanel is always visible on mobile (bottom panel)
- [x] No longer requires opening a sheet -- settings are inline
- **Status: PASS**

### Acceptance Criteria Summary: 5/9 PASSED, 2 FAILED, 2 PARTIAL PASS (unchanged)

---

### Responsive Testing (Mobile Layout -- Focus of This Round)

#### 375px (Mobile)
- [x] Layout switches from side-by-side to stacked (`flex-col` below `md` breakpoint)
- [x] Event list panel takes full width
- [x] Location panel takes full width (`w-full` on mobile)
- [x] Border switches from `border-r` to `border-b` on the top panel
- [x] Header user name hidden on small screens (`hidden sm:inline-block`)
- [ ] BUG: "Lege rechts deinen Standort fest" is incorrect on mobile (R3-BUG-1)
- [ ] BUG: Location side panel has no height constraint on mobile, may push event list out of view (R3-BUG-3)
- [x] User menu dropdown accessible

#### 768px (Tablet -- at `md` breakpoint)
- [x] Layout switches to side-by-side (`md:flex-row`)
- [x] Right panel is 320px (`md:w-80`)
- [x] Left panel fills remaining space (`flex-1 min-w-0`)
- [x] Borders correct (`md:border-r` on left, `md:border-t-0` on right)

#### 1440px (Desktop)
- [x] Right panel expands to 384px (`xl:w-96`)
- [x] Plenty of space for event list
- [x] Map + location controls all visible without scrolling

#### Cross-Browser (Code Review)
- [x] Tailwind responsive breakpoints work identically in Chrome, Firefox, Safari
- [x] `flex-col md:flex-row` is standard CSS flexbox, universally supported
- [x] No browser-specific features introduced

---

### Security Audit Results (Round 3)

#### Authentication
- [x] Dashboard page protected by server component auth check
- [x] Events API checks authentication (line 8-11 in route.ts)
- [x] Location operations require authenticated user

#### Authorization
- [x] Events API fetches all events (no owner restriction for read -- correct for discovery feed)
- [x] Profile updates scoped to current user via `.eq("id", user.id)`

#### Input Validation
- [ ] BUG: Events API GET has no Zod validation on query params (R3-BUG-6)
- [ ] BUG: Location data still has no server-side validation (BUG-5 still open)

#### XSS
- [x] All dynamic content rendered via React JSX (auto-escaped)
- [x] `event.title`, `event.description`, `event.city` all rendered safely
- [x] No `dangerouslySetInnerHTML` usage

#### Supply Chain
- [x] Marker icons now bundled locally (NEW-BUG-3 FIXED)
- [x] OpenStreetMap tiles loaded over HTTPS

#### Data Exposure
- [x] Events API returns `creator_display_name` but not `creator_id` email or other PII... wait, it does return `creator_id` (line 23). This is a UUID, not directly sensitive, but could be used for enumeration.
- [ ] NOTE: Events API returns `creator_id` (UUID) in response. While not directly exploitable, consider omitting it from public-facing responses.

---

### All Open Bugs (Consolidated -- Round 3)

#### From Previous Rounds (Still Open)

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| BUG-1 | GPS nicht automatisch beim ersten Aufruf angefragt | Medium | Still open |
| BUG-2 | Radius uses button grid instead of Slider | Low | Still open |
| BUG-5 | Keine serverseitige Validierung der Standortdaten | Medium | Still open |
| BUG-6 | Keine Fehlermeldung bei Suche ohne Ergebnisse | Low | Still open |
| BUG-7 | Kein Session-Speicher fuer nicht eingeloggte User | Medium | Still open |
| BUG-8 | RLS-Policies nicht verifizierbar | Medium | Still open |
| BUG-9 | Nominatim-Aufrufe ohne serverseitiges Rate-Limiting | Low | Still open |
| BUG-11 | Keine Keyboard-Navigation in Autocomplete | Low | Still open |
| NEW-BUG-1 | Radius-Optionen weichen von Spec ab (missing 10/25/50 km) | Medium | Still open |
| NEW-BUG-2 | Standardradius 1 km statt 10 km (AC-6 regression) | Medium | Still open |

#### Fixed This Round (Verified)

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| NEW-BUG-3 | Leaflet Marker-Icons von externem CDN | Medium | FIXED (bundled locally) |
| NEW-BUG-4 | Duplikation RADIUS_OPTIONS / formatRadius | Low | FIXED (extracted to lib) |
| NEW-BUG-5 | Radius-Toolbar speichert direkt ohne Bestaetigung | Low | FIXED (toolbar removed) |
| NEW-BUG-6 | Impressum nicht in Public Routes | Medium | FIXED (added to publicRoutes) |

#### New Bugs Found This Round

| ID | Title | Severity | Priority |
|----|-------|----------|----------|
| R3-BUG-1 | "Lege rechts" text incorrect on mobile layout | Low | Fix in next sprint |
| R3-BUG-2 | LocationBadge component is dead code | Low | Nice to have (cleanup) |
| R3-BUG-3 | Mobile panel height not constrained -- location panel may dominate viewport | Medium | Fix before deployment |
| R3-BUG-4 | Optimistic event fetch may show wrong events on save failure | Low | Fix in next sprint |
| R3-BUG-5 | No loading indicator during event re-fetch | Low | Nice to have |
| R3-BUG-6 | Events API GET has no Zod validation on query params | Medium | Fix before deployment |

---

### Summary

| Category | Result | Change vs Round 2 |
|----------|--------|-------------------|
| **Acceptance Criteria** | 5/9 PASSED, 2 FAILED, 2 PARTIAL | Same |
| **Edge Cases** | 3/5 PASSED, 2 FAILED | Same |
| **Bugs Fixed This Round** | 4 (2 Medium, 2 Low) | Improvement |
| **Bugs Still Open (prev)** | 10 (6 Medium, 4 Low) | Down from 14 |
| **New Bugs Found** | 6 (2 Medium, 4 Low) | New |
| **Total Open Bugs** | 16 (0 Critical, 0 High, 8 Medium, 8 Low) | Was 14 |
| **Security Audit** | 2 medium issues remain + 1 new | Similar |
| **Regression (PROJ-1)** | No new regressions (Impressum fixed) | Improvement |
| **Build** | Compiles successfully (18 routes) | Same |
| **Mobile Layout** | Functional but has usability issues | New scope |

### Production Ready: NO

**Reason:** 8 Medium-severity bugs remain. The mobile layout change works at a basic level but has a significant usability issue with panel height distribution.

**Must fix before deployment:**
1. R3-BUG-3 (Medium): Mobile panel height not constrained -- core mobile usability issue
2. R3-BUG-6 (Medium): Events API missing Zod validation (backend rule violation)
3. BUG-5 (Medium): No server-side validation of location data
4. BUG-8 (Medium): RLS policies not verifiable from repo

**Discuss with product (spec vs implementation):**
5. NEW-BUG-1 (Medium): Radius options deviate from spec
6. NEW-BUG-2 (Medium): Default radius 1 km instead of 10 km
7. BUG-1 (Medium): GPS not requested automatically
8. BUG-7 (Medium): No session storage for non-logged-in users

**Fix in next sprint:**
9. R3-BUG-1 (Low): "Lege rechts" text wrong on mobile
10. R3-BUG-4 (Low): Optimistic fetch rollback
11. BUG-6 (Low): No feedback for empty search results
12. BUG-11 (Low): No keyboard navigation in autocomplete

**Nice to have:**
13. R3-BUG-2 (Low): Remove dead LocationBadge code
14. R3-BUG-5 (Low): Add re-fetch loading indicator
15. BUG-2 (Low): Button grid vs slider
16. BUG-9 (Low): Nominatim rate limiting

## Deployment
_To be added by /deploy_
