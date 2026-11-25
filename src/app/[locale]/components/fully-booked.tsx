import { useId } from "react";
import { useTranslations } from "next-intl";
import { LtrRun } from "@/core/new-components/common/ltr-run";
import type { FullyBookedProps } from "../types/fully-booked-props";

export function FullyBooked({ contactEmail }: FullyBookedProps) {
  const t = useTranslations("booking.fullyBooked");
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-rule bg-ground-raised p-6"
    >
      <h1 id={headingId} className="text-2xl font-bold">
        {t("title")}
      </h1>
      <p className="mt-3 text-ink-muted">
        {t.rich("body", {
          email: contactEmail,
          n: (chunks) => <LtrRun>{chunks}</LtrRun>,
          mail: (chunks) => (
            <a
              href={`mailto:${contactEmail}`}
              className="font-semibold text-accent underline underline-offset-4"
            >
              <LtrRun>{chunks}</LtrRun>
            </a>
          ),
        })}
      </p>
    </section>
  );
}
