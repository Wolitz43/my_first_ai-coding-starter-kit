# PROJ-1: User Authentication

## Status: In Review
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- None

## User Stories
- Als neuer User möchte ich mich mit E-Mail und Passwort registrieren können, damit ich Inhalte erstellen und entdecken kann.
- Als bestehender User möchte ich mich einloggen können, damit ich auf mein Konto zugreifen kann.
- Als eingeloggter User möchte ich mich ausloggen können, damit mein Konto auf geteilten Geräten geschützt ist.
- Als User möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe.
- Als User möchte ich meinen Anzeigenamen bei der Registrierung festlegen, damit andere mich identifizieren können.

## Acceptance Criteria
- [ ] User kann sich mit E-Mail + Passwort registrieren (Passwort min. 8 Zeichen)
- [ ] Nach Registrierung erhält User eine Bestätigungs-E-Mail
- [ ] User kann sich mit gültigen Zugangsdaten einloggen
- [ ] Fehlermeldung bei falschen Zugangsdaten (kein Hinweis welches Feld falsch ist)
- [ ] User kann sich ausloggen (Session wird serverseitig beendet)
- [ ] Passwort-Zurücksetzen per E-Mail-Link funktioniert
- [ ] Anzeigename ist Pflichtfeld bei Registrierung (3–30 Zeichen, keine Sonderzeichen außer _-)
- [ ] Geschützte Seiten leiten nicht-eingeloggte User zur Login-Seite weiter
- [ ] "Angemeldet bleiben"-Option beim Login

## Edge Cases
- E-Mail-Adresse bereits registriert → Klare Fehlermeldung, kein Account-Enumeration-Risiko
- Ungültige E-Mail-Adresse → Validierung vor dem Submit
- Passwort-Reset-Link ist abgelaufen (>1h) → Fehlermeldung mit Option, neuen Link anzufordern
- User versucht sich mehrfach mit falschem Passwort einzuloggen → Rate-Limiting nach 5 Versuchen
- Session ist abgelaufen → Automatische Weiterleitung zum Login mit Hinweis

## Technical Requirements
- Authentifizierung via Supabase Auth (Email/Password)
- Passwörter werden nicht im Klartext gespeichert (Supabase handled this)
- HTTPS für alle Auth-Requests
- JWT-basierte Sessions für spätere API-Kompatibilität mit nativer App

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur
```
Authentication System
├── /login (Seite)
│   └── AuthLayout (zentrierte Card)
│       ├── App-Logo & Name
│       └── LoginForm
│           ├── E-Mail Input
│           ├── Passwort Input (mit Sichtbarkeits-Toggle)
│           ├── "Angemeldet bleiben" Checkbox
│           ├── Login Button
│           ├── Link → /auth/reset-password
│           └── Link → /signup
│
├── /signup (Seite)
│   └── AuthLayout
│       └── SignupForm
│           ├── Anzeigename Input
│           ├── E-Mail Input
│           ├── Passwort Input (mit Stärke-Anzeige)
│           └── Registrieren Button
│
├── /auth/reset-password (Seite)
│   └── AuthLayout
│       └── ResetPasswordForm
│           ├── E-Mail Input
│           └── "Link senden" Button + Erfolgsmeldung
│
├── /auth/update-password (Seite) ← nach Klick auf E-Mail-Link
│   └── AuthLayout
│       └── UpdatePasswordForm
│           ├── Neues Passwort Input
│           └── Bestätigen Button
│
└── middleware.ts (schützt Routen)
    └── Prüft Session bei JEDEM Request
        └── Weiterleitung → /login falls nicht eingeloggt
```

### Datenspeicherung
**Supabase Auth** verwaltet alle Login-Daten (E-Mail, Passwort-Hash, Sessions) automatisch.

Eigene **`profiles`-Tabelle** für App-Daten:
- `id` → Verknüpfung mit Supabase Auth User
- `display_name` → Anzeigename (3–30 Zeichen)
- `avatar_url` → Profilbild-URL (genutzt in PROJ-8)
- `created_at` → Registrierungszeitpunkt

