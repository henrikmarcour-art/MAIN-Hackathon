import { BrandPill } from "maasnow";

// `compact` hides the "Maastricht, tonight" subtitle, which itself only shows
// at the xl breakpoint (>= 1280px viewport) - so one cell covers both below xl.
export const Default = () => (
  <div style={{ display: "flex", alignItems: "center", padding: 16, background: "#f1eee7" }}>
    <BrandPill />
  </div>
);
