"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  invitations,
  MAASTRICHT_CENTER,
  MAASTRICHT_CENTER_MOBILE,
  type Category,
  type Venue,
} from "@/data/events";
import type { Filter } from "@/components/map/types";
import {
  buildMapStyle,
  isDarkMapStyle,
  loadBaseStyle,
  placeholderStyle,
  type MapStyleId,
} from "@/lib/map/styles";
import { metersPerPixel } from "@/lib/map/geo";
import {
  planPins,
  prominentCap,
  type PinCandidate,
  type PinTier,
} from "@/lib/map/pin-tier";
import { loadPreferences } from "@/lib/preferences";
import type { UserPosition } from "@/lib/use-user-location";

/** Ask the map to move; a new `nonce` repeats the same request. */
export type CameraRequest = { target: "user" | "city"; nonce: number };
import {
  attendeeCountNoun,
  displayAttendeeCount,
  type CrowdQuery,
} from "@/lib/venue-attendance";

type Props = {
  venues: Venue[];
  selectedId: string | null;
  goingIds: Set<string>;
  onSelect: (id: string) => void;
  /** Tap on the empty map (not a marker) */
  onMapClick: () => void;
  /** Fly to this id when it changes (used after accepting an invite) */
  focusId: string | null;
  mapStyle: MapStyleId;
  filter: Filter;
  crowd: CrowdQuery;
  userPosition: UserPosition | null;
  cameraRequest: CameraRequest | null;
  /** The visitor started dragging the map themselves. */
  onUserPan?: () => void;
  /** When true, MapLibre pan is off so overlay controls can be dragged. */
  lockPan?: boolean;
  pickMode?: boolean;
  pickLngLat?: { lng: number; lat: number } | null;
  onPick?: (lngLat: { lng: number; lat: number }) => void;
};

type VenueMarker = { marker: maplibregl.Marker; hit: HTMLButtonElement };

function createMarkerAnchor(hit: HTMLButtonElement) {
  const anchor = document.createElement("div");
  anchor.className = "mn-marker-anchor";
  anchor.appendChild(hit);
  return anchor;
}

/** Visible pin radius per tier, for the on-screen overlap check. */
const PIN_RADIUS: Record<Exclude<PinTier, "quiet">, number> = {
  relevant: 15,
  social: 17,
};
/** Minimum gap between two prominent pins before the weaker one becomes a dot. */
const PIN_GAP = 6;

const svg = (paths: string) =>
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

/** Category is an icon, never a color (DESIGN_SYSTEM §2). */
const CATEGORY_ICON: Record<Category, string> = {
  bar: svg('<path d="M5 4h14l-7 8z"/><path d="M12 12v7"/><path d="M8 20h8"/>'),
  club: svg(
    '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'
  ),
  event: svg(
    '<path d="M12 4l2.2 4.8 5.3.6-3.9 3.6 1.1 5.2L12 15.6l-4.7 2.6 1.1-5.2-3.9-3.6 5.3-.6z"/>'
  ),
  food: svg(
    '<path d="M7 3v18"/><path d="M4.5 3v5a2.5 2.5 0 0 0 5 0V3"/><path d="M17 21V3c-2 1.5-3 4-3 7h3"/>'
  ),
  private: svg('<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>'),
};

const LOCK_SVG =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const CHECK_SVG =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

type MarkerState = {
  tier: PinTier;
  count: number;
  countNoun: "going" | "friends";
  active: boolean;
  going: boolean;
  hot: boolean;
};

function renderMarkerInner(v: Venue, s: MarkerState) {
  let body = "";
  if (s.tier === "social" && !s.active) {
    body = `<span class="avatars">${v.friendsGoing
      .slice(0, 2)
      .map(
        (p) =>
          `<span style="background:${p.color}">${escapeHtml(p.initials)}</span>`
      )
      .join("")}</span>`;
  } else if (s.tier !== "quiet" || s.active) {
    body = CATEGORY_ICON[v.category];
  }
  const lock = v.isPrivate ? `<span class="lock">${LOCK_SVG}</span>` : "";
  const goingDot = s.going ? `<span class="going">${CHECK_SVG}</span>` : "";
  const label = `<span class="label"><b>${escapeHtml(v.name)}</b><span>${s.count} ${s.countNoun}</span></span>`;
  return `<span class="halo"></span><span class="stack"><span class="pin">${body}</span>${lock}${goingDot}</span>${label}`;
}

