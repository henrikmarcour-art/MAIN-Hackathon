"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
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
  onScrubbingChange?: (scrubbing: boolean) => void;
  className?: string;
};

export default function TimeScrubber({
  offsetHours,
  onOffsetHours,
  onScrubbingChange,
  className = "",
}: Props) {
  const rangeRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const maxHoursRef = useRef(0);
  const onOffsetHoursRef = useRef(onOffsetHours);
  onOffsetHoursRef.current = onOffsetHours;
  const [thumbX, setThumbX] = useState(THUMB / 2);
  const maxHours = maxForwardHours();
  maxHoursRef.current = maxHours;
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

  const hoursFromClientX = useCallback((clientX: number) => {
    const el = rangeRef.current;
    const max = maxHoursRef.current;
    if (!el || max <= 0) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(pct * max);
  }, []);

  const endScrub = useCallback(() => {
    draggingRef.current = false;
    onScrubbingChange?.(false);
  }, [onScrubbingChange]);

  useEffect(() => {
    window.addEventListener("pointerup", endScrub);
    window.addEventListener("pointercancel", endScrub);
    return () => {
      window.removeEventListener("pointerup", endScrub);
      window.removeEventListener("pointercancel", endScrub);
    };
  }, [endScrub]);

  function beginScrub(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    onScrubbingChange?.(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pan lock still covers lost pointers */
    }
    onOffsetHoursRef.current(hoursFromClientX(e.clientX));
  }

  function moveScrub(e: PointerEvent<HTMLElement>) {
    if (!draggingRef.current) return;
    e.stopPropagation();
    onOffsetHoursRef.current(hoursFromClientX(e.clientX));
  }

  return (
    <div
      className={`mn-time-scrubber ${className}`}
      role="group"
      aria-label="Hours from now"
      onPointerDown={beginScrub}
      onPointerMove={moveScrub}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
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
        <span
          className="mn-time-track-line"
          style={{
            background: `linear-gradient(to right, var(--color-graphite) ${fillPct}%, var(--color-line) ${fillPct}%)`,
          }}
        />
        <input
          ref={rangeRef}
          id="mn-night-slider"
          className="mn-time-range"
          type="range"
          min={0}
          max={maxHours}
          step={1}
          value={clamped}
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
      </div>
      <div className="mn-time-ticks">
        {ticks.map((h) => (
          <span key={h} className="mn-time-tick" />
        ))}
      </div>
    </div>
  );
}
