# MaasNow architecture

How MaasNow is built and deployed today (Phase 1: no auth). Keep this file in sync when the architecture or the database changes.

## The big picture

```
 Developer (Claude Code / Cursor / VS Code)
     │  git push (feature branch → PR → main)
     ▼
 GitHub  henrikmarcour-art/MAIN-Hackathon
     │  push webhook
     ▼
 Vercel  project "maasnow"
     │  builds Next.js ── main → https://maasnow.vercel.app (production)
     │                 └─ other branches → preview URLs (Vercel login required)
     ▼
 MaasNow in the browser (Next.js client app)
     │  supabase-js over HTTPS, public anon key only
     ▼
 Supabase  Postgres: public.events (+ delete_event function)

 Also called from the browser/server:
   • OpenFreeMap  vector tiles, fonts, sprites (no key, no limits)
   • PDOK         aerial photos for the Satellite style (Dutch government, CC BY 4.0, no key)
   • Photon (komoot) place search, proxied via /api/places (no key)
```

## Frontend

- **Next.js 15 App Router, one page.** `src/app/page.tsx` is a client component (`"use client"`) that holds all UI state and renders every screen: map, For You, Create, Profile, and the sheets on top of them.
- **Map:** `src/components/MapView.tsx` uses MapLibre GL. It is loaded with `dynamic(..., { ssr: false })` because MapLibre needs `window`.
- **Night time model:** `src/lib/night-time.ts` defines the night as 18:00–05:00 Maastricht time. `TimeScrubber` lets the user move through the night, and venues are filtered by whether they are open at the selected hour.
- **Styling:** Tailwind CSS v4 with tokens in `src/app/globals.css` (`@theme`). See `docs/DESIGN_SYSTEM.md`.
- **Server code:** only `src/app/api/places/route.ts`, a small proxy to Photon for address search. There are no other API routes, no server actions and no middleware.

## Map

- **One base style, three looks.** `public/map-styles/maasnow-natural.json` is our recoloured OpenFreeMap "Bright". `npm run build` re-downloads and recolours it, so **never hand-edit that JSON**. `src/lib/map/styles.ts` derives every style from it at runtime:
  - **Quiet base map (all styles):** removes the provider's points of interest (shops, cafés, restaurants, bus stops, airport), one-way arrows and road shields, and adds a small text-only landmark layer (churches, museums, castles, train stations) from zoom 15.
  - **Standard:** the quiet base style.
  - **Night:** our own low-glare palette applied to every layer, not the provider's generic dark theme.
  - **Satellite:** PDOK `Actueel_ortho25` aerial photos (25 cm, summer), with our street and place labels on top. Tiles are limited to the Netherlands.
- **Satellite licence:** CC BY 4.0, Beeldmateriaal Nederland, served by PDOK.
  - The raster source carries the required credit: "Luchtfoto © Beeldmateriaal Nederland (CC BY 4.0) via PDOK".
  - PDOK's terms require a Referer header, which browsers send for these tile requests by default. Don't add `referrerPolicy: "no-referrer"` anywhere.
- **Credits are visible:** a compact attribution control sits top-right under the filter chips (the bottom corners are covered by the rail and sheets). It's shown in full on load and collapses to an "i" once the map is moved.
- **Your location** (`src/lib/use-user-location.ts`):
  - The browser prompt appears only when the Locate button is tapped. If permission was granted earlier, the dot appears without a prompt.
  - The position lives in React state only: **never stored** in `localStorage` and **never sent** to Supabase.
  - GPS stops while the tab is in the background.
  - Outside Maastricht, the map shows the city with a short notice instead.
- **Style choice** is remembered per browser via `src/lib/preferences.ts`.
- **Heatmap: disabled.** `src/lib/nightlife-heat.ts` is kept but no longer mounted. To bring it back, recreate the overlay in `MapView` and restore the switch in `MapModeSheet`.

## Personalization groundwork

- **`src/lib/preferences.ts`:** a versioned, sanitised `localStorage` object (`maasnow:prefs:v1`) holding:
  - interests, saved, hidden and "not my vibe" places,
  - per-category interaction counts,
  - the map style.

  Today only the map style and "open" counts are written. After auth, upload it once to a Supabase profile and read from there.
- **`src/lib/relevance.ts`:** a pure, explainable score per venue plus reasons and a "why" line. It combines time of night, interests, habits, distance, friends and trending.
  - Some places are "pinned" (always visible): yours, going, saved, private invites, user-created events, and places with 2+ friends.
  - **Used for pin prominence only** (`src/lib/map/pin-tier.ts`): the score ranks which pins are drawn large; every place still shows, at least as a dot. Nothing is hidden based on it. Social pins are capped separately because the demo data gives most venues 2+ friends.
- **Pin layout** (`placePins` in `MapView.tsx`): after every `moveend`, prominent pins are chosen in rank order up to a zoom-based cap, and a pin that would overlap a stronger one becomes a dot. See DESIGN_SYSTEM §10.
## Data flow

