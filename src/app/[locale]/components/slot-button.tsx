import { useTranslations } from "next-intl";
import { LtrRun } from "@/core/new-components/common/ltr-run";
import type { SlotButtonProps } from "../types/slot-button-props";

export function SlotButton({ slot, label, selected, onSelect }: SlotButtonProps) {
  const t = useTranslations("booking.grid");
  const unavailable = slot.taken || slot.past;
  const status = slot.taken ? t("taken") : slot.past ? t("past") : null;

  const surface = unavailable
    ? "cursor-not-allowed border-rule bg-slot-taken-surface text-slot-taken-ink"
    : "border-rule-strong bg-ground text-ink hover:border-accent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-ink";

  return (
    <label className="block">
      <input
        type="radio"
        name="slotId"
        value={slot.id}
        checked={selected}
        disabled={unavailable}
        onChange={() => onSelect(slot.id)}
        className="peer sr-only"
      />
      <span
        className={`flex min-h-14 flex-col items-center justify-center rounded-md border px-2 py-2 text-center peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-accent ${surface}`}
      >
        <LtrRun className="text-base font-semibold">{label}</LtrRun>
        {status ? (
          <span className="text-xs">{status}</span>
        ) : selected ? (
          <span className="text-xs">{t("selected")}</span>
        ) : null}
      </span>
    </label>
  );
}
