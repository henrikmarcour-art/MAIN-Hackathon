# MaasNow — project guide for AI agents and contributors

Read this before changing anything. It is loaded automatically by Claude Code (via `CLAUDE.md`), Cursor and VS Code Copilot.
Deeper docs: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) · [docs/PRODUCT_UI_DIRECTION.md](docs/PRODUCT_UI_DIRECTION.md)

## What MaasNow is

A mobile-first web app that shows where Maastricht is going tonight: a map of bars, clubs and events, "I'm going", private invitations, a time slider for the night, and events that users create themselves. Built by Henrik, Thies and Leo. Live at https://maasnow.vercel.app.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · MapLibre GL with OpenFreeMap tiles · Supabase (Postgres via `supabase-js`) · Vercel · GitHub.

## Where things live

| Path | What it is |
|---|---|
| `src/app/page.tsx` | The app shell. Holds all UI state (filter, selection, going, invites, tab, time) and wires every screen. **Shared hot file.** |
| `src/app/tokens.css` | All design tokens (`@theme`): the single source of truth, also read by design-sync. |
| `src/app/globals.css` | Imports the tokens; marker, time-slider and desktop-system styles, including the mode-aware `.mn-ui[data-mode]` roles. **Shared hot file.** |
| `src/app/api/places/route.ts` | Place-search proxy to Photon (no API key). The only server route. |
| `src/components/` | Screens and sheets: `MapView`, `EventSheet`, `CreatePanel`, `ForYouPanel`, `ProfilePanel`, `TopBar`, `BottomNav`, `InviteCard`, `AttendeeListSheet`. `DesktopShell` is the desktop layout (≥ 1024 px). |
| `src/components/panel/` | Desktop panel views: `TonightView`, `FriendsView`, `VenueView`, `InviteView`, `SearchView`, `PanelHeader`, shared bits in `ui.tsx`. |
| `src/components/map/` | Map chrome: `SearchCapsule`, `DiscoveryRail`, `TimeScrubber`, `MapActions`, `MapModeSheet`; desktop `TimeCapsule` and `MapControls`. |
| `src/data/events.ts` | Hardcoded seed venues, people, `currentUser`, invitations, and the marked sample `friendPlans`. **Shared hot file.** |
| `src/data/maastricht-places.ts` | OpenStreetMap places used by the address search. |
| `src/lib/supabase.ts`, `src/lib/supabase-events.ts` | Supabase client and all event reads/writes/deletes. |
| `src/lib/night-time.ts` | Night clock (18:00–05:00) and time slider logic. |
| `src/lib/map/styles.ts` | The three base maps (Standard, Night, Satellite), all derived from one style with provider POIs removed. |
| `src/lib/use-user-location.ts` | The visitor's location (asked for on tap only, never stored). |
| `src/lib/preferences.ts`, `src/lib/relevance.ts` | Per-browser preferences (`localStorage`) and venue relevance scoring. Relevance ranks which map pins are prominent; nothing is hidden based on it. |
| `src/lib/map/pin-tier.ts` | Pin hierarchy: ranks venues into quiet / relevant / social pins and the zoom caps (DESIGN_SYSTEM §10). |
| `src/lib/map/desk-pins.ts` | Desktop pins: what each pin is per panel view (dot, named, cluster, selected, host, destination). Pure. |
| `src/lib/nightlife-heat.ts` | Heat-map overlay. **Disabled**; kept for a possible return. |
| `src/lib/venue-attendance.ts`, `venue-attendees.ts`, `event-chat.ts` | Local-only social data (crowd counts, attendee lists, chat). |
| `scripts/` | Dev-server helpers (port cleanup, `doctor`) and the map-style builder. |
| `.claude/` | Shared AI setup: skills (incl. workflows), agents, legacy commands. |

## How events work today (Phase 1)

- **Seed venues** are hardcoded in `src/data/events.ts` and are never stored in Supabase.
- **Creating:** `CreatePanel` builds a `Venue` → `handleCreate` in `page.tsx` shows it immediately → `insertEvent()` saves it to the Supabase `events` table.
- **Loading:** on page load `fetchCreatedEvents()` reads all rows and merges them with the seed venues. There is no realtime; other devices see new events after a reload.
- **Deleting:** only the browser that created an event can delete it. At creation that browser stores a random secret in `localStorage`; Supabase stores only its SHA-256 hash; deletion goes through the `delete_event` database function. The secret is tied to the browser *and* the domain, so an event created on a preview URL cannot be deleted from production.
- **Host:** every visitor is the same hardcoded `currentUser` (`"me"`), so a browser counts as host only if it holds the event's delete secret.
- **Not persisted yet:** "I'm going", accepted invitations, chat (sessionStorage only), invitations and friends (hardcoded or generated locally).

