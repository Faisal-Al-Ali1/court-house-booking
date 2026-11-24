import { createHash, timingSafeEqual } from "node:crypto";
import { signRef, verifyRef } from "./signed-ref.ts";

export const INTERVIEWER_COOKIE = "interviewer-session";

const SESSION_PREFIX = "interviewer:";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function readInterviewerPassword(): string {
  return process.env.INTERVIEWER_PASSWORD ?? "";
}

export function passwordMatches(submitted: string, expected: string): boolean {
  const matches = timingSafeEqual(digest(submitted), digest(expected));
  return expected !== "" && matches;
}

export function issueSession(expiresAt: Date, secret: string): string {
  return signRef(`${SESSION_PREFIX}${expiresAt.getTime()}`, secret);
}

export function sessionIsValid(
  cookie: string | undefined,
  now: Date,
  secret: string,
): boolean {
  const value = verifyRef(cookie, secret);
  if (value === null || !value.startsWith(SESSION_PREFIX)) {
    return false;
  }
  const expiresAt = Number(value.slice(SESSION_PREFIX.length));
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}
