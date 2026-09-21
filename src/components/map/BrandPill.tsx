"use client";

export default function BrandPill({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mn-control pointer-events-auto flex h-10 items-center gap-2.5 rounded-full px-3.5">
      <span className="mn-live-dot" aria-label="Live" />
      <span className="text-[14px] font-bold tracking-tight text-graphite">
        MaasNow
      </span>
      {!compact && (
        <>
          <span className="h-3.5 w-px bg-line" />
          <span className="text-[12px] font-medium text-graphite-muted">
            Maastricht, tonight
          </span>
        </>
      )}
    </div>
  );
}
