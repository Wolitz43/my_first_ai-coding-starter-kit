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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
