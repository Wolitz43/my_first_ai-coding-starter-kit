# Product Requirements Document

## Vision
Eine Community-getriebene Entdeckungs-App, mit der sich User anmelden, standortbasierte Veranstaltungen entdecken und eigene Tipps & Posts mit der lokalen Community teilen können. Das Ziel ist, Menschen mit interessanten Ereignissen und Orten in ihrer unmittelbaren Umgebung zu verbinden.

## Target Users
**Hauptzielgruppe:** Stadtbewohner und Reisende zwischen 18–45 Jahren, die spontan herausfinden wollen, was gerade in ihrer Nähe passiert.
- **Pain Point 1:** Veranstaltungen werden verpasst, weil sie über viele Plattformen verstreut sind
- **Pain Point 2:** Keine verlässliche, community-kuratierte Quelle für lokale Geheimtipps
- **Pain Point 3:** Standortbasierte Suche ist auf bestehenden Plattformen oft zu ungenau oder zu weiträumig

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | User Authentication (Signup, Login, Logout) | Planned |
| P0 (MVP) | Standort & Radius-Einstellung | Planned |
| P0 (MVP) | Event-Erstellung & Verwaltung | Planned |
| P0 (MVP) | Community-Posts | Planned |
| P0 (MVP) | Discovery-Feed (Entdecken in der Nähe) | Planned |
| P1 | Likes & Favoriten | Planned |
| P1 | Kommentare | Planned |
| P2 | Nutzerprofil & eigene Inhalte | Planned |

## Success Metrics
- **Registrierungen:** 100 aktive User im ersten Monat nach Launch
- **Content-Rate:** Mindestens 5 neue Events/Posts pro Tag pro Stadt
- **Engagement:** 30 % der aktiven User liken oder kommentieren Inhalte
- **Retention:** 40 % der User kehren innerhalb von 7 Tagen zurück

## Constraints
- Hobby-Projekt ohne feste Deadline
- Solo-Entwickler
- Kostenlose Tier von Supabase (500 MB DB, 2 GB Storage)
- Web-first, aber API sauber für spätere React Native App vorbereiten

## Non-Goals
- Keine Ticketverkaufs-Integration in dieser Version
- Kein Bezahlsystem für Veranstalter
- Keine nativen Mobile Apps (iOS/Android) in Phase 1
- Kein Admin-Dashboard für moderierte Inhalte in Phase 1
- Keine Echtzeit-Chat-Funktion

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
