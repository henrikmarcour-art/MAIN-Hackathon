"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addMinutes,
  clockInMaastricht,
  formatClock,
  toNightOffset,
} from "@/lib/night-time";
import { ChevronIcon } from "./icons";

/**
 * The single time control on desktop (approved desktop system).
 *
 * At rest it is one small object, "● NOW 22:40". Press and drag, wheel or
 * swipe the trackpad, or use ← → and it opens into a time strip that slides
 * under a fixed lime needle; letting go folds it back after a short delay.
 * Home or Escape returns to now.
 *
 * Smoothness: the strip is moved with a CSS transform straight from the
 * pointer, and `onChange` (which re-renders the panel and re-dims the map)
 * is sent at most once per animation frame.
 */

/** Pixels per minute on the strip. */
const PPM = 2.6;
/** Snap step while dragging, and the keyboard step. */
const SNAP = 5;
const KEY_STEP = 10;
const FOLD_AFTER_DRAG = 520;
const FOLD_AFTER_WHEEL = 760;
const FOLD_AFTER_KEY = 900;

type Props = {
  /** Minutes ahead of now; 0 is live. */
  offset: number;
  onChange: (offset: number) => void;
  /** The furthest offset (05:00). */
  max: number;
  /** The live clock. */
  now: Date;
};

function relativeLabel(exact: number) {
  const minutes = Math.round(exact);
  if (minutes <= 0) return "now";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `in ${h ? `${h} h` : ""}${h && m ? " " : ""}${m ? `${m} min` : ""}`;
}

export default function TimeCapsule({ offset, onChange, max, now }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  // The capsule shows its own value immediately; the page catches up per frame.
  const [shown, setShown] = useState(offset);
  const rootRef = useRef<HTMLDivElement>(null);
  const foldTimer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef(offset);
  const drag = useRef<{ x: number; from: number } | null>(null);

  // Follow outside changes (e.g. the page resetting to now).
  useEffect(() => {
    if (!drag.current) setShown(offset);
  }, [offset]);

  const nowOff = useMemo(() => {
    const { hour, minute } = clockInMaastricht(now);
    return toNightOffset(hour, minute);
  }, [now]);

  /** Snap so the shown clock lands on a 5-minute mark; 0 stays exactly now. */
  const snap = useCallback(
    (m: number) => {
      const clamped = Math.max(0, Math.min(max, m));
      if (clamped === 0) return 0;
      const abs = Math.round((nowOff + clamped) / SNAP) * SNAP;
      return Math.max(0, Math.min(max, abs - nowOff));
    },
    [max, nowOff]
  );

  const emit = useCallback(
    (m: number) => {
      pending.current = m;
      setShown(m);
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        onChange(pending.current);
      });
    },
    [onChange]
  );

  const hold = useCallback(() => {
    if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
    foldTimer.current = null;
    setOpen(true);
  }, []);

  const fold = useCallback((ms: number) => {
    if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
    foldTimer.current = window.setTimeout(() => {
      foldTimer.current = null;
      setOpen(false);
    }, ms);
  }, []);

  useEffect(
    () => () => {
      if (foldTimer.current !== null) window.clearTimeout(foldTimer.current);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-capsule-now]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, from: shown };
    setDragging(true);
    hold();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // Dragging left pulls later times under the needle.
    emit(snap(d.from - (e.clientX - d.x) / PPM));
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    fold(FOLD_AFTER_DRAG);
  };

  // Wheel and trackpad swipes; non-passive so the page never scrolls or
  // swipes back in history while scrubbing.
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      hold();
      emit(snap(shownRef.current + d / PPM));
      fold(FOLD_AFTER_WHEEL);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [emit, fold, hold, snap]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      hold();
      const step = e.key === "ArrowRight" ? KEY_STEP : -KEY_STEP;
      emit(snap(shown + step));
      fold(FOLD_AFTER_KEY);
    } else if (e.key === "Home" || e.key === "Escape") {
      // Handled here: the panel's own Escape (back to Tonight) stays put.
      e.preventDefault();
      e.stopPropagation();
      emit(0);
      fold(0);
    }
  };

  const at = addMinutes(now, shown);
  const time = formatClock(clockInMaastricht(at).hour, clockInMaastricht(at).minute);
  const nowTime = formatClock(clockInMaastricht(now).hour, clockInMaastricht(now).minute);
  const isNow = shown === 0;

  // Ticks every 10 minutes from the 10-minute mark before now to the end.
  const ticks = useMemo(() => {
    const out: { m: number; hour: string | null; past: boolean }[] = [];
    const first = Math.floor((nowOff - 90) / 10) * 10;
    for (let abs = first; abs <= nowOff + max; abs += 10) {
      const onHour = ((abs % 60) + 60) % 60 === 0;
      const clock = (((18 * 60 + abs) % 1440) + 1440) % 1440;
      out.push({
        m: abs - nowOff,
        hour: onHour ? String(Math.floor(clock / 60)).padStart(2, "0") : null,
        past: abs < nowOff,
      });
    }
    return out;
  }, [nowOff, max]);

  return (
    <div
      ref={rootRef}
      role="slider"
      tabIndex={0}
      aria-label="Time tonight"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={shown}
      aria-valuetext={isNow ? `Now, ${nowTime}` : `${time}, ${relativeLabel(shown)}`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={[
        "mn-capsule",
        open ? "is-open" : "",
        isNow ? "is-now" : "",
        dragging ? "is-dragging" : "",
      ].join(" ")}
    >
      {/* Rest state */}
      <div className="mn-capsule-rest" aria-hidden={open}>
        <span className="mn-capsule-hint left">
          <ChevronIcon size={12} strokeWidth={2.5} className="rotate-180" />
        </span>
        <span className="mn-capsule-hint right">
          <ChevronIcon size={12} strokeWidth={2.5} />
        </span>
        {isNow ? (
          <>
            <span className="mn-capsule-dot" />
            <span className="mn-capsule-now">NOW</span>
            <span className="mn-capsule-time">{nowTime}</span>
          </>
        ) : (
          <>
            <span className="mn-capsule-time">{time}</span>
            <span className="mn-capsule-sep" />
            <button
              type="button"
              data-capsule-now
              tabIndex={-1}
              onClick={() => emit(0)}
              aria-label="Back to now"
              className="mn-capsule-back"
            >
              <span className="mn-capsule-dot small" />
              Now
            </button>
          </>
        )}
      </div>

      {/* Open state: the strip under a fixed lime needle */}
      <div className="mn-capsule-open" aria-hidden={!open}>
        <div className="mn-capsule-head">
          <span className="mn-capsule-label">TONIGHT</span>
          <span className="mn-capsule-big">{time}</span>
          <span className="mn-capsule-rel">{relativeLabel(shown)}</span>
        </div>
        <div className="mn-capsule-strip">
          <div
            className="mn-capsule-track"
            style={{ transform: `translate3d(${-shown * PPM}px,0,0)` }}
          >
            {ticks.map((t) => (
              <span
                key={t.m}
                className={[
                  "mn-capsule-tick",
                  t.hour ? "is-hour" : "",
                  t.past ? "is-past" : t.m <= shown ? "is-passed" : "",
                ].join(" ")}
                style={{ left: t.m * PPM }}
              >
                {t.hour && <span className="mn-capsule-tick-label">{t.hour}</span>}
              </span>
            ))}
          </div>
          <span className="mn-capsule-needle" />
        </div>
      </div>
    </div>
  );
}
