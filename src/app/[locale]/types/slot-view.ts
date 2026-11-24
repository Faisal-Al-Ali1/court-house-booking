import type { Slot } from "@/lib/slots";

export type SlotView = Slot & {
  taken: boolean;
  past: boolean;
};
