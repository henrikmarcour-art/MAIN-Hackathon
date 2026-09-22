# MaasNow

See where Maastricht is going tonight. MaasNow is a mobile-first web app: a map of the city with social markers for bars, clubs and events, an "I'm going" interaction, and private invitations that unlock violet markers on the map.

This build runs on local sample data. There is no backend and no auth yet.

## Run locally

**After every `git pull` or merge**, start the app from the project folder:

```bash
npm install
npm run up
```

Wait until the terminal shows **`Ready`**, then open [http://localhost:3000](http://localhost:3000).

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

Shared files, change them carefully:

- `src/app/page.tsx` wires state and props together.
- `src/data/events.ts` is the sample data everyone reads. Leo owns the content.
- `src/components/BottomNav.tsx` and `TopBar.tsx` are shared chrome.

```bash
git checkout feat/map          # or feat/events / feat/profile
git pull origin main --rebase
# edit, then:
git add -A && git commit -m "..."
git push -u origin feat/map
# open a pull request into main
```

## Next

Supabase for auth, events, invites and row-level security, plus a Vercel deployment.
