import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "@/core/i18n/routing";
import { bookingsRepo } from "@/repositories/bookings";
import { BOOKED_COOKIE } from "@/lib/booked-cookie";
import { confirmFromRequest } from "@/lib/confirm-from-request";
import { buildIcs } from "@/lib/ics";
import { requireSessionSecret } from "@/lib/signed-ref";

const SLOT_PARAM = "slot";

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return notFound();
  }
  const jar = await cookies();
  const slotId = await confirmFromRequest({
    booked: new URL(request.url).searchParams.get(SLOT_PARAM) ?? undefined,
    cookie: jar.get(BOOKED_COOKIE)?.value,
    getSecret: requireSessionSecret,
    loadActive: () => bookingsRepo.listActive(),
  });
  if (slotId === null) {
    return notFound();
  }
  const venue = await getTranslations({ locale, namespace: "venue" });
  const confirmation = await getTranslations({
    locale,
    namespace: "confirmation",
  });
  const body = buildIcs({
    slotId,
    summary: confirmation("eventSummary"),
    location: `${venue("name")}, ${venue("address")}`,
    locale,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="interview.ics"',
      "Cache-Control": "no-store",
    },
  });
}
