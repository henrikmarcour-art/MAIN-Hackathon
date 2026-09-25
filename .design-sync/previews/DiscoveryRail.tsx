import { DiscoveryRail, venues } from "maasnow";

const crowd = { mode: "stillActiveOrComing" as const, at: new Date("2026-09-25T22:30:00+02:00") };
const noop = () => {};

function Stage({ children }: { children: React.ReactNode }) {
  // Desktop layout docks the rail bottom-left (460px wide, inset 24px).
  return <div style={{ position: "relative", width: 540, height: 380, background: "#f1eee7" }}>{children}</div>;
}

export const Tonight = () => (
  <Stage>
    <DiscoveryRail venues={venues.slice(0, 8)} goingIds={new Set()} filter="all" crowd={crowd} headlineCount={412} onPick={noop} />
  </Stage>
);

export const FriendsLens = () => (
  <Stage>
    <DiscoveryRail
      venues={venues.filter((v) => v.friendsGoing.length > 0).slice(0, 6)}
      goingIds={new Set()}
      filter="friends"
      crowd={crowd}
      headlineCount={5}
      onPick={noop}
    />
  </Stage>
);
