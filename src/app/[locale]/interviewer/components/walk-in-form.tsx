"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { getLangDir } from "rtl-detect";
import { Dropdown } from "@/core/new-components/common/dropdown";
import { RichText } from "@/core/new-components/common/ltr-run";
import { formatSlotTime } from "@/lib/format-time";
import { addWalkIn } from "../actions/add-walk-in";
import type { WalkInFormProps } from "../types/walk-in-form-props";
import type { WalkInState } from "../types/walk-in-state";

const IDLE_STATE: WalkInState = { status: "idle" };
const FIELD =
  "mt-2 block min-h-12 w-full rounded-md border border-rule-strong bg-ground px-3 py-2 text-base text-ink aria-[invalid=true]:border-2 aria-[invalid=true]:border-accent";
const ERROR = "mt-2 text-sm font-semibold text-accent";

export function WalkInForm({ locale, freeSlots, onAdded }: WalkInFormProps) {
  const t = useTranslations("interviewer.walkIn");
  const fields = useTranslations("booking.fields");
  const errors = useTranslations("booking.errors");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addWalkIn, IDLE_STATE);
  const [slotId, setSlotId] = useState("");
  const base = useId();

  const invalid = state.status === "invalid" ? state.errors : {};

  useEffect(() => {
    if (state.status === "added") {
      onAdded();
    }
  }, [state, onAdded]);

  const notice =
    state.status === "added"
      ? t("added")
      : state.status === "slot-taken"
        ? errors("slotTaken")
        : state.status === "already-booked"
          ? errors("alreadyBooked")
          : state.status === "failed" || state.status === "signed-out"
            ? t("failed")
            : null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={freeSlots.length === 0}
        className="mt-4 inline-flex min-h-12 items-center rounded-md border border-rule-strong bg-ground px-4 text-base font-semibold text-ink disabled:text-ink-muted"
      >
        {freeSlots.length === 0 ? t("none") : t("open")}
      </button>
    );
  }

  return (
    <section className="mt-4 rounded-lg border border-rule-strong bg-ground-raised p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{t("title")}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-12 items-center rounded-md border border-rule-strong bg-ground px-4 text-base font-semibold text-ink"
        >
          {t("close")}
        </button>
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-3 rounded-md border border-accent bg-ground p-3 font-semibold text-accent"
        >
          <RichText>{notice}</RichText>
        </p>
      ) : null}

      <form action={formAction} className="mt-3">
        <input type="hidden" name="locale" value={locale} />

        <label htmlFor={`${base}-slot`} className="block font-semibold">
          {t("slot")}
        </label>
        <div className="mt-2">
          <Dropdown
            id={`${base}-slot`}
            name="slotId"
            value={slotId}
            onChange={setSlotId}
            placeholder={t("choose")}
            invalid={Boolean(invalid.slotId)}
            describedBy={invalid.slotId ? `${base}-slot-error` : undefined}
            options={freeSlots.map((row) => ({
              value: row.slotId,
              label: formatSlotTime(
                { id: row.slotId, startMinutes: row.startMinutes },
                locale,
              ),
            }))}
          />
        </div>
        {invalid.slotId ? (
          <p id={`${base}-slot-error`} className={ERROR}>
            {invalid.slotId}
          </p>
        ) : null}

        <div className="mt-4">
          <label htmlFor={`${base}-name`} className="block font-semibold">
            {fields("name")}
          </label>
          <input
            id={`${base}-name`}
            name="name"
            type="text"
            aria-invalid={invalid.name ? true : undefined}
            className={FIELD}
          />
          {invalid.name ? <p className={ERROR}>{invalid.name}</p> : null}
        </div>

        <div className="mt-4">
          <label htmlFor={`${base}-email`} className="block font-semibold">
            {fields("email")}
          </label>
          <input
            id={`${base}-email`}
            name="email"
            type="email"
            dir="ltr"
            inputMode="email"
            aria-invalid={invalid.email ? true : undefined}
            className={`${FIELD} ${alignToPage(locale)}`}
          />
          {invalid.email ? <p className={ERROR}>{invalid.email}</p> : null}
        </div>

        <div className="mt-4">
          <label htmlFor={`${base}-phone`} className="block font-semibold">
            {fields("phone")}
          </label>
          <input
            id={`${base}-phone`}
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            aria-invalid={invalid.phone ? true : undefined}
            className={`${FIELD} ${alignToPage(locale)}`}
          />
          {invalid.phone ? <p className={ERROR}>{invalid.phone}</p> : null}
        </div>

        <div className="mt-4 flex items-start gap-3">
          <input
            id={`${base}-consent`}
            name="consent"
            type="checkbox"
            value="on"
            aria-invalid={invalid.consent ? true : undefined}
            className="mt-1 size-6 shrink-0 accent-accent"
          />
          <label htmlFor={`${base}-consent`} className="text-base">
            {t("consent")}
          </label>
        </div>
        {invalid.consent ? <p className={ERROR}>{invalid.consent}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 min-h-12 w-full rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink disabled:border disabled:border-rule-strong disabled:bg-ground-raised disabled:text-ink-muted sm:w-auto"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </section>
  );
}

function alignToPage(locale: string): string {
  return getLangDir(locale) === "rtl" ? "text-right" : "text-left";
}
