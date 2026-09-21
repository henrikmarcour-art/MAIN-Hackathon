"use client";

// Owned by: Leo (Events)

import { useEffect, useId, useMemo, useState } from "react";
import { currentUser, friends, type Venue } from "@/data/events";
import { Avatar } from "./Avatar";
import {
  geocodeAddress,
  mergePlaceHits,
  reverseGeocode,
  searchLocalPlaces,
  searchRemotePlaces,
  type PlaceHit,
} from "@/lib/places";

export type Visibility = "public" | "private";
export type LocationMode = "map" | "address" | "search";

export type PickedLngLat = { lng: number; lat: number };

type LocationValue = {
  address: string;
  lng: number;
  lat: number;
};

type Props = {
  mapPickActive: boolean;
  mapPick: PickedLngLat | null;
  onRequestMapPick: () => void;
  onCancelMapPick: () => void;
  onCreate: (venue: Venue) => void;
};

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-line/80 bg-surface-2 px-3.5 py-2.5 text-[15px] text-graphite outline-none placeholder:text-graphite-muted focus:border-graphite/40";

export default function CreatePanel({
  mapPickActive,
  mapPick,
  onRequestMapPick,
  onCancelMapPick,
  onCreate,
}: Props) {
  const formId = useId();
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [name, setName] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode | null>(null);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressStatus, setAddressStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [timeFrom, setTimeFrom] = useState("21:00");
  const [timeTo, setTimeTo] = useState("01:00");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(() => new Set());
  const [details, setDetails] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [pickLabel, setPickLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!mapPickActive || !mapPick) {
      setPickLabel(null);
      return;
    }
    let cancelled = false;
    setPickLabel("Looking up this pin…");
    reverseGeocode(mapPick.lng, mapPick.lat).then((label) => {
      if (!cancelled) setPickLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [mapPickActive, mapPick]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (locationMode !== "search" || q.length < 1) {
      setSearchHits([]);
      return;
    }
    const local = searchLocalPlaces(q);
    setSearchHits(local);
    if (q.length < 2) return;
    let cancelled = false;
    setSearching(true);
    const t = window.setTimeout(() => {
      searchRemotePlaces(q)
        .then((remote) => {
          if (!cancelled) setSearchHits(mergePlaceHits(local, remote));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [searchQuery, locationMode]);

  const missing = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("name");
    if (!location) errors.push("place");
    if (!timeFrom || !timeTo) errors.push("time");
    return errors;
  }, [name, location, timeFrom, timeTo]);

  const canSubmit = missing.length === 0;

  function resetForm() {
    setName("");
    setLocationMode(null);
    setLocation(null);
    setAddressQuery("");
    setAddressStatus(null);
    setSearchQuery("");
    setSearchHits([]);
    setTimeFrom("21:00");
    setTimeTo("01:00");
    setInvitedIds(new Set());
    setDetails("");
    setAttempted(false);
  }

  function toggleFriend(id: string) {
    setInvitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function lookupAddress(e: React.FormEvent) {
    e.preventDefault();
    const q = addressQuery.trim();
    if (!q) {
      setAddressStatus("Enter an address.");
      return;
    }
    setAddressStatus("Looking up…");
    const hit = await geocodeAddress(`${q}, Maastricht`);
    if (!hit) {
      setAddressStatus("No match in Maastricht. Try a street name.");
      return;
    }
    setLocation({
      address: hit.address.includes(hit.name)
        ? hit.address
        : `${hit.name} · ${hit.address}`,
      lng: hit.lng,
      lat: hit.lat,
    });
    setAddressStatus(null);
  }

  function choosePlace(hit: PlaceHit) {
    setLocation({
      address: `${hit.name} · ${hit.address}`,
      lng: hit.lng,
      lat: hit.lat,
    });
    setSearchQuery(hit.name);
  }

  function confirmMapPick() {
    if (!mapPick) return;
    setLocation({
      address: pickLabel && !pickLabel.startsWith("Looking")
        ? pickLabel
        : `${mapPick.lat.toFixed(5)}, ${mapPick.lng.toFixed(5)}`,
      lng: mapPick.lng,
      lat: mapPick.lat,
    });
    onCancelMapPick();
  }

  function submit() {
    setAttempted(true);
    if (!visibility || !location || !canSubmit) return;
    const invited = friends.filter((f) => invitedIds.has(f.id));
    const isPrivate = visibility === "private";
    const time = `${timeFrom} – ${timeTo}`;
    const venue: Venue = {
      id: `created-${Date.now()}`,
      name: name.trim(),
      category: isPrivate ? "private" : "event",
      address: location.address,
      lng: location.lng,
      lat: location.lat,
      time,
      vibe: isPrivate ? "Invite only" : "Open night",
      price: 1,
      description:
        details.trim() ||
        (isPrivate
          ? `${currentUser.name}’s private night. Invited guests only.`
          : `Public night hosted by ${currentUser.name}. Anyone in Maastricht can join.`),
      goingCount: 0,
      friendsGoing: invited,
      isPrivate,
      openJoin: !isPrivate,
      hostId: currentUser.id,
      invitedIds: invited.map((f) => f.id),
    };
    onCreate(venue);
    resetForm();
    setVisibility(null);
  }

  if (mapPickActive) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 mx-auto w-full px-3 md:bottom-6 md:right-6 md:left-auto md:w-[400px] md:px-0">
        <div className="pointer-events-auto rounded-3xl border border-line/70 bg-surface p-4 shadow-sheet">
          <div className="text-[13px] font-semibold uppercase tracking-wider text-graphite-muted">
            Choose on map
          </div>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-graphite">
            {mapPick
              ? pickLabel ?? "Pin dropped"
              : "Tap the map to drop a pin."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancelMapPick}
              className="h-11 rounded-2xl border border-line/80 text-[14px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!mapPick}
              onClick={confirmMapPick}
              className="h-11 rounded-2xl bg-graphite text-[14px] font-semibold text-surface disabled:opacity-40"
            >
              Use this pin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!visibility) {
    return (
      <div className="animate-fade pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[132px] z-20 mx-auto w-full overflow-y-auto px-3 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[400px] md:px-0">
        <div className="rounded-3xl border border-line/70 bg-surface p-5 shadow-sheet">
          <h2 className="text-[22px] font-bold tracking-tight">Create</h2>
          <p className="mt-0.5 text-[13px] text-graphite-muted">
            Host a public night or a private party.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className="rounded-2xl border border-line/80 p-4 text-left transition-colors hover:border-graphite/30 hover:bg-surface-2"
            >
              <div className="text-[14px] font-semibold">Public event</div>
              <div className="text-[12px] text-graphite-muted">
                Visible to everyone in Maastricht. Random accounts can join.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className="rounded-2xl border border-violet/40 p-4 text-left transition-colors hover:bg-violet/5"
            >
              <div className="text-[14px] font-semibold text-violet">
                Private party
              </div>
              <div className="text-[12px] text-graphite-muted">
                Only you and invited friends see it on the map.
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPrivate = visibility === "private";
  const accent = isPrivate ? "text-violet" : "text-lime-deep";

  return (
    <div className="animate-fade pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[132px] z-20 mx-auto w-full overflow-y-auto px-3 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[400px] md:px-0">
      <div className="rounded-3xl border border-line/70 bg-surface p-5 shadow-sheet">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setVisibility(null);
          }}
          className="text-[13px] font-semibold text-graphite-muted hover:text-graphite"
        >
          ← Back
        </button>
        <h2 className={`mt-2 text-[22px] font-bold tracking-tight ${accent}`}>
          {isPrivate ? "Private party" : "Public event"}
        </h2>
        <p className="mt-0.5 text-[13px] text-graphite-muted">
          {isPrivate
            ? "Invited friends only. Name, place and time are required."
            : "Anyone in Maastricht can join. Name, place and time are required."}
        </p>

        <div className="mt-4 grid gap-4">
          <label htmlFor={`${formId}-name`} className="block">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
              Name <span className="text-orange">*</span>
            </span>
            <input
              id={`${formId}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isPrivate ? "Leo’s rooftop" : "Sunset session"}
              className={inputClass}
              autoComplete="off"
            />
            {attempted && !name.trim() && (
              <p className="mt-1 text-[12px] text-orange">Add a name.</p>
            )}
          </label>

          <fieldset>
            <legend className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
              Place <span className="text-orange">*</span>
            </legend>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
              {(
                [
                  ["map", "On map"],
                  ["address", "Address"],
                  ["search", "Search"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setLocationMode(key);
                    if (key === "map") onRequestMapPick();
                  }}
                  className={[
                    "rounded-xl py-2 text-[12px] font-semibold",
                    locationMode === key
                      ? "bg-surface text-graphite shadow-float"
                      : "text-graphite-muted",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {locationMode === "address" && (
              <form onSubmit={lookupAddress} className="mt-2">
                <input
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  placeholder="Tongersestraat 6, Maastricht"
                  className={inputClass}
                  autoComplete="street-address"
                />
                <button
                  type="submit"
                  className="mt-2 h-10 w-full rounded-2xl bg-graphite text-[13px] font-semibold text-surface"
                >
                  Look up address
                </button>
                {addressStatus && (
                  <p className="mt-1 text-[12px] text-graphite-muted">
                    {addressStatus}
                  </p>
                )}
              </form>
            )}

            {locationMode === "search" && (
              <div className="mt-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bars, clubs, food…"
                  className={inputClass}
                  autoComplete="off"
                />
                {searching && (
                  <p className="mt-1 text-[12px] text-graphite-muted">
                    Searching Maastricht…
                  </p>
                )}
                {searchHits.length > 0 && (
                  <ul className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-line/80">
                    {searchHits.map((hit) => (
                      <li key={hit.id} className="border-b border-line/70 last:border-0">
                        <button
                          type="button"
                          onClick={() => choosePlace(hit)}
                          className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left hover:bg-surface-2"
                        >
                          <span>
                            <span className="block text-[14px] font-semibold">
                              {hit.name}
                            </span>
                            <span className="block text-[12px] text-graphite-muted">
                              {hit.address}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-graphite-muted">
                            {hit.kind}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {location && (
              <p className="mt-2 rounded-2xl bg-lime/30 px-3 py-2 text-[13px] font-medium text-graphite">
                {location.address}
              </p>
            )}
            {attempted && !location && (
              <p className="mt-1 text-[12px] text-orange">
                Pick a place on the map, enter an address, or search.
              </p>
            )}
          </fieldset>

          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
              Time <span className="text-orange">*</span>
            </span>
            <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <label className="sr-only" htmlFor={`${formId}-from`}>
                From
              </label>
              <input
                id={`${formId}-from`}
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className={inputClass + " mt-0"}
              />
              <span className="text-[13px] text-graphite-muted">to</span>
              <label className="sr-only" htmlFor={`${formId}-to`}>
                To
              </label>
              <input
                id={`${formId}-to`}
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                className={inputClass + " mt-0"}
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
              Invite friends
            </legend>
            <p className="mt-1 text-[12px] text-graphite-muted">
              {isPrivate
                ? "Only invited accounts can see and join."
                : "Friends get a heads-up. Anyone else can still join."}
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {friends.map((f) => {
                const on = invitedIds.has(f.id);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => toggleFriend(f.id)}
                      aria-pressed={on}
                      className={[
                        "flex w-full items-center gap-2 rounded-2xl border px-2.5 py-2 text-left",
                        on
                          ? isPrivate
                            ? "border-violet/50 bg-violet/10"
                            : "border-graphite/30 bg-surface-2"
                          : "border-line/80",
                      ].join(" ")}
                    >
                      <Avatar person={f} size={28} />
                      <span className="truncate text-[13px] font-semibold">
                        {f.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <label htmlFor={`${formId}-details`} className="block">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
              Details
            </span>
            <textarea
              id={`${formId}-details`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Bring drinks, dress code, playlist…"
              className={inputClass + " resize-none"}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={submit}
          className={[
            "mt-5 flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold tracking-tight active:scale-[0.98]",
            isPrivate ? "bg-violet text-white" : "bg-lime text-graphite",
          ].join(" ")}
        >
          {isPrivate ? "Create private party" : "Publish public event"}
        </button>
      </div>
    </div>
  );
}
