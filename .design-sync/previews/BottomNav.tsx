import { useState } from "react";
import { BottomNav } from "maasnow";

type Tab = "map" | "foryou" | "create" | "profile";

function Nav({ initial }: { initial: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);
  // BottomNav pins itself to the bottom of its positioned parent.
  return (
    <div style={{ position: "relative", width: 460, height: 110, background: "#f1eee7" }}>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

export const MapTab = () => <Nav initial="map" />;
export const ForYouTab = () => <Nav initial="foryou" />;
