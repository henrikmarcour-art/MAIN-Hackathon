import { TimeClock } from "maasnow";

const box: React.CSSProperties = { display: "flex", alignItems: "center", gap: 16, padding: 16, background: "#f1eee7" };

export const Live = () => (
  <div style={box}>
    <TimeClock time="22:30" live />
  </div>
);

export const Scrubbed = () => (
  <div style={box}>
    <TimeClock time="01:00" />
  </div>
);
