import type { SlotView } from "./slot-view";

export type SlotButtonProps = {
  slot: SlotView;
  label: string;
  selected: boolean;
  onSelect: (slotId: string) => void;
};
