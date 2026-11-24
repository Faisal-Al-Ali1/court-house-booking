import type { Locale } from "@/core/i18n/routing";
import type { CancelNotice } from "./cancel-notice";
import type { ScheduleRow } from "./schedule-row";

export type CancelConfirmProps = {
  row: ScheduleRow | null;
  locale: Locale;
  onClose: () => void;
  onCancelled: (notice: CancelNotice) => void;
  onGone: (notice: CancelNotice) => void;
  onSignedOut: () => void;
};
