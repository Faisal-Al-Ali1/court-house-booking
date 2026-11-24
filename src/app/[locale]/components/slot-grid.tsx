import { useTranslations } from "next-intl";
import { LtrRun, RichText } from "@/core/new-components/common/ltr-run";
import { formatBreakRange, formatSlotTime } from "@/lib/format-time";
import { slotWindows } from "@/lib/slots";
import { SlotButton } from "./slot-button";
import type { SlotGridProps } from "../types/slot-grid-props";

const MIDDAY_MINUTES = 12 * 60;

export function SlotGrid({
  slots,
  locale,
  selectedId,
  pending,
  onSelect,
  onBack,
}: SlotGridProps) {
  const t = useTranslations("booking");
  const ranges = slotWindows();
  const availableCount = slots.filter((slot) => !slot.taken && !slot.past).length;
  const selected = slots.find((slot) => slot.id === selectedId);

  return (
    <fieldset className="min-w-0">
      <legend className="text-xl font-bold">{t("grid.legend")}</legend>
      <p className="mt-2 text-ink-muted">
        {t.rich("grid.available", {
          count: availableCount,
          total: slots.length,
          n: (chunks) => <LtrRun>{chunks}</LtrRun>,
        })}
      </p>

      <div className="mt-5 space-y-6">
        {ranges.map((range, index) => {
          const group = slots.filter(
            (slot) =>
              slot.startMinutes >= range.startMinutes &&
              slot.startMinutes < range.endMinutes,
          );
          const next = ranges[index + 1];
          const groupKey =
            range.startMinutes < MIDDAY_MINUTES ? "morning" : "evening";

          return (
            <div key={range.startMinutes}>
              <h3 className="text-base font-semibold text-ink-muted">
                {t(`grid.${groupKey}`)}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.map((slot) => (
                  <SlotButton
                    key={slot.id}
                    slot={slot}
                    label={formatSlotTime(slot, locale)}
                    selected={slot.id === selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
              {next ? (
                <div
                  role="separator"
                  className="mt-6 flex items-center gap-3 text-sm text-ink-muted"
                >
                  <span aria-hidden="true" className="h-px flex-1 bg-rule-strong" />
                  <span className="flex items-center gap-2">
                    {t("grid.break")}
                    <LtrRun className="font-semibold">
                      {formatBreakRange(range.endMinutes, next.startMinutes, locale)}
                    </LtrRun>
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-rule-strong" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-6 min-h-6" aria-live="polite">
        {selected ? (
          t.rich("grid.summary", {
            time: formatSlotTime(selected, locale),
            n: (chunks) => <LtrRun className="font-semibold">{chunks}</LtrRun>,
          })
        ) : (
          <RichText>{t("grid.noneSelected")}</RichText>
        )}
      </p>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 rounded-md border border-rule-strong bg-ground px-6 py-3 text-base font-semibold text-ink"
          >
            {t("grid.back")}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink disabled:border disabled:border-rule-strong disabled:bg-ground-raised disabled:text-ink-muted"
        >
          {pending ? t("grid.confirming") : t("grid.confirm")}
        </button>
      </div>
    </fieldset>
  );
}
