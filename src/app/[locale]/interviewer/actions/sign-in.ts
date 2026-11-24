"use server";

import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routing } from "@/core/i18n/routing";
import { bookedCookieExpiry } from "@/lib/booked-cookie";
import {
  INTERVIEWER_COOKIE,
  issueSession,
  passwordMatches,
  readInterviewerPassword,
} from "@/lib/interviewer-session";
import { requireSessionSecret } from "@/lib/signed-ref";
import type { SignInState } from "../types/sign-in-state";

function readField(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const submittedLocale = readField(formData, "locale");
  const locale = hasLocale(routing.locales, submittedLocale)
    ? submittedLocale
    : routing.defaultLocale;

  try {
    const expected = readInterviewerPassword();
    const secret = requireSessionSecret();
    if (expected === "") {
      console.error("interviewer sign-in unavailable", { code: "not-configured" });
      return { status: "unavailable" };
    }
    if (!passwordMatches(readField(formData, "password"), expected)) {
      return { status: "wrong" };
    }
    const jar = await cookies();
    const expires = bookedCookieExpiry();
    jar.set(INTERVIEWER_COOKIE, issueSession(expires, secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires,
    });
  } catch (error) {
    console.error("interviewer sign-in failed", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return { status: "unavailable" };
  }

  redirect(`/${locale}/interviewer`);
}
