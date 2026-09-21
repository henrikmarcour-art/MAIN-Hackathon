"use client";

// Owned by: Leo (Events)
// Phase 2: turn this into the real event-creation form
// (title, date, category, private/public toggle, invite list).

export default function CreatePanel() {
  return (
    <div className="animate-fade pointer-events-auto absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] top-[132px] z-20 mx-auto w-full overflow-y-auto px-3 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[400px] md:px-0">
      <div className="rounded-3xl border border-line/70 bg-surface p-5 shadow-sheet">
        <h2 className="text-[22px] font-bold tracking-tight">Create</h2>
        <p className="mt-0.5 text-[13px] text-graphite-muted">
          Host a public night or a private party.
        </p>
        <div className="mt-4 grid gap-2">
          <div className="rounded-2xl border border-line/80 p-4">
            <div className="text-[14px] font-semibold">Public event</div>
            <div className="text-[12px] text-graphite-muted">
              Visible to everyone in Maastricht.
            </div>
          </div>
          <div className="rounded-2xl border border-violet/40 p-4">
            <div className="text-[14px] font-semibold text-violet">
              Private party
            </div>
            <div className="text-[12px] text-graphite-muted">
              Only invited guests see it on the map.
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-graphite-muted">
          Event creation ships in Phase 2.
        </p>
      </div>
    </div>
  );
}
