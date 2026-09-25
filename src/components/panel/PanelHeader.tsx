"use client";

import { useEffect, useId, useRef, useState } from "react";
import { currentUser } from "@/data/events";
import { SearchIcon } from "@/components/map/icons";
import { Face, ROUND_BTN, Wordmark } from "./ui";

type Props = {
  onSearch: () => void;
  onProfile: () => void;
  onCreate: () => void;
};

/**
 * Panel header: lowercase wordmark, search, and your face. The face opens a
 * small menu with Profile and Create event (desktop has no tab bar).
 */
export default function PanelHeader({ onSearch, onProfile, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="flex items-center gap-3 px-7 pt-[26px]">
      <Wordmark />
      <span className="flex-1" />
      <button type="button" onClick={onSearch} aria-label="Search" className={ROUND_BTN}>
        <SearchIcon size={18} />
      </button>
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="You"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          className="grid rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ui-ink"
        >
          <Face person={currentUser} size={38} ring="lime" />
        </button>
        {open && (
          <div
            id={menuId}
            role="menu"
            aria-label="You"
            className="animate-fade absolute right-0 top-[calc(100%+10px)] z-30 w-48 overflow-hidden rounded-2xl bg-ui-panel p-1.5 text-ui-ink shadow-float ring-1 ring-ui-line"
          >
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={choose(onProfile)}
              className="flex h-11 w-full items-center rounded-xl px-3 text-left text-body font-medium hover:bg-ui-fill focus-visible:bg-ui-fill focus-visible:outline-none"
            >
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={choose(onCreate)}
              className="flex h-11 w-full items-center rounded-xl px-3 text-left text-body font-medium hover:bg-ui-fill focus-visible:bg-ui-fill focus-visible:outline-none"
            >
              Create event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
