/**
 * Regression: dragging the time slider must not pan the MapLibre map.
 *
 * Source contracts (always):
 *  - .mn-time-slot eats pointer events (no hole through to the canvas)
 *  - TimeScrubber captures pointers and reports scrubbing
 *  - MapView disables dragPan while lockPan is set
 *
 * Live check (needs `npm run dev` + playwright):
 *  BASE_URL=http://localhost:3000 node scripts/check-slider-map-pan.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`ok  ${msg}`);
  }
}

const css = read("src/app/globals.css");
const slot = css.match(/\.mn-time-slot\s*\{[^}]+\}/)?.[0] ?? "";
assert(
  /pointer-events:\s*auto/.test(slot) && !/pointer-events:\s*none/.test(slot),
  ".mn-time-slot uses pointer-events: auto (no click-through to the map)"
);
assert(/touch-action:\s*none/.test(slot), ".mn-time-slot sets touch-action: none");

const range = css.match(/\.mn-time-range\s*\{[^}]+\}/)?.[0] ?? "";
assert(/height:\s*32px/.test(range), ".mn-time-range hit area is 32px, not a 3px line");
assert(/touch-action:\s*none/.test(range), ".mn-time-range sets touch-action: none");

const scrubber = read("src/components/map/TimeScrubber.tsx");
assert(
  scrubber.includes("hoursFromClientX") &&
    scrubber.includes("onPointerMove") &&
    scrubber.includes("onScrubbingChange"),
  "TimeScrubber maps pointer X to hours (native range capture would freeze the thumb)"
);
assert(
  scrubber.includes("stopPropagation"),
  "TimeScrubber stops pointer events from reaching the map"
);

const mapView = read("src/components/MapView.tsx");
assert(
  mapView.includes("lockPan") &&
    mapView.includes("dragPan.disable()") &&
    mapView.includes("dragPan.enable()"),
  "MapView disables dragPan while lockPan is true"
);

const page = read("src/app/page.tsx");
assert(
  page.includes("lockPan={panLocked}") &&
    page.includes("onScrubbingChange={setPanLocked}"),
  "page wires slider scrubbing to MapView lockPan"
);

if (process.exitCode) {
  console.error("Source contract failed.");
  process.exit(1);
}

console.log("PASS: slider/map pan source contracts hold.");

const wantLive = process.argv.includes("--live") || process.env.SLIDER_PAN_LIVE === "1";
if (!wantLive) process.exit(0);

const { chromium } = await import("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAX_LNG_DRIFT = 0.00008;

const browser = await chromium.launch({ headless: true });
const pageObj = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await pageObj.goto(BASE, { waitUntil: "domcontentloaded" });
await pageObj.waitForFunction(() => window.__mnMap?.loaded?.() || window.__mnMap, {
  timeout: 25_000,
});
await pageObj.waitForTimeout(800);

await pageObj.getByRole("button", { name: "Open time slider" }).click();
await pageObj.waitForSelector("#mn-night-slider");

const before = await pageObj.evaluate(() => {
  const c = window.__mnMap.getCenter();
  return { lng: c.lng, lat: c.lat };
});

const slider = pageObj.locator("#mn-night-slider");
const box = await slider.boundingBox();
if (!box) throw new Error("slider bounding box missing");

const startX = box.x + box.width * 0.15;
const y = box.y + box.height / 2;
const endX = box.x + box.width - 8;
await pageObj.mouse.move(startX, y);
await pageObj.mouse.down();
await pageObj.waitForTimeout(40);
const locked = await pageObj.evaluate(() => !window.__mnMap.dragPan.isEnabled());
assert(locked, "dragPan is disabled while pointer is down on the slider");
await pageObj.mouse.move(endX, y, { steps: 18 });
const sliderValue = Number(await slider.inputValue());
assert(sliderValue > 0, `slider value moves while dragging (value=${sliderValue})`);
await pageObj.mouse.move(endX + 120, y - 40, { steps: 8 });
await pageObj.mouse.up();
await pageObj.waitForTimeout(200);

const afterScrub = await pageObj.evaluate(() => {
  const c = window.__mnMap.getCenter();
  return { lng: c.lng, lat: c.lat };
});
const scrubDrift = Math.hypot(afterScrub.lng - before.lng, afterScrub.lat - before.lat);
assert(
  scrubDrift < MAX_LNG_DRIFT,
  `map center stays put while scrubbing (drift ${scrubDrift.toFixed(6)} deg)`
);

const enabledAgain = await pageObj.evaluate(() => window.__mnMap.dragPan.isEnabled());
assert(enabledAgain, "dragPan re-enables after pointer up");

const canvas = pageObj.locator(".maplibregl-canvas");
const cbox = await canvas.boundingBox();
if (!cbox) throw new Error("canvas missing");
const mx = cbox.x + cbox.width * 0.45;
const my = cbox.y + cbox.height * 0.4;
await pageObj.mouse.move(mx, my);
await pageObj.mouse.down();
await pageObj.mouse.move(mx + 160, my, { steps: 12 });
await pageObj.mouse.up();
await pageObj.waitForTimeout(250);

const afterPan = await pageObj.evaluate(() => {
  const c = window.__mnMap.getCenter();
  return { lng: c.lng, lat: c.lat };
});
const panDrift = Math.abs(afterPan.lng - afterScrub.lng);
assert(panDrift > MAX_LNG_DRIFT, `map still pans when dragging the canvas (Δlng ${panDrift.toFixed(6)})`);

await browser.close();
if (process.exitCode) {
  console.error("FAIL: live slider/map pan check.");
  process.exit(1);
}
console.log("PASS: live slider drag does not pan the map; canvas drag still pans.");
