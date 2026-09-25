"use client";

import { useSyncExternalStore } from "react";

/** Desktop layout (panel + map) from 1024 px; tablets keep the mobile layout. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * `null` on the server and during hydration, then the real answer, so the
 * page renders neither chrome until it knows which one fits (no flash of the
 * mobile top bar on a desktop screen).
 */
export function useDesktop(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null
  );
}
