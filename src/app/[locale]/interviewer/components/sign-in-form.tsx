"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { getLangDir } from "rtl-detect";
import { Link } from "@/core/i18n/navigation";
import { routing } from "@/core/i18n/routing";
import { signIn } from "../actions/sign-in";
import type { SignInFormProps } from "../types/sign-in-form-props";
import type { SignInState } from "../types/sign-in-state";

const IDLE_STATE: SignInState = { status: "idle" };

export function SignInForm({ locale }: SignInFormProps) {
  const t = useTranslations("interviewer.signIn");
  const common = useTranslations("common");
  const otherLocale = routing.locales.find((candidate) => candidate !== locale);
  const [state, formAction, pending] = useActionState(signIn, IDLE_STATE);
  const [visible, setVisible] = useState(false);
  const rtl = getLangDir(locale) === "rtl";
  const alignToPage = rtl
    ? "text-right ps-14 pe-3"
    : "text-left pe-14 ps-3";
  const message =
    state.status === "wrong"
      ? t("wrong")
      : state.status === "unavailable"
        ? t("unavailable")
        : null;

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 py-8 sm:px-6">
      <div data-rise="1" className="flex items-center justify-between gap-4">
        <Image
          src="/logo-lockup-light.webp"
          alt={common("siteName")}
          width={960}
          height={260}
          priority
          className="h-9 w-auto sm:h-11"
        />
        {otherLocale ? (
          <Link
            href="/interviewer"
            locale={otherLocale}
            lang={otherLocale}
            dir={getLangDir(otherLocale)}
            className="inline-flex min-h-12 items-center text-base font-semibold text-field-ink underline underline-offset-4"
          >
            {common("otherLanguage")}
          </Link>
        ) : null}
      </div>

      <h1 data-rise="2" className="mt-8 text-2xl font-bold text-field-ink">
        {t("title")}
      </h1>
      <p className="mt-2 text-field-ink-muted">{t("intro")}</p>
      <form
        action={formAction}
        data-rise="3"
        className="mt-6 rounded-lg border border-rule bg-ground-raised p-5 shadow-xl"
      >
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="interviewer-password" className="block font-semibold">
          {t("passwordLabel")}
        </label>
        <div className="relative mt-2">
          <input
            id="interviewer-password"
            name="password"
            type={visible ? "text" : "password"}
            required
            autoComplete="current-password"
            dir="ltr"
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? "interviewer-password-error" : undefined}
            className={`block min-h-12 w-full rounded-md border border-rule-strong bg-ground text-base ${alignToPage}`}
          />
          <button
            type="button"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            aria-pressed={visible}
            className="absolute inset-y-0 end-0 inline-flex w-12 items-center justify-center text-ink-muted hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-5"
            >
              <path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3.2" />
              {visible ? <path d="M4 20 20 4" /> : null}
            </svg>
          </button>
        </div>
        {message ? (
          <p
            id="interviewer-password-error"
            role="alert"
            className="mt-3 font-semibold text-accent"
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 min-h-12 w-full rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink disabled:border disabled:border-rule-strong disabled:bg-ground-raised disabled:text-ink-muted"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </main>
  );
}
