"use client";

import type { Venue } from "@/data/events";
import BrandPill from "@/components/map/BrandPill";
import SearchCapsule from "@/components/map/SearchCapsule";
import DiscoveryChips from "@/components/map/DiscoveryChips";
import type { Filter } from "@/components/map/types";
import type { CrowdQuery } from "@/lib/venue-attendance";

export type { Filter } from "@/components/map/types";

type Props = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  /** Venues currently visible on the map (used for search results) */
  venues: Venue[];
  goingIds: Set<string>;
  crowd: CrowdQuery;
  onPick: (id: string) => void;
};

/**
 * Top composition:
 *  - mobile: search capsule, then a scrollable discovery row
 *  - desktop: brand pill (left) · search capsule (center) · discovery chips (right)
 */
export default function TopBar({
  filter,
  onFilter,
  venues,
  goingIds,
  crowd,
  onPick,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-[max(12px,env(safe-area-inset-top))] md:pt-6">
      {/* Mobile */}
      <div className="flex flex-col gap-2.5 md:hidden">
        <SearchCapsule
          venues={venues}
          goingIds={goingIds}
          filter={filter}
          crowd={crowd}
          onPick={onPick}
          className="px-3"
        />
        <DiscoveryChips filter={filter} onFilter={onFilter} className="px-3" />
      </div>

      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-4 md:px-6">
        <div className="flex justify-start">
          <BrandPill />
        </div>
        <SearchCapsule
          venues={venues}
          goingIds={goingIds}
          filter={filter}
          crowd={crowd}
          onPick={onPick}
          className="w-[420px]"
        />
        <div className="flex justify-end">
          <DiscoveryChips filter={filter} onFilter={onFilter} />
        </div>
      </div>
      <p className="px-3 pt-1 text-center text-[11px] font-medium text-graphite-muted md:px-6">
        Test by Leo
      </p>
    </div>
  );
}
