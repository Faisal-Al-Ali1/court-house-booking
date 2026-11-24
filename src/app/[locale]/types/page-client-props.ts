import type { Locale } from "@/core/i18n/routing";
import type { SlotView } from "./slot-view";

export type PageClientProps = {
  locale: Locale;
  slots: readonly SlotView[];
};
