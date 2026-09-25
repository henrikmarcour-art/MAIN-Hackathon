import { SearchCapsule, venues } from "maasnow";

const crowd = { mode: "stillActiveOrComing" as const, at: new Date("2026-09-25T22:30:00+02:00") };

export const Default = () => (
  <div style={{ padding: 16, width: 420, background: "#f1eee7" }}>
    <SearchCapsule venues={venues} goingIds={new Set()} filter="all" crowd={crowd} onPick={() => {}} />
  </div>
);
