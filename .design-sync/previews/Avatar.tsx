import { Avatar, people, currentUser } from "maasnow";

const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: 16, background: "#faf8f4" };

export const Sizes = () => (
  <div style={row}>
    <Avatar person={people.leo} size={24} />
    <Avatar person={people.leo} size={32} />
    <Avatar person={people.leo} size={44} />
    <Avatar person={people.leo} size={64} />
  </div>
);

export const People = () => (
  <div style={row}>
    <Avatar person={currentUser} size={40} />
    {Object.values(people).map((p) => (
      <Avatar key={p.id} person={p} size={40} />
    ))}
  </div>
);
