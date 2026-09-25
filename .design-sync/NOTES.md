# design-sync notes (MaasNow → Claude Design project "maasnow")

MaasNow is a Next.js app, not a published component library. There is no `dist/`, no `.d.ts` build and no Storybook, so the sync builds its own input package.

## How the build works

- **Build first:** run `node .design-sync/build.mjs` (cfg.buildCmd) before the converter. It writes the gitignored staging package `.design-sync/.cache/pkg/`:
  - `maasnow.css`: `.design-sync/ds-styles.css` compiled with `@tailwindcss/postcss` (the app's `globals.css` plus `@source inline(...)` safelists).
  - `types/`: `tsc` declarations for `.design-sync/entry.ts`, with the `@/` alias rewritten to relative paths.
  - `index.ts`: the bundle entry.
  - `package.json`: name `maasnow`, with `types` pointing at the declarations.
- **Converter entry:** `--entry ./.design-sync/.cache/pkg/index.ts --node-modules ./node_modules`. PKG_DIR is `.design-sync/.cache/pkg`, so every package-relative config path (`srcDir`, `tsconfig`, `componentSrcMap`, `guidelinesGlob`) starts with `../../../`. `cssEntry` must live inside PKG_DIR, which is why the CSS is written there.
- **Scope lives in `.design-sync/entry.ts`:** explicit named re-exports, needed because most components are `export default`. Left out on purpose: `MapView` (needs MapLibre and a live map) and the large panels wired to page state (`EventSheet`, `CreatePanel`, `ProfilePanel`, `AttendeeListSheet`). The icons in `map/icons.tsx` and the seed data are exported in the bundle but excluded as components (null entries in `componentSrcMap`).
- **Stylesheet fixes in `build.mjs`:**
  - The app-shell rule `body { position: fixed; overflow: hidden }` is dropped because it clips preview cards.
  - The app loads Geist through `next/font`, so there's no `@font-face` to ship. `build.mjs` prepends a Google Fonts `@import` and sets `--font-geist: "Geist"`. `runtimeFontPrefixes: ["Geist"]` covers it.
- **Precompiled Tailwind:** only classes used in `src/` or listed in the `@source inline` safelists in `ds-styles.css` exist. If the conventions header names a new utility, add it to the safelist first and rebuild.
- **Render check:** needs Playwright 1.58.x (installed in `.ds-sync/`) to match the cached Chromium 1208 in `~/Library/Caches/ms-playwright`. Newer Playwright versions expect a different Chromium.
- **Previews:** stages in the preview files mimic the app's positioned parent (`relative` plus a real size), because the components position themselves `absolute`. The capture viewport is desktop-wide, so the `md:` layouts are what render.
  - `TopBar` needs `cardMode: single` with a `1320x140` viewport to reach the `xl` grid.
  - `InviteCard`, `MapModeSheet`, `DiscoveryRail`, `ForYouPanel`, `MapNotice`, `TimeScrubber` and `BottomNav` use `cardMode: column`.
- **`BrandPill`:** `compact` only hides a subtitle that itself only shows at `xl`, so its preview has a single `Default` cell.

## Known render warns

- `[FONT_REMOTE] "SF Pro Text"`: part of the system-font fallback stack in `--font-sans`, which is expected. The informational warn is attributed to "SF Pro Text" even though the remote `@import` serves Geist.

## Re-sync risks

- **Clock-dependent preview:** `TimeScrubber` calls `maxForwardHours(new Date())`, so its tick range depends on when the capture runs. The other previews pin `crowd.at` to a fixed date. A regrade that differs only in scrubber ticks is noise.
- **Hand-mirrored types:** the `.d.ts` files reference `Venue`, `Invitation`, `CrowdQuery` and `Filter` without inlining them. The conventions header describes their shapes by hand, so update `.design-sync/conventions.md` if those types in `src/data/events.ts` or `src/lib/venue-attendance.ts` change.
- **Scope doesn't follow the app:** a new component or a new default export is not synced until you add it to `entry.ts`. Renaming or moving a file under `src/components` breaks `entry.ts` and the `../../../src/...` pins in `componentSrcMap`.
- **Style drift:** `globals.css` changes flow in automatically through `build.mjs`. New tokens need adding to the `@source inline` color list in `ds-styles.css` if designs should be able to use them as classes.
- **Font dependency:** Geist loads from Google Fonts at runtime (network-dependent). If you swap the font in `layout.tsx`, update `build.mjs` and `runtimeFontPrefixes`.
