import type { Locale } from "@/core/i18n/routing";
import type { ScheduleRow } from "./schedule-row";

export type PageClientProps = {
  locale: Locale;
  rows: ScheduleRow[];
  nextSlotId: string | null;
};