Profil wird automatisch bei Registrierung via Supabase DB Trigger angelegt.

### Tech-Entscheidungen
| Entscheidung | Warum |
|---|---|
| **Supabase Auth** | Fertige E-Mail/Passwort-Auth inkl. Bestätigungs-Mails & Reset — kein eigener Auth-Server nötig |
| **@supabase/ssr** | Pflicht für Next.js App Router — serverseitige Session-Prüfung, kein Login-Flackern |
| **Next.js Middleware** | Schützt Routen bevor die Seite lädt — sicherer als clientseitiger Check |
| **JWT Cookies (httpOnly)** | Sicher vor XSS, kompatibel mit späterer nativer App |
| **Zod + react-hook-form** | Bereits im Projekt — clientseitige Validierung vor API-Aufrufen |

### Neue Abhängigkeiten
- `@supabase/ssr` — Supabase für Next.js App Router (Server Components + Middleware)

## QA Test Results (Re-Test)

**Tested:** 2026-02-28 | **Tester:** QA Engineer (AI)
**Build Status:** Compiles successfully (Next.js 16.1.6, 15 routes)
**App URL:** https://my-first-ai-coding-starter-kit.vercel.app

### Previous QA: 2026-02-23 (9/9 PASSED, 5 Low bugs accepted)

---

### Acceptance Criteria Status

#### AC-1: Signup mit E-Mail + Passwort (min. 8 Zeichen)
- [x] Signup form exists at `/signup` with email and password fields
- [x] Zod schema enforces `min(8)` on password (both client and server)
- [x] Server-side validation via `/api/auth/signup` with Zod `signupSchema`
- [x] Supabase `auth.signUp()` called with validated data
- **Status: PASS**

#### AC-2: Bestaetigungs-E-Mail nach Signup
- [x] `emailRedirectTo` set to `${siteUrl}/auth/callback` in signup options
- [x] Success screen shows "Bestaetigungslink gesendet" message
- [x] Auth callback route handles PKCE code exchange
- **Status: PASS**

#### AC-3: Login mit gueltigen Zugangsdaten
- [x] Login form at `/login` calls `/api/auth/login` API route
- [x] `signInWithPassword` used for authentication
- [x] Successful login redirects to `/dashboard` via `window.location.href`
- [x] Cookies properly set on response object
- **Status: PASS**

#### AC-4: Generische Fehlermeldung bei falschen Zugangsdaten
- [x] Error message: "E-Mail oder Passwort ist falsch" -- does not reveal which field
- [x] Same 401 status for wrong email or wrong password
- **Status: PASS**

#### AC-5: Logout (serverseitige Session-Beendigung)
- [x] `/api/auth/signout` calls `supabase.auth.signOut()` server-side
- [x] Dashboard "Abmelden" button triggers signout then redirects to `/login`
- **Status: PASS**

#### AC-6: Passwort-Reset per E-Mail-Link
- [x] Reset password form at `/auth/reset-password`
- [x] Server-side API route `/api/auth/reset-password` sends reset email
- [x] Callback route handles `token_hash` + `type=recovery` flow
- [x] Update password page at `/auth/update-password` with confirmation field
- [x] Expired link detection with "Neuen Link anfordern" option
- **Status: PASS**

#### AC-7: Anzeigename Pflichtfeld (3-30 Zeichen, _- erlaubt)
- [x] Zod regex `/^[a-zA-ZaeoeueAeOeUess0-9_-]+$/` on both client and server
- [x] Min 3 / Max 30 enforced
- [x] Unique check via admin client (case-insensitive `ilike`)
- **Status: PASS**

#### AC-8: Geschuetzte Seiten leiten zur Login-Seite weiter
- [x] Middleware checks `supabase.auth.getUser()` on every non-public route
- [x] Redirect to `/login` if no user found
- [x] Dashboard page has additional server-side `redirect("/login")` guard
- [x] Root page `/` redirects based on auth state
- **Status: PASS**

