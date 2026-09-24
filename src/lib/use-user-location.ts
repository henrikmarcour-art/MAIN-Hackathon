"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UserPosition = { lng: number; lat: number; accuracy: number };

export type LocationStatus =
  | "idle"
  | "locating"
  | "active"
  | "denied"
  | "unavailable"
  | "unsupported";

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 15_000,
  timeout: 20_000,
};

/**
 * The visitor's position, kept in memory only — never stored or sent anywhere.
 * The browser permission prompt only appears when `request()` is called from a
 * tap; if permission was granted before, the dot shows up without prompting.
 */
export function useUserLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [position, setPosition] = useState<UserPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wantedRef = useRef(false);
  const hasFixRef = useRef(false);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    wantedRef.current = true;
    if (watchIdRef.current !== null) return;
    if (!hasFixRef.current) setStatus("locating");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        hasFixRef.current = true;
        setPosition({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("active");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          wantedRef.current = false;
          hasFixRef.current = false;
          stopWatching();
          setPosition(null);
          setStatus("denied");
          return;
        }
        // A hiccup after we already have a fix: keep showing the last position.
        if (hasFixRef.current) return;
        stopWatching();
        setStatus("unavailable");
      },
      WATCH_OPTIONS
    );
  }, [stopWatching]);

  // Already granted earlier? Show the dot without prompting.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    let cancelled = false;
    let permission: PermissionStatus | null = null;
    const onChange = () => {
      if (permission?.state === "denied") {
        wantedRef.current = false;
        hasFixRef.current = false;
        stopWatching();
        setPosition(null);
        setStatus("denied");
      }
    };
    navigator.permissions
      .query({ name: "geolocation" })
      .then((p) => {
        if (cancelled) return;
        permission = p;
        p.addEventListener("change", onChange);
        if (p.state === "granted") startWatching();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      permission?.removeEventListener("change", onChange);
    };
  }, [startWatching, stopWatching]);

  // Stop GPS while the tab is in the background; resume when it's back.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopWatching();
      else if (wantedRef.current) startWatching();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopWatching();
    };
  }, [startWatching, stopWatching]);

  return { status, position, request: startWatching };
}
