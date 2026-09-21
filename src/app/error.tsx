"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
        MaasNow
      </p>
      <h1 className="mt-2 text-[24px] font-bold tracking-tight text-graphite">
        Something broke
      </h1>
      <p className="mt-2 max-w-[340px] text-[14px] leading-relaxed text-graphite-soft">
        After a merge, stop the old dev server (Ctrl+C) and run{" "}
        <code className="text-graphite">npm run dev</code> again — it clears a
        stale <code className="text-graphite">.next</code> folder (fixes missing
        chunk errors like <code className="text-graphite">586.js</code>).
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-graphite px-6 text-[15px] font-bold tracking-tight text-lime"
      >
        Try again
      </button>
    </main>
  );
}
