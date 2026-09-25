"use client";

import type { LocationStatus } from "@/lib/use-user-location";
import { LayersIcon, LocateIcon, LocateOffIcon, MinusIcon, PlusIcon } from "./icons";

type Props = {
  modeOpen: boolean;
  onToggleMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  locationStatus: LocationStatus;
  centeredOnUser: boolean;
  onLocate: () => void;
};

/**
 * Desktop map controls: map style top-right; zoom and locate bottom-right.
 * They follow the map mode through the --ui-control roles.
 */
export default function MapControls({
  modeOpen,
  onToggleMode,
  onZoomIn,
  onZoomOut,
  locationStatus,
  centeredOnUser,
  onLocate,
}: Props) {
  const off = locationStatus === "denied" || locationStatus === "unsupported";
  return (
    <>
      <div className="absolute right-6 top-6 z-20">
        <div className="mn-ctl">
          <button
            type="button"
            onClick={onToggleMode}
            aria-label="Map style"
            aria-expanded={modeOpen}
            className={modeOpen ? "is-on" : ""}
          >
            <LayersIcon size={18} />
          </button>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2.5">
        <div className="mn-ctl">
          <button type="button" onClick={onZoomIn} aria-label="Zoom in">
            <PlusIcon size={18} />
          </button>
          <hr />
          <button type="button" onClick={onZoomOut} aria-label="Zoom out">
            <MinusIcon size={18} />
          </button>
        </div>
        <div className="mn-ctl">
          <button
            type="button"
            onClick={onLocate}
            aria-label={off ? "Location is off" : "My location"}
            aria-pressed={centeredOnUser}
            className={centeredOnUser ? "is-on" : ""}
          >
            {off ? <LocateOffIcon size={18} /> : <LocateIcon size={18} />}
          </button>
        </div>
      </div>
    </>
  );
}
