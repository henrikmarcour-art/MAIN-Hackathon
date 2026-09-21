/**
 * Headless check: marker anchors track map.project(lngLat) while zooming and after UI updates.
 * Run with dev server: npm run dev && node scripts/check-marker-anchor.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAX_DRIFT_PX = 2.5;

async function measure(page) {
  return page.evaluate(() => {
    const map = window.__mnMap;
    if (!map) throw new Error("window.__mnMap missing (dev server only)");
    const canvas = map.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const anchors = [...document.querySelectorAll(".mn-marker-anchor")];
    let worst = 0;
    let worstId = "";
    for (const a of anchors) {
      const id =
        a.querySelector(".mn-marker")?.getAttribute("aria-label") ?? "?";
      const lng = Number(a.dataset.lng);
      const lat = Number(a.dataset.lat);
      if (!Number.isFinite(lng)) continue;
      const projected = map.project([lng, lat]);
      const expectedX = rect.left + projected.x;
      const expectedY = rect.top + projected.y;
      const r = a.getBoundingClientRect();
      const actualX = r.left + r.width / 2;
      const actualY = r.top + r.height / 2;
      const d = Math.hypot(actualX - expectedX, actualY - expectedY);
      if (d > worst) {
        worst = d;
        worstId = id;
      }
    }
    return { worst, worstId, count: anchors.length, zoom: map.getZoom() };
  });
}

async function zoomVia(page, delta) {
  await page.evaluate((d) => {
    const map = window.__mnMap;
    map.setZoom(map.getZoom() + d);
  }, delta);
  await page.waitForTimeout(350);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.querySelectorAll(".mn-marker-anchor").length > 0,
    { timeout: 25_000 }
  );

  let failed = false;
  const report = (label, m) => {
    console.log(
      `${label} @ z=${m.zoom.toFixed(1)}: ${m.count} markers, worst ${m.worst.toFixed(2)}px (${m.worstId})`
    );
    if (m.worst > MAX_DRIFT_PX) failed = true;
  };

  report("initial", await measure(page));

  for (const z of [12, 14, 16, 18, 13.5]) {
    await page.evaluate((zoom) => window.__mnMap.setZoom(zoom), z);
    await page.waitForTimeout(350);
    report(`setZoom ${z}`, await measure(page));
  }

  for (let i = 0; i < 8; i++) {
    await zoomVia(page, 0.4);
    report(`zoom in step ${i + 1}`, await measure(page));
  }
  for (let i = 0; i < 8; i++) {
    await zoomVia(page, -0.4);
    report(`zoom out step ${i + 1}`, await measure(page));
  }

  // Open a sheet and toggle I'm going — count/size updates must not shift anchor.
  await page.locator(".mn-marker").first().click({ force: true });
  await page.waitForTimeout(500);
  const goingBtn = page.getByRole("button", { name: /going/i }).filter({
    hasText: /^I.m going$/i,
  });
  if (await goingBtn.count()) {
    await goingBtn.first().click();
    await page.waitForTimeout(400);
    report("after I'm going", await measure(page));
    for (let i = 0; i < 4; i++) await zoomVia(page, 0.5);
    report("after I'm going + zoom in", await measure(page));
    for (let i = 0; i < 4; i++) await zoomVia(page, -0.5);
    report("after I'm going + zoom out", await measure(page));
  } else {
    console.log("skip: event sheet going button not found");
  }

  await browser.close();
  if (failed) {
    console.error(`FAIL: drift exceeded ${MAX_DRIFT_PX}px`);
    process.exit(1);
  }
  console.log("PASS: markers stay anchored under zoom and going toggle.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
