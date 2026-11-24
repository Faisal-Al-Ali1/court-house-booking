import type { Locale } from "@/core/i18n/routing";
import type { ScheduleRow } from "./schedule-row";

export type CancelConfirmProps = {
  row: ScheduleRow | null;
  locale: Locale;
  onClose: () => void;
  onCancelled: () => void;
  onSignedOut: () => void;
};
