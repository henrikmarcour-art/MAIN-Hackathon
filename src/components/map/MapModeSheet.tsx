"use client";

import { useEffect } from "react";
import type { MapTheme } from "./types";
import { CheckIcon, CloseIcon } from "./icons";

type Props = {
  open: boolean;
  theme: MapTheme;
  showRadar: boolean;
  onTheme: (t: MapTheme) => void;
  onToggleRadar: () => void;
  onClose: () => void;
};

const modes: { key: MapTheme; label: string; hint: string }[] = [
  { key: "light", label: "Light", hint: "Natural colours, full detail" },
  { key: "night", label: "Night", hint: "Low-glare for late hours" },
];

export default function MapModeSheet({
  open,
  theme,
  showRadar,
  onTheme,
  onToggleRadar,
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
        aria-label="Close map mode"
        onClick={onClose}
        className="animate-fade absolute inset-0 z-30 cursor-default bg-graphite/10 md:bg-transparent"
      />
      <div
        role="dialog"
        aria-label="Map mode"
        className="animate-sheet absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto w-full px-3 md:inset-x-auto md:bottom-auto md:right-6 md:top-[76px] md:w-[320px] md:px-0"
      >
        <div className="rounded-3xl border border-line/80 bg-surface shadow-sheet md:rounded-2xl md:shadow-float">
          <div className="flex justify-center pt-2.5 md:hidden">
            <span className="h-1 w-9 rounded-full bg-line" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3 pt-3 md:pt-4">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-graphite">
                Map mode
              </h2>
              <p className="text-[12px] text-graphite-muted">
                Choose how Maastricht is drawn
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-graphite-soft hover:bg-line"
            >
              <CloseIcon size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5">
            {modes.map((m) => {
              const active = theme === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onTheme(m.key)}
                  aria-pressed={active}
                  className={[
                    "group text-left rounded-2xl border p-1.5 transition-colors",
                    active
                      ? "border-lime-deep/70 bg-lime/10"
                      : "border-line bg-surface hover:bg-surface-2",
                  ].join(" ")}
                >
                  <span
                    className={`mn-mode-preview ${m.key} relative block h-[76px] overflow-hidden rounded-xl`}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-lime text-graphite">
                        <CheckIcon size={11} />
                      </span>
                    )}
                  </span>
                  <span className="block px-1.5 pb-1 pt-2">
                    <span className="block text-[13px] font-bold tracking-tight text-graphite">
                      {m.label}
                    </span>
                    <span className="block text-[11px] text-graphite-muted">
                      {m.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mx-5 mb-5 mt-4 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold text-graphite">
                Vibe-Map
              </div>
              <div className="text-[11px] text-graphite-muted">
                Blue is quiet · gold is packed
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showRadar}
              aria-label="Vibe-Map"
              onClick={onToggleRadar}
              className={`mn-switch ${showRadar ? "is-on" : ""}`}
            >
              <span className="mn-switch-knob" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
