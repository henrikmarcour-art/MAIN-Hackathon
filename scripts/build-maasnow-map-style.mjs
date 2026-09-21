/**
 * Builds public/map-styles/maasnow-natural.json from OpenFreeMap "bright"
 * with MaasNow palette: natural but muted (not Google/Apple candy colors).
 */
import fs from "node:fs";
import path from "node:path";

const SOURCE = "https://tiles.openfreemap.org/styles/bright";
const OUT = path.join(process.cwd(), "public/map-styles/maasnow-natural.json");

/** Layer-id → paint property overrides */
const PAINT = {
  background: { "background-color": "#f1eee7" },
  water: { "fill-color": "#8ebad4" },
  "water-intermittent": { "fill-color": "#a8cade", "fill-opacity": 0.65 },
  park: { "fill-color": "#b8cfaa", "fill-opacity": 0.85 },
  "landcover-grass": { "fill-color": "#c2d6b4", "fill-opacity": 0.9 },
  "landcover-grass-park": { "fill-color": "#b8cfaa", "fill-opacity": 0.85 },
  "landcover-wood": {
    "fill-color": "#9eb38f",
    "fill-opacity": 0.35,
    "fill-outline-color": "rgba(28,28,30,0.04)",
  },
  "landuse-cemetery": { "fill-color": "#c8d4c0" },
  building: {
    "fill-color": "#e6e2da",
    "fill-antialias": true,
  },
  "building-top": {
    "fill-color": "#e6e2da",
    "fill-outline-color": "#d5d0c8",
  },
};

const WATERWAY_LINE = "#6fa3c0";

const ROAD_NEUTRAL = {
  line: "#ffffff",
  casing: "#d8d3cb",
  motorway: "#f7f4ee",
  motorwayCasing: "#ccc6bc",
  path: "#ddd6c8",
};

function patchLayer(layer) {
  if (PAINT[layer.id]) {
    layer.paint = { ...layer.paint, ...PAINT[layer.id] };
  }

  const id = layer.id;
  const p = layer.paint;
  if (!p) return;

  if (id.startsWith("waterway") && p["line-color"]) {
    p["line-color"] = WATERWAY_LINE;
  }

  if (id.includes("motorway") && !id.includes("link") && p["line-color"]) {
    if (typeof p["line-color"] === "string" && p["line-color"].startsWith("#f")) {
      p["line-color"] = ROAD_NEUTRAL.motorway;
    }
  }
  if (id.includes("motorway") && id.includes("casing") && p["line-color"]) {
    p["line-color"] = ROAD_NEUTRAL.motorwayCasing;
  }
  if (
    id.includes("bridge-trunk-primary-casing") &&
    p["line-color"] &&
    String(p["line-color"]).includes("hsl(28")
  ) {
    p["line-color"] = ROAD_NEUTRAL.casing;
  }
  if (
    (id.includes("secondary") ||
      id.includes("tertiary") ||
      id.includes("primary") ||
      id.includes("trunk") ||
      id.includes("link")) &&
    p["line-color"] &&
    typeof p["line-color"] === "string"
  ) {
    const c = p["line-color"];
    if (
      c.includes("fc8") ||
      c.includes("fea") ||
      c.includes("fff4") ||
      c.includes("e9ac") ||
      c.includes("244, 209")
    ) {
      p["line-color"] = id.includes("casing")
        ? ROAD_NEUTRAL.casing
        : ROAD_NEUTRAL.line;
    }
  }
  if (id.includes("highway-minor") || id.includes("tunnel-minor")) {
    if (p["line-color"] === "#fff") p["line-color"] = "#faf8f4";
  }
  if (id.includes("path") && p["line-color"] === "#cba") {
    p["line-color"] = ROAD_NEUTRAL.path;
  }

  if (id.startsWith("label_") || id.startsWith("poi") || id.includes("highway-name")) {
    if (p["text-color"] === "#000" || p["text-color"] === "#666") {
      p["text-color"] = "#4a4a4f";
    }
    if (p["text-halo-color"] === "#fff" || p["text-halo-color"] === "#ffffff") {
      p["text-halo-color"] = "rgba(241, 238, 231, 0.92)";
    }
  }
  if (id.includes("water") && id.includes("label") && p["text-color"]) {
    p["text-color"] = "#3d6a85";
  }
}

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Failed to fetch ${SOURCE}: ${res.status}`);
  const style = await res.json();
  style.name = "MaasNow Natural";
  style.metadata = {
    "mapbox:autocomposite": false,
    "maasnow:source": SOURCE,
  };
  for (const layer of style.layers) patchLayer(layer);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(style));
  console.log(`Wrote ${OUT} (${style.layers.length} layers)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
