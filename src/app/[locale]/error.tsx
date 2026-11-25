"use client";

import { useTranslations } from "next-intl";

export default function BookingError({ reset }: { reset: () => void }) {
  const t = useTranslations("error");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-ink-muted">{t("body")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-12 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink"
      >
        {t("retry")}
      </button>
    </main>
  );
}
