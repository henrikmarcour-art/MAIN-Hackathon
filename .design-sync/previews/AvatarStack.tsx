import { AvatarStack, friends, venues } from "maasnow";

const box: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: 16, background: "#faf8f4", fontSize: 13, color: "#4a4a4f" };

export const FriendsGoing = () => (
  <div style={box}>
    <AvatarStack people={venues[0].friendsGoing} size={26} />
    <span>{venues[0].friendsGoing.length} friends going to {venues[0].name}</span>
  </div>
);

export const Large = () => (
  <div style={box}>
    <AvatarStack people={friends} size={36} />
  </div>
);
