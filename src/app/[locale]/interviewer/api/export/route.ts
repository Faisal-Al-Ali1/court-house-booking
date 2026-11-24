import { hasLocale } from "next-intl";
import { EVENT_CONFIG } from "@/core/config/event";
import { routing } from "@/core/i18n/routing";
import { bookingsRepo } from "@/repositories/bookings";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure } from "@/core/types/results/results";
import { toCsv } from "@/lib/csv";
import { isSignedIn } from "../../utils/is-signed-in";

const NO_STORE = { "Cache-Control": "no-store" };

function plain(status: number, body: string): Response {
  return new Response(body, { status, headers: NO_STORE });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return plain(404, "Not found");
  }
  if (!(await isSignedIn())) {
    return plain(401, "Unauthorised");
  }

  const result = await bookingsRepo.listAll();
  if (isFailure(result)) {
    console.error("interviewer export failed", {
      code: errorCodeOf(result.failure),
    });
    return plain(500, "Export failed");
  }

  return new Response(toCsv(result.data ?? []), {
    headers: {
      ...NO_STORE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="interviews-${EVENT_CONFIG.date}.csv"`,
    },
  });
}
