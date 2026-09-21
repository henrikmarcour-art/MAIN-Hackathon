"use client";

import { categoryMeta, type Category } from "@/data/events";

export type Filter = Exclude<Category, "private"> | "all";

type Props = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  totalGoing: number;
  theme: "light" | "night";
  onToggleTheme: () => void;
  showRadar: boolean;
  onToggleRadar: () => void;
};

const order: Filter[] = ["all", "bar", "club", "event", "food"];

export default function TopBar({ filter, onFilter, totalGoing, theme, onToggleTheme, showRadar, onToggleRadar }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 pt-[max(12px,env(safe-area-inset-top))] md:flex-row md:items-start md:justify-between md:px-6 md:pt-6">
      
      <div className="flex items-center justify-between px-4 md:px-0 md:justify-start">
        {/* Left: Brand Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-line/70 bg-surface/90 px-3.5 py-2 shadow-float backdrop-blur-md shrink-0 transition-colors">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime"></span>
            </span>
            <h1 className="text-[14px] font-bold tracking-tight text-graphite">
              MaasNow
            </h1>
          </div>
          <div className="h-3.5 w-px bg-line/70" />
          <p className="text-[12px] font-medium text-graphite-muted">
            Maastricht, tonight
          </p>
          <div className="h-3.5 w-px bg-line/70 hidden md:block" />
          <div className="hidden md:flex items-center gap-1.5 text-right">
            <div className="text-[13px] font-bold tabular-nums tracking-tight text-graphite">
              {totalGoing.toLocaleString("en-US")}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-graphite-muted">
              out
            </div>
          </div>
        </div>

        {/* Mobile Toggles */}
        <div className="flex gap-2 pointer-events-auto md:hidden">
          <button onClick={onToggleRadar} className={["flex h-9 w-9 items-center justify-center rounded-full border shadow-float backdrop-blur-md transition-colors", showRadar ? "border-lime bg-lime/10 text-lime-deep" : "border-line/70 bg-surface/90 text-graphite-soft hover:bg-surface"].join(" ")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
          </button>
          <button onClick={onToggleTheme} className="flex h-9 w-9 items-center justify-center rounded-full border border-line/70 bg-surface/90 shadow-float backdrop-blur-md text-graphite-soft hover:bg-surface transition-colors">
            {theme === 'light' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Filters & Desktop Toggles */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="pointer-events-auto no-scrollbar flex gap-2 overflow-x-auto px-4 md:px-0">
          {order.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilter(key)}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-colors shadow-float border backdrop-blur-md",
                  active
                    ? "bg-graphite border-graphite text-surface"
                    : "border-line/70 bg-surface/90 text-graphite-soft hover:bg-surface",
                ].join(" ")}
              >
                {categoryMeta[key].label}
              </button>
            );
          })}
        </div>
        
        {/* Desktop Toggles */}
        <div className="hidden md:flex gap-2 pointer-events-auto pl-2">
          <button onClick={onToggleRadar} className={["flex h-[38px] w-[38px] items-center justify-center rounded-full border shadow-float backdrop-blur-md transition-colors", showRadar ? "border-lime bg-lime/10 text-lime-deep" : "border-line/70 bg-surface/90 text-graphite-soft hover:bg-surface"].join(" ")} title="Toggle Radar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
          </button>
          <button onClick={onToggleTheme} className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line/70 bg-surface/90 shadow-float backdrop-blur-md text-graphite-soft hover:bg-surface transition-colors" title="Toggle Theme">
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
