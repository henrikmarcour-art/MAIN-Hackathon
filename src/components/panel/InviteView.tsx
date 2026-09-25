"use client";

import type { Invitation, Venue } from "@/data/events";
import { BackIcon, CheckIcon, LockIcon } from "@/components/map/icons";
import { BTN_PRIMARY, BTN_SECONDARY, Face, Faces, ROUND_BTN } from "./ui";

type Props = {
  invitation: Invitation;
  venue: Venue;
  accepted: boolean;
  onBack: () => void;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * Private invitation. Violet is a thread only: a 3px top line, a lock and a
 * ring — never a fill. The exact location stays hidden until you join.
 */
export default function InviteView({
  invitation: inv,
  venue: v,
  accepted,
  onBack,
  onAccept,
  onDecline,
}: Props) {
  const guests = v.friendsGoing.filter((p) => p.id !== inv.from.id);
  // Everyone in except the host; the named guests are part of that count.
  const inCount = Math.max(0, v.goingCount - 1);
  const more = Math.max(0, inCount - guests.length);
  const rows: [string, React.ReactNode][] = [
    ["When", <span key="w" className="font-mono tabular-nums">Tonight · {v.time}</span>],
    [
      "Where",
      accepted
        ? v.address
        : `${inv.areaHint ?? v.address.split("·")[0].trim()} · shared when you join`,
    ],
  ];
  if (inv.bring) rows.push(["Bring", inv.bring]);

  return (
    <div className="flex h-full flex-col">
      <div className="h-[3px] shrink-0 bg-ui-violet" />
      <div className="flex items-center justify-between px-7 pt-[23px]">
        <button type="button" onClick={onBack} aria-label="Back" className={ROUND_BTN}>
          <BackIcon size={18} />
        </button>
        <span className="flex items-center gap-1.5 text-caption uppercase tracking-[0.1em] text-ui-violet">
          <LockIcon size={12} strokeWidth={2.4} />
          Private invitation
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6 pt-9">
        <div className="flex items-center gap-4">
          <Face person={inv.from} size={84} />
          <div>
            <div className="text-meta text-ui-ink-soft">From</div>
            <div className="text-[22px] font-bold tracking-[-0.02em] text-ui-ink">{inv.from.name}</div>
          </div>
        </div>
        <h1 className="mt-7 text-[42px] font-bold leading-none tracking-[-0.045em] text-ui-ink [text-wrap:balance]">
          {inv.headline ?? `${v.name}, tonight.`}
        </h1>
        <p className="mt-4 text-[18px] leading-[27px] text-ui-ink-soft [text-wrap:pretty]">
          “{inv.message}”
        </p>
        <div className="mt-[26px]">
          {rows.map(([k, val]) => (
            <div key={k} className="flex border-t border-ui-line py-[13px] text-[15px]">
              <span className="w-[76px] shrink-0 text-ui-ink-soft">{k}</span>
              <span className="font-medium text-ui-ink">{val}</span>
            </div>
          ))}
        </div>
        {inCount > 0 && (
          <div className="flex items-center gap-3 border-t border-ui-line pt-4">
            {guests.length > 0 && <Faces people={guests} size={34} />}
            <span className="text-[14px] text-ui-ink-soft">
              {guests.length > 0 ? (
                <>
                  <b className="font-semibold text-ui-ink">{guests.map((p) => p.name).join(", ")}</b>
                  {more > 0 ? ` + ${more}` : ""} {inCount === 1 ? "is" : "are"} in
                </>
              ) : (
                <>{inCount} in</>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 border-t border-ui-line bg-ui-panel px-7 pb-[26px] pt-4">
        {accepted ? (
          <span className="inline-flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-2xl bg-ui-fill text-[16px] font-semibold text-ui-ink">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
              <CheckIcon size={13} />
            </span>
            You’re in
          </span>
        ) : (
          <button type="button" onClick={onAccept} className={`${BTN_PRIMARY} flex-1`}>
            I’m in
          </button>
        )}
        <button type="button" onClick={onDecline} className={BTN_SECONDARY}>
          Not tonight
        </button>
      </div>
    </div>
  );
}
