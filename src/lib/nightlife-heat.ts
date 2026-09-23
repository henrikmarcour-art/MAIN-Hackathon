import type { Venue } from "@/data/events";
import type { Filter } from "@/components/map/types";
import { displayAttendeeCount, type CrowdQuery } from "@/lib/venue-attendance";
import type { Map as MapLibreMap } from "maplibre-gl";

/** Nightlife ramp: dark blue → violet → pink → gold */
const RAMP: [number, [number, number, number]][] = [
  [0, [11, 26, 84]],
  [0.22, [30, 58, 184]],
  [0.42, [91, 63, 214]],
  [0.62, [168, 69, 232]],
  [0.78, [240, 75, 168]],
  [0.9, [255, 122, 69]],
  [1, [245, 185, 66]],
];

const SAMPLE = 0.5;
const BLUR = 7;
/** Peak field value that maps to gold. */
const DENSITY_CAP = 165;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function colorAt(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < RAMP.length; i++) {
    if (x <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1];
      const [t1, c1] = RAMP[i];
      const u = (x - t0) / (t1 - t0 || 1);
      return [
        lerp(c0[0], c1[0], u),
        lerp(c0[1], c1[1], u),
        lerp(c0[2], c1[2], u),
      ];
    }
  }
  return RAMP[RAMP.length - 1][1];
}

export type HeatPoint = { lng: number; lat: number; weight: number };

export function venuesToHeatPoints(
  venues: Venue[],
  goingIds: Set<string>,
  filter: Filter,
  crowd: CrowdQuery
): HeatPoint[] {
  return venues.map((v) => ({
    lng: v.lng,
    lat: v.lat,
    weight: displayAttendeeCount(v, goingIds, filter, crowd),
  }));
}

function boxBlurAlpha(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
) {
  const tmp = new Uint8ClampedArray(data.length);
  const r = Math.max(1, radius | 0);

  for (let y = 0; y < h; y++) {
    let sum = 0;
    let count = 0;
    const row = y * w;
    for (let k = 0; k <= r && k < w; k++) {
      sum += data[(row + k) * 4 + 3];
      count++;
    }
    for (let x = 0; x < w; x++) {
      tmp[(row + x) * 4 + 3] = sum / count;
      const left = x - r;
      const right = x + r + 1;
      if (left >= 0) {
        sum -= data[(row + left) * 4 + 3];
        count--;
      }
      if (right < w) {
        sum += data[(row + right) * 4 + 3];
        count++;
      }
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    let count = 0;
    for (let k = 0; k <= r && k < h; k++) {
      sum += tmp[(k * w + x) * 4 + 3];
      count++;
    }
    for (let y = 0; y < h; y++) {
      data[(y * w + x) * 4 + 3] = sum / count;
      const top = y - r;
      const bot = y + r + 1;
      if (top >= 0) {
        sum -= tmp[(top * w + x) * 4 + 3];
        count--;
      }
      if (bot < h) {
        sum += tmp[(bot * w + x) * 4 + 3];
        count++;
      }
    }
  }
}

export class NightlifeHeatOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private intensity: HTMLCanvasElement;
  private ictx: CanvasRenderingContext2D;
  private map: MapLibreMap;
  private points: HeatPoint[] = [];
  private visible = true;
  private removeFns: Array<() => void> = [];
  private raf = 0;

  constructor(map: MapLibreMap) {
    this.map = map;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "mn-heat-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context for heatmap");
    this.ctx = ctx;

    this.intensity = document.createElement("canvas");
    const ictx = this.intensity.getContext("2d", { willReadFrequently: true });
    if (!ictx) throw new Error("No 2d context for heatmap");
    this.ictx = ictx;

    map.getCanvasContainer().appendChild(this.canvas);

    const redraw = () => this.schedule();
    map.on("move", redraw);
    map.on("zoom", redraw);
    map.on("resize", redraw);
    this.removeFns.push(() => {
      map.off("move", redraw);
      map.off("zoom", redraw);
      map.off("resize", redraw);
      if (this.raf) cancelAnimationFrame(this.raf);
    });
    this.draw();
  }

  setPoints(points: HeatPoint[]) {
    this.points = points;
    this.draw();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.canvas.style.opacity = visible ? "1" : "0";
    if (visible) this.draw();
  }

  destroy() {
    this.removeFns.forEach((fn) => fn());
    this.canvas.remove();
  }

  private schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  }

  private draw() {
    if (!this.visible) return;
    const { canvas, ctx, map, intensity, ictx } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = map.getCanvas().clientWidth;
    const h = map.getCanvas().clientHeight;
    if (w < 2 || h < 2) return;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const iw = Math.max(1, Math.round(w * SAMPLE));
    const ih = Math.max(1, Math.round(h * SAMPLE));
    if (intensity.width !== iw || intensity.height !== ih) {
      intensity.width = iw;
      intensity.height = ih;
    }

    ictx.setTransform(1, 0, 0, 1, 0, 0);
    ictx.clearRect(0, 0, iw, ih);
    ictx.globalCompositeOperation = "lighter";

    const zoom = map.getZoom();
    const zoomScale = Math.pow(2, zoom - 14.2);
    const sx = iw / w;
    const sy = ih / h;

    // Grayscale kernels only — colour comes from merged density, not per pin.
    for (const p of this.points) {
      const { x, y } = map.project([p.lng, p.lat]);
      const t = Math.min(1, Math.max(0.12, (p.weight - 6) / 200));
      const radius = (150 + t * 70) * zoomScale * SAMPLE;
      const px = x * sx;
      const py = y * sy;
      if (px < -radius || py < -radius || px > iw + radius || py > ih + radius) {
        continue;
      }

      const peak = 0.11 + t * 0.16;
      const g = ictx.createRadialGradient(px, py, 0, px, py, radius);
      g.addColorStop(0, `rgba(255,255,255,${peak})`);
      g.addColorStop(0.18, `rgba(255,255,255,${peak * 0.62})`);
      g.addColorStop(0.4, `rgba(255,255,255,${peak * 0.28})`);
      g.addColorStop(0.68, `rgba(255,255,255,${peak * 0.08})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ictx.fillStyle = g;
      ictx.beginPath();
      ictx.arc(px, py, radius, 0, Math.PI * 2);
      ictx.fill();
    }

    ictx.globalCompositeOperation = "source-over";
    const img = ictx.getImageData(0, 0, iw, ih);
    boxBlurAlpha(img.data, iw, ih, BLUR);
    boxBlurAlpha(img.data, iw, ih, BLUR);

    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      const dens = px[i + 3];
      const t = Math.min(1, dens / DENSITY_CAP);
      const fade = smoothstep(0.03, 0.55, t);
      if (fade < 0.02) {
        px[i] = 0;
        px[i + 1] = 0;
        px[i + 2] = 0;
        px[i + 3] = 0;
        continue;
      }
      const [r, g, b] = colorAt(Math.pow(t, 0.82));
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = Math.round(fade * 172);
    }
    ictx.putImageData(img, 0, 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(intensity, 0, 0, w, h);
  }
}
