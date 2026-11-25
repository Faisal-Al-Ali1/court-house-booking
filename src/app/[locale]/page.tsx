import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { routing } from "@/core/i18n/routing";
import { Backdrop } from "@/core/new-components/common/backdrop";
import { RichText } from "@/core/new-components/common/ltr-run";
import { bookingsRepo } from "@/repositories/bookings";
import { isFailure } from "@/core/types/results/results";
import { BOOKED_COOKIE } from "@/lib/booked-cookie";
import { confirmFromRequest } from "@/lib/confirm-from-request";
import { requireSessionSecret } from "@/lib/signed-ref";
import { generateSlots, isSlotPast } from "@/lib/slots";
import { PageClient } from "./page-client";

export const preferredRegion = "fra1";

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ booked?: string | string[] }>;
}) {
  const { locale } = await params;
  const { booked } = await searchParams;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  await connection();

  const result = await bookingsRepo.takenSlotIds();

  if (isFailure(result)) {
    console.error("takenSlotIds failed");
    const t = await getTranslations({ locale, namespace: "booking" });
    return (
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Backdrop />
        <p
          role="alert"
          className="rounded-md border border-accent bg-ground-raised p-4 font-semibold text-accent"
        >
          <RichText>{t("loadFailed")}</RichText>
        </p>
      </main>
    );
  }

  const taken = new Set(result.data ?? []);
  const now = new Date();
  const slots = generateSlots().map((slot) => ({
    id: slot.id,
    startMinutes: slot.startMinutes,
    taken: taken.has(slot.id),
    past: isSlotPast(slot, now),
  }));

  const contactEmail = (process.env.MAIL_REPLY_TO ?? "").trim();

  const jar = await cookies();
  const confirmedSlotId = await confirmFromRequest({
    booked,
    cookie: jar.get(BOOKED_COOKIE)?.value,
    getSecret: requireSessionSecret,
    loadActive: () => bookingsRepo.listActive(),
  });

  return (
    <>
      <Backdrop />
      <PageClient
        locale={locale}
        slots={slots}
        confirmedSlotId={confirmedSlotId}
        contactEmail={contactEmail}
      />
    </>
  );
}
