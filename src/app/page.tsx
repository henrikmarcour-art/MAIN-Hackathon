"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  invitations,
  venues as allVenues,
  currentUser,
  type Venue,
} from "@/data/events";
import TopBar from "@/components/TopBar";
import EventSheet from "@/components/EventSheet";
import BottomNav, { type Tab } from "@/components/BottomNav";
import ForYouPanel from "@/components/ForYouPanel";
import CreatePanel, { type PickedLngLat } from "@/components/CreatePanel";
import ProfilePanel from "@/components/ProfilePanel";
import { InviteCard, InviteChip } from "@/components/InviteCard";
import MapActions from "@/components/map/MapActions";
import MapModeSheet from "@/components/map/MapModeSheet";
import DiscoveryRail from "@/components/map/DiscoveryRail";
import {
  TRENDING_MIN,
  type Filter,
  type MapTheme,
} from "@/components/map/types";
import { uniqueFriendsAcrossVenues } from "@/lib/venue-attendance";
import { fetchCreatedEvents, insertEvent } from "@/lib/supabase-events";

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
  const [createdVenues, setCreatedVenues] = useState<Venue[]>([]);
  const [mapPickActive, setMapPickActive] = useState(false);
  const [mapPick, setMapPick] = useState<PickedLngLat | null>(null);

  // Map UI state
  const [theme, setTheme] = useState<MapTheme>("light");
  const [showRadar, setShowRadar] = useState(true);
  const [modeOpen, setModeOpen] = useState(false);
  const [recenterNonce, setRecenterNonce] = useState(0);

  // Load user-created events from Supabase once on mount and merge them in.
  // Keep any locally-created venue whose insert hasn't resolved to the
  // server yet (or a duplicate slipping in) by de-duping on id.
  useEffect(() => {
    let cancelled = false;
    fetchCreatedEvents().then((fetched) => {
      if (cancelled || fetched.length === 0) return;
      setCreatedVenues((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        const merged = [...prev];
        for (const venue of fetched) {
          if (!seen.has(venue.id)) merged.push(venue);
        }
        return merged;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(
    () => [...allVenues, ...createdVenues],
    [createdVenues]
  );

  // Private venues are only visible once their invitation is accepted,
  // or if the current user is hosting them.
  const visibleVenues = useMemo(
    () =>
      catalog.filter((v) =>
        v.isPrivate
          ? acceptedVenueIds.has(v.id) || v.hostId === currentUser.id
          : true
      ),
    [acceptedVenueIds, catalog]
  );

  const filteredVenues = useMemo(
    () =>
      visibleVenues.filter((v) => {
        if (filter === "all") return true;
        if (filter === "friends") return v.friendsGoing.length > 0;
        if (filter === "trending")
          return v.goingCount + (goingIds.has(v.id) ? 1 : 0) >= TRENDING_MIN;
        return v.isPrivate || v.category === filter;
      }),
    [visibleVenues, filter, goingIds]
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

  const railHeadlineCount = useMemo(
    () =>
      filter === "friends"
        ? uniqueFriendsAcrossVenues(filteredVenues)
        : totalGoing,
    [filter, filteredVenues, totalGoing]
  );

  const pendingInvites = invitations.filter(
    (inv) =>
      !acceptedVenueIds.has(inv.venueId) && !declinedInviteIds.has(inv.id)
  );
  const openInvite = invitations.find((i) => i.id === openInviteId) ?? null;
  const openInviteVenue = openInvite
    ? catalog.find((v) => v.id === openInvite.venueId) ?? null
    : null;

  const onMap = tab === "map" && !mapPickActive;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setFocusId(id);
    setTab("map");
    setModeOpen(false);
    setMapPickActive(false);
    setMapPick(null);
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
    setMapPickActive(false);
    setMapPick(null);
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

  const handleCreate = useCallback((venue: Venue) => {
    // Optimistic: show it immediately, then persist so it survives a
    // refresh and shows up for anyone else opening the app.
    setCreatedVenues((prev) => [...prev, venue]);
    setGoingIds((prev) => new Set(prev).add(venue.id));
    setMapPickActive(false);
    setMapPick(null);
    setFilter("all");
    setTab("map");
    setTimeout(() => {
      setSelectedId(venue.id);
      setFocusId(venue.id);
    }, 50);
    void insertEvent(venue);
  }, []);

  /** Hosts can remove the events they created; seeded venues stay put. */
  const deleteVenue = useCallback((id: string) => {
    setCreatedVenues((prev) => prev.filter((v) => v.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setFocusId((cur) => (cur === id ? null : cur));
    setGoingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setAcceptedVenueIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const startMapPick = useCallback(() => {
    setSelectedId(null);
    setMapPick(null);
    setMapPickActive(true);
    setModeOpen(false);
  }, []);

  const cancelMapPick = useCallback(() => {
    setMapPickActive(false);
    setMapPick(null);
  }, []);

  const showTopBar = tab !== "profile" && !mapPickActive;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-surface-2">
      <MapView
        venues={filteredVenues}
        selectedId={selectedId}
        goingIds={goingIds}
        onSelect={handleSelect}
        onMapClick={() => {
          if (mapPickActive) return;
          setSelectedId(null);
          setModeOpen(false);
        }}
        focusId={focusId}
        theme={theme}
        filter={filter}
        showRadar={showRadar}
        recenterNonce={recenterNonce}
        pickMode={mapPickActive}
        pickLngLat={mapPick}
        onPick={setMapPick}
      />

      {showTopBar && (
        <TopBar
          filter={filter}
          onFilter={handleFilter}
          venues={visibleVenues}
          goingIds={goingIds}
          onPick={handleSelect}
        />
      )}

      {onMap && (
        <MapActions
          theme={theme}
          showRadar={showRadar}
          modeOpen={modeOpen}
          onOpenMode={() => setModeOpen((o) => !o)}
          onRecenter={() => setRecenterNonce((n) => n + 1)}
          onToggleRadar={() => setShowRadar((r) => !r)}
          className="absolute right-3 top-[calc(max(12px,env(safe-area-inset-top))+112px)] z-20 md:right-6 md:top-[76px]"
        />
      )}

      {tab === "profile" && (
        <div className="animate-fade pointer-events-none absolute inset-0 z-10 bg-graphite/20 backdrop-blur-[2px]" />
      )}

      {pendingInvites.length > 0 && onMap && (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+112px)] z-20 flex justify-center px-14 md:justify-start md:px-6 md:top-[76px]">
          {pendingInvites.map((inv) => {
            const venue = catalog.find((v) => v.id === inv.venueId);
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

      {onMap && !selected && (
        <DiscoveryRail
          venues={filteredVenues}
          goingIds={goingIds}
          filter={filter}
          headlineCount={railHeadlineCount}
          onPick={handleSelect}
        />
      )}

      {onMap && selected && (
        <EventSheet
          venue={selected}
          going={goingIds.has(selected.id)}
          onToggleGoing={() => toggleGoing(selected.id)}
          onClose={() => setSelectedId(null)}
          onDelete={
            createdVenues.some((v) => v.id === selected.id)
              ? () => deleteVenue(selected.id)
              : undefined
          }
        />
      )}

      {tab === "foryou" && (
        <ForYouPanel
          venues={visibleVenues}
          goingIds={goingIds}
          onOpenVenue={handleSelect}
        />
      )}

      {tab === "create" && (
        <CreatePanel
          mapPickActive={mapPickActive}
          mapPick={mapPick}
          onRequestMapPick={startMapPick}
          onCancelMapPick={cancelMapPick}
          onCreate={handleCreate}
        />
      )}

      {tab === "profile" && (
        <ProfilePanel
          venues={visibleVenues}
          goingIds={goingIds}
          onOpenVenue={handleSelect}
        />
      )}

      <BottomNav
        tab={tab}
        onChange={(next) => {
          if (next !== "create") {
            setMapPickActive(false);
            setMapPick(null);
          }
          setTab(next);
        }}
      />

      <MapModeSheet
        open={onMap && modeOpen}
        theme={theme}
        showRadar={showRadar}
        onTheme={setTheme}
        onToggleRadar={() => setShowRadar((r) => !r)}
        onClose={() => setModeOpen(false)}
      />

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
