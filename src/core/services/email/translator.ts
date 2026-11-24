import { createTranslator, type AbstractIntlMessages } from "next-intl";
import ar from "../../../../messages/ar.json" with { type: "json" };
import en from "../../../../messages/en.json" with { type: "json" };
import type { Locale } from "../../i18n/routing.ts";
import type { Translate } from "./types.ts";

const MESSAGES: Readonly<Record<Locale, AbstractIntlMessages>> = Object.freeze({
  ar,
  en,
});

export function translatorFor(locale: Locale): Translate {
  return createTranslator({
    locale,
    messages: MESSAGES[locale],
    onError: (error) => {
      console.error("email translation problem", { name: error.name, code: error.code });
    },
  }) as unknown as Translate;
}
