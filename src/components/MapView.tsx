"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  MAASTRICHT_CENTER,
  MAASTRICHT_CENTER_MOBILE,
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

const MIN_SIZE = 34;
const MAX_SIZE = 60;
type VenueMarker = { marker: maplibregl.Marker; hit: HTMLButtonElement };

function createMarkerAnchor(hit: HTMLButtonElement) {
  const anchor = document.createElement("div");
  anchor.className = "mn-marker-anchor";
  anchor.appendChild(hit);
  return anchor;
}

const REF_MIN = Math.sqrt(10);
const REF_MAX = Math.sqrt(220);

/** Square-root attendance scaling, clamped so large events never dominate. */
function markerSize(count: number) {
  const t = (Math.sqrt(Math.max(count, 1)) - REF_MIN) / (REF_MAX - REF_MIN);
  const clamped = Math.min(1, Math.max(0, t));
  return Math.round(MIN_SIZE + clamped * (MAX_SIZE - MIN_SIZE));
}

function haloSize(size: number) {
  const t = (size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE);
  return Math.round(size + 18 + t * 44);
}

const LOCK_SVG =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const CHECK_SVG =
  '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function renderMarkerInner(
  v: Venue,
  count: number,
  going: boolean,
  countNoun: "going" | "friends"
) {
  const friends = v.friendsGoing.slice(0, 2);
  const body =
    friends.length > 0
      ? `<span class="avatars">${friends
          .map(
            (p) =>
              `<span style="background:${p.color}">${escapeHtml(p.initials)}</span>`
          )
          .join("")}</span>`
      : `<span class="count">${count}</span>`;
  const badge = friends.length > 0 ? `<span class="badge">${count}</span>` : "";
  const lock = v.isPrivate ? `<span class="lock">${LOCK_SVG}</span>` : "";
  const goingDot = going ? `<span class="going">${CHECK_SVG}</span>` : "";
  const label = `<span class="label"><b>${escapeHtml(v.name)}</b><span>${count} ${countNoun}</span></span>`;
  return `<span class="halo"></span><span class="stack"><span class="pin">${body}</span>${badge}${lock}${goingDot}</span>${label}`;
}

function applyMarkerState(
  el: HTMLElement,
  v: Venue,
  opts: {
    count: number;
    countNoun: "going" | "friends";
    active: boolean;
    going: boolean;
    hottest: boolean;
  }
) {
  const { count, countNoun, active, going, hottest } = opts;
  const size = markerSize(count);

  // Never assign el.className — MapLibre adds maplibregl-marker + anchor classes.
  el.classList.add("mn-marker");
  el.classList.toggle("is-private", !!v.isPrivate);
  el.classList.toggle("is-active", active);
  el.classList.toggle("is-going", going);
  el.classList.toggle("is-hottest", hottest);
  el.classList.toggle("kind-bar", v.category === "bar");
  el.classList.toggle("kind-club", v.category === "club");
  el.classList.toggle("kind-event", v.category === "event");
  el.classList.toggle("kind-food", v.category === "food");
  el.classList.toggle("kind-private", v.category === "private");

  el.setAttribute("aria-label", `${v.name}, ${count} ${countNoun}`);
  el.setAttribute("aria-pressed", active ? "true" : "false");
  el.style.setProperty("--size", `${size}px`);
  el.style.setProperty("--halo", `${haloSize(size)}px`);
  el.style.zIndex = active ? "10" : hottest ? "3" : "1";

  // Only rebuild inner DOM when its content actually changes so CSS transitions survive.
  const sig = `${count}|${countNoun}|${going ? 1 : 0}`;
  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig;
    el.innerHTML = renderMarkerInner(v, count, going, countNoun);
  }
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

  // Sync markers with visible venues + state
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

    let hottestId: string | null = null;
    let max = 0;
    const countNoun = attendeeCountNoun(filter);
    for (const v of venues) {
      const c = displayAttendeeCount(v, goingIds, filter, crowd);
      if (c > max) {
        max = c;
        hottestId = v.id;
      }
    }

    for (const v of venues) {
      const count = displayAttendeeCount(v, goingIds, filter, crowd);
      const state = {
        count,
        countNoun,
        active: v.id === selectedId,
        going: goingIds.has(v.id),
        hottest: v.id === hottestId,
      };
      const existing = markers.get(v.id);
      if (existing) {
        applyMarkerState(existing.hit, v, state);
        existing.marker.setLngLat([v.lng, v.lat]);
        const anchorEl = existing.marker.getElement();
        anchorEl.dataset.lng = String(v.lng);
        anchorEl.dataset.lat = String(v.lat);
        continue;
      }
      const hit = document.createElement("button");
      hit.type = "button";
      applyMarkerState(hit, v, state);
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
      className={`absolute inset-0 mn-map style-${mapStyle} ${
        isDarkMapStyle(mapStyle) ? "is-dark" : ""
      }`}
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
