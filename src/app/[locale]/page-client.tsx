"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { getLangDir } from "rtl-detect";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/core/i18n/navigation";
import { LtrRun, RichText } from "@/core/new-components/common/ltr-run";
import { routing } from "@/core/i18n/routing";
import { collectDetailsErrors } from "@/lib/details-errors";
import { createBooking } from "./actions/create-booking";
import {
  ApplicantForm,
  BookingConfirmation,
  FullyBooked,
  SlotGrid,
} from "./components";
import { clearDraft, useApplicantDraft } from "./hooks/use-applicant-draft";
import type { BookingActionState } from "./types/booking-action-state";
import type { ApplicantDraft } from "./types/applicant-draft";
import type { PageClientProps } from "./types/page-client-props";

const IDLE_STATE: BookingActionState = { status: "idle" };
const DETAIL_FIELDS = ["name", "email", "phone", "consent"] as const;
const TOTAL_STEPS = 2;

export function PageClient({ locale, slots, confirmedSlotId }: PageClientProps) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const errorText = useTranslations("booking.errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, hydrated, update } = useApplicantDraft();
  const [state, formAction, pending] = useActionState(createBooking, IDLE_STATE);
  const [acknowledged, setAcknowledged] = useState<BookingActionState | null>(
    null,
  );
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>(
    {},
  );
  const handledRef = useRef<BookingActionState | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef<string | null>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const active = state === acknowledged ? IDLE_STATE : state;
  const serverErrors =
    active.status === "invalid" ? (active.errors ?? {}) : {};
  const errors = { ...serverErrors, ...detailErrors };
  const hasDetailErrors = DETAIL_FIELDS.some((field) => errors[field]);
  const draftIsBlank =
    draft.name === "" && draft.email === "" && draft.phone === "";

  const urlStep = searchParams.get("step") === "slot" ? "slot" : "details";
  const step =
    urlStep === "slot" && (hasDetailErrors || (hydrated && draftIsBlank))
      ? "details"
      : urlStep;

  const bookedId =
    active.status === "success" && active.slotId
      ? active.slotId
      : confirmedSlotId;
  const bookedSlot = slots.find((slot) => slot.id === bookedId);

  const everyUnavailable = slots.every((slot) => slot.taken || slot.past);
  const selected = slots.find(
    (slot) => slot.id === draft.slotId && !slot.taken && !slot.past,
  );
  const otherLocale = routing.locales.find((candidate) => candidate !== locale);
  const query = searchParams.toString();
  const message =
    Object.keys(detailErrors).length > 0
      ? errorText("detailsIncomplete")
      : active.status === "error" || active.status === "invalid"
        ? (active.message ?? (step === "slot" ? errors.slotId : undefined))
        : undefined;

  useEffect(() => {
    if (handledRef.current === state) {
      return;
    }
    handledRef.current = state;
    if (state.status === "error") {
      router.refresh();
    }
    if (
      state.status === "invalid" &&
      DETAIL_FIELDS.some((field) => state.errors?.[field])
    ) {
      router.replace("/");
    }
    if (state.status === "success" && state.slotId) {
      clearDraft();
      router.replace(`/?booked=${encodeURIComponent(state.slotId)}`);
    }
  }, [state, router]);

  useEffect(() => {
    if (previousStepRef.current !== null && previousStepRef.current !== step) {
      headingRef.current?.focus();
    }
    previousStepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (message) {
      messageRef.current?.focus();
    }
  }, [message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("name", draft.name);
    formData.set("email", draft.email);
    formData.set("phone", draft.phone);
    if (draft.consent) {
      formData.set("consent", "on");
    }
    formData.set("slotId", selected?.id ?? "");
    if (step === "details") {
      const found = collectDetailsErrors({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        consent: draft.consent,
      });
      setAcknowledged(state);
      if (Object.keys(found).length > 0) {
        setDetailErrors(
          Object.fromEntries(
            Object.entries(found).map(([field, key]) => [
              field,
              errorText(key),
            ]),
          ),
        );
        return;
      }
      setDetailErrors({});
      router.push("/?step=slot");
      return;
    }
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleChange(patch: Partial<ApplicantDraft>) {
    update(patch);
    setDetailErrors((current) => {
      const cleared = Object.keys(patch).filter((field) => field in current);
      if (cleared.length === 0) {
        return current;
      }
      const next = { ...current };
      for (const field of cleared) {
        delete next[field];
      }
      return next;
    });
  }

  function handleSelect(slotId: string) {
    setAcknowledged(state);
    update({ slotId });
  }

  const header = (
    <div
      data-rise="1"
      className="flex items-center justify-between gap-4"
    >
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
          href={query ? `/?${query}` : "/"}
          locale={otherLocale}
          lang={otherLocale}
          dir={getLangDir(otherLocale)}
          className="inline-flex min-h-12 items-center text-base font-semibold text-field-ink underline underline-offset-4"
        >
          {common("otherLanguage")}
        </Link>
      ) : null}
    </div>
  );

  if (bookedSlot) {
    return (
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {header}
        <div className="mt-8" data-rise="2">
          <BookingConfirmation slot={bookedSlot} locale={locale} />
        </div>
      </main>
    );
  }

  if (everyUnavailable) {
    return (
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {header}
        <div className="mt-8" data-rise="2">
          <FullyBooked />
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {header}

      <div className="mt-8" data-rise="2">
        <p className="text-sm text-field-ink-muted">
          {t.rich("stepOf", {
            current: step === "details" ? 1 : 2,
            total: TOTAL_STEPS,
            n: (chunks) => <LtrRun>{chunks}</LtrRun>,
          })}
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-2xl font-bold text-field-ink outline-none"
        >
          {step === "details" ? t("stepDetails") : t("stepSlot")}
        </h1>
        <p className="mt-2 text-field-ink-muted">
          <RichText>{t("intro")}</RichText>
        </p>
      </div>

      {message ? (
        <p
          ref={messageRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-md border border-accent bg-ground-raised p-4 font-semibold text-accent shadow-lg outline-none"
        >
          <RichText>{message}</RichText>
        </p>
      ) : null}

      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        data-rise="3"
        className="mt-6 rounded-lg border border-rule bg-ground-raised p-5 shadow-xl sm:p-6"
      >
        <input type="hidden" name="locale" value={locale} />
        {step === "details" ? (
          <>
            <ApplicantForm
              values={draft}
              errors={errors}
              canContinue={hydrated}
              onChange={handleChange}
            />
            <noscript>
              <div className="mt-8">
                <SlotGrid
                  slots={slots}
                  locale={locale}
                  selectedId={draft.slotId}
                  pending={false}
                  onSelect={handleSelect}
                />
              </div>
            </noscript>
          </>
        ) : (
          <>
            <input type="hidden" name="name" value={draft.name} />
            <input type="hidden" name="email" value={draft.email} />
            <input type="hidden" name="phone" value={draft.phone} />
            {draft.consent ? (
              <input type="hidden" name="consent" value="on" />
            ) : null}
            <SlotGrid
              slots={slots}
              locale={locale}
              selectedId={selected?.id ?? ""}
              pending={pending}
              onSelect={handleSelect}
              onBack={() => router.push("/")}
            />
          </>
        )}
      </form>
    </main>
  );
}
