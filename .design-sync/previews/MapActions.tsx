import { MapActions } from "maasnow";

const noop = () => {};
const box: React.CSSProperties = { display: "flex", gap: 24, padding: 16, background: "#f1eee7" };

export const Idle = () => (
  <div style={box}>
    <MapActions modeOpen={false} timeOpen={false} locationStatus="idle" centeredOnUser={false} onOpenMode={noop} onLocate={noop} onToggleTime={noop} />
  </div>
);

export const Located = () => (
  <div style={box}>
    <MapActions modeOpen={false} timeOpen={false} locationStatus="active" centeredOnUser onOpenMode={noop} onLocate={noop} onToggleTime={noop} />
  </div>
);

export const TimeOpen = () => (
  <div style={box}>
    <MapActions modeOpen={false} timeOpen locationStatus="idle" centeredOnUser={false} onOpenMode={noop} onLocate={noop} onToggleTime={noop} />
  </div>
);

export const LocationDenied = () => (
  <div style={box}>
    <MapActions modeOpen={false} timeOpen={false} locationStatus="denied" centeredOnUser={false} onOpenMode={noop} onLocate={noop} onToggleTime={noop} />
  </div>
);
