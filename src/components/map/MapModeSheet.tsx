"use client";

import { useEffect } from "react";
import { MAP_STYLE_IDS, type MapStyleId } from "@/lib/map/styles";
import { CloseIcon } from "./icons";

type Props = {
  open: boolean;
  mapStyle: MapStyleId;
  onMapStyle: (s: MapStyleId) => void;
  onClose: () => void;
};

const LABELS: Record<MapStyleId, string> = {
  standard: "Standard",
  night: "Night",
  satellite: "Satellite",
};

export default function MapModeSheet({
  open,
  mapStyle,
  onMapStyle,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Scrim: only present while open, so it never intercepts unrelated clicks. */}
      <button
        type="button"
        aria-label="Close map style"
        onClick={onClose}
        className="animate-fade absolute inset-0 z-30 cursor-default bg-graphite/10 md:bg-transparent"
      />
      <div
        role="dialog"
        aria-label="Map style"
        className="animate-sheet absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto w-full px-3 md:inset-x-auto md:bottom-6 md:right-[76px] md:w-[340px] md:px-0"
      >
        <div className="rounded-3xl bg-surface px-5 pb-5 shadow-sheet">
          <div className="flex justify-center pt-2.5 md:hidden">
            <span className="h-1 w-9 rounded-full bg-line" />
          </div>
          <div className="flex items-center justify-between pb-4 pt-3 md:pt-5">
            <h2 className="text-headline font-semibold tracking-tight text-graphite">
              Map style
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-graphite-soft hover:bg-line"
            >
              <CloseIcon size={13} />
            </button>
          </div>

          <div role="radiogroup" aria-label="Map style" className="grid grid-cols-3 gap-2.5">
            {MAP_STYLE_IDS.map((id) => {
              const active = mapStyle === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onMapStyle(id)}
                  className="group flex flex-col items-center gap-2 text-center focus-visible:outline-none"
                >
                  <span
                    className={[
                      "mn-style-swatch block h-16 w-full overflow-hidden rounded-2xl transition-shadow",
                      id,
                      active
                        ? "ring-2 ring-graphite ring-offset-2 ring-offset-surface"
                        : "group-hover:ring-1 group-hover:ring-line group-focus-visible:ring-2 group-focus-visible:ring-graphite/40",
                    ].join(" ")}
                  />
                  <span
                    className={`text-meta tracking-tight ${
                      active ? "font-semibold text-graphite" : "font-medium text-graphite-soft"
                    }`}
                  >
                    {LABELS[id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
