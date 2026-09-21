"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  MAASTRICHT_CENTER,
  MAASTRICHT_CENTER_MOBILE,
  type Venue,
} from "@/data/events";
import { MAP_STYLES, type MapTheme } from "@/components/map/types";

type Props = {
  venues: Venue[];
  selectedId: string | null;
  goingIds: Set<string>;
  onSelect: (id: string) => void;
  /** Tap on the empty map (not a marker) */
  onMapClick: () => void;
  /** Fly to this id when it changes (used after accepting an invite) */
  focusId: string | null;
  theme: MapTheme;
  showRadar: boolean;
  /** Increment to request a recenter */
  recenterNonce: number;
  pickMode?: boolean;
  pickLngLat?: { lng: number; lat: number } | null;
  onPick?: (lngLat: { lng: number; lat: number }) => void;
};

const MIN_SIZE = 34;
const MAX_SIZE = 60;
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

function renderMarkerInner(v: Venue, count: number, going: boolean) {
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
  const label = `<span class="label"><b>${escapeHtml(v.name)}</b><span>${count} going</span></span>`;
  return `<span class="halo"></span><span class="pin">${body}</span>${badge}${lock}${goingDot}${label}`;
}

function applyMarkerState(
  el: HTMLElement,
  v: Venue,
  opts: {
    count: number;
    active: boolean;
    going: boolean;
    hottest: boolean;
    showRadar: boolean;
  }
) {
  const { count, active, going, hottest, showRadar } = opts;
  const size = markerSize(count);

  el.className = [
    "mn-marker",
    v.isPrivate ? "is-private" : "",
    active ? "is-active" : "",
    going ? "is-going" : "",
    hottest ? "is-hottest" : "",
    showRadar ? "has-radar" : "",
  ]
    .filter(Boolean)
    .join(" ");
  el.setAttribute("aria-label", `${v.name}, ${count} going`);
  el.setAttribute("aria-pressed", active ? "true" : "false");
  el.style.setProperty("--size", `${size}px`);
  el.style.setProperty("--halo", `${haloSize(size)}px`);
  el.style.zIndex = active ? "10" : hottest ? "3" : "1";

  // Only rebuild inner DOM when its content actually changes so CSS transitions survive.
  const sig = `${count}|${going ? 1 : 0}`;
  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig;
    el.innerHTML = renderMarkerInner(v, count, going);
  }
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

function inMaastricht(lng: number, lat: number) {
  return lng > 5.6 && lng < 5.78 && lat > 50.79 && lat < 50.9;
}

export default function MapView({
  venues,
  selectedId,
  goingIds,
  onSelect,
  onMapClick,
  focusId,
  theme,
  showRadar,
  recenterNonce,
  pickMode = false,
  pickLngLat = null,
  onPick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const themeRef = useRef<MapTheme>(theme);
  const pickMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const isMobile = isMobileViewport();
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[themeRef.current],
      // On mobile, sit slightly north so pins fall between the header and the rail.
      center: isMobile ? MAASTRICHT_CENTER_MOBILE : MAASTRICHT_CENTER,
      zoom: isMobile ? 13.6 : 14.6,
      minZoom: 12,
      maxZoom: 18,
      pitch: 0,
      attributionControl: { compact: false },
    });
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();
    map.on("click", (e) => {
      if (pickModeRef.current) {
        onPickRef.current?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        return;
      }
      onMapClickRef.current();
    });
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap basemap style; DOM markers and camera survive the swap.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || themeRef.current === theme) return;
    themeRef.current = theme;
    map.setStyle(MAP_STYLES[theme]);
  }, [theme]);

  // Sync markers with visible venues + state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const wanted = new Set(venues.map((v) => v.id));

    for (const [id, m] of markers) {
      if (!wanted.has(id)) {
        m.remove();
        markers.delete(id);
      }
    }

    let hottestId: string | null = null;
    let max = 0;
    for (const v of venues) {
      const c = v.goingCount + (goingIds.has(v.id) ? 1 : 0);
      if (c > max) {
        max = c;
        hottestId = v.id;
      }
    }

    for (const v of venues) {
      const count = v.goingCount + (goingIds.has(v.id) ? 1 : 0);
      const state = {
        count,
        active: v.id === selectedId,
        going: goingIds.has(v.id),
        hottest: v.id === hottestId,
        showRadar,
      };
      const existing = markers.get(v.id);
      if (existing) {
        applyMarkerState(existing.getElement(), v, state);
        continue;
      }
      const el = document.createElement("button");
      el.type = "button";
      applyMarkerState(el, v, state);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (pickModeRef.current) {
          onPickRef.current?.({ lng: v.lng, lat: v.lat });
          return;
        }
        onSelectRef.current(v.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([v.lng, v.lat])
        .addTo(map);
      markers.set(v.id, marker);
    }
  }, [venues, selectedId, goingIds, showRadar]);

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

  // Recenter: use geolocation only when already granted, otherwise fall back silently.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || recenterNonce === 0) return;
    const isMobile = isMobileViewport();
    const fallback = () =>
      map.easeTo({
        center: isMobile ? MAASTRICHT_CENTER_MOBILE : MAASTRICHT_CENTER,
        zoom: isMobile ? 13.6 : 14.6,
        duration: 700,
      });

    let cancelled = false;
    const locate = () => {
      if (!("geolocation" in navigator)) return fallback();
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const { longitude, latitude } = pos.coords;
          if (inMaastricht(longitude, latitude)) {
            map.easeTo({ center: [longitude, latitude], zoom: 15, duration: 700 });
          } else {
            fallback();
          }
        },
        () => {
          if (!cancelled) fallback();
        },
        { timeout: 2500, maximumAge: 60_000 }
      );
    };

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (cancelled) return;
          if (status.state === "granted") locate();
          else fallback();
        })
        .catch(() => {
          if (!cancelled) fallback();
        });
    } else {
      fallback();
    }
    return () => {
      cancelled = true;
    };
  }, [recenterNonce]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 mn-map theme-${theme}`}
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
