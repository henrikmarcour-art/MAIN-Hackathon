"use client";

import { categoryMeta, type Category } from "@/data/events";

export type Filter = Exclude<Category, "private"> | "all";

type Props = {
  filter: Filter;
  onFilter: (f: Filter) => void;
  totalGoing: number;
};

const order: Filter[] = ["all", "bar", "club", "event", "food"];

export default function TopBar({ filter, onFilter, totalGoing }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] md:px-6 md:pt-5">
      <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-line/70 bg-surface/90 px-4 py-3 shadow-float backdrop-blur-md md:max-w-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-lime ring-4 ring-lime/25" />
            <h1 className="text-[17px] font-bold tracking-tight text-graphite">
              MaasNow
            </h1>
          </div>
          <p className="mt-0.5 text-[13px] leading-none text-graphite-muted">
            Maastricht, tonight
          </p>
        </div>
        <div className="text-right">
          <div className="text-[17px] font-bold tabular-nums tracking-tight text-graphite">
            {totalGoing.toLocaleString("en-US")}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-graphite-muted">
            out tonight
          </div>
        </div>
      </div>

      <div className="no-scrollbar pointer-events-auto -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {order.map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilter(key)}
              className={[
                "shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-colors shadow-float",
                active
                  ? "bg-graphite text-surface"
                  : "border border-line/70 bg-surface/90 text-graphite-soft backdrop-blur-md hover:bg-surface",
              ].join(" ")}
            >
              {categoryMeta[key].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
