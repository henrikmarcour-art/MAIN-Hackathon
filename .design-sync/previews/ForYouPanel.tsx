import { ForYouPanel, venues } from "maasnow";

const crowd = { mode: "stillActiveOrComing" as const, at: new Date("2026-09-25T22:30:00+02:00") };

export function Tonight() {
  // Desktop layout docks the panel to the right edge (400px wide, inset 24px).
  return (
    <div style={{ position: "relative", width: 480, height: 640, background: "#f1eee7" }}>
      <ForYouPanel venues={venues} goingIds={new Set([venues[1].id])} crowd={crowd} onOpenVenue={() => {}} />
    </div>
  );
}
