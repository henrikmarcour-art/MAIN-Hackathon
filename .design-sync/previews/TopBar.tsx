import { useState } from "react";
import { TopBar, venues } from "maasnow";

type Filter = "all" | "friends" | "trending" | "bar" | "club" | "event" | "food";
const crowd = { mode: "stillActiveOrComing" as const, at: new Date("2026-09-25T22:30:00+02:00") };

export function Desktop() {
  const [filter, setFilter] = useState<Filter>("all");
  // TopBar pins to the top of its positioned parent; this card shows the desktop grid.
  return (
    <div style={{ position: "relative", width: 1280, height: 110, background: "#f1eee7" }}>
      <TopBar filter={filter} onFilter={setFilter} venues={venues} goingIds={new Set()} crowd={crowd} onPick={() => {}} />
    </div>
  );
}
