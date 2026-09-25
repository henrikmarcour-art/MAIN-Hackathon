"use client";

import { people, type FriendPlan, type Person, type Venue } from "@/data/events";
import { BackIcon, LockIcon } from "@/components/map/icons";
import { BTN_PRIMARY, Caption, Face, Faces, ROUND_BTN, Wordmark } from "./ui";

type Props = {
  plans: FriendPlan[];
  venueById: ReadonlyMap<string, Venue>;
  destination: { venueId: string; people: Person[]; at: string } | null;
  onBack: () => void;
  onOpenVenue: (id: string) => void;
};

const shortName = (n: string) => n.replace(/^Café /, "");

/**
 * Friends: where it's going first (the shared destination and one Join),
 * then everyone out right now. Sample data until friends are real.
 */
export default function FriendsView({ plans, venueById, destination, onBack, onOpenVenue }: Props) {
  const out = plans.filter((p) => !p.hosting).length;
  const dest = destination ? venueById.get(destination.venueId) : null;

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between px-7 pt-[26px]">
        <button type="button" onClick={onBack} aria-label="Back" className={ROUND_BTN}>
          <BackIcon size={18} />
        </button>
        <Wordmark size={20} muted />
      </div>
      <div className="px-7 pt-6">
        <h1 className="text-[46px] font-bold leading-[0.95] tracking-[-0.05em] text-ui-ink">
          {out} friends out
        </h1>
        {dest && (
          <p className="mt-2.5 text-[16px] text-ui-ink-soft">Most of them end up at {dest.name}.</p>
        )}
      </div>

      {dest && destination && (
        <div className="mx-4 mt-6 flex items-center gap-4 rounded-[22px] bg-ui-fill p-5">
          <Faces people={destination.people} size={56} overlap={0.32} ringColor="var(--ui-fill)" />
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-bold tracking-[-0.02em] text-ui-ink">{dest.name}</div>
            <div className="truncate text-meta text-ui-ink-soft">
              {destination.people.map((x) => x.name).join(", ")} ·{" "}
              <span className="font-mono tabular-nums">{destination.at}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenVenue(dest.id)}
            className={`${BTN_PRIMARY} h-11 px-[18px] text-[15px]`}
          >
            Join
          </button>
        </div>
      )}

      <div className="px-7 pt-[22px]">
        <Caption className="mb-1">Right now</Caption>
        {plans.map((p) => {
          const person = people[p.personId];
          const at = venueById.get(p.atVenueId);
          const next = p.nextVenueId ? venueById.get(p.nextVenueId) : null;
          if (!person || !at) return null;
          return (
            <button
              key={p.personId}
              type="button"
              onClick={() => onOpenVenue(p.hosting ? at.id : next?.id ?? at.id)}
              className="flex w-full items-center gap-3.5 border-b border-ui-line py-2.5 text-left"
            >
              <Face person={person} size={46} ring={p.hosting ? "violet" : "none"} />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold text-ui-ink">{person.name}</span>
                <span className="flex items-center gap-[5px] truncate text-meta text-ui-ink-soft">
                  {p.hosting ? (
                    <>
                      <span className="text-ui-violet">
                        <LockIcon size={11} strokeWidth={2.4} />
                      </span>
                      Hosting {at.name}
                    </>
                  ) : (
                    <>At {at.name}</>
                  )}
                </span>
              </span>
              {next && (
                <span className="text-right">
                  <span className="block text-meta font-semibold text-ui-ink">{shortName(next.name)}</span>
                  <span className="block font-mono text-[12px] tabular-nums text-ui-ink-soft">{p.nextAt}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
