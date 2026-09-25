import type {
  LayerSpecification,
  SourceSpecification,
  StyleSpecification,
} from "maplibre-gl";
import { osmPlaces } from "@/data/maastricht-places";
import { venues } from "@/data/events";

export type MapStyleId = "standard" | "night" | "satellite";

export const MAP_STYLE_IDS: readonly MapStyleId[] = [
  "standard",
  "night",
  "satellite",
];

export function isDarkMapStyle(id: MapStyleId) {
  return id !== "standard";
}

/**
 * The colour at the map's edges. Safari 26 ignores theme-color and tints the
 * status-bar strip and the area around its floating toolbar from the page
 * background, so the page background follows the map to read edge-to-edge.
 */
export const MAP_CANVAS_COLOR: Record<MapStyleId, string> = {
  standard: "#f1eee7",
  // Warm black (tokens: night-map), not blue-black.
  night: "#12110f",
  satellite: "#1b1c1e",
};

/** Our recoloured OpenFreeMap "bright" (rebuilt by `npm run map:style`). */
const BASE_STYLE_URL = "/map-styles/maasnow-natural.json";
const FALLBACK_STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

let basePromise: Promise<StyleSpecification> | null = null;

async function fetchStyle(url: string): Promise<StyleSpecification> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Map style ${url} returned ${res.status}`);
  return (await res.json()) as StyleSpecification;
}

/** Loads the base style once; every map style is derived from it. */
export function loadBaseStyle(): Promise<StyleSpecification> {
  if (!basePromise) {
    basePromise = fetchStyle(BASE_STYLE_URL)
      .catch(() => fetchStyle(FALLBACK_STYLE_URL))
      .catch((err) => {
        basePromise = null;
        throw err;
      });
  }
  return basePromise;
}

/** Shown on first paint, before the real style has loaded. */
export function placeholderStyle(id: MapStyleId): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": MAP_CANVAS_COLOR[id] },
      },
    ],
  };
}

export type BuildOptions = {
  /** Desktop: draw every other known place as a quiet speck. */
  places?: boolean;
};

export function buildMapStyle(
  id: MapStyleId,
  base: StyleSpecification,
  { places = false }: BuildOptions = {}
): StyleSpecification {
  const quiet = quietStyle(base);
  const style =
    id === "night" ? nightStyle(quiet) : id === "satellite" ? satelliteStyle(quiet) : quiet;
  return withPlaces(style, id, places);
}

// ---------------------------------------------------------------------------
// Quiet specks (desktop): the ~130 OpenStreetMap bars, cafés and restaurants
// that aren't one of tonight's venues, as tiny points. They say "the city is
// full of places" without competing with the venues MaasNow pins itself.
// A map layer, not DOM markers, so they cost nothing while scrubbing time.
// ---------------------------------------------------------------------------

export const PLACES_LAYER_ID = "mn-places";

const VENUE_NAMES = new Set(venues.map((v) => v.name.toLowerCase()));

const PLACES_GEOJSON = {
  type: "FeatureCollection" as const,
  features: osmPlaces
    .filter((p) => !VENUE_NAMES.has(p.name.toLowerCase()))
    .map((p) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    })),
};

const SPECK: Record<MapStyleId, { color: string; opacity: number; stroke: string }> = {
  standard: { color: "#0e0e10", opacity: 0.4, stroke: "rgba(255,255,255,0.9)" },
  night: { color: "#ffe9cc", opacity: 0.36, stroke: "rgba(0,0,0,0)" },
  satellite: { color: "#ffffff", opacity: 0.6, stroke: "rgba(0,0,0,0.7)" },
};

function withPlaces(
  style: StyleSpecification,
  id: MapStyleId,
  visible: boolean
): StyleSpecification {
  const s = SPECK[id];
  const layer: LayerSpecification = {
    id: PLACES_LAYER_ID,
    type: "circle",
    source: PLACES_LAYER_ID,
    minzoom: 13,
    layout: { visibility: visible ? "visible" : "none" },
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 1.2, 16, 2.2, 18, 3],
      "circle-color": s.color,
      "circle-opacity": s.opacity,
      "circle-stroke-width": 0.8,
      "circle-stroke-color": s.stroke,
      "circle-stroke-opacity": s.opacity,
    },
  };
  return {
    ...style,
    sources: {
      ...style.sources,
      [PLACES_LAYER_ID]: { type: "geojson", data: PLACES_GEOJSON },
    },
    layers: [...style.layers, layer],
  };
}

// ---------------------------------------------------------------------------
// Quiet base map: the map is a canvas for MaasNow content, so drop the
// provider's shops, cafés, bus stops and road furniture, and keep only a few
// landmarks for orientation.
// ---------------------------------------------------------------------------

const HIDDEN_SOURCE_LAYERS = new Set(["poi", "aerodrome_label", "housenumber"]);

// "attraction" is too noisy (tour operators, breweries) and "theatre" would
// duplicate venues MaasNow already pins itself.
const LANDMARK_CLASSES = ["museum", "castle", "monument", "place_of_worship"];

function sourceLayer(layer: LayerSpecification): string | undefined {
  return "source-layer" in layer ? layer["source-layer"] : undefined;
}

function isNoiseLayer(layer: LayerSpecification) {
  const src = sourceLayer(layer);
  if (src && HIDDEN_SOURCE_LAYERS.has(src)) return true;
  if (layer.type !== "symbol") return false;
  // One-way arrows and road shields.
  if (src === "transportation") return true;
  return src === "transportation_name" && !!layer.layout?.["icon-image"];
}

function textFont(style: StyleSpecification): string[] {
  for (const layer of style.layers) {
    if (layer.type !== "symbol") continue;
    const font = layer.layout?.["text-font"];
    if (Array.isArray(font) && font.every((f) => typeof f === "string")) {
      return font as string[];
    }
  }
  return ["Noto Sans Regular"];
}

function vectorSourceId(style: StyleSpecification): string {
  const entry = Object.entries(style.sources).find(
    ([, s]) => s.type === "vector"
  );
  return entry?.[0] ?? "openmaptiles";
}

export function quietStyle(base: StyleSpecification): StyleSpecification {
  const background = base.layers.find((l) => l.type === "background");
  const halo =
    (background?.paint as { "background-color"?: string } | undefined)?.[
      "background-color"
    ] ?? "#f1eee7";

  const landmarks: LayerSpecification = {
    id: "mn-landmarks",
    type: "symbol",
    source: vectorSourceId(base),
    "source-layer": "poi",
    minzoom: 15,
    filter: [
      "any",
      ["match", ["get", "class"], LANDMARK_CLASSES, true, false],
      [
        "all",
        ["==", ["get", "class"], "railway"],
        ["==", ["get", "subclass"], "station"],
      ],
    ],
    layout: {
      "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
      "text-font": textFont(base),
      "text-size": 11,
      "text-max-width": 8,
      "text-padding": 6,
      "symbol-sort-key": ["get", "rank"],
    },
    paint: {
      "text-color": "#8a857b",
      "text-halo-color": halo,
      "text-halo-width": 1.2,
    },
  };

  const layers = base.layers.filter((l) => !isNoiseLayer(l));
  // Neighbourhood and city names keep priority over landmarks.
  const firstPlaceLabel = layers.findIndex(
    (l) => l.type === "symbol" && sourceLayer(l) === "place"
  );
  const at = firstPlaceLabel === -1 ? layers.length : firstPlaceLabel;
  return {
    ...base,
    layers: [...layers.slice(0, at), landmarks, ...layers.slice(at)],
  };
}

// ---------------------------------------------------------------------------
// Night: a deliberate, low-glare palette (not the provider's generic dark
// theme) so pins and the lime "you" states carry the screen after dark.
// ---------------------------------------------------------------------------

// Warm darks: the approved Night mode is "sodium night without the amber",
// warm-toned greys that sit with the warm-black panel (tokens: night-*).
const NIGHT = {
  bg: MAP_CANVAS_COLOR.night,
  landuse: "#15130f",
  residential: "#161411",
  park: "#141510",
  wood: "#13140f",
  water: "#0e1113",
  waterLine: "#141a1c",
  building: "#1e1b17",
  buildingTop: "#221e19",
  buildingOutline: "#2a251f",
  road: "#27231d",
  roadMajor: "#342e26",
  roadCasing: "#171510",
  path: "#211d18",
  rail: "#2c2720",
  boundary: "#3a332a",
  text: "#9c9284",
  textStrong: "#d6cbbb",
  textWater: "#5f6a68",
  landmark: "#a89d8d",
  halo: "#12110f",
};

type Paint = Record<string, unknown>;

function nightPaint(layer: LayerSpecification): Paint | null {
  const src = sourceLayer(layer) ?? "";
  const id = layer.id;
  switch (layer.type) {
    case "background":
      return { "background-color": NIGHT.bg };
    case "fill": {
      let color = NIGHT.landuse;
      if (src === "water") color = NIGHT.water;
      else if (src === "park") color = NIGHT.park;
      else if (src === "landcover") color = id.includes("wood") ? NIGHT.wood : NIGHT.park;
      else if (src === "landuse" && /residential|suburb/.test(id)) color = NIGHT.residential;
      else if (src === "building") color = id.includes("top") ? NIGHT.buildingTop : NIGHT.building;
      else if (src === "transportation" || src === "aeroway") color = NIGHT.road;
      const paint: Paint = { "fill-color": color };
      if (layer.paint && "fill-outline-color" in layer.paint) {
        paint["fill-outline-color"] = src === "building" ? NIGHT.buildingOutline : color;
      }
      return paint;
    }
    case "line": {
      let color = NIGHT.road;
      if (src === "waterway") color = NIGHT.waterLine;
      else if (src === "boundary") color = NIGHT.boundary;
      else if (id.includes("casing")) color = NIGHT.roadCasing;
      else if (/rail|cablecar|ferry/.test(id)) color = NIGHT.rail;
      else if (id.includes("path")) color = NIGHT.path;
      else if (/motorway|trunk|primary|secondary/.test(id)) color = NIGHT.roadMajor;
      return { "line-color": color };
    }
    case "symbol": {
      let color = NIGHT.text;
      if (src === "water_name" || src === "waterway") color = NIGHT.textWater;
      else if (id === "mn-landmarks") color = NIGHT.landmark;
      else if (src === "place" && /city|town/.test(id)) color = NIGHT.textStrong;
      return {
        "text-color": color,
        "text-halo-color": NIGHT.halo,
        "text-halo-width": 1.2,
      };
    }
    default:
      return null;
  }
}

export function nightStyle(quiet: StyleSpecification): StyleSpecification {
  const layers = quiet.layers.flatMap((layer): LayerSpecification[] => {
    if (layer.type === "raster" || layer.type === "hillshade") return [];
    const override = nightPaint(layer);
    if (!override) return [layer];
    const paint: Paint = { ...(layer.paint as Paint | undefined) };
    delete paint["fill-pattern"];
    delete paint["line-pattern"];
    return [{ ...layer, paint: { ...paint, ...override } } as LayerSpecification];
  });
  return { ...quiet, layers };
}

// ---------------------------------------------------------------------------
// Satellite: PDOK aerial photos (Beeldmateriaal Nederland, CC BY 4.0) with
// our own street and place labels on top. Free, no key; PDOK requires a
// Referer header, which browsers send for these tile requests by default.
// ---------------------------------------------------------------------------

const PDOK_AERIAL_TILES =
  "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg";

export const PDOK_ATTRIBUTION =
  'Luchtfoto <a href="https://www.beeldmateriaal.nl" target="_blank" rel="noopener">© Beeldmateriaal Nederland</a> ' +
  '(<a href="https://creativecommons.org/licenses/by/4.0/deed.nl" target="_blank" rel="noopener">CC BY 4.0</a>) via ' +
  '<a href="https://www.pdok.nl" target="_blank" rel="noopener">PDOK</a>';

const SATELLITE_LABEL_SOURCE_LAYERS = new Set([
  "transportation_name",
  "place",
  "water_name",
  "waterway",
  "poi",
]);

export function satelliteStyle(quiet: StyleSpecification): StyleSpecification {
  const vectorId = vectorSourceId(quiet);
  const aerial: SourceSpecification = {
    type: "raster",
    tiles: [PDOK_AERIAL_TILES],
    tileSize: 256,
    maxzoom: 21,
    // The Netherlands; avoids requesting tiles PDOK does not cover.
    bounds: [3.0, 50.6, 7.4, 53.7],
    attribution: PDOK_ATTRIBUTION,
  };
  const labels = quiet.layers
    .filter(
      (l) =>
        l.type === "symbol" &&
        SATELLITE_LABEL_SOURCE_LAYERS.has(sourceLayer(l) ?? "")
    )
    .map((layer) => {
      const strong = sourceLayer(layer) === "place";
      return {
        ...layer,
        paint: {
          ...(layer.paint as Paint | undefined),
          "text-color": strong ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
          "text-halo-color": "rgba(10, 11, 12, 0.72)",
          "text-halo-width": 1.4,
          "text-halo-blur": 0.4,
        },
      } as LayerSpecification;
    });
  return {
    ...quiet,
    sources: { [vectorId]: quiet.sources[vectorId], "pdok-aerial": aerial },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": MAP_CANVAS_COLOR.satellite },
      },
      {
        id: "pdok-aerial",
        type: "raster",
        source: "pdok-aerial",
        paint: {
          // Darkened about a fifth (the approved "22% scrim") and calmed, so
          // light labels and MaasNow's pins stay the loudest thing.
          "raster-saturation": -0.2,
          "raster-brightness-max": 0.78,
          "raster-contrast": 0.06,
          "raster-fade-duration": 150,
        },
      },
      ...labels,
    ],
  };
}
