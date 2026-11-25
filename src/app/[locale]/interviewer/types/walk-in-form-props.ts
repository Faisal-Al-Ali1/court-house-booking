import type { Locale } from "@/core/i18n/routing";
import type { ScheduleRow } from "./schedule-row";

export type WalkInFormProps = {
  locale: Locale;
  freeSlots: ScheduleRow[];
  onAdded: () => void;
};
