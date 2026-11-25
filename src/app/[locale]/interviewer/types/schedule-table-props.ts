import type { Locale } from "@/core/i18n/routing";
import type { Attendance } from "@/repositories/bookings";
import type { ScheduleRow } from "./schedule-row";

export type ScheduleTableProps = {
  rows: ScheduleRow[];
  locale: Locale;
  nextSlotId: string | null;
  pendingSlotId: string | null;
  onCancel: (row: ScheduleRow) => void;
  onAttendance: (row: ScheduleRow, attendance: Attendance | null) => void;
};
