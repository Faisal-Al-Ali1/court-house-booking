import type { Locale } from "@/core/i18n/routing";
import type { SlotView } from "./slot-view";

export type SlotGridProps = {
  slots: readonly SlotView[];
  locale: Locale;
  selectedId: string;
  pending: boolean;
  onSelect: (slotId: string) => void;
  onBack?: () => void;
};
