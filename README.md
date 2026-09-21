# MaasNow

See where Maastricht is going tonight. Mobile-first web app: an Apple-style map of Maastricht with social markers for bars, clubs and events, an "I'm going" interaction, and private invitations that unlock violet markers on the map.

**Phase 1 (this build):** local sample data, no backend, no auth.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Test at 390 × 844 (iPhone) and at desktop width.

## Demo flow

1. Map opens on Maastricht.
2. Filter **Bars** or **Clubs**.
3. Tap a busy (orange) marker → bottom sheet with time, vibe, price, attendees.
4. Tap **I'm going** → count increases, button becomes **You're going**.
5. Tap **Leo invited you** → invitation card → **Accept invitation**.
6. **Leo's Rooftop** appears as a violet marker and is added to your plans.

## Structure

```
src/
  app/
    layout.tsx        metadata + viewport
    page.tsx          all app state (filter, selection, going, invites, tab)
    globals.css       theme tokens, marker styles
  components/
    MapView.tsx       MapLibre map + DOM markers (CARTO Positron basemap)
    TopBar.tsx        "MaasNow · Maastricht, tonight" + category pills
    EventSheet.tsx    bottom sheet with "I'm going"
    InviteCard.tsx    invite chip + Apple Invites-style card
    BottomNav.tsx     Map · For You · Create · Profile
    TabPanel.tsx      lightweight For You / Create / Profile panels
    Avatar.tsx
  data/
    events.ts         ~9 Maastricht venues/events, people, invitations
```

## Design tokens

Graphite text · warm off-white surfaces · lime accent · orange = busy nightlife · violet = private events only.

## Team workflow

`main` always stays runnable. Everyone works on their own branch and opens a PR back into `main`; merge small and often (every 30–45 min) to avoid conflicts.

| Branch         | Owner  | Files                                                                              |
| -------------- | ------ | ----------------------------------------------------------------------------------- |
| `feat/map`     | Henrik | `src/components/MapView.tsx`, marker styles in `src/app/globals.css`                |
| `feat/events`  | Leo    | `src/components/EventSheet.tsx`, `InviteCard.tsx`, `ForYouPanel.tsx`, `CreatePanel.tsx`, `src/data/events.ts` |
| `feat/profile` | Thies  | `src/components/ProfilePanel.tsx`, `src/components/Avatar.tsx`                      |

Shared / handle-with-care (touching these can cause merge conflicts — keep changes small and pull often):

- `src/app/page.tsx` — wires everything together (state, props). If you need a new prop on your component, add it here too, then push fast.
- `src/data/events.ts` — sample data + types. Leo owns the content, but everyone reads from it.
- `src/components/BottomNav.tsx`, `TopBar.tsx` — shared chrome.

Day-to-day loop:

```bash
git checkout feat/map          # or feat/events / feat/profile
git pull origin main --rebase  # get the latest before you start
# ...edit your files...
git add -A && git commit -m "..."
git push -u origin feat/map
# open a PR into main, teammate skims, merge
```

## Next (Phase 2)

Supabase (auth, events, invites, RLS), event creation, Vercel deployment.
