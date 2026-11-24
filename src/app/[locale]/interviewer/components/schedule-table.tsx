import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { LtrRun } from "@/core/new-components/common/ltr-run";
import { formatBreakRange, formatSlotTime } from "@/lib/format-time";
import { slotWindows } from "@/lib/slots";
import { dialHref } from "../utils/dial-href";
import type { ScheduleTableProps } from "../types/schedule-table-props";

export function ScheduleTable({
  rows,
  locale,
  nextSlotId,
  onCancel,
}: ScheduleTableProps) {
  const t = useTranslations("interviewer");
  const grid = useTranslations("booking.grid");
  const windows = slotWindows();

  return (
    <table className="w-full border-separate border-spacing-y-2 text-start">
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("columns.time")}</th>
          <th scope="col">{t("columns.applicant")}</th>
          <th scope="col">{t("columns.action")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const windowIndex = windows.findIndex(
            (range) => range.startMinutes === row.startMinutes,
          );
          const previous = windows[windowIndex - 1];
          const isNext = row.slotId === nextSlotId;
          const surface = row.applicant
            ? `border-rule bg-ground-raised ${row.past ? "text-ink-muted" : "text-ink"}`
            : "border-rule bg-slot-taken-surface text-slot-taken-ink";
          const edge = isNext ? "border-s-4 border-s-accent" : "";

          return (
            <Fragment key={row.slotId}>
              {previous ? (
                <tr>
                  <td colSpan={3} className="py-2">
                    <div className="flex items-center gap-3 text-sm text-ink-muted">
                      <span aria-hidden="true" className="h-px flex-1 bg-rule-strong" />
                      <span className="flex items-center gap-2">
                        {grid("break")}
                        <LtrRun className="font-semibold">
                          {formatBreakRange(
                            previous.endMinutes,
                            row.startMinutes,
                            locale,
                          )}
                        </LtrRun>
                      </span>
                      <span aria-hidden="true" className="h-px flex-1 bg-rule-strong" />
                    </div>
                  </td>
                </tr>
              ) : null}
              <tr aria-current={isNext ? "time" : undefined}>
                <th
                  scope="row"
                  className={`whitespace-nowrap rounded-s-md border-y border-s px-3 py-3 text-start text-base font-semibold ${surface} ${edge}`}
                >
                  <LtrRun>
                    {formatSlotTime(
                      { id: row.slotId, startMinutes: row.startMinutes },
                      locale,
                    )}
                  </LtrRun>
                </th>
                <td className={`w-full border-y px-3 py-3 wrap-anywhere ${surface}`}>
                  {row.applicant ? (
                    <>
                      <div className="font-semibold">
                        <bdi>{row.applicant.name}</bdi>
                      </div>
                      <a
                        href={dialHref(row.applicant.phone)}
                        className="inline-flex min-h-6 items-center text-sm underline underline-offset-4"
                      >
                        <LtrRun>{row.applicant.phone}</LtrRun>
                      </a>
                    </>
                  ) : (
                    <span className="text-sm">{t("openSlot")}</span>
                  )}
                </td>
                <td
                  className={`rounded-e-md border-y border-e px-2 py-1 text-end ${surface}`}
                >
                  {row.applicant ? (
                    <button
                      type="button"
                      onClick={() => onCancel(row)}
                      aria-label={t("cancel.label", { name: row.applicant.name })}
                      className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-md border border-rule-strong bg-ground text-xl font-semibold text-accent"
                    >
                      <span aria-hidden="true">⨯</span>
                    </button>
                  ) : null}
                </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
