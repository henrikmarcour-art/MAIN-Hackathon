# MaasNow design system

The rules for how MaasNow looks and moves. MaasNow is a **map-first local discovery app**: a premium consumer product for going out tonight, not a SaaS dashboard. The references are the restraint and clarity of DICE and Resident Advisor: confident type, dark ink on quiet surfaces, one accent, and content that does the talking. We don't copy either.

Tokens live in `src/app/globals.css` (`@theme`). A value that is not in this document or in `@theme` should not appear in a component. If you need one, add a token first.

---

## 1. Brand principles

1. **Tonight first.** Every screen answers "what's happening now, and later tonight?" Time is always visible: live, starts in, until.
2. **The map is the product.** UI floats over the map and gets out of its way. Chrome is small, sheets are dismissible, and nothing permanently covers more than about a third of the map.
3. **Quiet UI, loud content.** Venue names, times and people carry the screen. Controls are neutral.
4. **Social proof over marketing.** "Thies + 12 going" beats "🔥 Hot event!". No hype copy and no decorative emoji.
5. **One accent, used rarely.** Lime means "you" and "the main action". If everything is lime, nothing is.
6. **Calm motion.** Things move to explain a change, never to decorate.

---

## 2. Color

### Tokens

| Token | Hex | Role |
|---|---|---|
| `graphite` | `#1c1c1e` | Primary text, primary dark buttons, icons |
| `graphite-soft` | `#4a4a4f` | Secondary text (meta that matters: time, venue) |
| `graphite-muted` | `#8a8a8f` | Tertiary text: placeholders, disabled, non-essential hints |
| `surface` | `#faf8f4` | Sheets, cards, floating controls |
| `surface-2` | `#f1eee7` | App background, input fields, pressed states, image placeholders |
| `line` | `#e6e2d9` | Hairline borders and dividers |
| `lime` | `#c6f432` | **Brand.** Primary action fill, "you're going", selection, live indicator |
| `lime-deep` | `#9ed10e` | Lime on light surfaces for strokes/rings where plain lime disappears |
| `orange` | `#ff7a1a` | State: **busy / trending** |
| `violet` | `#6f56ff` | State: **private / invite-only** |
| `cobalt` | `#2563eb` | State: **friends / social** |
| `danger` *(add)* | `#c2383d` | Destructive actions and errors (AA on `surface`) |

### Rules

- **One meaning per color.** Orange always means busy, violet private, cobalt friends and lime "you/primary". Category (bar, club, event, food) is shown with an **icon and label, not a color**, on pins too (§10).
- **Lime is a fill, never text on light.** Lime and lime-deep on `surface` have a contrast of about 1.2–1.7:1, which is unreadable. Use graphite text on a lime fill (≈13:1), or lime text on graphite (≈13:1, as in "You're hosting").
- **Orange is a fill or icon color,** with graphite content on it (6.5:1). Orange text on light fails contrast.
- **Contrast floor is WCAG AA.**
  - `graphite` (16:1) and `graphite-soft` (8:1) are fine for any text size.
  - `graphite-muted` is only 3.2:1: use it for placeholders, disabled states and optional hints, never for information the user needs.
- **No raw hex in components.** Avatar colors are the one exception; they live in the data layer.
- **No gradients** except in data visualization: the heat map and the time-slider track.
- **Night map theme:** the map goes dark, but floating UI stays on `surface`. Don't invert components per theme until a dark token set exists.

---

## 3. Typography

**Geist**, loaded with `next/font/google` in `src/app/layout.tsx` (self-hosted at build time, no npm package) and exposed as `--font-geist` → `--font-sans`, with the system stack as fallback. Weights: **500, 600 and 700 only** (400 for long body text). 700 is for `display` only; titles and names use 600.

