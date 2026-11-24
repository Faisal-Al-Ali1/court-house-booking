import { useId } from "react";
import { useTranslations } from "next-intl";
import { RichText } from "@/core/new-components/common/ltr-run";

export function FullyBooked() {
  const t = useTranslations("booking.fullyBooked");
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-rule bg-ground-raised p-6"
    >
      <h2 id={headingId} className="text-xl font-bold">
        {t("title")}
      </h2>
      <p className="mt-3 text-ink-muted">
        <RichText>{t("body")}</RichText>
      </p>
    </section>
  );
}
