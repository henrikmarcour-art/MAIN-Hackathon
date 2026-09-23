# MaasNow product UI direction

A proposal for a cleaner MaasNow. It builds on what exists: the map, the Map / For You / Create / Profile tabs, category and social filters, Leo's time slider and heat map, the event sheet and the create flow. It sharpens them rather than replacing them. Visual rules come from [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

**Status: direction, not built.** Nothing here changes the app until we decide to implement it, piece by piece.

---

## Principles

1. **One question per screen.** Map: "what's around me tonight?" For You: "what should I pick?" Create: "what am I hosting?"
2. **Tonight is the default.** The app opens at *now*. The time slider moves through the night (18:00–05:00), and everything reacts to it: pins, heat, counts and the For You list.
3. **Tap = preview, second tap = detail.** A pin opens a small preview card and never a full sheet straight away. The map stays usable.
4. **Social signals are facts, not badges:** who is going, how many, and whether friends are there.
5. **Creating takes 3 short steps** and less than 30 seconds.

## Navigation

The bottom nav keeps 4 tabs: **Map · For You · Create · Profile**. Create stays a tab (not a floating button) because it's a core action for hosts.

---

## 1. Main map

```
┌────────────────────────────────────────┐
│ ◉ MaasNow            🔍 Search Maastricht│  ← brand pill + search capsule
│ (All)(Bars)(Clubs)(Events)(Friends)(🔥) │  ← one row of chips, scrolls sideways
│                                         │
│        ·   (Ⓒ148)                  [◎]  │  ← busy pin with count; recenter
│    (●)          ·      (TM)        [≡]  │  ← friends pin (avatars); layers
│         ·   ░░▒▒▓▓▒▒░░     ·            │  ← heat layer (subtle)
│   ·          (🔒)        ·              │  ← private (violet), only if invited
│                  ·                      │
│ ┌─────────────────────────────────────┐ │
│ │ TONIGHT · 438 going     Friends: 6 │ │  ← discovery rail: headline number
│ │ [Complex 148] [Vrijthof 210] [Take5]│ │     + horizontally scrolling mini cards
│ └─────────────────────────────────────┘ │
│  22:40 ●────────◆───────────────── 05:00│  ← time slider; ● = live now, ◆ = chosen
├─────────────────────────────────────────┤
│   ◉ Map    ♡ For You    ＋ Create   ☺ Me │  ← bottom nav
└────────────────────────────────────────┘
```

- Filters are chips with one active state: a `graphite` fill for the selected chip. Everything else is neutral.
- Emoji in these wireframes (🔍 🔥 🔒 💬 📍) only stand in for line icons. The real UI uses icons from `icons.tsx`, never emoji.
- The time slider always shows the chosen time. A "Back to now" pill appears when it is not live.
- The heat layer is on by default but subtle. Its on/off switch lives in the layers menu (`MapModeSheet`) next to the light/night theme.

## 2. Event preview card (after tapping a pin)

```
│                                         │
│              (Ⓒ148)  ← selected, scaled │
│ ┌─────────────────────────────────────┐ │
│ │ ┌──────┐ CLUB · BINNENSTAD   ● Live │ │
│ │ │ img  │ Complex                    │ │
│ │ │ 1:1  │ 23:00 – 05:00 · €€         │ │
│ │ └──────┘ (T)(M)(J) Thies + 147 going│ │
│ │ ┌───────────────┐ ┌───────────────┐ │ │
│ │ │  I'm going    │ │   Details  ›  │ │ │  ← primary (lime) + secondary
│ │ └───────────────┘ └───────────────┘ │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
```

- It floats above the nav; the map stays pannable. Swipe the card sideways to go to the next nearby venue.
- Tapping the card, or **Details**, opens the detail sheet.

## 3. Event detail sheet

```
┌────────────────────────────────────────┐
│                 ────                    │  ← grabber
│ ┌────────────────────────────────────┐  │
│ │              image 16:9            │  │  ← or surface-2 + category icon
│ └────────────────────────────────────┘  │
│ CLUB · BINNENSTAD            ● Live now  │
│ Complex                                  │  ← title
│ Tonight 23:00 – 05:00                    │
│ Griend 7 · Sint Maartenspoort   Route ›  │
│ €€ · Techno · basement · loud            │
│─────────────────────────────────────────│
│ WHO'S GOING                     See all ›│
│ (T)(M)(J)(+)  Thies, Mara + 145 going    │
│─────────────────────────────────────────│
│ ABOUT                                    │
│ Maastricht's underground club on the     │
│ Griend. Local residents, dark room…      │
│─────────────────────────────────────────│
│ HOSTED BY  (L) Leo          (private)    │  ← only for user-created events
│ 💬 Group chat                        ›   │  ← only for private events you joined
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │            I'm going                 │ │  ← pinned primary action
│ └──────────────────────────────────────┘ │
│   Share      ·      Invite friends       │  ← secondary, text buttons
└────────────────────────────────────────┘
```

