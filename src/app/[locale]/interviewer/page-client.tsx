"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/core/i18n/navigation";
import { LtrRun } from "@/core/new-components/common/ltr-run";
import { routing } from "@/core/i18n/routing";
import { formatSlotTime } from "@/lib/format-time";
import { CancelConfirm, ScheduleTable } from "./components";
import type { PageClientProps } from "./types/page-client-props";
import type { ScheduleRow } from "./types/schedule-row";

const REFRESH_INTERVAL_MS = 60_000;

function dialHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function PageClient({ locale, rows, nextSlotId }: PageClientProps) {
  const t = useTranslations("interviewer");
  const common = useTranslations("common");
  const booking = useTranslations("booking");
  const router = useRouter();
  const [target, setTarget] = useState<ScheduleRow | null>(null);

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  const otherLocale = routing.locales.find((candidate) => candidate !== locale);
  const bookedCount = rows.filter((row) => row.applicant !== null).length;
  const next = rows.find((row) => row.slotId === nextSlotId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {otherLocale ? (
          <Link
            href="/interviewer"
            locale={otherLocale}
            lang={otherLocale}
            className="inline-flex min-h-12 items-center text-base font-semibold text-accent underline underline-offset-4"
          >
            {common("otherLanguage")}
          </Link>
        ) : null}
      </div>
      <p className="mt-1 text-ink-muted">{booking("eventDate")}</p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-lg font-semibold">
          {t.rich("booked", {
            booked: bookedCount,
            total: rows.length,
            n: (chunks) => <LtrRun>{chunks}</LtrRun>,
          })}
        </p>
        <a
          href={`/${locale}/interviewer/api/export`}
          className="inline-flex min-h-12 items-center rounded-md border border-rule-strong bg-ground px-4 text-base font-semibold text-ink"
        >
          {t("export")}
        </a>
      </div>

      <section
        aria-labelledby="next-up"
        className="mt-4 rounded-lg border border-rule-strong bg-ground-raised p-4"
      >
        <h2 id="next-up" className="text-sm font-semibold text-ink-muted">
          {t("nextUp")}
        </h2>
        {next?.applicant ? (
          <div className="mt-1 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-2xl font-bold">
                <LtrRun>
                  {formatSlotTime(
                    { id: next.slotId, startMinutes: next.startMinutes },
                    locale,
                  )}
                </LtrRun>
              </p>
              <p className="mt-1 text-lg font-semibold wrap-anywhere">
                <bdi>{next.applicant.name}</bdi>
              </p>
            </div>
            <a
              href={dialHref(next.applicant.phone)}
              className="inline-flex min-h-12 items-center rounded-md bg-accent px-4 text-base font-semibold text-accent-ink"
            >
              <LtrRun>{next.applicant.phone}</LtrRun>
            </a>
          </div>
        ) : (
          <p className="mt-1 text-lg">{t("noneUpcoming")}</p>
        )}
      </section>

      <div className="mt-4">
        <ScheduleTable
          rows={rows}
          locale={locale}
          nextSlotId={nextSlotId}
          onCancel={setTarget}
        />
      </div>

      <CancelConfirm
        row={target}
        locale={locale}
        onClose={() => setTarget(null)}
        onCancelled={() => {
          setTarget(null);
          router.refresh();
        }}
        onSignedOut={() => {
          setTarget(null);
          router.refresh();
        }}
      />
    </main>
  );
}
