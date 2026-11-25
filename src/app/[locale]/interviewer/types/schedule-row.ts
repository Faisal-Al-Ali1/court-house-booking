import type { Attendance } from "@/repositories/bookings";

export type ScheduleRow = {
  slotId: string;
  startMinutes: number;
  past: boolean;
  attendance: Attendance | null;
  applicant: { name: string; email: string; phone: string } | null;
};