- The order is fixed: **what → when → where → price/vibe → who → about → host/chat → action.**
- Host view: the primary becomes "You're hosting" (graphite with lime text), and Edit/Delete move to a "⋯" menu.

## 4. For You

```
┌────────────────────────────────────────┐
│ For You                                  │  ← display
│ Tonight in Maastricht · 22:40            │
│                                          │
│ FRIENDS ARE GOING                        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐      │  ← horizontal cards
│ │  img    │ │  img    │ │  img    │ →    │
│ │Complex  │ │Vrijthof │ │Take Five│      │
│ │23:00 · 3│ │18:30 · 3│ │20:00 · 2│      │  ← time · friends count
│ └─────────┘ └─────────┘ └─────────┘      │
│                                          │
│ STARTING SOON                            │
│ ┌──────────────────────────────────────┐ │
│ │ [img] Lumière Cinema     21:15 · in 35m│ │  ← list rows = event card anatomy
│ ├──────────────────────────────────────┤ │
│ │ [img] Café De Poshoorn   open · €     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ BUSY TONIGHT                             │
│ ┌──────────────────────────────────────┐ │
│ │ [img] Vrijthof Sessions  ● 210 going │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ YOUR PLANS                               │  ← events you're going to / hosting
│ ┌──────────────────────────────────────┐ │
│ │ [img] Leo's Rooftop   21:00 · 🔒 Going│ │
│ └──────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│   ◉ Map    ♡ For You    ＋ Create   ☺ Me │
└────────────────────────────────────────┘
```

- **At most 4 sections,** each hidden when empty, in this order: Friends are going → Starting soon → Busy tonight → Your plans.
- Everything follows the time slider's chosen time.

## 5. Create event flow (3 steps)

```
 Step 1 of 3 — What & when          Step 2 of 3 — Where               Step 3 of 3 — Who
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│ ←              1 ● ○ ○    │    │ ←              ● 2 ○      │    │ ←              ● ● 3      │
│ Create event              │    │ Where is it?              │    │ Who can come?             │
│                           │    │ 🔍 Search a place…         │    │ ┌──────────┐┌──────────┐  │
│ Name                      │    │ ┌──────────────────────┐  │    │ │ Public   ││ Private  │  │
│ ┌───────────────────────┐ │    │ │ Take Five            │  │    │ │ anyone   ││ invite   │  │
│ │ Sunset session        │ │    │ │ Bredestraat 14       │  │    │ └──────────┘└──────────┘  │
│ └───────────────────────┘ │    │ ├──────────────────────┤  │    │                           │
│ Tonight                   │    │ │ Vrijthof             │  │    │ Invite friends (private)  │
│ ┌──────────┐ ┌──────────┐ │    │ └──────────────────────┘  │    │ (L)✓ (T)✓ (M)  (J)  (S)   │
│ │ 21:00    │ │ 01:00    │ │    │ ── or ──                  │    │                           │
│ └──────────┘ └──────────┘ │    │ [ 📍 Pick on the map ]     │    │ Details (optional)        │
│ Vibe (optional)           │    │                           │    │ ┌───────────────────────┐ │
│ (Chill)(Party)(Live)(+)   │    │                           │    │ │ Bring drinks…         │ │
│                           │    │                           │    │ └───────────────────────┘ │
│ ┌───────────────────────┐ │    │ ┌───────────────────────┐ │    │ ┌───────────────────────┐ │
│ │        Next           │ │    │ │        Next           │ │    │ │     Create event      │ │
│ └───────────────────────┘ │    │ └───────────────────────┘ │    │ └───────────────────────┘ │
└──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

- **What changes from today:** public/private moves from the first question to the last step. Name and time come first because that's what people think of first.
- **Validation is inline and calm:** "Add a name". The Next button stays disabled until the step is valid.
- **After Create:** the map flies to the new pin, the detail sheet opens in its host view, and a toast says "Event created".

---

## What this needs beyond UI (later phases)

| Idea | Needs |
|---|---|
| Event images | An `image_url` column and Supabase Storage (upload in Create) |
| "I'm going" visible to others, real counts | An `event_attendees` table, which needs auth for identity (Phase 2) |
| Friends are going (real) | Auth plus a friends/follows table |
| Live updates without reload | Supabase Realtime on `events` (and attendees) |
| Private events for invited people | An invites table plus RLS (Phase 2) |
| Route › | A deep link to Apple/Google Maps; no backend |

Until then the UI can show these areas using the local data we have, clearly marked as sample data where relevant.

## Suggested order

1. Consolidate onto the design system (tokens, type scale, radii). No behavior change.
2. The preview card on pin tap, then the detail sheet order.
3. The For You sections, which follow the time slider.
4. The 3-step Create flow.
5. The map pin redesign (DESIGN_SYSTEM §10).
6. The data-backed features above, after auth.
