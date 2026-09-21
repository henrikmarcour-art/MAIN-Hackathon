"use client";

import type { MapTheme } from "./types";
import { LayersIcon, LocateIcon, RadarIcon } from "./icons";

type Props = {
  theme: MapTheme;
  showRadar: boolean;
  modeOpen: boolean;
  onOpenMode: () => void;
  onRecenter: () => void;
  onToggleRadar: () => void;
  className?: string;
};

export default function MapActions({
  theme,
  showRadar,
  modeOpen,
  onOpenMode,
  onRecenter,
  onToggleRadar,
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
      <button
        type="button"
        onClick={onToggleRadar}
        aria-pressed={showRadar}
        aria-label="Toggle social radar"
        title="Radar"
        className={`mn-action ${showRadar ? "is-on" : ""}`}
      >
        <RadarIcon size={17} />
      </button>
    </div>
  );
}
