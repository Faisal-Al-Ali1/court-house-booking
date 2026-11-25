"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { getLangDir } from "rtl-detect";
import { Link, useRouter } from "@/core/i18n/navigation";
import { LtrRun, RichText } from "@/core/new-components/common/ltr-run";
import { StatCard } from "@/core/new-components/common/stat-card";
import { routing } from "@/core/i18n/routing";
import { formatSlotTime } from "@/lib/format-time";
import { setAttendance } from "./actions/set-attendance";
import { signOut } from "./actions/sign-out";
import { CancelConfirm, ScheduleTable, WalkInForm } from "./components";
import { dialHref } from "./utils/dial-href";
import type { Attendance } from "@/repositories/bookings";
import type { CancelNotice } from "./types/cancel-notice";
import type { PageClientProps } from "./types/page-client-props";
import type { ScheduleRow } from "./types/schedule-row";

const REFRESH_INTERVAL_MS = 60_000;
const NOTICE_KEYS = {
  notified: "cancel.notified",
  "not-notified": "cancel.notNotified",
  gone: "cancel.gone",
} as const;

export function PageClient({ locale, rows, nextSlotId }: PageClientProps) {
  const t = useTranslations("interviewer");
  const common = useTranslations("common");
  const booking = useTranslations("booking");
  const router = useRouter();
  const [target, setTarget] = useState<ScheduleRow | null>(null);
  const [notice, setNotice] = useState<CancelNotice | null>(null);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [, startAttendance] = useTransition();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  function handleAttendance(row: ScheduleRow, next: Attendance | null) {
    setProblem(null);
    setPendingSlotId(row.slotId);
    startAttendance(async () => {
      const result = await setAttendance(row.slotId, next);
      setPendingSlotId(null);
      if (result.status === "failed") {
        setProblem(t("attendance.failed"));
      }
      router.refresh();
    });
  }

  const otherLocale = routing.locales.find((candidate) => candidate !== locale);
  const bookedCount = rows.filter((row) => row.applicant !== null).length;
  const next = rows.find((row) => row.slotId === nextSlotId);
  const freeSlots = rows.filter((row) => row.applicant === null && !row.past);
  const arrivedCount = rows.filter((row) => row.attendance === "arrived").length;
  const noShowCount = rows.filter((row) => row.attendance === "no-show").length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div data-rise="1" className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo-lockup.webp"
            alt=""
            width={960}
            height={260}
            priority
            className="hidden h-8 w-auto sm:block"
          />
          <h1 className="truncate text-2xl font-bold">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {otherLocale ? (
            <Link
              href="/interviewer"
              locale={otherLocale}
              lang={otherLocale}
              dir={getLangDir(otherLocale)}
              className="inline-flex min-h-12 items-center text-base font-semibold text-accent underline underline-offset-4"
            >
              {common("otherLanguage")}
            </Link>
          ) : null}
          <form action={signOut.bind(null, locale)}>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center rounded-md border border-rule-strong bg-ground px-4 text-base font-semibold text-ink"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-1 text-ink-muted">
        <RichText>{booking("eventDate")}</RichText>
      </p>

      <p className="sr-only">
        {t.rich("booked", {
          booked: bookedCount,
          total: rows.length,
          n: (chunks) => <LtrRun>{chunks}</LtrRun>,
        })}
      </p>

      <div data-rise="2" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.booked")} value={bookedCount} tone="accent" />
        <StatCard label={t("stats.free")} value={freeSlots.length} tone="ink" />
        <StatCard
          label={t("stats.arrived")}
          value={arrivedCount}
          tone="accent"
        />
        <StatCard label={t("stats.noShow")} value={noShowCount} tone="muted" />
      </div>

      <div className="mt-4 flex justify-end">
        <a
          href={`/${locale}/interviewer/api/export`}
          className="inline-flex min-h-12 items-center rounded-md border border-rule-strong bg-ground px-4 text-base font-semibold text-ink"
        >
          <RichText>{t("export")}</RichText>
        </a>
      </div>

      {notice ? (
        <div
          role="status"
          className="sticky top-2 z-10 mt-4 flex items-start justify-between gap-3 rounded-lg border border-accent bg-ground-raised p-4"
        >
          <p className="font-semibold">
            {t.rich(NOTICE_KEYS[notice.kind], {
              name: notice.name,
              phone: notice.phone,
              who: (chunks) => <bdi>{chunks}</bdi>,
              call: (chunks) => (
                <a href={dialHref(notice.phone)} className="underline underline-offset-4">
                  <LtrRun>{chunks}</LtrRun>
                </a>
              ),
            })}
          </p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="min-h-12 shrink-0 rounded-md border border-rule-strong bg-ground px-4 text-base font-semibold text-ink"
          >
            {t("cancel.dismiss")}
          </button>
        </div>
      ) : null}

      {problem ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-accent bg-ground-raised p-4 font-semibold text-accent"
        >
          {problem}
        </p>
      ) : null}

      <section
        aria-labelledby="next-up"
        data-rise="3"
        className="mt-4 rounded-xl border border-rule-strong bg-ground-raised p-4 shadow-sm"
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

      <WalkInForm
        locale={locale}
        freeSlots={freeSlots}
        onAdded={() => router.refresh()}
      />

      <div className="mt-4">
        <ScheduleTable
          rows={rows}
          locale={locale}
          nextSlotId={nextSlotId}
          pendingSlotId={pendingSlotId}
          onCancel={setTarget}
          onAttendance={handleAttendance}
        />
      </div>

      <CancelConfirm
        row={target}
        locale={locale}
        onClose={() => setTarget(null)}
        onCancelled={(result) => {
          setTarget(null);
          setNotice(result);
          router.refresh();
        }}
        onGone={(result) => {
          setTarget(null);
          setNotice(result);
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
