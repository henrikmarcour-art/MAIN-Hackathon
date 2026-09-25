"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  currentUser,
  friendPlans,
  invitations,
  type Invitation,
  type Venue,
} from "@/data/events";
import type { Filter } from "@/components/map/types";
import type { CameraFrame, CameraRequest, DeskMap } from "@/components/MapView";
import type { PickedLngLat } from "@/components/CreatePanel";
import CreatePanel from "@/components/CreatePanel";
import ProfilePanel from "@/components/ProfilePanel";
import MapModeSheet from "@/components/map/MapModeSheet";
import MapNotice from "@/components/map/MapNotice";
import MapControls from "@/components/map/MapControls";
import TimeCapsule from "@/components/map/TimeCapsule";
import PanelHeader from "@/components/panel/PanelHeader";
import TonightView, { type Pick } from "@/components/panel/TonightView";
import FriendsView from "@/components/panel/FriendsView";
import VenueView from "@/components/panel/VenueView";
import InviteView from "@/components/panel/InviteView";
import SearchView from "@/components/panel/SearchView";
import { names } from "@/components/panel/ui";
import {
  friendGroups,
  friendsDestination,
  planDeskPins,
  type PanelView,
} from "@/lib/map/desk-pins";
import { planPins } from "@/lib/map/pin-tier";
import type { MapStyleId } from "@/lib/map/styles";
import {
  addMinutes,
  clockLabel,
  isAvailableAt,
  minutesUntilNightEnd,
} from "@/lib/night-time";
import { rankVenues } from "@/lib/relevance";
import { loadPreferences } from "@/lib/preferences";
import { searchVenues } from "@/lib/search";
import { displayAttendeeCount, type CrowdQuery } from "@/lib/venue-attendance";
import type { LocationStatus, UserPosition } from "@/lib/use-user-location";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-(--mn-canvas)" />,
});

/** Panel width (approved desktop system). */
const PANEL_W = 440;

type TypeFilter = Exclude<Filter, "all" | "friends" | "trending">;
const isType = (f: Filter): f is TypeFilter =>
  f === "bar" || f === "club" || f === "event" || f === "food";

type Props = {
  /** Venues this visitor may see (private ones only if invited or hosting). */
  venues: Venue[];
  goingIds: Set<string>;
  onToggleGoing: (id: string) => void;
  acceptedVenueIds: Set<string>;
  onAcceptInvite: (venueId: string) => void;
  onDeclineInvite: (venueId: string) => void;
  selectedId: string | null;
  onSelectedId: (id: string | null) => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
  mapStyle: MapStyleId;
  onMapStyle: (s: MapStyleId) => void;
  clockTick: number;
  // Location
  userPosition: UserPosition | null;
  locationStatus: LocationStatus;
  centeredOnUser: boolean;
  onLocate: () => void;
  onUserPan: () => void;
  cameraRequest: CameraRequest | null;
  onCameraRequest: (r: CameraRequest) => void;
  notice: { id: number; message: string } | null;
  onDismissNotice: () => void;
  // Profile and Create (the avatar menu)
  tab: "map" | "profile" | "create";
  onTab: (t: "map" | "profile" | "create") => void;
  mapPickActive: boolean;
  mapPick: PickedLngLat | null;
  onMapPick: (p: PickedLngLat) => void;
  onStartMapPick: () => void;
  onCancelMapPick: () => void;
  onCreate: (v: Venue) => void;
  canDelete: (id: string) => boolean;
  onDelete: (id: string) => void;
};

/**
 * Desktop (≥ 1024 px): one persistent left panel with one contextual view at
 * a time, the map as the dominant canvas, and the time capsule as the single
 * time control. The page owns shared state (going, invites, created events,
 * location); this shell owns what only desktop needs: the panel view, the
 * chosen time, search, and the desktop pin plan.
 */
