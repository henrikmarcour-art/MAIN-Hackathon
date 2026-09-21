"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  MAASTRICHT_CENTER,
  MAASTRICHT_CENTER_MOBILE,
  type Venue,
} from "@/data/events";

const STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type Props = {
  venues: Venue[];
  selectedId: string | null;
  goingIds: Set<string>;
  onSelect: (id: string) => void;
  /** Tap on the empty map (not a marker) */
  onMapClick: () => void;
  /** Fly to this id when it changes (used after accepting an invite) */
  focusId: string | null;
};

function markerColor(v: Venue) {
  if (v.isPrivate) return "#6f56ff";
  if (v.busy) return "#ff7a1a";
  return "#c6f432";
}

function badgeText(v: Venue) {
  return v.isPrivate || v.busy ? "#ffffff" : "#1c1c1e";
}

function buildMarkerEl(v: Venue, count: number, active: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "mn-marker" + (active ? " is-active" : "");
  el.setAttribute("aria-label", `${v.name}, ${count} going`);
  el.style.setProperty("--pin-color", markerColor(v));
  el.style.setProperty("--pin-badge-text", badgeText(v));
  el.innerHTML = renderMarkerInner(v, count);
  return el;
}

function renderMarkerInner(v: Venue, count: number) {
  const rings = v.busy
    ? `<span class="ring r1"></span><span class="ring r2"></span>`
    : "";
  const friends = v.friendsGoing.slice(0, 2);
  const inner =
    friends.length > 0
      ? `<span class="avatars">${friends
          .map(
            (p) =>
              `<span style="background:${p.color}">${p.initials}</span>`
          )
          .join("")}</span>`
      : `<span class="count">${count}</span>`;
  const badge =
    friends.length > 0 ? `<span class="badge">${count}</span>` : "";
  const lock = v.isPrivate
    ? `<span class="lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>`
    : "";
  return `${rings}<span class="pin">${inner}</span>${badge}${lock}`;
}

export default function MapView({
  venues,
  selectedId,
  goingIds,
  onSelect,
  onMapClick,
  focusId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const isMobile = window.innerWidth < 768;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      // On mobile, sit slightly north so pins fall between the top bar and the nav.
      center: isMobile ? MAASTRICHT_CENTER_MOBILE : MAASTRICHT_CENTER,
      zoom: isMobile ? 13.6 : 14.6,
      minZoom: 12,
      maxZoom: 18,
      pitch: 0,
      attributionControl: { compact: false },
    });
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();
    map.on("click", () => onMapClickRef.current());
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers with visible venues + state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers = markersRef.current;
    const wanted = new Set(venues.map((v) => v.id));

    // Remove stale
    for (const [id, m] of markers) {
      if (!wanted.has(id)) {
        m.remove();
        markers.delete(id);
      }
    }

    // Add / update
    for (const v of venues) {
      const count = v.goingCount + (goingIds.has(v.id) ? 1 : 0);
      const active = v.id === selectedId;
      const existing = markers.get(v.id);
      if (existing) {
        const el = existing.getElement();
        el.className = "mn-marker" + (active ? " is-active" : "");
        el.setAttribute("aria-label", `${v.name}, ${count} going`);
        el.innerHTML = renderMarkerInner(v, count);
        // Keep selected marker above others
        el.style.zIndex = active ? "10" : "1";
        continue;
      }
      const el = buildMarkerEl(v, count, active);
      el.style.zIndex = active ? "10" : "1";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(v.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([v.lng, v.lat])
        .addTo(map);
      markers.set(v.id, marker);
    }
  }, [venues, selectedId, goingIds]);

  // Ease to a focused venue
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const v = venues.find((x) => x.id === focusId);
    if (!v) return;
    const isMobile = window.innerWidth < 768;
    map.easeTo({
      center: [v.lng, v.lat],
      zoom: Math.max(map.getZoom(), 15),
      offset: isMobile ? [0, -190] : [-180, 0],
      duration: 650,
    });
  }, [focusId, venues]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
