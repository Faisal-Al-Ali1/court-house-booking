import { useId } from "react";
import { useTranslations } from "next-intl";
import { RichText } from "@/core/new-components/common/ltr-run";
import type { ApplicantFormProps } from "../types/applicant-form-props";

const INPUT_CLASS =
  "mt-2 block min-h-12 w-full rounded-md border border-rule-strong bg-ground px-3 py-2 text-base text-ink aria-[invalid=true]:border-2 aria-[invalid=true]:border-accent";
const ERROR_CLASS = "mt-2 text-sm font-semibold text-accent";

export function ApplicantForm({
  values,
  errors,
  canContinue,
  onChange,
}: ApplicantFormProps) {
  const t = useTranslations("booking");
  const baseId = useId();
  const ids = {
    name: `${baseId}-name`,
    email: `${baseId}-email`,
    phone: `${baseId}-phone`,
    consent: `${baseId}-consent`,
    notice: `${baseId}-notice`,
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={ids.name} className="block font-semibold">
          {t("fields.name")}
        </label>
        <input
          id={ids.name}
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${ids.name}-error` : undefined}
          className={INPUT_CLASS}
        />
        {errors.name ? (
          <p id={`${ids.name}-error`} className={ERROR_CLASS}>
            <RichText>{errors.name}</RichText>
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={ids.email} className="block font-semibold">
          {t("fields.email")}
        </label>
        <input
          id={ids.email}
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={(event) => onChange({ email: event.target.value })}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${ids.email}-error` : undefined}
          className={`${INPUT_CLASS} text-start`}
        />
        {errors.email ? (
          <p id={`${ids.email}-error`} className={ERROR_CLASS}>
            <RichText>{errors.email}</RichText>
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={ids.phone} className="block font-semibold">
          {t("fields.phone")}
        </label>
        <input
          id={ids.phone}
          name="phone"
          type="tel"
          dir="ltr"
          autoComplete="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? `${ids.phone}-error` : undefined}
          className={`${INPUT_CLASS} text-start`}
        />
        {errors.phone ? (
          <p id={`${ids.phone}-error`} className={ERROR_CLASS}>
            <RichText>{errors.phone}</RichText>
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id={ids.consent}
            name="consent"
            type="checkbox"
            value="on"
            checked={values.consent}
            onChange={(event) => onChange({ consent: event.target.checked })}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={
              errors.consent ? `${ids.notice} ${ids.consent}-error` : ids.notice
            }
            className="mt-1 size-6 shrink-0 accent-accent"
          />
          <label htmlFor={ids.consent} className="text-base">
            <RichText>{t("fields.consent")}</RichText>
          </label>
        </div>
        <p id={ids.notice} className="mt-2 text-sm text-ink-muted ps-9">
          <RichText>{t("fields.privacyNotice")}</RichText>
        </p>
        {errors.consent ? (
          <p id={`${ids.consent}-error`} className={ERROR_CLASS}>
            <RichText>{errors.consent}</RichText>
          </p>
        ) : null}
      </div>

      {canContinue ? (
        <button
          type="submit"
          className="min-h-12 w-full rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink sm:w-auto"
        >
          {t("fields.continue")}
        </button>
      ) : null}
    </div>
  );
}
