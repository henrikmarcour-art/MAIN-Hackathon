# MaasNow

See where Maastricht is going tonight. MaasNow is a mobile-first web app: a map of the city with social markers for bars, clubs and events, an "I'm going" interaction, and private invitations that unlock violet markers on the map.

This build runs on local sample data. There is no backend and no auth yet, and **no secrets or `.env` file are needed to run it.**

## First-time setup

Each person works from their **own local clone** of this GitHub repo — not a shared folder, and not separate `Henrik/` `Thies/` `Leo/` subfolders inside the project. Clone it once per machine:

```bash
git clone https://github.com/henrikmarcour-art/MAIN-Hackathon.git
cd MAIN-Hackathon
npm install
npm run up
```

Requires Node.js 18.18+ (Node 20 LTS or newer recommended). Wait until the terminal shows **`Ready`**, then open [http://localhost:3000](http://localhost:3000).

## Run locally

**After every `git pull` or merge**, start (or restart) the app from the project folder:

```bash
npm install
npm run up
```

Wait until the terminal shows **`Ready`**, then open [http://localhost:3000](http://localhost:3000).

In **Cursor / VS Code**: `Terminal → Run Task… → MaasNow: Start dev (npm run up)` — keep that terminal open.

**Leave that terminal open.** If you close it, the browser shows `ERR_CONNECTION_REFUSED` / “Can’t connect to the server” — nothing is wrong with the code; the dev server is simply off.

| Command | When to use |
|--------|-------------|
| `npm run up` | **Default** — clean cache + start dev on port 3000 |
| `npm run dev` | Start dev (auto-fixes bad `.next` when needed) |
| `npm run doctor` | Diagnose connection refused |
| `npm start` | **Not for daily dev** — production server after `npm run build` |

The layout is designed for a phone (390 × 844) and also works at desktop width.

### `ERR_CONNECTION_REFUSED` on http://localhost:3000

Nothing is listening on port **3000** — start the dev server:

```bash
npm run doctor   # optional: explains what’s wrong
npm run up
```

Keep the terminal open until you see `Ready`, then reload the browser.

### “Internal Server Error” on localhost:3000

`next dev` and `next build` both write to `.next`. **Do not run `npm run build` while the dev server is still running** — it corrupts the cache and every page returns 500 until you reset.

Fix (stop the dev terminal with **Ctrl+C**, then):

```bash
npm run dev
```

or force a wipe:

```bash
npm run dev:clean
```

Never run `npm run build` while `npm run dev` is still running.

## What you can do

1. The map opens on Maastricht (OpenFreeMap, light or night).
2. Filter by **Bars**, **Clubs**, **Friends** or **Trending**, or search from the capsule.
3. Tap a marker to open the sheet: time, vibe, price, who is going.
4. Tap **I'm going**. The count updates and the button becomes **You're going**.
5. Open **Leo invited you**, then **Accept invitation**. **Leo's Rooftop** appears as a violet marker and is added to your plans.
6. **Create** a public or private night, including picking a spot on the map.
7. **For You** and **Profile** sit in the bottom navigation next to the map.

Private venues stay hidden until the invitation is accepted, or until you are the host.

## Structure

```
src/
  app/
    layout.tsx              title, description, viewport
    page.tsx                app state: filter, selection, going, invites, tabs
    globals.css             theme tokens and marker styles
    api/places/route.ts     place search used by Create
  components/
    MapView.tsx             MapLibre map and markers
    map/                    search, discovery chips, actions, mode sheet
    TopBar.tsx              title and category filters
    EventSheet.tsx          venue sheet and "I'm going"
    InviteCard.tsx          invite chip and invitation card
    ForYouPanel.tsx         For You tab
    CreatePanel.tsx         public and private night flow
    ProfilePanel.tsx        profile tab
    BottomNav.tsx           Map · For You · Create · Profile
    Avatar.tsx
  data/
    events.ts               Maastricht venues, people, invitations
  lib/
    places.ts               local place search
```

## Design

Graphite text, warm off-white surfaces, lime accent. Orange marks a busy night. Violet is reserved for private events.

## Team

`main` stays runnable. Each person works on a branch and opens a pull request back into `main`. Keep changes small and merge often.

| Branch         | Owner  | Files                                                                 |
| -------------- | ------ | --------------------------------------------------------------------- |
| `feat/map`     | Henrik | `src/components/MapView.tsx`, marker styles in `src/app/globals.css` |
| `feat/events`  | Leo    | `EventSheet.tsx`, `InviteCard.tsx`, `ForYouPanel.tsx`, `CreatePanel.tsx`, `src/data/events.ts` |
| `feat/profile` | Thies  | `src/components/ProfilePanel.tsx`, `src/components/Avatar.tsx`       |

Shared files, change them carefully — pull first, keep the diff small, tell the others before editing:

- `src/app/page.tsx` wires state and props together.
- `src/data/events.ts` is the sample data everyone reads. Leo owns the content.
- `src/components/BottomNav.tsx` and `TopBar.tsx` are shared chrome.

## Everyday Git workflow

Pull before you start, work on a branch, push, open a PR:

```bash
git checkout main
git pull origin main

git checkout -b feat/your-change     # or: git checkout feat/map, etc.

# ...edit files...

git add -A
git commit -m "Short description of what changed"
git push -u origin feat/your-change
# open a pull request into main on GitHub
```

To pick up what the others merged since you last pulled:

```bash
git checkout main
git pull origin main
git checkout feat/your-change
git rebase main                      # or: git merge main
```

**Avoiding conflicts:**

- Pull `main` before you start a session, and again before you push.
- Stick to your owned files from the table above where possible; for shared files, keep edits small and coordinate first.
- Commit and push often in small chunks rather than one huge end-of-day commit — smaller diffs merge cleaner.
- Never run `npm run build` while `npm run dev` is running (see troubleshooting above), and don't commit `.next/` or `node_modules/` — `.gitignore` already excludes both.
- If a rebase or merge conflict comes up, resolve it locally before pushing; don't force-push over someone else's work.

## Using this repo from Claude Code, Cursor, or VS Code

No special setup. Clone the repo (above) and open the `MAIN-Hackathon` folder in whichever tool you use. The whole AI setup is plain files in Git, with no symlinks, so a normal `git pull` gives Henrik, Thies and Leo the same setup on macOS and Windows.

- **Project guide:** [`AGENTS.md`](AGENTS.md). Cursor, VS Code Copilot and Codex load it automatically, and Claude Code loads it through `CLAUDE.md`. Read it once yourself too.
- **Workflows:** type one of these in your agent's chat:

  | Command | What it does |
  |---|---|
  | `/start-work` | Check git status and pull the latest changes safely |
  | `/new-feature <what>` | Branch, inspect, make a scoped change, verify |
  | `/review-work` | Review your diff |
  | `/pre-deploy` | GO / NO-GO check |
  | `/end-work` | Clean up, commit, push your branch and write a handoff |

- **Specialist agents** (Claude Code): in `.claude/agents/`: `frontend-designer`, `supabase-expert`, `code-reviewer`, `pre-deploy-checker`, `github-sync`.
- **Docs:** [architecture](docs/ARCHITECTURE.md), [design system](docs/DESIGN_SYSTEM.md), [product UI direction](docs/PRODUCT_UI_DIRECTION.md).
- **VS Code / Cursor:** `Terminal → Run Task… → "MaasNow: Start dev (npm run up)"` runs the dev server (defined in `.vscode/tasks.json`). Keep that terminal open while you work.
- **Cursor:** `.cursor/settings.json` enables the Supabase and Vercel plugins for this project.

### Supabase Agent Skills

The official [Supabase Agent Skills](https://supabase.com/docs/guides/getting-started/ai-skills) (`supabase` and `supabase-postgres-best-practices`) are committed to this repo, so AI agents use them automatically for Supabase work. Nothing needs installing after cloning.

- `.claude/skills/`: the skills plus our workflows. Claude Code, Cursor and VS Code Copilot all read this folder, so there is one copy with no duplicates.
- `skills-lock.json`: records the source and version.

To update them to the latest version, run this on a branch and commit the result:

```bash
npx skills add supabase/agent-skills --skill '*' --agent claude-code --copy -y
```

## Next

Supabase for auth, events, invites and row-level security, plus a Vercel deployment.
