"use client";

// Owned by: Thies (Profile)
// Control-center style profile sheet that floats over the map.
// Props stay the same shape so Map/Events work doesn't need to change.

import { useState } from "react";
import { currentUser, invitations, type Venue } from "@/data/events";
import { Avatar } from "./Avatar";

type Props = {
  venues: Venue[];
  goingIds: Set<string>;
  onOpenVenue: (id: string) => void;
};

type RowProps = {
  icon: React.ReactNode;
  tint: string;
  label: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
};

function Row({ icon, tint, label, trailing, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2/70 active:bg-surface-2"
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-white"
        style={{ background: tint }}
      >
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-medium tracking-tight text-graphite">
        {label}
      </span>
      {trailing}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-graphite-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 mt-5 px-1 text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
      {children}
    </h3>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-surface">
      {children}
    </div>
  );
}

export default function ProfilePanel({
  venues,
  goingIds,
  onOpenVenue,
}: Props) {
  const going = venues.filter((v) => goingIds.has(v.id));
  const [hint, setHint] = useState<string | null>(null);

  function comingSoon(label: string) {
    setHint(`${label} — coming in Phase 2`);
    window.clearTimeout((comingSoon as unknown as { t?: number }).t);
    (comingSoon as unknown as { t?: number }).t = window.setTimeout(
      () => setHint(null),
      1800
    );
  }

  return (
    <div className="animate-fade pointer-events-auto absolute inset-x-3 top-[calc(48px+env(safe-area-inset-top))] bottom-[calc(88px+env(safe-area-inset-bottom))] z-20 mx-auto overflow-y-auto rounded-[28px] border border-line/70 bg-surface shadow-sheet md:inset-x-0 md:bottom-10 md:top-10 md:w-[430px]">
      {/* grabber */}
      <div className="sticky top-0 z-10 flex justify-center bg-surface/95 pb-1 pt-3 backdrop-blur-md">
        <span className="h-1.5 w-10 rounded-full bg-line" />
      </div>

      <div className="px-5 pb-6">
        {/* header */}
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="relative">
            <Avatar person={currentUser} size={76} />
            <button
              type="button"
              onClick={() => comingSoon("Change photo")}
              aria-label="Change photo"
              className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-graphite text-surface shadow-float"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>
          <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-tight text-graphite">
            Hi, {currentUser.name}!
          </h2>
          <p className="mt-0.5 text-[13px] text-graphite-muted">Maastricht</p>
          <button
            type="button"
            onClick={() => comingSoon("Manage your profile")}
            className="mt-3 rounded-full border border-line px-5 py-2 text-[14px] font-semibold tracking-tight text-graphite transition-colors hover:bg-surface-2"
          >
            Manage your profile
          </button>
        </div>

        {/* stats */}
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-line/80 bg-surface py-3 text-center">
          <div>
            <div className="text-[18px] font-bold tabular-nums text-graphite">
              {going.length}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-graphite-muted">
              tonight
            </div>
          </div>
          <div className="border-x border-line/70">
            <div className="text-[18px] font-bold tabular-nums text-graphite">
              7
            </div>
            <div className="text-[11px] uppercase tracking-wider text-graphite-muted">
              friends
            </div>
          </div>
          <div>
            <div className="text-[18px] font-bold tabular-nums text-graphite">
              12
            </div>
            <div className="text-[11px] uppercase tracking-wider text-graphite-muted">
              nights out
            </div>
          </div>
        </div>

        {/* plans tonight */}
        <SectionLabel>Your plans tonight</SectionLabel>
        {going.length === 0 ? (
          <div className="rounded-2xl border border-line/80 bg-surface px-4 py-3">
            <p className="text-[14px] text-graphite-soft">
              Nothing yet. Tap a marker and hit “I’m going”.
            </p>
          </div>
        ) : (
          <Group>
            {going.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpenVenue(v.id)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-surface-2/70 active:bg-surface-2"
              >
                <span className="text-[15px] font-semibold tracking-tight text-graphite">
                  {v.name}
                </span>
                <span className="text-[12px] tabular-nums text-graphite-muted">
                  {v.time}
                </span>
              </button>
            ))}
          </Group>
        )}

        {/* social */}
        <SectionLabel>Social</SectionLabel>
        <Group>
          <Row
            tint="var(--color-violet)"
            label="Friends"
            onClick={() => comingSoon("Friends")}
            trailing={
              <span className="text-[13px] font-semibold tabular-nums text-graphite-muted">
                7
              </span>
            }
            icon={
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 20a5.5 5.5 0 0 0-2.3-4.5" />
              </svg>
            }
          />
          <Row
            tint="var(--color-orange)"
            label="Invitations"
            onClick={() => comingSoon("Invitations")}
            trailing={
              invitations.length > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-[11px] font-bold tabular-nums text-white">
                  {invitations.length}
                </span>
              ) : undefined
            }
            icon={
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M4 7l8 6 8-6" />
              </svg>
            }
          />
          <Row
            tint="var(--color-lime-deep)"
            label="Saved places"
            onClick={() => comingSoon("Saved places")}
            icon={
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 4h12v16l-6-4-6 4z" />
              </svg>
            }
          />
        </Group>

        {/* app */}
        <SectionLabel>App</SectionLabel>
        <Group>
          <Row
            tint="var(--color-graphite-soft)"
            label="Settings"
            onClick={() => comingSoon("Settings")}
            icon={
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L16 3H8l-.6 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1c.6.5 1.3.9 2 1.2L8 21h8l.6-2.5c.7-.3 1.4-.7 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
              </svg>
            }
          />
          <Row
            tint="var(--color-violet)"
            label="Help & feedback"
            onClick={() => comingSoon("Help & feedback")}
            icon={
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.2 9.2a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 4" />
                <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            }
          />
          <Row
            tint="var(--color-graphite-muted)"
            label="About MaasNow"
            onClick={() => comingSoon("About MaasNow")}
            icon={
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5" />
                <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            }
          />
        </Group>

        <div className="mt-5">
          <Group>
            <Row
              tint="#e5484d"
              label="Sign out"
              onClick={() => comingSoon("Sign out")}
              icon={
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                  <path d="M10 17l-5-5 5-5M5 12h11" />
                </svg>
              }
            />
          </Group>
        </div>
      </div>

      {/* phase-2 hint toast */}
      {hint && (
        <div className="pointer-events-none sticky bottom-3 z-10 mx-auto w-fit max-w-[85%] animate-fade rounded-full bg-graphite/90 px-4 py-2 text-center text-[13px] font-medium text-surface shadow-float backdrop-blur-md">
          {hint}
        </div>
      )}
    </div>
  );
}
