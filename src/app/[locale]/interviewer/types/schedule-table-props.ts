import type { Locale } from "@/core/i18n/routing";
import type { ScheduleRow } from "./schedule-row";

export type ScheduleTableProps = {
  rows: ScheduleRow[];
  locale: Locale;
  nextSlotId: string | null;
  onCancel: (row: ScheduleRow) => void;
};
