"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import TimeScrubber, { TimeClock } from "@/components/map/TimeScrubber";
import MapModeSheet from "@/components/map/MapModeSheet";
import DiscoveryRail from "@/components/map/DiscoveryRail";
import MapNotice from "@/components/map/MapNotice";
import type { CameraRequest } from "@/components/MapView";
import {
  TRENDING_MIN,
  type Filter,
} from "@/components/map/types";
import { uniqueFriendsAcrossVenues, displayAttendeeCount, type CrowdQuery } from "@/lib/venue-attendance";
import { addHours, clockInMaastricht, formatClock, isHappeningAt, isUpcomingTonight } from "@/lib/night-time";
import {
  canDeleteEvent,
  deleteEvent,
  fetchCreatedEvents,
  insertEvent,
} from "@/lib/supabase-events";
import { MAP_CANVAS_COLOR, type MapStyleId } from "@/lib/map/styles";
import { isInMaastricht } from "@/lib/map/geo";
import {
  loadPreferences,
  recordInteraction,
  updatePreferences,
} from "@/lib/preferences";
import { useUserLocation, type UserPosition } from "@/lib/use-user-location";
import { useDesktop } from "@/lib/use-desktop";
import DesktopShell from "@/components/DesktopShell";

// MapLibre touches `window`; load it client-side only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-surface-2" />,
});