## Supabase

- One table: `public.events`. The `anon` role (the browser) may `SELECT` and `INSERT`; it has **no** `UPDATE` or `DELETE`. Deleting only works through `public.delete_event(p_id, p_token)`.
- **New tables are not exposed to the API automatically in this project.** Every new table needs RLS *and* explicit grants to `anon`. Missing grants caused a "permission denied" bug once.
- The app only ever uses the public anon key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Never put a `service_role` or secret key in app code, docs or commits.
- There is no migrations folder yet. Schema, grants and policies are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Any database change: propose the SQL, get approval, apply it, then update that doc.
- Use the `supabase` and `supabase-postgres-best-practices` skills for any database or Supabase work.
- **Phase 1 limitations:** no auth; anyone with the public key can read and create events (spam is possible); attendance is not stored; private events are visible only to their creator because invites are not built; deletion is bound to one browser.

## Vercel

- Project `maasnow` in the "Henriks Team" account, connected to this GitHub repo.
- Push to `main` → production deploy to https://maasnow.vercel.app (about 30 seconds). Push any other branch → a preview at `maasnow-git-<branch>-henriks-team.vercel.app` (requires a Vercel login).
- The two `NEXT_PUBLIC_SUPABASE_*` variables are set in Vercel for Production, Preview and Development. Without them the build fails, because `src/lib/supabase.ts` throws on import.
- Only Henrik is a Vercel team member. Commits authored by Thies or Leo may be blocked from deploying, and they cannot open previews. Henrik merges their PRs on GitHub with **"Create a merge commit"** so the deployed commit is his.
- Do not change Vercel settings or environment variables unless explicitly asked.

## Git and collaboration

- Everyone works in their own clone. `main` must always be deployable.
- Work on a branch: `feat/<topic>`, `fix/<topic>` or `chore/<topic>`. Pull `main` before starting.
- Small, scoped commits with clear messages that say what changed and why.
- `page.tsx`, `events.ts` and `globals.css` are touched by everyone. Pull right before editing them and keep those diffs small.
- Before committing: review the diff, remove debug logs and temp files, and check for secrets.

## Rules for AI agents

1. **Inspect before changing.** Read the relevant code and check how it behaves now. Do not guess.
2. **Keep changes scoped** to the request. No drive-by refactors, renames or formatting sweeps.
3. **Never commit secrets.** `.env.local` stays local (it is gitignored). No keys, tokens or passwords in code, docs or commit messages.
4. **Do not push, merge, force-push, rebase shared branches or delete branches** unless the user explicitly asks in the current session. Never discard uncommitted work; if something is in the way, stop and ask.
5. **Ask first** before changing the Supabase schema, grants or policies, Vercel settings, or dependencies.
6. **Tell the user before starting long-running commands** (dev server, build, lint). Use time limits and never leave a hung process running.
7. **Report honestly** what was verified and what was not.

## Validation

- Always run `npx tsc --noEmit`. It is fast and reliable.
- `npm run build` with a time limit, and never while `npm run dev` is running (they share `.next`).
- The dependable full build check is the Vercel preview build of your branch.
- For database changes, verify with a real query using the anon key, not only an admin/service connection.
- For UI changes, check in a browser at phone width (390 × 844) and at desktop width.

## Known issues

- **Don't keep the project in an iCloud-synced folder (Desktop / Documents with "Optimize Mac Storage").** iCloud evicts files, `node_modules` included, and every tool that reads an evicted file waits for a slow download. That is why `npm run dev`, `build`, `lint` and even `tsc` appeared to "hang" with 0% CPU on Henrik's Mac. Keep your clone somewhere like `~/Developer/maasnow`. Check with `find node_modules -flags +dataless | head` (any output means evicted files).
- Running `npm run build` while the dev server runs corrupts `.next` and gives HTTP 500s. Fix with `npm run dev:clean`.

## AI setup in this repo

- **Skills** in `.claude/skills/` (read by Claude Code, Cursor and VS Code Copilot):
  - `supabase`, `supabase-postgres-best-practices`: official Supabase guidance.
  - Workflows, run by typing the name: `/start-work`, `/new-feature`, `/review-work`, `/pre-deploy`, `/end-work`.
- **Specialist agents** in `.claude/agents/`: `frontend-designer`, `supabase-expert`, `code-reviewer`, `pre-deploy-checker`, `github-sync`. Claude Code runs them as subagents; in other tools, read the file and follow it as a checklist.
- Keep this file up to date when the architecture changes.