| Style | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 28 / 32 | 700 | −0.02em | Screen titles ("For You", "Tonight") |
| `title` | 22 / 28 | 700 | −0.015em | Venue name in the detail sheet, section titles |
| `headline` | 17 / 22 | 600 | −0.01em | Card titles, list-row titles |
| `body` | 15 / 20 | 400–500 | 0 | Body text, button labels (600) |
| `meta` | 13 / 18 | 500 | 0 | Time, venue, price, counts |
| `caption` | 11 / 14 | 600, UPPERCASE | +0.06em | Eyebrows, badges, tab labels |

- Numbers (times, counts, prices) always use `tabular-nums`.
- The scale is defined as Tailwind v4 tokens in `@theme` (`--text-display` … `--text-caption`, with line height, tracking and weight). Use `text-title`, `text-meta` etc., never `text-[22px]`. `text-caption` still needs `uppercase`.
- **Done:** the map screen (top bar, search, lens control, Popular tonight, venue sheet, invite chip, map style sheet, notices).
- **Still to move:** For You, Create, Profile, attendee list and the invitation card use arbitrary sizes. Map them when you touch them: 10→11, 12→13, 14→15, 18→17, 24→22, 30→28.

---

## 4. Spacing

A 4 px base using Tailwind's default spacing (`1` = 4 px). Only use these steps:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`

| Where | Value |
|---|---|
| Screen side gutter | 16 |
| Sheet padding | 20 |
| Card padding | 12 (compact) / 16 (standard) |
| Gap between related items | 8 |
| Gap between sections | 24–32 |
| Safe areas | Always add `env(safe-area-inset-*)` on top of the value |

---

## 5. Radius

Four values. Today the app uses seven (`9px`, `22px` and `28px` are one-offs).

| Token | px | Tailwind | Use |
|---|---|---|---|
| `sm` | 12 | `rounded-xl` | Inputs, thumbnails, small tiles |
| `md` | 16 | `rounded-2xl` | Buttons, cards, list rows |
| `lg` | 24 | `rounded-3xl` | Bottom sheets (top corners), large preview cards |
| `full` | — | `rounded-full` | Pills, chips, avatars, map pins, icon buttons |

Nested elements use a smaller radius than their container.

---

## 6. Elevation

Three shadow tokens; nothing else.

| Token | Use |
|---|---|
| `shadow-control` | Small controls floating on the map (icon buttons, search, chips) |
| `shadow-float` | Cards floating on the map (preview card, discovery rail) |
| `shadow-sheet` | Bottom sheets |

- **Inside a sheet or card there are no shadows:** separate things with `line` hairlines or `surface-2` fills.
- **Blur (`backdrop-blur`) only for the bottom nav and small chrome over the map.** Never for cards, sheets or modals. Today it is also used in `InviteCard` and `ProfilePanel`; remove it there in the redesign.

---

## 7. Buttons

| Variant | Look | Use |
|---|---|---|
| **Primary** | `lime` fill, `graphite` label, 600 | The one main action on a screen: "I'm going", "Create event". **At most one per view.** |
| **Strong** | `graphite` fill, `surface` label | Confirmations and the main action in forms when lime is already used |
| **Secondary** | `surface-2` fill, `graphite` label | Alternatives: "Share", "Keep it" |
| **Ghost** | No fill, `graphite-soft` label | Low-priority actions, "Cancel" |
| **Destructive** | `surface-2` fill, `danger` label; confirm step fills `danger` with a white label | Delete. Always with a confirmation |
| **Icon** | 44×44 circle, `surface` + `shadow-control` | Map controls (recenter, layers) |

- **Sizes:** large 48 px (sheet actions), medium 40 px, chip 32 px. Touch targets stay ≥ 44 px, so pad small visuals.
- **Radius:** `md` (16) for rectangular buttons, `full` for chips and icon buttons.
- **States:**
  - Pressed: `scale(0.98)`, 120 ms.
  - Disabled: 40% opacity, no pointer events.
  - Focus: 2 px `graphite` ring, 2 px offset (`focus-visible` only).
  - Loading: the label is replaced by a small spinner and the width stays the same.
