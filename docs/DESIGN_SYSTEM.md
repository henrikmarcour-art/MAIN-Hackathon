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

- **One meaning per color.** Orange always means busy, violet private, cobalt friends and lime "you/primary". Category (bar, club, event, food) is shown with an **icon and label, not a color**. The map pins break this today; see §10.
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

System font stack: SF Pro on Apple devices, Segoe UI on Windows (`--font-sans`). It's fast, native and needs no font loading. Weights: **500, 600 and 700 only** (400 for long body text).

| Style | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 28 / 32 | 700 | −0.02em | Screen titles ("For You", "Tonight") |
| `title` | 22 / 28 | 700 | −0.015em | Venue name in the detail sheet, section titles |
| `headline` | 17 / 22 | 600 | −0.01em | Card titles, list-row titles |
| `body` | 15 / 20 | 400–500 | 0 | Body text, button labels (600) |
| `meta` | 13 / 18 | 500 | 0 | Time, venue, price, counts |
| `caption` | 11 / 14 | 600, UPPERCASE | +0.06em | Eyebrows, badges, tab labels |

- Numbers (times, counts, prices) always use `tabular-nums`.
- **Today the app uses 12 font sizes (10–30 px).** Map them onto the scale: 10→11, 12→13, 14→15, 18→17, 24→22, 30→28.
- When the redesign starts, add these as Tailwind v4 theme tokens (`--text-display` …) so components use `text-title` instead of `text-[22px]`.

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
- **Desktop (≥ 768 px):** the sheet becomes a 400 px side panel on the right, with the same content.

---

## 10. Map pins

**Target system** (today's pins color by category; move to this in the redesign):

| State | Look |
|---|---|
| Default | `surface` circle, `graphite` category icon, `shadow-control`, 36 px |
| Busy / trending | Default + `orange` ring and count badge; the **only** pin with a looping halo |
| Friends going | Up to 2 avatars inside the pin + a `cobalt` ring |
| Private (visible to you) | `violet` fill, white lock icon |
| You're going | `lime` fill, `graphite` icon |
| Selected | Scale 1.15 + a 3 px `graphite` ring + a name label below; others dim to 60% |
| Not open at the selected time | 40% opacity, no badge |
| Cluster | `graphite` circle with a white count; tap zooms in |

- **Pin size** scales with crowd (36–48 px), never more.
- **Labels** only for the selected pin and at high zoom.
- **Counts** use `tabular-nums` and at most 3 characters ("99+").

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
