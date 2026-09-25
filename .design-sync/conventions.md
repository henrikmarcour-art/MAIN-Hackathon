# MaasNow — how to build with it

MaasNow is a mobile-first night-out map for Maastricht: calm, warm-paper surfaces, graphite type, one lime "live" accent. Screens float over a map: controls are small pills and rounded cards with soft shadows, never heavy chrome.

## Setup

No provider or wrapper is needed. Link `styles.css` once (it carries Tailwind v4 utilities, the tokens, the `mn-*` component classes and Geist from Google Fonts), load `_ds_bundle.js`, then use `window.MaasNow.*`.

**Positioning gotcha:** `TopBar`, `BottomNav`, `DiscoveryRail`, `ForYouPanel`, `MapNotice`, `MapModeSheet` and `InviteCard` position themselves `absolute` against their parent (top bar at the top, nav and rail at the bottom, sheets and overlays covering it). Always render them inside a `position: relative` screen container with a real height (e.g. `className="relative overflow-hidden bg-surface-2" style={{ width: 390, height: 844 }}`), or they escape the layout. Layout switches at Tailwind's `md` (768px) and `xl` (1280px) breakpoints, which follow the viewport, not the container.

## Data

The bundle exports the app's seed data, so use it instead of inventing records: `venues` (Venue[]: `id, name, category, address, time, vibe, price, goingCount, friendsGoing, busy?`), `people` (keyed `leo`, `thies`, `mara`…), `friends`, `currentUser`, `invitations` (`{ id, venueId, from, message }`), `categoryMeta`.
- `crowd` props take `{ mode: "stillActiveOrComing", at: new Date() }`.
- `goingIds` is a `Set<string>` of venue ids.
- `filter` is one of `"all" | "friends" | "trending" | "bar" | "club" | "event" | "food"`.

## Styling idiom: Tailwind utilities on MaasNow tokens

Use these classes for your own layout; don't hard-code hex values.

| Family | Classes |
|---|---|
| Color (bg-/text-/border-) | mobile: `graphite`, `graphite-soft`, `graphite-muted`, `surface`, `surface-2`, `line` · desktop panel: `panel`, `ink`, `ink-soft`, `ink-muted`, `mist`, `hairline` · Night mode: `night`, `night-2`, `night-3`, `night-ink`, `violet-night` · meaning: `lime`, `lime-deep`, `orange`, `violet`, `cobalt` |
| Type scale | `text-hero` 48 (desktop panel titles), `text-feature` 38, `text-display` 28, `text-title` 22, `text-headline` 17, `text-body` 15, `text-meta` 13, `text-caption` 11 (uppercase labels). Use these, not `text-[NNpx]`; times and counts use `font-mono` |
| Shadows | `shadow-control` (pills and buttons), `shadow-float` (cards), `shadow-sheet` (bottom sheets) |
| Component classes | `mn-control` (frosted floating pill surface), `mn-chip` (filter chip), `mn-live-dot` (lime live indicator), `mn-card` |
| Motion | `animate-fade`, `animate-sheet` |

Colour roles: graphite is primary text and active states. Lime means "live now" and is only ever a small dot, never a fill. Orange means busy or trending counts. Violet means private invitations. Surfaces are warm (`surface` #faf8f4 on `surface-2` #f1eee7).

**Reading the token list:** the type scale is `--text-<step>` plus sub-tokens `--text-<step>--line-height`, `--letter-spacing` and `--font-weight`. These are typography, even though the generated token index groups every `--text-*` name under colour. `--font-geist` and `--font-geist-mono` are set at runtime by the app's font loader; in designs, use `--font-sans` and `--font-mono`.

CSS variables are available too: `var(--color-<name>)` for every colour above, plus `var(--shadow-control)` and `var(--shadow-float)`.

**The stylesheet is precompiled, not a live Tailwind.** Only classes that already exist in `styles.css` work. Besides the token classes above, you get common layout utilities: `flex`, `grid`, `flex-col`, `items-center`, `justify-between`, `gap-/p-/px-/py-/pt-/pb-/m-/mt-/mb-` with steps `0 1 2 3 4 5 6 8 10 12`, `rounded-{md,lg,xl,2xl,3xl,full}`, `font-{medium,semibold,bold}`, `w-full`, `truncate` and similar. Arbitrary values such as `h-[844px]` or `text-[13px]` do **not** exist. Use inline `style` for exact sizes. The body font is already Geist, so no font class is needed.

## Where the truth lives

`guidelines/DESIGN_SYSTEM.md` (type scale, pin hierarchy, spacing) and `guidelines/PRODUCT_UI_DIRECTION.md` (tone and layout rules). Read them before composing a new screen. Each component's props are in `components/<group>/<Name>/<Name>.d.ts`, with examples in `<Name>.prompt.md`.

## Example: a phone screen

```jsx
const { TopBar, DiscoveryRail, BottomNav, venues } = window.MaasNow;
const crowd = { mode: "stillActiveOrComing", at: new Date() };

function Tonight() {
  const [filter, setFilter] = React.useState("all");
  const [tab, setTab] = React.useState("map");
  return (
    <div className="relative overflow-hidden bg-surface-2" style={{ width: 390, height: 844 }}>
      <TopBar filter={filter} onFilter={setFilter} venues={venues} goingIds={new Set()} crowd={crowd} onPick={() => {}} />
      <DiscoveryRail venues={venues.slice(0, 8)} goingIds={new Set()} filter={filter} crowd={crowd} headlineCount={412} onPick={() => {}} />
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
```
