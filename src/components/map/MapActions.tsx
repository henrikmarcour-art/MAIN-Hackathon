"use client";

import type { LocationStatus } from "@/lib/use-user-location";
import { ClockIcon, LayersIcon, LocateIcon, LocateOffIcon } from "./icons";

type Props = {
  modeOpen: boolean;
  timeOpen: boolean;
  locationStatus: LocationStatus;
  /** True while the map is centred on the visitor's position. */
  centeredOnUser: boolean;
  onOpenMode: () => void;
  onLocate: () => void;
  onToggleTime: () => void;
  className?: string;
};

function locateLabel(status: LocationStatus, centered: boolean) {
  if (status === "locating") return "Finding your location";
  if (status === "denied" || status === "unsupported") return "Location is off";
  if (status === "active" && centered) return "Showing your location";
  return "Show my location";
}

export default function MapActions({
  modeOpen,
  timeOpen,
  locationStatus,
  centeredOnUser,
  onOpenMode,
  onLocate,
  onToggleTime,
  className = "",
}: Props) {
  const locationOff =
    locationStatus === "denied" || locationStatus === "unsupported";
  const label = locateLabel(locationStatus, centeredOnUser);
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
        aria-label="Map style"
        title="Map style"
        className={`mn-action ${modeOpen ? "is-active" : ""}`}
      >
        <LayersIcon size={17} />
      </button>
      <button
        type="button"
        onClick={onLocate}
        aria-label={label}
        title={label}
        className={[
          "mn-action",
          locationStatus === "locating" ? "is-locating" : "",
          locationStatus === "active" && centeredOnUser ? "is-active" : "",
          locationOff ? "is-off" : "",
        ].join(" ")}
      >
        {locationOff ? <LocateOffIcon size={17} /> : <LocateIcon size={17} />}
      </button>
    </div>
  );
}
