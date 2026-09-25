import { InviteCard, invitations, venues } from "maasnow";

// A fixed Friday-night clock keeps the crowd numbers stable between renders.
const crowd = { mode: "stillActiveOrComing" as const, at: new Date("2026-09-25T22:30:00+02:00") };
const noop = () => {};

function Stage({ children }: { children: React.ReactNode }) {
  // InviteCard is a full-screen overlay (absolute inset-0); give it a phone-sized stage.
  return <div style={{ position: "relative", width: 390, height: 640, background: "#f1eee7" }}>{children}</div>;
}

export function RooftopInvite() {
  const inv = invitations[0];
  return (
    <Stage>
      <InviteCard invitation={inv} venue={venues.find((v) => v.id === inv.venueId)!} crowd={crowd} onAccept={noop} onDecline={noop} onClose={noop} />
    </Stage>
  );
}

export function DinnerInvite() {
  const inv = invitations[1];
  return (
    <Stage>
      <InviteCard invitation={inv} venue={venues.find((v) => v.id === inv.venueId)!} crowd={crowd} onAccept={noop} onDecline={noop} onClose={noop} />
    </Stage>
  );
}
