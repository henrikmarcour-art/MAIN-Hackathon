"use client";

import { useEffect } from "react";

type Props = {
  /** Changing `id` restarts the timer even when the text repeats. */
  notice: { id: number; message: string } | null;
  onDismiss: () => void;
};

const VISIBLE_MS = 4000;

/** One short, calm message above the bottom nav. Never stacks. */
export default function MapNotice({ notice, onDismiss }: Props) {
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(onDismiss, VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [notice, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom)+12px)] z-40 flex justify-center px-4 md:bottom-6"
    >
      {notice && (
        <p
          key={notice.id}
          className="animate-fade max-w-[340px] rounded-2xl bg-graphite px-4 py-3 text-center text-body font-medium leading-snug text-surface shadow-float"
        >
          {notice.message}
        </p>
      )}
    </div>
  );
}
