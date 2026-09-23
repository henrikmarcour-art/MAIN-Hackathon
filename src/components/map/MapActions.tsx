"use client";

import type { MapTheme } from "./types";
import { ClockIcon, LayersIcon, LocateIcon } from "./icons";

type Props = {
  theme: MapTheme;
  modeOpen: boolean;
  timeOpen: boolean;
  onOpenMode: () => void;
  onRecenter: () => void;
  onToggleTime: () => void;
  className?: string;
};

export default function MapActions({
  theme,
  modeOpen,
  timeOpen,
  onOpenMode,
  onRecenter,
  onToggleTime,
  className = "",
}: Props) {
  return (
    <div
      className={`pointer-events-auto flex flex-col gap-2 ${className}`}
      role="group"
      aria-label="Map actions"
    >
      <button
        type="button"
        onClick={onToggleTime}
        aria-expanded={timeOpen}
        aria-pressed={timeOpen}
        aria-label={timeOpen ? "Close time slider" : "Open time slider"}
        title="Time"
        className={`mn-action ${timeOpen ? "is-active" : ""}`}
      >
        <ClockIcon size={17} />
      </button>
      <button
        type="button"
        onClick={onOpenMode}
        aria-expanded={modeOpen}
        aria-label={`Map mode: ${theme === "light" ? "Light" : "Night"}`}
        title="Map mode"
        className={`mn-action ${modeOpen ? "is-active" : ""}`}
      >
        <LayersIcon size={17} />
      </button>
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Recenter map"
        title="Recenter"
        className="mn-action"
      >
        <LocateIcon size={17} />
      </button>
    </div>
  );
}
