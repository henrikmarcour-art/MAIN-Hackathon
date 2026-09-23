"use client";

export type Tab = "map" | "foryou" | "create" | "profile";

type Props = {
  tab: Tab;
  onChange: (t: Tab) => void;
  className?: string;
};

const items: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4l6 2 6-2v14l-6 2-6-2-6 2V6z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    key: "foryou",
    label: "For You",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l2.4 5.6L20 9.3l-4.3 3.9L17 19l-5-2.9L7 19l1.3-5.8L4 9.3l5.6-.7z" />
      </svg>
    ),
  },
  {
    key: "create",
    label: "Create",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export default function BottomNav({ tab, onChange, className = "" }: Props) {
  return (
    <nav
      aria-label="Primary"
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(10px,env(safe-area-inset-bottom))] md:bottom-6 md:pb-0 ${className}`}
    >
      <div className="pointer-events-auto grid w-full max-w-[420px] grid-cols-4 rounded-2xl border border-line/70 bg-surface/85 p-1 shadow-float backdrop-blur-md">
        {items.map((it) => {
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => onChange(it.key)}
              aria-current={active ? "page" : undefined}
              className={[
                "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold tracking-tight transition-colors",
                active
                  ? "bg-graphite text-surface"
                  : "text-graphite-muted hover:text-graphite",
              ].join(" ")}
            >
              <span className="h-5 w-5">{it.icon}</span>
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
