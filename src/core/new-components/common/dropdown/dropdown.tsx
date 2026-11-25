"use client";

import { useEffect, useRef, useState } from "react";
import { LtrRun } from "../ltr-run";
import type { DropdownProps } from "./dropdown-props";

const TRIGGER =
  "flex min-h-12 w-full items-center justify-between gap-2 rounded-md border bg-ground px-3 py-2 text-start text-base text-ink";

export function Dropdown({
  id,
  name,
  options,
  value,
  placeholder,
  invalid,
  describedBy,
  onChange,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrap.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    document.getElementById(optionId(active))?.scrollIntoView({
      block: "nearest",
    });
  });

  function show(index: number) {
    setActive(Math.max(0, Math.min(index, options.length - 1)));
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option) {
      onChange(option.value);
    }
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(active);
    }
  }

  return (
    <div ref={wrap} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : show(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={onKeyDown}
        className={`${TRIGGER} ${invalid ? "border-2 border-accent" : "border-rule-strong"}`}
      >
        <span className={selected ? "text-ink" : "text-ink-muted"}>
          {selected ? <LtrRun>{selected.label}</LtrRun> : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`size-4 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute start-0 end-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-rule-strong bg-ground py-1 shadow-xl"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              onPointerDown={(event) => {
                event.preventDefault();
                commit(index);
              }}
              onPointerEnter={() => setActive(index)}
              className={`flex min-h-11 cursor-pointer items-center px-3 text-base ${
                index === active ? "bg-accent text-accent-ink" : "text-ink"
              }`}
            >
              <LtrRun>{option.label}</LtrRun>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
