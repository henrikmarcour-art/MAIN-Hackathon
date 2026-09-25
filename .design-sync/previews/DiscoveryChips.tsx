import { useState } from "react";
import { DiscoveryChips } from "maasnow";

type Filter = "all" | "friends" | "trending" | "bar" | "club" | "event" | "food";

function Chips({ initial }: { initial: Filter }) {
  const [filter, setFilter] = useState<Filter>(initial);
  return (
    <div style={{ padding: 12, background: "#f1eee7", minHeight: 64 }}>
      <DiscoveryChips filter={filter} onFilter={setFilter} />
    </div>
  );
}

export const Tonight = () => <Chips initial="all" />;
export const Friends = () => <Chips initial="friends" />;
export const Trending = () => <Chips initial="trending" />;
export const ClubsSelected = () => <Chips initial="club" />;