const Z_INDEX: Record<PinTier, number> = { quiet: 1, relevant: 2, social: 3 };

function applyMarkerState(el: HTMLElement, v: Venue, s: MarkerState) {
  // Never assign el.className — MapLibre adds maplibregl-marker + anchor classes.
  el.classList.add("mn-marker");
  el.classList.toggle("tier-quiet", s.tier === "quiet" && !s.active);
  el.classList.toggle("tier-relevant", s.tier === "relevant");
  el.classList.toggle("tier-social", s.tier === "social");
  el.classList.toggle("is-private", !!v.isPrivate);
  el.classList.toggle("is-active", s.active);
  el.classList.toggle("is-going", s.going);
  el.classList.toggle("is-hot", s.hot);

  el.setAttribute("aria-label", `${v.name}, ${s.count} ${s.countNoun}`);
  el.setAttribute("aria-pressed", s.active ? "true" : "false");
  el.style.zIndex = s.active ? "10" : s.hot ? "4" : String(Z_INDEX[s.tier]);

  // Only rebuild inner DOM when its content actually changes so CSS transitions survive.
  const sig = `${s.tier}|${s.active ? 1 : 0}|${s.count}|${s.countNoun}|${s.going ? 1 : 0}`;
  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig;
    el.innerHTML = renderMarkerInner(v, s);
  }
}

const INVITED_IDS: ReadonlySet<string> = new Set(
  invitations.map((inv) => inv.venueId)
);

/**
 * Decide which pins stay prominent for the current camera: the selected and
 * personal pins always do; the rest go in rank order until the zoom's cap is
 * reached, and a pin that would overlap a stronger one falls back to a dot.
 * Off-screen pins stay quiet until the next move brings them into view.
 */
