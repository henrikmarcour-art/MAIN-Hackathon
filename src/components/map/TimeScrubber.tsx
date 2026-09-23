"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { maxForwardHours } from "@/lib/night-time";

const THUMB = 18;

type ClockProps = {
  time: string;
  live?: boolean;
  className?: string;
};

export function TimeClock({ time, live = false, className = "" }: ClockProps) {
  return (
    <div
      className={`mn-time-clock ${live ? "is-live" : "is-coupled"} ${className}`}
      aria-live="polite"
    >
      <span className="mn-time-clock-value tabular-nums">{time}</span>
      {live && <span className="mn-time-live-dot" aria-hidden />}
    </div>
  );
}

type Props = {
  offsetHours: number;
  onOffsetHours: (hours: number) => void;
  className?: string;
};

export default function TimeScrubber({
  offsetHours,
  onOffsetHours,
  className = "",
}: Props) {
  const rangeRef = useRef<HTMLInputElement>(null);
  const [thumbX, setThumbX] = useState(THUMB / 2);
  const maxHours = maxForwardHours();
  const clamped = Math.min(offsetHours, maxHours);
  const ticks = useMemo(
    () => Array.from({ length: maxHours + 1 }, (_, i) => i),
    [maxHours]
  );
  const offsetLabel = clamped === 0 ? "Now" : `+${clamped}`;
  const fillPct = maxHours === 0 ? 0 : (clamped / maxHours) * 100;

  const syncThumb = useCallback(() => {
    const el = rangeRef.current;
    if (!el) return;
    const max = Number(el.max);
    const val = Number(el.value);
    const pct = max <= 0 ? 0 : val / max;
    setThumbX(pct * (el.clientWidth - THUMB) + THUMB / 2);
  }, []);

  useLayoutEffect(() => {
    syncThumb();
  }, [clamped, maxHours, syncThumb]);

  useEffect(() => {
    const el = rangeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(syncThumb);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncThumb]);

  return (
    <div
      className={`mn-time-scrubber ${className}`}
      role="group"
      aria-label="Hours from now"
    >
      <div className="mn-time-readout" aria-hidden>
        <span className="mn-time-offset" style={{ left: thumbX }}>
          {offsetLabel}
        </span>
      </div>
      <label className="sr-only" htmlFor="mn-night-slider">
        {clamped === 0 ? "Now" : `Plus ${clamped} hours`}
      </label>
      <div className="mn-time-track">
        <input
          ref={rangeRef}
          id="mn-night-slider"
          className="mn-time-range"
          type="range"
          min={0}
          max={maxHours}
          step={1}
          value={clamped}
          style={{
            background: `linear-gradient(to right, var(--color-graphite) ${fillPct}%, var(--color-line) ${fillPct}%)`,
          }}
          aria-valuetext={offsetLabel}
          onChange={(e) => {
            onOffsetHours(Number(e.target.value));
            requestAnimationFrame(() => {
              const el = rangeRef.current;
              if (!el) return;
              const max = Number(el.max);
              const val = Number(el.value);
              const pct = max <= 0 ? 0 : val / max;
              setThumbX(pct * (el.clientWidth - THUMB) + THUMB / 2);
            });
          }}
        />
        <div className="mn-time-ticks">
          {ticks.map((h) => (
            <span key={h} className="mn-time-tick" />
          ))}
        </div>
      </div>
    </div>
  );
}