- **Labels are verbs and short:** "I'm going", "Create", "Invite friends". No "Click here" and no ALL CAPS.

---

## 8. Cards and the event card anatomy

There is **one card style**: `surface` background, `md` or `lg` radius, a `line` hairline on `surface-2` backgrounds or `shadow-float` over the map. Never a card inside a card.

### Event card (list / For You)

```
┌──────────────────────────────────────────────┐
│ ┌──────────┐  CLUB · BINNENSTAD      ● Live  │  ← caption eyebrow + status chip
│ │  image   │  Complex                        │  ← headline, 1 line, ellipsis
│ │   1:1    │  23:00 – 05:00 · Griend 7       │  ← meta (graphite-soft), tabular
│ │  72×72   │  €€ · Techno, basement          │  ← price + max 2 vibe words
│ └──────────┘  (T)(M)(J) Thies + 147 going    │  ← avatars (max 3) + count (cobalt if friends)
└──────────────────────────────────────────────┘
```

- **Order of information:** what (name) → when (time) → where (venue/area) → price and vibe → who (social).
- **Status chip**, one at most:
  - "Live" (lime dot),
  - "Starts 22:00" (neutral),
  - "Busy" (orange),
  - "Private" (violet lock).
- **Image:** the `sm` radius. Without an image, use `surface-2` with the category icon; never a stock photo or a gradient.
- The whole card is one tap target, and "I'm going" lives in the detail sheet, not on the card.

### Map preview card (tap on a pin)

This is the same anatomy in a horizontal floating card (`lg` radius, `shadow-float`) above the bottom nav, plus one primary button. See `docs/PRODUCT_UI_DIRECTION.md`.

---

## 9. Bottom sheets

- **Snap points:**
  - peek, about 40% of the height (preview),
  - full, about 92% (detail).
  - The map stays visible and pannable behind the peek state.
- **Top:** `lg` top radius, `shadow-sheet`, and a 36×4 grabber in `line` at the top center.
- **Closing:** drag down, tap the map, or the close button. Also support Escape on desktop.
- **Scrim:** only in the full state, `graphite` at 20% opacity. No scrim while peeking.
- **The primary action is pinned to the bottom** with safe-area padding. Content scrolls under it with a `line` divider.
- **Only one sheet at a time.** Opening a second one (e.g. the attendee list) replaces or stacks it as a full-screen push; sheets don't pile up.
- **Desktop (≥ 768 px):** today the sheet is a 400 px floating card at the bottom right. **Decided direction (next feature, `feat/desktop-side-panel`):** one docked **left** panel (about 380 px, full height) that holds search, invites, Popular tonight and the selected venue, with the map as the only thing to its right. See `docs/PRODUCT_UI_DIRECTION.md`.

---

## 10. Map pins

The map is the product, so pins are quiet by default. Most places are small dots; a ranked, capped few are prominent. Ranking decides **prominence only**: nothing is hidden. Logic: `src/lib/map/pin-tier.ts` (ranking) and `placePins` in `MapView.tsx` (caps and overlap); styles: `.mn-marker` in `globals.css`.

| Tier | Look | Who gets it |
|---|---|---|
| **Quiet** | 10 px `graphite` dot, `surface` outline (inverted on dark maps). No count, no avatar, no color | Everything else that is on tonight |
| **Relevant** | 30 px `surface` circle, `graphite` category icon, `shadow-control` | Highest-ranked places, up to the zoom cap |
| **Social** | 34 px `surface` circle, up to 2 friend avatars, 1.5 px `graphite` ring | 2+ friends going; **max 3** (6 in the Friends lens), ranked by friends then relevance |
| **Selected** | 40 px `graphite` fill, `surface` icon, name + count label. All other pins dim to 45% | The pin you tapped |

**State overlays** (on any prominent tier):

| State | Signal |
|---|---|
| You're going / your event | `lime-deep` ring + small `lime` check badge. **The only lime on the map** |
| Private (visible to you) | Small `violet` lock badge |
| Hot | **One pin at most** (busiest, and only if ≥ the trending threshold): +4 px and a soft breathing halo in `graphite` (`surface` on dark maps). The only looping animation on the map |

