import { useState } from "react";
import { MapModeSheet } from "maasnow";

type MapStyleId = "standard" | "night" | "satellite";

function Sheet({ initial }: { initial: MapStyleId }) {
  const [style, setStyle] = useState<MapStyleId>(initial);
  // The sheet anchors to the bottom-right of its positioned parent (desktop: right 76px, 340px wide).
  return (
    <div style={{ position: "relative", width: 460, height: 300, background: "#f1eee7" }}>
      <MapModeSheet open mapStyle={style} onMapStyle={setStyle} onClose={() => {}} />
    </div>
  );
}

export const Standard = () => <Sheet initial="standard" />;
export const Night = () => <Sheet initial="night" />;
