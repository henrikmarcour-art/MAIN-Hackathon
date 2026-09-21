"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  MAASTRICHT_CENTER,
  MAASTRICHT_CENTER_MOBILE,
  type Venue,
} from "@/data/events";

const STYLE_URL_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const STYLE_URL_NIGHT = "https://tiles.openfreemap.org/styles/dark";

type Props = {
  venues: Venue[];
  selectedId: string | null;
  goingIds: Set<string>;
  onSelect: (id: string) => void;
  onMapClick: () => void;
  focusId: string | null;
  theme: "light" | "night";
  showRadar: boolean;
};

function markerBg(v: Venue) {
  if (v.isPrivate) return "var(--color-violet)";
  return "var(--color-cobalt)";
}

function markerText() {
  return "#ffffff";
}

function buildMarkerEl(
  v: Venue, 
  count: number, 
  active: boolean, 
  isHottest: boolean, 
  showRadar: boolean
) {
  const el = document.createElement("button");
  el.type = "button";
  
  const scale = Math.min(1, Math.sqrt(count) / Math.sqrt(210));
  const size = 34 + scale * (62 - 34);
  const haloSize = size + 12 + scale * 24;

  let className = "mn-marker";
  if (active) className += " is-active";
  if (isHottest) className += " is-hottest";
  
  el.className = className;
  el.setAttribute("aria-label", `${v.name}, ${count} going`);
  
  el.style.setProperty("--marker-size", `${size}px`);
  el.style.setProperty("--halo-size", `${haloSize}px`);
  el.style.setProperty("--pin-bg", markerBg(v));
  el.style.setProperty("--pin-badge-text", markerText());

  el.innerHTML = renderMarkerInner(v, count, showRadar);
  return el;
}

function renderMarkerInner(v: Venue, count: number, showRadar: boolean) {
  const halo = showRadar ? `<span class="halo"></span>` : "";
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
    ? `<span class="lock"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>`
    : "";
  return `${halo}<span class="pin">${inner}</span>${badge}${lock}`;
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
      style: theme === "light" ? STYLE_URL_LIGHT : STYLE_URL_NIGHT,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(theme === "light" ? STYLE_URL_LIGHT : STYLE_URL_NIGHT);
  }, [theme]);

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

    // Find the hottest event
    let maxCount = 0;
    for (const v of venues) {
      const count = v.goingCount + (goingIds.has(v.id) ? 1 : 0);
      if (count > maxCount) maxCount = count;
    }

    // Add / update
    for (const v of venues) {
      const count = v.goingCount + (goingIds.has(v.id) ? 1 : 0);
      const active = v.id === selectedId;
      const isHottest = count === maxCount && count > 10;

      const existing = markers.get(v.id);
      if (existing) {
        const el = existing.getElement();
        
        let className = "mn-marker";
        if (active) className += " is-active";
        if (isHottest) className += " is-hottest";
        el.className = className;
        
        el.setAttribute("aria-label", `${v.name}, ${count} going`);
        
        const scale = Math.min(1, Math.sqrt(count) / Math.sqrt(210));
        const size = 34 + scale * (62 - 34);
        const haloSize = size + 12 + scale * 24;
        
        el.style.setProperty("--marker-size", `${size}px`);
        el.style.setProperty("--halo-size", `${haloSize}px`);
        el.style.setProperty("--pin-bg", markerBg(v));
        el.style.setProperty("--pin-badge-text", markerText(v));

        el.innerHTML = renderMarkerInner(v, count, showRadar);
        el.style.zIndex = active ? "10" : "1";
        continue;
      }

      const el = buildMarkerEl(v, count, active, isHottest, showRadar);
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
  }, [venues, selectedId, goingIds, showRadar]);

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
