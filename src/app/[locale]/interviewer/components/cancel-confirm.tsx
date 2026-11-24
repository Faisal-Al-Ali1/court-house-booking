"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { LtrRun } from "@/core/new-components/common/ltr-run";
import { formatSlotTime } from "@/lib/format-time";
import { cancelBooking } from "../actions/cancel-booking";
import type { CancelConfirmProps } from "../types/cancel-confirm-props";

export function CancelConfirm({
  row,
  locale,
  onClose,
  onCancelled,
  onGone,
  onSignedOut,
}: CancelConfirmProps) {
  const t = useTranslations("interviewer.cancel");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (row && !dialog.open) {
      setFailed(false);
      dialog.showModal();
    }
    if (!row && dialog.open) {
      dialog.close();
    }
  }, [row]);

  function handleConfirm() {
    if (!row || pending) {
      return;
    }
    const { slotId, applicant } = row;
    if (!applicant) {
      return;
    }
    startTransition(async () => {
      const result = await cancelBooking(slotId);
      if (result === "notified" || result === "not-notified") {
        onCancelled({
          notified: result === "notified",
          name: applicant.name,
          phone: applicant.phone,
        });
      } else if (result === "gone") {
        onGone();
      } else if (result === "signed-out") {
        onSignedOut();
      } else {
        setFailed(true);
      }
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (pending) {
          event.preventDefault();
        }
      }}
      aria-labelledby="cancel-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-rule-strong bg-ground-raised p-5 text-ink backdrop:bg-ink/40"
    >
      {row?.applicant ? (
        <>
          <h2 id="cancel-title" className="text-xl font-bold">
            {t("title")}
          </h2>
          <p className="mt-3">
            {t.rich("body", {
              name: row.applicant.name,
              time: formatSlotTime(
                { id: row.slotId, startMinutes: row.startMinutes },
                locale,
              ),
              who: (chunks) => <bdi className="font-semibold">{chunks}</bdi>,
              n: (chunks) => <LtrRun className="font-semibold">{chunks}</LtrRun>,
            })}
          </p>
          {failed ? (
            <p role="alert" className="mt-3 font-semibold text-accent">
              {t("failed")}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              onClick={onClose}
              disabled={pending}
              className="min-h-12 rounded-md border border-rule-strong bg-ground px-6 py-3 text-base font-semibold text-ink disabled:text-ink-muted"
            >
              {t("keep")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pending}
              className="min-h-12 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink disabled:border disabled:border-rule-strong disabled:bg-ground-raised disabled:text-ink-muted"
            >
              {pending ? t("confirming") : t("confirm")}
            </button>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
