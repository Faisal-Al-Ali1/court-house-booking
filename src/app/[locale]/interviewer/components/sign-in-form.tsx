"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "../actions/sign-in";
import type { SignInFormProps } from "../types/sign-in-form-props";
import type { SignInState } from "../types/sign-in-state";

const IDLE_STATE: SignInState = { status: "idle" };

export function SignInForm({ locale }: SignInFormProps) {
  const t = useTranslations("interviewer.signIn");
  const [state, formAction, pending] = useActionState(signIn, IDLE_STATE);
  const message =
    state.status === "wrong"
      ? t("wrong")
      : state.status === "unavailable"
        ? t("unavailable")
        : null;

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-ink-muted">{t("intro")}</p>
      <form
        action={formAction}
        className="mt-6 rounded-lg border border-rule bg-ground-raised p-5"
      >
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="interviewer-password" className="block font-semibold">
          {t("passwordLabel")}
        </label>
        <input
          id="interviewer-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? "interviewer-password-error" : undefined}
          className="mt-2 block min-h-12 w-full rounded-md border border-rule-strong bg-ground px-3 text-base"
        />
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
