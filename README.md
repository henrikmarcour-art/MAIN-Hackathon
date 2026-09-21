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

- `main` stays runnable. One branch per feature (`feat/map`, `feat/auth`, ...).
- Small PRs, merge often. Pull `main` before starting anything.

## Next (Phase 2)

Supabase (auth, events, invites, RLS), event creation, Vercel deployment.