function placePins(
  map: maplibregl.Map,
  plan: PinCandidate[],
  byId: ReadonlyMap<string, Venue>,
  selectedId: string | null
) {
  const tiers = new Map<string, PinTier>();
  const cap = prominentCap(map.getZoom());
  const { clientWidth: w, clientHeight: h } = map.getContainer();
  const placed: { x: number; y: number; r: number }[] = [];
  let used = 0;
  const order = [...plan].sort(
    (a, b) =>
      Number(b.id === selectedId) - Number(a.id === selectedId) ||
      a.rank - b.rank
  );
  for (const c of order) {
    const v = byId.get(c.id);
    if (!v) continue;
    const selected = c.id === selectedId;
    const must = selected || c.personal;
    const p = map.project([v.lng, v.lat]);
    const onScreen = p.x >= -40 && p.y >= -40 && p.x <= w + 40 && p.y <= h + 40;
    if (!onScreen || (!must && used >= cap)) {
      tiers.set(c.id, "quiet");
      continue;
    }
    const r = selected ? 20 : PIN_RADIUS[c.tier];
    const clash = placed.some(
      (q) => Math.hypot(q.x - p.x, q.y - p.y) < q.r + r + PIN_GAP
    );
    if (clash && !must) {
      tiers.set(c.id, "quiet");
      continue;
    }
    placed.push({ x: p.x, y: p.y, r });
    tiers.set(c.id, c.tier);
    if (!must) used++;
  }
  return tiers;
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

function sizeAccuracyRing(el: HTMLElement, map: maplibregl.Map, pos: UserPosition) {
  const diameter = (2 * pos.accuracy) / metersPerPixel(pos.lat, map.getZoom());
  // Hide when it would vanish under the dot or swamp the screen.
  el.style.setProperty(
    "--accuracy",
    diameter < 26 || diameter > 600 ? "0px" : `${Math.round(diameter)}px`
  );
}

/** Loads the real style; `isCurrent` lets a newer choice win a race. */
function applyMapStyle(
  map: maplibregl.Map,
  id: MapStyleId,
  isCurrent: () => boolean
) {
  loadBaseStyle()
    .then((base) => {
      if (isCurrent()) map.setStyle(buildMapStyle(id, base));
    })
    .catch((err) => console.error("Map style failed to load", err));
}

export default function MapView({
  venues,
  selectedId,
  goingIds,
  onSelect,
  onMapClick,
  focusId,
  mapStyle,
  filter,
  crowd,
  userPosition,
  cameraRequest,
  onUserPan,
  lockPan = false,
  pickMode = false,
  pickLngLat = null,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, VenueMarker>>(new Map());
  const styleRef = useRef<MapStyleId>(mapStyle);
  const pickMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onUserPanRef = useRef(onUserPan);
  onUserPanRef.current = onUserPan;
  const userPositionRef = useRef(userPosition);
  userPositionRef.current = userPosition;
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const lockPanRef = useRef(lockPan);
  lockPanRef.current = lockPan;
  /** Re-places pins for the current camera; replaced whenever the data changes. */
  const layoutRef = useRef<() => void>(() => {});

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const isMobile = isMobileViewport();
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: placeholderStyle(styleRef.current),
        // On mobile, sit slightly north so pins fall between the header and the rail.
        center: isMobile ? MAASTRICHT_CENTER_MOBILE : MAASTRICHT_CENTER,
        zoom: isMobile ? 13.6 : 14.6,
        minZoom: 12,
        maxZoom: 18,
        pitch: 0,
        attributionControl: false,
      });
    } catch (err) {
      console.error("Map failed to start", err);
      return;
    }
    // Bottom corners sit under the rail and sheets, so credits live top-right:
    // shown in full on load, collapsed to an "i" once the map is moved.
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "top-right"
    );
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();
    if (lockPanRef.current) map.dragPan.disable();
    map.on("error", (e) => {
      console.error("Map error", e.error ?? e);
    });
    // Only real drags fire this, not our own easeTo/flyTo animations.
    map.on("dragstart", () => onUserPanRef.current?.());
    map.on("moveend", () => layoutRef.current());
    map.on("zoom", () => {
      const pos = userPositionRef.current;
      const el = userMarkerRef.current?.getElement();
      if (pos && el) sizeAccuracyRing(el, map, pos);
    });
    map.on("click", (e) => {
      if (pickModeRef.current) {
        onPickRef.current?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        return;
      }
      onMapClickRef.current();
    });
    mapRef.current = map;
    const initialStyle = styleRef.current;
    applyMapStyle(
      map,
      initialStyle,
      () => mapRef.current === map && styleRef.current === initialStyle
    );
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __mnMap?: maplibregl.Map }).__mnMap = map;
    }
    const markers = markersRef.current;
    return () => {
      if (process.env.NODE_ENV === "development") {
        delete (window as unknown as { __mnMap?: maplibregl.Map }).__mnMap;
      }
      markers.forEach((entry) => entry.marker.remove());
      markers.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap basemap style; DOM markers and camera survive the swap.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleRef.current === mapStyle) return;
    styleRef.current = mapStyle;
    applyMapStyle(
      map,
      mapStyle,
      () => mapRef.current === map && styleRef.current === mapStyle
    );
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lockPan) map.dragPan.disable();
    else map.dragPan.enable();
  }, [lockPan]);

  // State classes on the map container (see the className note below).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    for (const cls of [...el.classList]) {
      if (cls.startsWith("style-")) el.classList.remove(cls);
    }
    el.classList.add(`style-${mapStyle}`);
    el.classList.toggle("is-dark", isDarkMapStyle(mapStyle));
    el.classList.toggle("has-selection", selectedId !== null);
  }, [mapStyle, selectedId]);

  // Rank venues whenever the data changes; which pins stay prominent also
  // depends on the camera, so the layout re-runs after every map move.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const wanted = new Set(venues.map((v) => v.id));

    for (const [id, entry] of markers) {
      if (!wanted.has(id)) {
        entry.marker.remove();
        markers.delete(id);
      }
    }

    const byId = new Map(venues.map((v) => [v.id, v]));
    const counts = new Map(
      venues.map((v) => [v.id, displayAttendeeCount(v, goingIds, filter, crowd)])
    );
    const countNoun = attendeeCountNoun(filter);
    const prefs = loadPreferences();

    for (const v of venues) {
      const existing = markers.get(v.id);
      if (existing) {
        existing.marker.setLngLat([v.lng, v.lat]);
        const anchorEl = existing.marker.getElement();
        anchorEl.dataset.lng = String(v.lng);
        anchorEl.dataset.lat = String(v.lat);
        continue;
      }
      const hit = document.createElement("button");
      hit.type = "button";
      hit.addEventListener("click", (e) => {
        e.stopPropagation();
        if (pickModeRef.current) {
          onPickRef.current?.({ lng: v.lng, lat: v.lat });
          return;
        }
        onSelectRef.current(v.id);
      });
      const anchor = createMarkerAnchor(hit);
      anchor.dataset.lng = String(v.lng);
      anchor.dataset.lat = String(v.lat);
      // Zero-size anchor: MapLibre's translate(-50%,-50%) stays at the lng/lat
      // point; the visible pin is centered in .mn-marker inside the anchor.
      const marker = new maplibregl.Marker({
        element: anchor,
        anchor: "center",
        subpixelPositioning: true,
      })
        .setLngLat([v.lng, v.lat])
        .addTo(map);
      markers.set(v.id, { marker, hit });
    }

    // GPS updates every few seconds, so the position is read from a ref when
    // pins are laid out (data changes and every map move), not on each fix.
    const layout = () => {
      const plan = planPins({
        venues,
        counts,
        filter,
        goingIds,
        invitedIds: INVITED_IDS,
        prefs,
        at: crowd.at,
        userPosition: userPositionRef.current,
      });
      const tiers = placePins(map, plan, byId, selectedId);
      for (const c of plan) {
        const v = byId.get(c.id);
        const entry = markers.get(c.id);
        if (!v || !entry) continue;
        const tier = tiers.get(c.id) ?? "quiet";
        applyMarkerState(entry.hit, v, {
          tier,
          count: counts.get(c.id) ?? 0,
          countNoun,
          active: c.id === selectedId,
          going: goingIds.has(c.id),
          hot: c.hot && tier !== "quiet",
        });
      }
    };
    layoutRef.current = layout;
    layout();
  }, [venues, selectedId, goingIds, filter, crowd]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = pickMode ? "crosshair" : "";
    if (!pickMode) {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      return;
    }
    if (!pickLngLat) return;
    if (!pickMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "mn-pick-pin";
      pickMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        subpixelPositioning: true,
      })
        .setLngLat([pickLngLat.lng, pickLngLat.lat])
        .addTo(map);
    } else {
      pickMarkerRef.current.setLngLat([pickLngLat.lng, pickLngLat.lat]);
    }
  }, [pickMode, pickLngLat]);

  // Ease to a focused venue
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const v = venues.find((x) => x.id === focusId);
    if (!v) return;
    const isMobile = isMobileViewport();
    map.easeTo({
      center: [v.lng, v.lat],
      zoom: Math.max(map.getZoom(), 15),
      offset: isMobile ? [0, -170] : [-180, 0],
      duration: 650,
    });
  }, [focusId, venues]);

  // The visitor's location dot with its accuracy ring.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    let marker = userMarkerRef.current;
    if (!marker) {
      const el = document.createElement("div");
      el.className = "mn-user";
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Your location");
      el.innerHTML =
        '<span class="mn-user-accuracy"></span><span class="mn-user-dot"></span>';
      // Above ordinary pins, below the selected one.
      el.style.zIndex = "5";
      marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
        subpixelPositioning: true,
      })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map);
      userMarkerRef.current = marker;
    } else {
      marker.setLngLat([userPosition.lng, userPosition.lat]);
    }
    sizeAccuracyRing(marker.getElement(), map, userPosition);
  }, [userPosition]);

  // Camera moves requested by the page (locate button, "show me Maastricht").
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cameraRequest) return;
    const isMobile = isMobileViewport();
    const pos = userPositionRef.current;
    if (cameraRequest.target === "user" && pos) {
      map.easeTo({
        center: [pos.lng, pos.lat],
        zoom: Math.max(map.getZoom(), 15.5),
        // Keep the dot clear of the rail on phones.
        offset: isMobile ? [0, -90] : [0, 0],
        duration: 700,
      });
      return;
    }
    map.easeTo({
      center: isMobile ? MAASTRICHT_CENTER_MOBILE : MAASTRICHT_CENTER,
      zoom: isMobile ? 13.6 : 14.6,
      duration: 700,
    });
  }, [cameraRequest]);

  return (
    <div
      ref={containerRef}
      // Fixed on purpose: MapLibre adds its own classes (maplibregl-map) to this
      // element, and a changing className would make React wipe them. State
      // classes are toggled in an effect instead.
      className="absolute inset-0 mn-map"
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
