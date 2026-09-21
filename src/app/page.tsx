"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { invitations, venues as allVenues } from "@/data/events";
import TopBar, { type Filter } from "@/components/TopBar";
import EventSheet from "@/components/EventSheet";
import BottomNav, { type Tab } from "@/components/BottomNav";
import ForYouPanel from "@/components/ForYouPanel";
import CreatePanel from "@/components/CreatePanel";
import ProfilePanel from "@/components/ProfilePanel";
import { InviteCard, InviteChip } from "@/components/InviteCard";

// MapLibre touches `window`; load it client-side only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-surface-2" />,
});

export default function Home() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [goingIds, setGoingIds] = useState<Set<string>>(() => new Set());
  const [acceptedVenueIds, setAcceptedVenueIds] = useState<Set<string>>(
    () => new Set()
  );
  const [declinedInviteIds, setDeclinedInviteIds] = useState<Set<string>>(
    () => new Set()
  );
  const [openInviteId, setOpenInviteId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("map");

  const [theme, setTheme] = useState<"light" | "night">("light");
  const [showRadar, setShowRadar] = useState(true);

  // Private venues are only visible once their invitation is accepted.
  const visibleVenues = useMemo(
    () =>
      allVenues.filter((v) =>
        v.isPrivate ? acceptedVenueIds.has(v.id) : true
      ),
    [acceptedVenueIds]
  );

  const filteredVenues = useMemo(
    () =>
      visibleVenues.filter((v) =>
        filter === "all" ? true : v.isPrivate || v.category === filter
      ),
    [visibleVenues, filter]
  );

  const selected = useMemo(
    () => filteredVenues.find((v) => v.id === selectedId) ?? null,
    [filteredVenues, selectedId]
  );

  const totalGoing = useMemo(
    () =>
      visibleVenues.reduce(
        (sum, v) => sum + v.goingCount + (goingIds.has(v.id) ? 1 : 0),
        0
      ),
    [visibleVenues, goingIds]
  );

  const pendingInvites = invitations.filter(
    (inv) =>
      !acceptedVenueIds.has(inv.venueId) && !declinedInviteIds.has(inv.id)
  );
  const openInvite = invitations.find((i) => i.id === openInviteId) ?? null;
  const openInviteVenue = openInvite
    ? allVenues.find((v) => v.id === openInvite.venueId) ?? null
    : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setFocusId(id);
    setTab("map");
  }, []);

  const handleFilter = useCallback((f: Filter) => {
    setFilter(f);
    setSelectedId(null);
  }, []);

  const toggleGoing = useCallback((id: string) => {
    setGoingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const acceptInvite = useCallback(() => {
    if (!openInvite) return;
    const venueId = openInvite.venueId;
    setAcceptedVenueIds((prev) => new Set(prev).add(venueId));
    setGoingIds((prev) => new Set(prev).add(venueId));
    setOpenInviteId(null);
    setFilter("all");
    setTab("map");
    // Let the marker mount, then focus it.
    setTimeout(() => {
      setSelectedId(venueId);
      setFocusId(venueId);
    }, 50);
  }, [openInvite]);

  const declineInvite = useCallback(() => {
    if (!openInvite) return;
    setDeclinedInviteIds((prev) => new Set(prev).add(openInvite.id));
    setOpenInviteId(null);
  }, [openInvite]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-surface-2">
      <MapView
        venues={filteredVenues}
        selectedId={selectedId}
        goingIds={goingIds}
        onSelect={handleSelect}
        onMapClick={() => setSelectedId(null)}
        focusId={focusId}
        theme={theme}
        showRadar={showRadar}
      />

      <TopBar 
        filter={filter} 
        onFilter={handleFilter} 
        totalGoing={totalGoing} 
        theme={theme}
        onToggleTheme={() => setTheme(t => t === "light" ? "night" : "light")}
        showRadar={showRadar}
        onToggleRadar={() => setShowRadar(r => !r)}
      />

      {pendingInvites.length > 0 && tab === "map" && (
        <div className="pointer-events-none absolute inset-x-0 top-[132px] z-20 flex justify-center px-4 md:justify-start md:px-6 md:top-[140px]">
          {pendingInvites.map((inv) => {
            const venue = allVenues.find((v) => v.id === inv.venueId);
            if (!venue) return null;
            return (
              <InviteChip
                key={inv.id}
                invitation={inv}
                venue={venue}
                onOpen={() => setOpenInviteId(inv.id)}
              />
            );
          })}
        </div>
      )}

      {tab === "map" && selected && (
        <EventSheet
          venue={selected}
          going={goingIds.has(selected.id)}
          onToggleGoing={() => toggleGoing(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {tab === "foryou" && (
        <ForYouPanel
          venues={visibleVenues}
          goingIds={goingIds}
          onOpenVenue={handleSelect}
        />
      )}

      {tab === "create" && <CreatePanel />}

      {tab === "profile" && (
        <ProfilePanel
          venues={visibleVenues}
          goingIds={goingIds}
          onOpenVenue={handleSelect}
        />
      )}

      <BottomNav tab={tab} onChange={setTab} />

      {openInvite && openInviteVenue && (
        <InviteCard
          invitation={openInvite}
          venue={openInviteVenue}
          onAccept={acceptInvite}
          onDecline={declineInvite}
          onClose={() => setOpenInviteId(null)}
        />
      )}
    </main>
  );
}
