import Link from "next/link";

/**
 * An explicit App Router 404. Without one, Next falls back to the pages-router
 * document while collecting page data, which can break the production build.
 */
export default function NotFound() {
  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-graphite-muted">
        MaasNow
      </p>
      <h1 className="mt-2 text-[28px] font-bold tracking-tight text-graphite">
        Nothing here tonight
      </h1>
      <p className="mt-1 max-w-[320px] text-[14px] leading-relaxed text-graphite-soft">
        That page is not on the map. Head back and see where Maastricht is
        going.
      </p>
      <Link
        href="/"
        className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-graphite px-6 text-[15px] font-bold tracking-tight text-lime"
      >
        Back to the map
      </Link>
    </main>
  );
}