#### AC-9: "Angemeldet bleiben"-Option
- [x] Checkbox in login form bound to `rememberMe` field
- [x] When `rememberMe=false`, cookie `maxAge` is set to `undefined` (session cookie)
- [x] When `rememberMe=true`, Supabase default `maxAge` is preserved
- **Status: PASS**

### Acceptance Criteria Summary: 9/9 PASSED

---

### Edge Cases Status

#### EC-1: E-Mail bereits registriert (Account Enumeration)
- [x] Signup returns generic "Registrierung fehlgeschlagen" for duplicate emails (Supabase handles this)
- [ ] BUG: See NEW-BUG-1 -- Password reset endpoint reveals email registration status
- **Status: PARTIAL PASS**

#### EC-2: Ungueltige E-Mail-Adresse
- [x] Client-side Zod email validation prevents submit
- [x] Server-side Zod email validation as second layer
- **Status: PASS**

#### EC-3: Passwort-Reset-Link abgelaufen
- [x] `useEffect` checks session on mount at `/auth/update-password`
- [x] "Neuen Link anfordern" link shown when error contains "abgelaufen"
- **Status: PASS**

#### EC-4: Mehrfache Fehlversuche (Rate Limiting)
- [x] Login: 5 attempts per 15 minutes per email
- [x] Signup: 5 attempts per hour per email
- [x] Password reset: 3 attempts per 15 minutes per email
- **Status: PASS**

#### EC-5: Session abgelaufen
- [x] Middleware detects lingering `sb-*auth-token*` cookies without valid user
- [x] Redirects to `/login?reason=session_expired`
- [x] Login page displays "Deine Sitzung ist abgelaufen" alert
- **Status: PASS**

### Edge Cases Summary: 4.5/5 PASSED (1 partial -- see NEW-BUG-1)

---

### Security Audit Results (Red Team Perspective)

#### Authentication
- [x] Cannot access `/dashboard` without login (middleware + server component double guard)
- [x] Authenticated users redirected away from `/login` and `/signup`
- [x] `getUser()` used instead of `getSession()` for server-side auth checks (secure pattern)

#### Authorization
- [x] Dashboard only shows current user's profile data (filtered by `user.id`)
- [x] Delete account API verifies user identity via `getUser()` before deletion
- [x] Service role key (`SUPABASE_SERVICE_ROLE_KEY`) only used server-side, never exposed as `NEXT_PUBLIC_`

#### Input Validation
- [x] All API routes validate input with Zod before processing
- [x] Display name regex prevents script injection in name field
- [x] Email validated as proper email format on both client and server

#### XSS Protection
- [x] React auto-escapes rendered values (display name, email)
- [x] No `dangerouslySetInnerHTML` usage found
- [x] X-Content-Type-Options: nosniff header set

#### Open Redirect
- [x] Auth callback validates `next` parameter: `rawNext.startsWith("/") && !rawNext.startsWith("//")`
- [x] Fallback to `/dashboard` if validation fails

#### Security Headers
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: origin-when-cross-origin
- [x] Strict-Transport-Security: max-age=31536000; includeSubDomains
- [ ] BUG: No Content-Security-Policy header (previously noted as BUG-5, still open)

#### Rate Limiting
- [x] Login, signup, and password reset endpoints all have rate limiting
- [ ] BUG: Resend-confirmation endpoint has NO rate limiting (see NEW-BUG-2)

#### Secrets Management
- [x] `SUPABASE_SERVICE_ROLE_KEY` not prefixed with `NEXT_PUBLIC_`
- [x] `.env.local.example` documents required vars with dummy values
- [x] No hardcoded secrets in source code

---

### Bugs Found

#### Previously Open (Low -- from 2026-02-23 QA, still open)

