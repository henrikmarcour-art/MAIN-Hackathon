import { MapNotice } from "maasnow";

function Stage({ message }: { message: string }) {
  // The notice floats at the bottom of its positioned parent, above the nav.
  return (
    <div style={{ position: "relative", width: 420, height: 120, background: "#f1eee7" }}>
      <MapNotice notice={{ id: 1, message }} onDismiss={() => {}} />
    </div>
  );
}

export const Saved = () => <Stage message="You’re going to Leo’s Rooftop" />;
export const LocationOff = () => <Stage message="Location is off. Turn it on in your browser settings." />;
