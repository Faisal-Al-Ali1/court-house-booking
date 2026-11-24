export type ScheduleRow = {
  slotId: string;
  startMinutes: number;
  past: boolean;
  applicant: { name: string; phone: string } | null;
};