export default function Home() {
  // ≥ 1024 px gets the desktop system (panel + map); null until hydrated.
  const isDesktop = useDesktop();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [goingIds, setGoingIds] = useState<Set<string>>(() => new Set());
  const [acceptedVenueIds, setAcceptedVenueIds] = useState<Set<string>>(
    () => new Set()
  );
  const [openInviteId, setOpenInviteId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("map");
  const [createdVenues, setCreatedVenues] = useState<Venue[]>([]);
  const [mapPickActive, setMapPickActive] = useState(false);
  const [mapPick, setMapPick] = useState<PickedLngLat | null>(null);

  // Map UI state
  // Only MapView (client-only) reads this, so a stored choice can't cause a hydration mismatch.
  const [mapStyle, setMapStyle] = useState<MapStyleId>(
    () => loadPreferences().mapStyle
  );
  const chooseMapStyle = useCallback((next: MapStyleId) => {
    setMapStyle(next);
    updatePreferences((p) => ({ ...p, mapStyle: next }));
  }, []);

  // The map is the edge-to-edge surface on every tab, so the browser's
  // status-bar and toolbar areas take its colour.
  useEffect(() => {
    const color = MAP_CANVAS_COLOR[mapStyle];
    document.documentElement.style.setProperty("--mn-canvas", color);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", color);
  }, [mapStyle]);
  const [modeOpen, setModeOpen] = useState(false);

  // Location: asked for only when the locate button is tapped; never stored.
  const {
    status: locationStatus,
    position: userPosition,
    request: requestLocation,
  } = useUserLocation();
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null);
  const [centeredOnUser, setCenteredOnUser] = useState(false);
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(
    null
  );
  const locatePendingRef = useRef(false);
  const showNotice = useCallback(
    (message: string) => setNotice({ id: Date.now(), message }),
    []
  );
  const dismissNotice = useCallback(() => setNotice(null), []);
  const stopCenteringOnUser = useCallback(() => setCenteredOnUser(false), []);

  const goToUser = useCallback(
    (pos: UserPosition) => {
      if (isInMaastricht(pos)) {
        setCameraRequest({ target: "user", nonce: Date.now() });
        setCenteredOnUser(true);
      } else {
        setCameraRequest({ target: "city", nonce: Date.now() });
        setCenteredOnUser(false);
        showNotice("You're outside Maastricht, so here's the city.");
      }
    },
    [showNotice]
  );

  const handleLocate = useCallback(() => {
    if (locationStatus === "active" && userPosition) {
      goToUser(userPosition);
      return;
    }
    if (locationStatus === "unsupported") {
      showNotice("This browser can't share your location.");
      return;
    }
    locatePendingRef.current = true;
    requestLocation();
  }, [locationStatus, userPosition, goToUser, showNotice, requestLocation]);

  // Finish a locate tap once the browser answers.
  useEffect(() => {
    if (!locatePendingRef.current) return;
    if (locationStatus === "active" && userPosition) {
      locatePendingRef.current = false;
      goToUser(userPosition);
    } else if (locationStatus === "denied") {
      locatePendingRef.current = false;
      showNotice("Location is off. Allow it for this site in your browser settings.");
    } else if (locationStatus === "unavailable") {
      locatePendingRef.current = false;
      showNotice("Couldn't find your location. Try again in a moment.");
    } else if (locationStatus === "unsupported") {
      locatePendingRef.current = false;
      showNotice("This browser can't share your location.");
    }
  }, [locationStatus, userPosition, goToUser, showNotice]);

  // Flying to a venue moves the camera away from the visitor.
  useEffect(() => {
    if (focusId) setCenteredOnUser(false);
  }, [focusId]);
  const [timeOpen, setTimeOpen] = useState(false);
  const [hourOffset, setHourOffset] = useState(0);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [panLocked, setPanLocked] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setClockTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

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

  // Personalization groundwork: count opens per category (local only, nothing hidden yet).
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  useEffect(() => {
    if (!selectedId) return;
    const venue = catalogRef.current.find((v) => v.id === selectedId);
    if (venue) recordInteraction("open", venue);
  }, [selectedId]);

  const invitedVenueIds = useMemo(
    () => new Set(invitations.map((inv) => inv.venueId)),
    []
  );

  // Private nights stay on the map if you host them or were invited —
  // even before you accept, and after you decline.
  const visibleVenues = useMemo(
    () =>
      catalog.filter((v) =>
        v.isPrivate
          ? v.hostId === currentUser.id || invitedVenueIds.has(v.id)
          : true
      ),
    [catalog, invitedVenueIds]
  );

  const timedVenues = useMemo(
    () =>
      visibleVenues.filter((v) => {
        const at = new Date(clockTick);
        if (!timeOpen) return isUpcomingTonight(v, at);
        return isHappeningAt(v, new Date(at.getTime() + hourOffset * 3600_000));
      }),
    [visibleVenues, timeOpen, hourOffset, clockTick]
  );

  const filteredVenues = useMemo(
    () =>
      timedVenues.filter((v) => {
        if (filter === "all") return true;
        if (filter === "friends") return v.friendsGoing.length > 0;
        if (filter === "trending")
          return v.goingCount + (goingIds.has(v.id) ? 1 : 0) >= TRENDING_MIN;
        return v.isPrivate || v.category === filter;
      }),
    [timedVenues, filter, goingIds]
  );

  // Mobile hides venues outside the chosen time, so drop a selection that
  // vanished. Desktop only dims them (DesktopShell owns its own list).
  useEffect(() => {
    if (isDesktop !== false) return;
    if (selectedId && !filteredVenues.some((v) => v.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredVenues, selectedId, isDesktop]);

  const selected = useMemo(
    () => filteredVenues.find((v) => v.id === selectedId) ?? null,
    [filteredVenues, selectedId]
  );

  const onMap = tab === "map" && !mapPickActive;
  const sliderOpen = Boolean(onMap && timeOpen && !selected);

  useEffect(() => {
    if (!sliderOpen) setPanLocked(false);
  }, [sliderOpen]);
  const evaluationTime = useMemo(
    () => addHours(new Date(clockTick), timeOpen ? hourOffset : 0),
    [clockTick, timeOpen, hourOffset]
  );
  const crowd: CrowdQuery = useMemo(
    () => ({
      mode: timeOpen ? "instantPresence" : "stillActiveOrComing",
      at: evaluationTime,
    }),
    [timeOpen, evaluationTime]
  );

  const railHeadlineCount = useMemo(
    () =>
      filter === "friends"
        ? uniqueFriendsAcrossVenues(filteredVenues)
        : filteredVenues.reduce(
            (sum, v) => sum + displayAttendeeCount(v, goingIds, filter, crowd),
            0
          ),
    [filter, filteredVenues, goingIds, crowd]
  );

  const pendingInvites = invitations.filter(
    (inv) => !acceptedVenueIds.has(inv.venueId)
  );
  const openInvite = invitations.find((i) => i.id === openInviteId) ?? null;
  const openInviteVenue = openInvite
    ? catalog.find((v) => v.id === openInvite.venueId) ?? null
    : null;

  const clockDisplay = useMemo(() => {
    const at = addHours(new Date(clockTick), sliderOpen ? hourOffset : 0);
    const { hour, minute } = clockInMaastricht(at);
    return formatClock(hour, minute);
  }, [clockTick, sliderOpen, hourOffset]);

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
    if (invitedVenueIds.has(id)) {
      setAcceptedVenueIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [invitedVenueIds]);

  /** Accepting an invitation means you're going (local only, Phase 1). */
  const acceptVenueInvite = useCallback((venueId: string) => {
    setAcceptedVenueIds((prev) => new Set(prev).add(venueId));
    setGoingIds((prev) => new Set(prev).add(venueId));
  }, []);

  const declineVenueInvite = useCallback((venueId: string) => {
    setAcceptedVenueIds((prev) => {
      if (!prev.has(venueId)) return prev;
      const next = new Set(prev);
      next.delete(venueId);
      return next;
    });
    setGoingIds((prev) => {
      if (!prev.has(venueId)) return prev;
      const next = new Set(prev);
      next.delete(venueId);
      return next;
    });
  }, []);

  const acceptInvite = useCallback(() => {
    if (!openInvite) return;
    const venueId = openInvite.venueId;
    acceptVenueInvite(venueId);
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
  }, [openInvite, acceptVenueInvite]);

  const declineInvite = useCallback(() => {
    if (!openInvite) return;
    declineVenueInvite(openInvite.venueId);
    setOpenInviteId(null);
  }, [openInvite, declineVenueInvite]);

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
    void deleteEvent(id);
  }, []);

  const startMapPick = useCallback(() => {
    setSelectedId(null);
    setMapPick(null);
    setMapPickActive(true);
    setModeOpen(false);
    setTimeOpen(false);
    setHourOffset(0);
  }, []);

  const cancelMapPick = useCallback(() => {
    setMapPickActive(false);
    setMapPick(null);
  }, []);

  const showTopBar = tab !== "profile" && !mapPickActive;

  const deskTab = tab === "profile" || tab === "create" ? tab : "map";

  return (
    <main
      className="mn-ui relative h-dvh w-full overflow-hidden bg-surface-2"
      // Set only after hydration: the stored map style is client-only.
      data-mode={isDesktop === null ? undefined : mapStyle}
    >
      {isDesktop === true && (
        <DesktopShell
          venues={visibleVenues}
          goingIds={goingIds}
          onToggleGoing={toggleGoing}
          acceptedVenueIds={acceptedVenueIds}
          onAcceptInvite={acceptVenueInvite}
          onDeclineInvite={declineVenueInvite}
          selectedId={selectedId}
          onSelectedId={setSelectedId}
          filter={filter}
          onFilter={handleFilter}
          mapStyle={mapStyle}
          onMapStyle={chooseMapStyle}
          clockTick={clockTick}
          userPosition={userPosition}
          locationStatus={locationStatus}
          centeredOnUser={centeredOnUser}
          onLocate={handleLocate}
          onUserPan={stopCenteringOnUser}
          cameraRequest={cameraRequest}
          onCameraRequest={setCameraRequest}
          notice={notice}
          onDismissNotice={dismissNotice}
          tab={deskTab}
          onTab={setTab}
          mapPickActive={mapPickActive}
          mapPick={mapPick}
          onMapPick={setMapPick}
          onStartMapPick={startMapPick}
          onCancelMapPick={cancelMapPick}
          onCreate={handleCreate}
          canDelete={canDeleteEvent}
          onDelete={deleteVenue}
        />
      )}

      {isDesktop === false && (
      <>
      <MapView
        venues={filteredVenues}
        selectedId={selectedId}
        goingIds={goingIds}
        onSelect={handleSelect}
        onMapClick={() => {
          if (mapPickActive) return;
          setSelectedId(null);
          setModeOpen(false);
          setTimeOpen(false);
          setHourOffset(0);
        }}
        focusId={focusId}
        mapStyle={mapStyle}
        filter={filter}
        crowd={crowd}
        lockPan={panLocked}
        userPosition={userPosition}
        cameraRequest={cameraRequest}
        onUserPan={stopCenteringOnUser}
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
          crowd={crowd}
          onPick={handleSelect}
        />
      )}

      {tab === "profile" && (
        <div className="animate-fade pointer-events-none absolute inset-0 z-10 bg-graphite/20 backdrop-blur-[2px]" />
      )}

      {pendingInvites.length > 0 && onMap && (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+112px)] z-20 flex flex-col items-center gap-2 px-14 md:items-start md:px-6 md:top-[76px]">
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
          crowd={crowd}
          headlineCount={railHeadlineCount}
          onPick={handleSelect}
        />
      )}

      {onMap && selected && (
        <EventSheet
          venue={selected}
          going={goingIds.has(selected.id)}
          crowd={crowd}
          onToggleGoing={() => toggleGoing(selected.id)}
          onClose={() => setSelectedId(null)}
          onDelete={
            canDeleteEvent(selected.id)
              ? () => deleteVenue(selected.id)
              : undefined
          }
        />
      )}

      {tab === "foryou" && (
        <ForYouPanel
          venues={visibleVenues}
          goingIds={goingIds}
          crowd={crowd}
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

      {onMap && !selected && (
        <MapActions
          modeOpen={modeOpen}
          timeOpen={timeOpen}
          onOpenMode={() => {
            setTimeOpen(false);
            setHourOffset(0);
            setModeOpen((o) => !o);
          }}
          locationStatus={locationStatus}
          centeredOnUser={centeredOnUser}
          onLocate={handleLocate}
          onToggleTime={() => {
            setTimeOpen((open) => !open);
            setHourOffset(0);
            setModeOpen(false);
          }}
          className="absolute right-3 bottom-[calc(76px+env(safe-area-inset-bottom)+12px)] z-40 md:right-6 md:bottom-6"
        />
      )}

      {sliderOpen && (
        <div
          className="mn-time-slot"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <TimeClock time={clockDisplay} className="mn-dock-clock-over" />
          <TimeScrubber
            offsetHours={hourOffset}
            onOffsetHours={setHourOffset}
            onScrubbingChange={setPanLocked}
          />
        </div>
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

      <MapNotice notice={notice} onDismiss={dismissNotice} />

      <MapModeSheet
        open={onMap && modeOpen}
        mapStyle={mapStyle}
        onMapStyle={chooseMapStyle}
        onClose={() => setModeOpen(false)}
      />

      {openInvite && openInviteVenue && (
        <InviteCard
          invitation={openInvite}
          venue={openInviteVenue}
          crowd={crowd}
          onAccept={acceptInvite}
          onDecline={declineInvite}
          onClose={() => setOpenInviteId(null)}
        />
      )}
      </>
      )}
    </main>
  );
}