export default function DesktopShell(p: Props) {
  const {
    venues,
    goingIds,
    selectedId,
    filter,
    mapStyle,
    clockTick,
    userPosition,
    tab,
  } = p;

  const [view, setView] = useState<PanelView>(() => (selectedId ? "venue" : "tonight"));
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [declined, setDeclined] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const [modeOpen, setModeOpen] = useState(false);
  /**
   * The moment chosen with the time capsule (epoch ms), or null for live.
   * Stored as an absolute time so "00:00" stays 00:00 while the clock ticks;
   * once that moment arrives it simply becomes now.
   */
  const [chosenAt, setChosenAt] = useState<number | null>(null);

  const now = useMemo(() => new Date(clockTick), [clockTick]);
  const maxOffset = useMemo(() => minutesUntilNightEnd(now), [now]);
  // Exact (fractional) minutes, so the capsule and the panel show the very
  // same clock time as it was chosen.
  const offset =
    chosenAt === null || chosenAt <= clockTick
      ? 0
      : Math.min(maxOffset, (chosenAt - clockTick) / 60000);
  const at = useMemo(() => addMinutes(now, offset), [now, offset]);
  const isNow = offset === 0;
  const setOffset = useCallback(
    (m: number) => setChosenAt(m <= 0 ? null : clockTick + m * 60000),
    [clockTick]
  );
  const crowd: CrowdQuery = useMemo(
    () => ({ mode: isNow ? "stillActiveOrComing" : "instantPresence", at }),
    [isNow, at]
  );

  // The type filter hides other types; time only dims (markers never churn).
  const typeFilter = isType(filter) ? filter : null;
  const shown = useMemo(
    () => (typeFilter ? venues.filter((v) => v.isPrivate || v.category === typeFilter) : venues),
    [venues, typeFilter]
  );
  const venueById = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const back = useCallback(() => {
    setView("tonight");
    p.onSelectedId(null);
    setInviteId(null);
  }, [p]);

  const openInvite = useCallback((inv: Invitation) => {
    p.onSelectedId(null);
    setInviteId(inv.id);
    setView("invite");
  }, [p]);

  const openVenue = useCallback(
    (id: string) => {
      // A private night you were invited to opens as its invitation first.
      const inv = invitations.find((i) => i.venueId === id);
      if (inv && !p.acceptedVenueIds.has(id)) {
        openInvite(inv);
        return;
      }
      p.onSelectedId(id);
      setView("venue");
      setModeOpen(false);
      p.onTab("map");
    },
    [p, openInvite]
  );

  // Selecting on the map (page state) switches the panel to that venue.
  useEffect(() => {
    if (selectedId && view !== "venue") setView("venue");
  }, [selectedId, view]);

  // Escape steps back: close Profile/Create, then return to Tonight.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (tab !== "map") p.onTab("map");
      else if (modeOpen) setModeOpen(false);
      else if (view !== "tonight") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, modeOpen, view, back, p]);

  // --- Tonight ------------------------------------------------------------
  const ranked = useMemo(
    () =>
      rankVenues(
        shown.filter((v) => !v.isPrivate),
        {
          at,
          prefs: loadPreferences(),
          goingIds,
          mineIds: new Set(shown.filter((v) => v.hostId === currentUser.id).map((v) => v.id)),
          userCreatedIds: new Set(shown.filter((v) => v.id.startsWith("created-")).map((v) => v.id)),
          userPosition,
        }
      ).filter((r) => !r.relevance.hidden && isAvailableAt(r.venue, at)),
    [shown, at, goingIds, userPosition]
  );
  const picks: Pick[] = useMemo(
    () =>
      ranked.slice(0, 4).map(({ venue, relevance }) => ({
        venue,
        why: venue.friendsGoing.length
          ? `${names(venue.friendsGoing)} ${venue.friendsGoing.length > 1 ? "are" : "is"} going`
          : relevance.headline ?? venue.vibe,
      })),
    [ranked]
  );
  const outCount = useMemo(
    () =>
      shown
        .filter((v) => !v.isPrivate)
        .reduce((sum, v) => sum + displayAttendeeCount(v, goingIds, "all", crowd), 0),
    [shown, goingIds, crowd]
  );
  const pendingInvite = useMemo(() => {
    const inv = invitations.find(
      (i) => !p.acceptedVenueIds.has(i.venueId) && !declined.has(i.id) && venueById.has(i.venueId)
    );
    return inv ? { invitation: inv, venue: venueById.get(inv.venueId)! } : null;
  }, [p.acceptedVenueIds, declined, venueById]);
  const friendsOut = useMemo(() => friendPlans.filter((f) => !f.hosting), []);
  const destination = useMemo(() => friendsDestination(), []);

  // --- Search -------------------------------------------------------------
  const results = useMemo(() => searchVenues(shown, query), [shown, query]);

  // --- Map ----------------------------------------------------------------
  const invite = inviteId ? invitations.find((i) => i.id === inviteId) ?? null : null;
  const plan = useMemo(() => {
    const counts = new Map(shown.map((v) => [v.id, displayAttendeeCount(v, goingIds, "all", crowd)]));
    return planPins({
      venues: shown,
      counts,
      filter: "all",
      goingIds,
      invitedIds: new Set(invitations.map((i) => i.venueId)),
      prefs: loadPreferences(),
      at,
      userPosition,
    });
  }, [shown, goingIds, crowd, at, userPosition]);
  const desk: DeskMap = useMemo(
    () => ({
      pins: planDeskPins({
        view,
        venues: shown,
        plan,
        at,
        goingIds,
        selectedId,
        invite,
        searchHits: results.map((v) => v.id),
      }),
      groups: view === "friends" ? friendGroups(venueById) : [],
    }),
    [view, shown, plan, at, goingIds, selectedId, invite, results, venueById]
  );

  const frame: CameraFrame | null = useMemo(() => {
    const pt = (v: Venue | undefined): [number, number][] => (v ? [[v.lng, v.lat]] : []);
    if (view === "venue" && selectedId) return { key: `venue:${selectedId}`, points: pt(venueById.get(selectedId)) };
    if (view === "invite" && invite) return { key: `invite:${invite.id}`, points: pt(venueById.get(invite.venueId)) };
    if (view === "friends") {
      const ids = new Set(friendPlans.map((f) => f.atVenueId));
      if (destination) ids.add(destination.venueId);
      return { key: "friends", points: [...ids].flatMap((id) => pt(venueById.get(id))) };
    }
    if (view === "search" && results.length) {
      return { key: `search:${results.map((v) => v.id).join(",")}`, points: results.flatMap((v) => pt(v)) };
    }
    return null;
  }, [view, selectedId, invite, results, venueById, destination]);

  const selected = selectedId ? venueById.get(selectedId) ?? null : null;
  const timeLabel = clockLabel(at);

  let panel: React.ReactNode;
  if (view === "venue" && selected) {
    panel = (
      <VenueView
        venue={selected}
        at={at}
        isNow={isNow}
        going={goingIds.has(selected.id)}
        userPosition={userPosition}
        onBack={back}
        onToggleGoing={() => p.onToggleGoing(selected.id)}
        onDelete={p.canDelete(selected.id) ? () => { p.onDelete(selected.id); back(); } : undefined}
      />
    );
  } else if (view === "invite" && invite && venueById.get(invite.venueId)) {
    const v = venueById.get(invite.venueId)!;
    panel = (
      <InviteView
        invitation={invite}
        venue={v}
        accepted={p.acceptedVenueIds.has(v.id)}
        onBack={back}
        onAccept={() => {
          p.onAcceptInvite(v.id);
          setInviteId(null);
          p.onSelectedId(v.id);
          setView("venue");
        }}
        onDecline={() => {
          p.onDeclineInvite(v.id);
          setDeclined((d) => new Set(d).add(invite.id));
          back();
        }}
      />
    );
  } else if (view === "friends") {
    panel = (
      <FriendsView
        plans={friendPlans}
        venueById={venueById}
        destination={destination}
        onBack={back}
        onOpenVenue={openVenue}
      />
    );
  } else if (view === "search") {
    panel = (
      <SearchView
        query={query}
        onQuery={setQuery}
        results={results}
        onCancel={() => {
          setQuery("");
          back();
        }}
        onOpenVenue={openVenue}
        onFriends={() => setView("friends")}
      />
    );
  } else {
    panel = (
      <>
        <PanelHeader
          onSearch={() => setView("search")}
          onProfile={() => p.onTab("profile")}
          onCreate={() => p.onTab("create")}
        />
        <TonightView
          at={at}
          isNow={isNow}
          timeLabel={timeLabel}
          outCount={outCount}
          picks={picks}
          friendsOut={friendsOut}
          venueById={venueById}
          invite={pendingInvite}
          userPosition={userPosition}
          typeFilter={typeFilter}
          onTypeFilter={(t) => p.onFilter(t ?? "all")}
          onOpenVenue={openVenue}
          onFriends={() => setView("friends")}
          onInvite={() => pendingInvite && openInvite(pendingInvite.invitation)}
        />
      </>
    );
  }

  const panelKey = view === "venue" ? `venue:${selectedId}` : view === "invite" ? `invite:${inviteId}` : view;

  return (
    <>
      <aside
        aria-label="maasnow"
        className="mn-panel absolute inset-y-0 left-0 z-10 overflow-hidden"
        style={{ width: PANEL_W }}
      >
        <div key={panelKey} className="mn-panel-view no-scrollbar h-full overflow-y-auto">
          {panel}
        </div>
      </aside>

      <div className="absolute inset-y-0 right-0" style={{ left: PANEL_W }}>
        <MapView
          venues={shown}
          selectedId={selectedId}
          goingIds={goingIds}
          onSelect={openVenue}
          onMapClick={() => {
            if (p.mapPickActive) return;
            setModeOpen(false);
            if (tab !== "map") p.onTab("map");
            else if (view === "venue" || view === "invite") back();
          }}
          focusId={null}
          mapStyle={mapStyle}
          filter={filter}
          crowd={crowd}
          userPosition={userPosition}
          cameraRequest={p.cameraRequest}
          onUserPan={p.onUserPan}
          pickMode={p.mapPickActive}
          pickLngLat={p.mapPick}
          onPick={p.onMapPick}
          desk={desk}
          frame={frame}
        />

        {/* One surface at a time: Profile/Create cards replace the map controls. */}
        {!p.mapPickActive && tab === "map" && (
          <MapControls
            modeOpen={modeOpen}
            onToggleMode={() => setModeOpen((o) => !o)}
            onZoomIn={() => p.onCameraRequest({ target: "zoomIn", nonce: Date.now() })}
            onZoomOut={() => p.onCameraRequest({ target: "zoomOut", nonce: Date.now() })}
            locationStatus={p.locationStatus}
            centeredOnUser={p.centeredOnUser}
            onLocate={p.onLocate}
          />
        )}

        {!p.mapPickActive && tab === "map" && (
          <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
            <TimeCapsule offset={offset} onChange={setOffset} max={maxOffset} now={now} />
          </div>
        )}

        {tab === "profile" && (
          <ProfilePanel venues={venues} goingIds={goingIds} onOpenVenue={openVenue} />
        )}
        {tab === "create" && (
          <CreatePanel
            mapPickActive={p.mapPickActive}
            mapPick={p.mapPick}
            onRequestMapPick={p.onStartMapPick}
            onCancelMapPick={p.onCancelMapPick}
            onCreate={p.onCreate}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[72px]">
          <MapNotice notice={p.notice} onDismiss={p.onDismissNotice} />
        </div>

        <MapModeSheet
          open={modeOpen}
          mapStyle={mapStyle}
          onMapStyle={p.onMapStyle}
          onClose={() => setModeOpen(false)}
          desktop
        />
      </div>
    </>
  );
}
