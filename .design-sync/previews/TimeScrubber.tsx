import { useState } from "react";
import { TimeScrubber } from "maasnow";

function Scrubber({ initial }: { initial: number }) {
  const [hours, setHours] = useState(initial);
  return (
    <div style={{ padding: 16, width: 420, background: "#f1eee7" }}>
      <TimeScrubber offsetHours={hours} onOffsetHours={setHours} />
    </div>
  );
}

export const Now = () => <Scrubber initial={0} />;
export const LaterTonight = () => <Scrubber initial={2} />;
