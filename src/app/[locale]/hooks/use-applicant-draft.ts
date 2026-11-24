"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { ApplicantDraft } from "../types/applicant-draft";

const STORAGE_KEY = "court-house-booking:draft";

export const EMPTY_DRAFT: ApplicantDraft = Object.freeze({
  name: "",
  email: "",
  phone: "",
  consent: false,
  slotId: "",
});

const listeners = new Set<() => void>();
let memory: string | null = null;
let loaded = false;

function readStorage(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(raw: string | null): void {
  try {
    if (raw === null) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, raw);
    }
  } catch {
    return;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string | null {
  if (!loaded) {
    memory = readStorage();
    loaded = true;
  }
  return memory;
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribeNever(): () => void {
  return () => undefined;
}

function isHydrated(): boolean {
  return true;
}

function isNotHydrated(): boolean {
  return false;
}

function parseDraft(raw: string | null): ApplicantDraft {
  if (raw === null) {
    return EMPTY_DRAFT;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return EMPTY_DRAFT;
    }
    const record = value as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : "",
      email: typeof record.email === "string" ? record.email : "",
      phone: typeof record.phone === "string" ? record.phone : "",
      consent: record.consent === true,
      slotId: typeof record.slotId === "string" ? record.slotId : "",
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function commit(raw: string | null): void {
  memory = raw;
  loaded = true;
  writeStorage(raw);
  listeners.forEach((listener) => listener());
}

export function clearDraft(): void {
  commit(null);
}

export function useApplicantDraft() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeNever,
    isHydrated,
    isNotHydrated,
  );
  const draft = useMemo(() => parseDraft(raw), [raw]);

  const update = useCallback((patch: Partial<ApplicantDraft>) => {
    const current = parseDraft(getSnapshot());
    commit(JSON.stringify({ ...current, ...patch }));
  }, []);

  return { draft, hydrated, update };
}
