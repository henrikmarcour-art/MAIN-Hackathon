"use client";

export default function BrandPill({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mn-control pointer-events-auto flex h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-3.5">
      <span className="mn-live-dot" aria-label="Live" />
      <span className="text-body font-semibold text-graphite">
        MaasNow
      </span>
      {!compact && (
        // The subtitle only shows when there is room for it on one line.
        <span className="hidden items-center gap-2.5 xl:flex">
          <span className="h-3.5 w-px bg-line" />
          <span className="text-meta text-graphite-muted">Maastricht, tonight</span>
        </span>
      )}
    </div>
  );
}