**Page load**
1. The seed venues from `src/data/events.ts` render immediately.
2. A `useEffect` in `page.tsx` calls `fetchCreatedEvents()` (`src/lib/supabase-events.ts`), which does `select * from events order by created_at`.
3. Rows are mapped to the `Venue` type and merged into `createdVenues` (duplicates removed by id). The map shows seed venues and created events together.

**Creating an event**
1. `CreatePanel` builds a `Venue` with id `created-<timestamp>` and `hostId: "me"`.
2. `handleCreate` in `page.tsx` adds it to state right away, so it appears instantly.
3. `insertEvent()` generates a random delete secret, keeps it in `localStorage` (`maasnow:delete-token:<id>`), hashes it with SHA-256, and inserts the row with `delete_token_hash`.
4. Failures are logged to the console; the event then disappears on the next reload.

**Deleting an event**
1. The delete button only renders if this browser holds the event's secret (`canDeleteEvent`).
2. `deleteVenue` removes it from state, then `deleteEvent()` calls the database function `delete_event(p_id, p_token)`.
3. The function deletes the row only if the hash of the token matches. The `anon` role has no direct `DELETE` permission.

**Other devices** see changes only after reloading the page. There is no realtime subscription.

## Environment variables

| Variable | Where it is set | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` (local, gitignored) and Vercel (Production, Preview, Development) | Public by design, since it ships to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | Public anon key. Security comes from grants and RLS, not from hiding it. |

- `.env.example` lists them with empty values. There are no server-side secrets in the project.
- If either variable is missing, `src/lib/supabase.ts` throws on import and the build fails.
- The Supabase `service_role` key must never be used in this app.

## Hardcoded vs database-backed

| Data | Where it lives | Persisted? |
|---|---|---|
| Seed venues (Complex, Take Five, …) | `src/data/events.ts` | Hardcoded |
| Places for address search | `src/data/maastricht-places.ts` + Photon | Hardcoded / external |
| User-created events | Supabase `public.events` | ✅ Yes |
| Current user ("Henrik", id `me`) | `src/data/events.ts` | Hardcoded, same for every visitor |
| Friends / people | `src/data/events.ts` | Hardcoded |
| Invitations | `src/data/events.ts` | Hardcoded |
| "I'm going" | React state (`goingIds`) | ❌ Lost on reload, invisible to others |
| Accepted invites | React state | ❌ Lost on reload |
| Crowd counts and attendee lists | Generated in `src/lib/venue-attendance.ts` / `venue-attendees.ts` | ❌ Computed locally |
| Event chat | `sessionStorage` (`src/lib/event-chat.ts`) | ❌ One tab only |
| Delete secrets | `localStorage`, per browser and per domain | Local only |

## Temporary until auth exists

These are deliberate Phase 1 shortcuts. Replace them when Supabase Auth is added:

- **Everyone is `currentUser` "me".** Replace with the signed-in user; store `host_id = auth.uid()`.
- **Host detection via the delete secret.** Replace with `host_id = auth.uid()`.
- **The delete secret and `delete_event` function.** Replace with an RLS delete policy `using (host_id = auth.uid())`, then drop the `delete_token_hash` column.
- **Anyone can insert events (anon `INSERT`).** Replace with inserts for `authenticated` users only.
- **Private events visible only to their creator.** Replace with a real invites table (`event_invites`) and RLS based on invitations.
- **"I'm going" in memory.** Replace with an `event_attendees` table, with counts derived from it.

## Database schema (reference, already applied — do not re-run)

The live state of Supabase project `maasnow`. There is no migrations folder yet. When the database changes, update this block.

```sql
create table public.events (
  id                text primary key,              -- client-generated "created-<ms>"
  name              text not null,
  category          text not null check (category in ('bar','club','event','food','private')),
  address           text not null,
  lng               double precision not null,
  lat               double precision not null,
  time              text not null,                  -- free text, e.g. "21:00 – 01:00"
  vibe              text,
  price             smallint not null check (price in (1,2,3)),
  description       text,
  going_count       integer not null default 0,
  friends_going     jsonb not null default '[]'::jsonb,
  is_private        boolean not null default false,
  open_join         boolean not null default true,
  host_id           text,                           -- always "me" in Phase 1
  invited_ids       text[] not null default '{}',
  busy              boolean not null default false,
  created_at        timestamptz not null default now(),
  delete_token_hash text                            -- sha256 hex of the creator's secret; temporary
);

alter table public.events enable row level security;
create policy "Anyone can read events"   on public.events for select using (true);
create policy "Anyone can create events" on public.events for insert with check (true);

-- New tables are NOT exposed to the API automatically in this project:
grant select, insert on public.events to anon;   -- no update/delete for anon

create function public.delete_event(p_id text, p_token text) returns boolean
  language plpgsql security definer set search_path = '' as $$
  declare deleted_count integer;
  begin
    delete from public.events
    where id = p_id
      and delete_token_hash is not null
      and delete_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
    get diagnostics deleted_count = row_count;
    return deleted_count > 0;
  end; $$;
revoke all on function public.delete_event(text, text) from public, anon, authenticated;
grant execute on function public.delete_event(text, text) to anon;
```

`public.rls_auto_enable()` also exists. It is Supabase-managed and not part of our code; leave it alone.