**BUG-1 (prev): Kein explizites Request-Body-Size-Limit auf API-Routen**
- **Severity:** Low
- **Status:** Still open, accepted for MVP

**BUG-4 (prev): In-Memory Rate-Limiter resettet bei Serverless Cold-Starts**
- **Severity:** Low
- **Status:** Still open, accepted for MVP

**BUG-5 (prev): Kein Content-Security-Policy Header**
- **Severity:** Low
- **Status:** Still open, accepted for MVP

**BUG-6 (prev): Signout-API Redirect-Verhalten**
- **Severity:** Low
- **Status:** Still open, functionally works

**BUG-9 (prev): Inkonsistente Umlaut-Kodierung in UI-Texten**
- **Severity:** Low
- **Status:** Still open -- confirmed in multiple places:
  - Signup success: "ueberpruefe", "Bestaetigung", "Bestaetigungslink"
  - Reset password: "Ueberpruefe", "Zuruecksetzen", "Zurueck"
  - Update password: "bestaetigen", "Passwoerter", "ueberein"
  - Login: "gueltige" (but also proper umlauts in other messages like "Bitte bestaetige zuerst deine E-Mail-Adresse")
  - Mixed: Some strings use proper umlauts (e.g. "Ungueltige E-Mail-Adresse" in server vs "Ungueltige E-Mail-Adresse" in client)

---

#### NEW Bugs Found (2026-02-28 Re-Test)

**NEW-BUG-1: Password Reset API Leaks Email Registration Status (Account Enumeration)**
- **Severity:** Medium
- **File:** `src/app/api/auth/reset-password/route.ts` (lines 86-91)
- **Steps to Reproduce:**
  1. Send POST to `/api/auth/reset-password` with `{"email": "nonexistent@example.com"}`
  2. Expected: Generic success message regardless of whether email exists (to prevent enumeration)
  3. Actual: Returns HTTP 404 with `{"error": "Diese E-Mail-Adresse ist nicht registriert."}`
- **Impact:** An attacker can enumerate valid email addresses by calling this endpoint. The spec explicitly states "kein Account-Enumeration-Risiko" as an edge case requirement.
- **Note:** The frontend page comment says "Always show success (even if email doesn't exist) to prevent account enumeration" but the API contradicts this by returning 404.
- **Priority:** Fix before next deployment

**NEW-BUG-2: Resend-Confirmation Endpoint Has No Rate Limiting**
- **Severity:** Medium
- **File:** `src/app/api/auth/resend-confirmation/route.ts`
- **Steps to Reproduce:**
  1. From login page, trigger "email not confirmed" state
  2. Repeatedly click "Bestaetigungsmail erneut senden"
  3. Expected: Rate limiting after N attempts
  4. Actual: Unlimited confirmation email resends possible
- **Impact:** Can be abused to flood a victim's inbox with confirmation emails. Also increases email sending costs on Supabase.
- **Priority:** Fix before next deployment

**NEW-BUG-3: Unhandled JSON Parse Error on Malformed Request Body**
- **Severity:** Low
- **Files:** All API routes using `request.json()` without try/catch:
  - `src/app/api/auth/login/route.ts` (line 17)
  - `src/app/api/auth/signup/route.ts` (line 25)
  - `src/app/api/auth/reset-password/route.ts` (line 16)
  - `src/app/api/auth/resend-confirmation/route.ts` (line 10)
- **Steps to Reproduce:**
  1. Send POST to any auth API with Content-Type: application/json but invalid JSON body (e.g. "not-json")
  2. Expected: 400 Bad Request with clean error message
  3. Actual: Unhandled exception, likely 500 Internal Server Error with stack trace
- **Priority:** Nice to have

**NEW-BUG-4: Signup Rate Limiter Increments Before Checking Display Name Uniqueness**
- **Severity:** Low
- **File:** `src/app/api/auth/signup/route.ts` (lines 49-55)
- **Steps to Reproduce:**
  1. Submit signup with a display name that is already taken
  2. Receive 409 "Anzeigename ist bereits vergeben" error
  3. The rate limit counter was already incremented before the display name check
  4. Repeat 5 times -- user gets rate limited even though they never actually attempted to create an account