**Ranking and caps**

- Rank order: personal first (yours, going, invited), then by the active lens: relevance score (`relevance.ts`) for Tonight and types, crowd for Trending, friends for Friends.
- Personal and selected pins are always prominent. The rest fill the cap in rank order: **6** prominent pins below zoom 14, **10** below 15, **16** below 16, **24** above.
- A prominent pin that would overlap a stronger one on screen (radii + 6 px) falls back to a dot. Off-screen pins count as dots until the map stops moving; tiers are recomputed on every `moveend`.
- No clustering yet. With a few dozen places, caps and overlap fallback are enough.

**Rules**

- **Category = icon, state = ring or badge.** Never color a pin by category.
- Don't add new state colors to pins. Busy/trending is shown by the single hot pin, not orange.
- **Labels** only for the selected pin and on hover (pointer devices).
- **Counts** live in the label, never as a badge on the pin; `tabular-nums`.
- Demo data gives most places friends. Keep social capped so the map stays calm with it.

---

## 11. Empty, loading and error states

| State | Rule | Example |
|---|---|---|
| **Empty** | One sentence plus one action. No illustrations | "Nothing on at 04:00. Slide back to earlier tonight." [Back to now] |
| **Loading** | Skeletons that match the final layout (`surface-2` blocks). No spinners over the map. Map tiles loading = `surface-2` background | — |
| **Inline action loading** | Spinner inside the button; keep the button's size | — |
| **Error** | Plain language: what happened plus how to fix it, and a Retry action. Never show raw error codes | "Couldn't load new events. Check your connection." [Retry] |
| **Offline / failed save** | Keep the user's input; offer Retry; never pretend it was saved | — |
| **Toasts** | Bottom, above the nav, 3 s, one at a time, for confirmations only ("Event created") | — |

---

## 12. Motion

- **Durations:** 120 ms (press), 200 ms (small changes, fades), 260–280 ms (sheets, cards entering). Map camera moves: 400–600 ms.
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` for movement, `ease-out` for fades. This is the curve already used in `globals.css`; use no other.
- **Animate only `transform` and `opacity`.** Never animate layout, width/height, blur or shadows on large surfaces.
- **One looping animation at a time on screen:** the busy halo or the live dot. Nothing else loops.
- **`prefers-reduced-motion`:** loops stop and movement becomes an instant or 100 ms fade (`globals.css` already has the hook).
- **No bounce, no parallax,** no confetti, and no staggered list entrances longer than 200 ms in total.

---

## 13. Things to avoid

- The generic AI/SaaS look: purple-blue gradients, glowing borders, stat tiles, "dashboard" grids.
- Gradients as decoration (they are allowed only in the heat map and time track).
- Glassmorphism everywhere. Blur is for the bottom nav and small map chrome only.
- Random colors: every color must be a token with one meaning.
- Inconsistent cards: one card style, one radius scale, one shadow per context.
- More than one lime (primary) button in view.
- Unnecessary animation: bouncing, looping or staggered effects that don't explain a change.
- Emoji as UI and hype copy ("🔥 Insane night!!").
- Arbitrary sizes (`text-[19px]`, `rounded-[22px]`); use the scales.
- Walls of text in sheets. If it needs a paragraph, it probably needs a better label.
- Icons from mixed icon sets. Use `src/components/map/icons.tsx` style: 2 px stroke, round caps, 24 px grid.

---

## 14. Adopting this without a big-bang redesign

1. Add the missing tokens to `@theme`: the text styles and `--color-danger`.
2. When you touch a component for any other reason, move its sizes, radii and colors onto the scales. Don't do repo-wide restyles in unrelated PRs.
3. Redesign the map pins (§10) as one dedicated change, since it affects the whole map.
4. The `frontend-designer` agent and `/review-work` check new UI against this document.
