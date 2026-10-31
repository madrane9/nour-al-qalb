# Nour Al-Qalb | نور القلب

Interaktive islamische Hoffnungsplattform: Gefühl wählen → Zettel aus dem Hoffnungsglas ziehen oder per Mindmap entdecken → Koranvers / Hadith / Reflexion mit Quelle.
Sprachen: Darija (RTL), Deutsch, Englisch. Hell/Dunkel. Stack: React + TypeScript + Vite, Tailwind, React Flow (`@xyflow/react`), Motion, i18next, Zod, Supabase.

## Schnellstart (lokal, ohne Datenbank)

```bash
npm install
npm run dev
```

Ohne `.env` läuft die App im **Demo-Modus** mit 28 bei Quran.com geprüften Versen (`src/data/quran-seed.json`).
Favoriten werden dann im Browser gespeichert. Admin und Anmeldung brauchen Supabase.

## Mit Supabase (Datenbank, Login, Admin)

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im SQL-Editor nacheinander ausführen:
   `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, dann `supabase/seed/001_emotions.sql`, `002_quran_entries.sql`.
   (Alternativ per Supabase CLI: `supabase db push`.)
3. `.env.example` nach `.env` kopieren und `VITE_SUPABASE_URL` sowie `VITE_SUPABASE_ANON_KEY` (Project Settings → API → *anon public*) eintragen.
   **Niemals** den `service_role`-Key ins Frontend oder Repository.
4. In der App ein Konto registrieren (Authentication → ggf. E-Mail-Bestätigung).
5. **Admin freischalten** (bewusst nur per SQL, eine Anmeldung allein gibt keine Rechte):
   ```sql
   insert into admin_users (user_id)
   select id from auth.users where email = 'deine@mail.de';
   ```
6. In der App erscheint der Menüpunkt **Verwaltung**: Verse, Hadithe, Reflexionen und Gefühle anlegen, bearbeiten, veröffentlichen.

### Qualitätsprüfung
Neue Einträge starten als **Entwurf**. Veröffentlichen geht erst, wenn „Ich habe Originaltext und Quelle manuell geprüft“ gesetzt ist, Quelle + Link (https) vorhanden sind (Hadith zusätzlich Bewertung + Bewertungsquelle). Das erzwingen sowohl das Formular (Zod) als auch die Datenbank (CHECK-Constraints).

## Szenen "Situation & Antwort" (ohne Datenbank)

Szenen liegen komplett im Repo und kosten nichts:

1. Bild pro Sprache nach `public/scenes/` legen, z. B. `geduld-de.webp`, `geduld-ar.webp` (WebP, PNG, JPEG oder SVG, möglichst unter 300 KB).
2. Eintrag in `src/data/scenes.json` ergänzen:
   ```json
   {
     "id": "geduld",
     "entryKey": "2:153",
     "sortOrder": 2,
     "images": [
       { "lang": "de", "file": "geduld-de.webp", "alt": "Text der Sprechblasen auf Deutsch" },
       { "lang": "ar", "file": "geduld-ar.webp", "alt": "نص الفقاعات بالعربية" }
     ]
   }
   ```
   `entryKey` ist die Versreferenz aus `src/data/quran-seed.json`. Fehlt der Vers dort, erst mit `npm run seed:quran` ergänzen.
3. `npm test` prüft, dass jede Szene auf einen vorhandenen Vers zeigt. Danach committen und pushen.

Fehlt eine Sprache, zeigt die Seite das arabische Bild. Nur eigene Bilder oder Bilder mit Erlaubnis verwenden.

## Religiöse Inhalte: was ist verifiziert, was nicht

| Inhalt | Herkunft | Status |
|---|---|---|
| Arabischer Koran-Text | `text_uthmani` der Quran.com-API | automatisch bezogen, **bitte stichprobenartig prüfen** |
| Deutsch | Bubenheim & Elyas (Quran.com-Ressource 27) | Quelle im Datensatz |
| Englisch | Saheeh International (Quran.com-Ressource 20) | Quelle im Datensatz |
| Darija-Erklärungen | **eigene, vereinfachte Erklärungen** | in der UI klar als „keine Übersetzung“ gekennzeichnet; **bitte inhaltlich prüfen** |
| Hadithe | **keine mitgeliefert** | Es werden bewusst keine Hadith-Texte/Nummern/Bewertungen ohne geprüfte Quelle erfunden. Anlegen im Admin nach Prüfung (z. B. sunnah.com). |
| Audio | Quran.com-Rezitation (Mishari al-Afasy) | URL per HEAD-Request als erreichbar geprüft; Lizenz prüfen |
| Reflexionen | keine mitgeliefert | im Admin als „Reflexion“ (kein Zitat) |

Seed neu erzeugen (benötigt Internet): `npm run seed:quran` – verifiziert die Übersetzer-IDs gegen die API und schreibt `src/data/quran-seed.json` + `supabase/seed/*.sql`.

**Offene Prüfungen:** Lizenzbedingungen der Übersetzungen/Audios für den geplanten Einsatz; Redaktionelle Zuordnung Vers ↔ Gefühl (`scripts/fetch-quran.mjs`, `CURATION`); Darija-Texte durch Muttersprachler/Fachperson.

## Qualität

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript strict
npm test            # Vitest (Logik, Zod, UI, RLS-Regeln)
npm run e2e         # Playwright (Desktop + Mobil), nutzt den Demo-Modus
npm run build
```

## Deployment (GitHub Pages)

- Vite-`base` ist `/nour-al-qalb/` (überschreibbar via `VITE_BASE`). Routing per `HashRouter`, daher keine 404-Umleitung nötig.
- Repository → Settings → Pages → Source: **GitHub Actions**.
- Repository → Settings → Secrets and variables → Actions → **Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (öffentliche Werte).
- Push auf `main` startet `.github/workflows/deploy.yml`. CI (`ci.yml`) prüft Lint, Typen, Tests, Build und E2E.
- In Supabase unter Authentication → URL Configuration die Pages-URL als Site URL eintragen.

## Sicherheit

- Row Level Security auf allen Tabellen; Besucher lesen nur `status = 'published'`.
- Schreibrechte nur über `is_admin()` (Tabelle `admin_users`, nur per SQL befüllbar). `profiles` hat keine Rollenspalte.
- React escaped alle Texte; externe Links nur mit `https://` und `rel="noopener noreferrer"`.
- Keine Secrets im Repo (`.env` ist ignoriert).