- **Expected:** Rate limit should only increment on actual signup attempts, not on display-name-conflict responses
- **Priority:** Nice to have

**NEW-BUG-5: Password Reset Lists ALL Users in Memory**
- **Severity:** Medium
- **File:** `src/app/api/auth/reset-password/route.ts` (lines 67-77)
- **Steps to Reproduce:**
  1. Observe line 67: `adminClient.auth.admin.listUsers()` fetches ALL users
  2. Then line 75: iterates full list with `.some()` to find matching email
- **Impact:** As the user base grows, this loads ALL user records into memory on every single password reset request. With 1000+ users this becomes a performance issue. With 10,000+ users it could cause memory exhaustion on serverless functions. The Supabase Admin API `listUsers()` also paginates at 1000 users by default, meaning emails beyond page 1 would never be found.
- **Priority:** Fix before next deployment

**NEW-BUG-6: Update Password Page Uses Client-Side `getSession()` Instead of `getUser()`**
- **Severity:** Low
- **File:** `src/app/auth/update-password/page.tsx` (line 52)
- **Steps to Reproduce:**
  1. Observe `useEffect` calls `supabase.auth.getSession()` to check if user has a valid recovery session
  2. Per Supabase docs, `getSession()` reads from local storage and does not verify the JWT with the server
  3. `getUser()` should be used for security-sensitive checks
- **Note:** The actual password update call to `supabase.auth.updateUser()` will still validate server-side, so this is not exploitable. But the session check gives a false sense of security and could show the form even with an expired/invalid session.
- **Priority:** Nice to have

---

### Cross-Browser Testing (Code Review)
- [x] No browser-specific APIs used (no `window.crypto`, no `Navigator.clipboard`, etc.)
- [x] Standard form elements with shadcn/ui (cross-browser compatible)
- [x] `window.location.href` redirect is universally supported
- Note: Full cross-browser manual testing in Chrome, Firefox, Safari requires running browser -- code review shows no compatibility concerns.

### Responsive Testing (Code Review)
- [x] AuthLayout uses `max-w-[400px]` with `px-4` padding -- works on 375px mobile
- [x] Dashboard uses `max-w-md` card -- responsive
- [x] All form elements are `w-full` -- fills container properly
- [x] Tailwind responsive utilities used correctly
- Note: No breakpoint-specific styles needed for auth forms (single-column layout)

---

### Summary

| Category | Result |
|----------|--------|
| **Acceptance Criteria** | 9/9 PASSED |
| **Edge Cases** | 4.5/5 PASSED (1 partial) |
| **New Bugs** | 6 total (0 Critical, 3 Medium, 3 Low) |
| **Previous Open Bugs** | 5 Low (unchanged, accepted for MVP) |
| **Security Audit** | 2 issues found (account enumeration, missing rate limit) |
| **Build** | Compiles successfully |

### Production Ready: NO

**Reason:** 3 Medium-severity bugs must be fixed:
- NEW-BUG-1: Account enumeration via password reset API (security)
- NEW-BUG-2: No rate limiting on resend-confirmation (abuse potential)
- NEW-BUG-5: `listUsers()` fetches all users into memory (scalability + correctness beyond 1000 users)

### QA-Ergebnis: NOT APPROVED -- Fix Medium bugs first, then re-test

## Deployment

**Deployed:** 2026-02-24
**Production URL:** https://my-first-ai-coding-starter-kit.vercel.app
**Platform:** Vercel (auto-deploy via GitHub `main` branch)

### Checklist
- [x] Build successful (Next.js 16.1.6, 13/13 pages)
- [x] Environment variables set (SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL)
- [x] Security headers configured (X-Frame-Options, HSTS, etc.)
- [x] Production URL loads correctly
- [x] Authentication flows verified in production
