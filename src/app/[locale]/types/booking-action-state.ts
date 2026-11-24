export type BookingActionState = {
  status: "idle" | "invalid" | "error" | "success";
  errors?: Record<string, string>;
  message?: string;
  slotId?: string;
};
