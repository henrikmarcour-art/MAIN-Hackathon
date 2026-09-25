import { InviteChip, invitations, venues } from "maasnow";

const box: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10, padding: 16, width: 360, background: "#f1eee7" };

export const Invitations = () => (
  <div style={box}>
    {invitations.map((inv) => (
      <InviteChip key={inv.id} invitation={inv} venue={venues.find((v) => v.id === inv.venueId)!} onOpen={() => {}} />
    ))}
  </div>
);
